import db from '../db/index.js'
import { v4 as uuidv4 } from 'uuid'

// Helper to run SQL with promises
const runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err)
      else resolve(this)
    })
  })
}

// Helper to get a single row
const getAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

// Helper to get all rows
const allAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

const calculateTimeRemaining = (session) => {
  const startedAt = new Date(session.started_at).getTime()
  const durationMs = session.duration_minutes * 60 * 1000
  const expiresAt = startedAt + durationMs
  const now = Date.now()
  const timeRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000))
  
  return {
    ...session,
    time_remaining_seconds: timeRemaining,
    is_expired: timeRemaining === 0
  }
}

export const createSession = async (req, res) => {
  try {
    const { agent_id, duration_hours } = req.body
    const userId = req.user.id

    // Validate input
    if (!agent_id || duration_hours === undefined) {
      return res.status(400).json({ error: 'agent_id and duration_hours are required' })
    }

    if (typeof duration_hours !== 'number' || duration_hours <= 0) {
      return res.status(400).json({ error: 'duration_hours must be a positive number' })
    }

    // Verify agent exists
    const agent = await getAsync('SELECT id FROM agents WHERE id = ?', [agent_id])
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' })
    }

    // Calculate duration in minutes
    const durationMinutes = duration_hours * 60

    // Create session
    const sessionId = uuidv4()
    const now = new Date().toISOString()

    await runAsync(
      `INSERT INTO sessions (id, user_id, agent_id, started_at, duration_minutes, expired)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [sessionId, userId, agent_id, now, durationMinutes]
    )

    // Fetch and return the created session
    const session = await getAsync(
      'SELECT id, user_id, agent_id, started_at, duration_minutes FROM sessions WHERE id = ?',
      [sessionId]
    )

    const sessionWithTime = calculateTimeRemaining(session)

    res.status(201).json({
      message: 'Session created successfully',
      session: sessionWithTime
    })
  } catch (err) {
    console.error('Create session error:', err.message)
    res.status(500).json({ error: 'Failed to create session' })
  }
}

export const getSession = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Get session
    const session = await getAsync(
      `SELECT id, user_id, agent_id, started_at, duration_minutes, expired 
       FROM sessions WHERE id = ?`,
      [id]
    )

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Verify ownership
    if (session.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized access to session' })
    }

    // Calculate time remaining and check if expired
    const sessionWithTime = calculateTimeRemaining(session)

    // If session just expired, update the database
    if (sessionWithTime.is_expired && !session.expired) {
      await runAsync('UPDATE sessions SET expired = 1 WHERE id = ?', [id])
    }

    res.json({
      message: 'Session retrieved successfully',
      session: sessionWithTime
    })
  } catch (err) {
    console.error('Get session error:', err.message)
    res.status(500).json({ error: 'Failed to retrieve session' })
  }
}

export const listSessions = async (req, res) => {
  try {
    const userId = req.user.id

    // Get all sessions for user
    const sessions = await allAsync(
      `SELECT id, user_id, agent_id, started_at, duration_minutes, expired 
       FROM sessions WHERE user_id = ? ORDER BY started_at DESC`,
      [userId]
    )

    // Calculate time remaining for each session
    const sessionsWithTime = sessions.map(calculateTimeRemaining)

    // Update expired sessions in database
    const expiredSessions = sessionsWithTime.filter(s => s.is_expired && !s.expired)
    for (const session of expiredSessions) {
      await runAsync('UPDATE sessions SET expired = 1 WHERE id = ?', [session.id])
    }

    res.json({
      message: 'Sessions retrieved successfully',
      sessions: sessionsWithTime,
      count: sessionsWithTime.length
    })
  } catch (err) {
    console.error('List sessions error:', err.message)
    res.status(500).json({ error: 'Failed to retrieve sessions' })
  }
}

export default { createSession, getSession, listSessions }
