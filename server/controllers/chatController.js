import db from '../db/index.js'
import { v4 as uuidv4 } from 'uuid'

const MINIMAX_URL = 'https://api.minimax.chat/v1/text/chatcompletion_v2'

const runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err)
      else resolve(this)
    })
  })
}

const getAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

const allAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

const readContentValue = (value) => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => {
        if (typeof item === 'string') return item
        if (typeof item?.text === 'string') return item.text
        if (typeof item?.content === 'string') return item.content
        return ''
      })
      .filter(Boolean)

    const combined = parts.join('\n').trim()
    if (combined) return combined
  }

  return null
}

const getAssistantReply = (payload) => {
  const directFields = [payload?.reply, payload?.output_text, payload?.text]
  for (const field of directFields) {
    const parsed = readContentValue(field)
    if (parsed) return parsed
  }

  if (Array.isArray(payload?.choices) && payload.choices.length > 0) {
    const firstChoice = payload.choices[0]
    const candidates = [
      firstChoice?.message?.content,
      firstChoice?.messages?.[0]?.content,
      firstChoice?.text,
      firstChoice?.delta?.content
    ]

    for (const candidate of candidates) {
      const parsed = readContentValue(candidate)
      if (parsed) return parsed
    }
  }

  const nestedCandidates = [
    payload?.data?.reply,
    payload?.data?.output_text,
    payload?.data?.text,
    payload?.output?.text
  ]

  for (const candidate of nestedCandidates) {
    const parsed = readContentValue(candidate)
    if (parsed) return parsed
  }

  return null
}

const isSessionExpired = (session) => {
  if (session.expired) {
    return true
  }

  const startedAtMs = new Date(session.started_at).getTime()
  const durationMs = Number(session.duration_minutes) * 60 * 1000
  return Date.now() >= startedAtMs + durationMs
}

export const postMessage = async (req, res) => {
  try {
    const { session_id, message } = req.body
    const userId = req.user.id

    if (!session_id || !message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'session_id and message are required' })
    }

    const session = await getAsync(
      'SELECT id, user_id, agent_id, started_at, duration_minutes, expired FROM sessions WHERE id = ?',
      [session_id]
    )

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    if (session.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized access to session' })
    }

    if (isSessionExpired(session)) {
      if (!session.expired) {
        await runAsync('UPDATE sessions SET expired = 1 WHERE id = ?', [session_id])
      }
      return res.status(403).json({ error: 'Session expired' })
    }

    const agent = await getAsync('SELECT id, system_prompt FROM agents WHERE id = ?', [session.agent_id])
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found for session' })
    }

    const historyRows = await allAsync(
      `SELECT role, content
       FROM messages
       WHERE session_id = ?
       ORDER BY created_at DESC, rowid DESC
       LIMIT 10`,
      [session_id]
    )

    const history = historyRows.reverse().map((row) => ({
      role: row.role,
      content: row.content
    }))

    const minimaxApiKey = process.env.MINIMAX_API_KEY
    if (!minimaxApiKey) {
      return res.status(502).json({ error: 'AI provider is not configured (missing MINIMAX_API_KEY)' })
    }

    const minimaxMessages = [
      { role: 'system', content: agent.system_prompt },
      ...history,
      { role: 'user', content: message.trim() }
    ]

    let assistantMessage
    try {
      const minimaxResponse = await fetch(MINIMAX_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${minimaxApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'abab6.5s-chat',
          messages: minimaxMessages
        })
      })

      if (!minimaxResponse.ok) {
        const errorText = await minimaxResponse.text()
        return res.status(502).json({
          error: `AI service call failed (${minimaxResponse.status}): ${errorText || 'Unknown error'}`
        })
      }

      const minimaxPayload = await minimaxResponse.json()

      const providerStatusCode = minimaxPayload?.base_resp?.status_code
      if (providerStatusCode && Number(providerStatusCode) !== 0) {
        const providerMessage = minimaxPayload?.base_resp?.status_msg || 'Unknown provider error'
        return res.status(502).json({
          error: `AI service call failed (${providerStatusCode}): ${providerMessage}`
        })
      }

      assistantMessage = getAssistantReply(minimaxPayload)

      if (!assistantMessage) {
        return res.status(502).json({ error: 'AI service returned an unreadable response' })
      }
    } catch (apiError) {
      return res.status(502).json({ error: `AI service call failed: ${apiError.message}` })
    }

    await runAsync(
      'INSERT INTO messages (id, session_id, role, content) VALUES (?, ?, ?, ?)',
      [uuidv4(), session_id, 'user', message.trim()]
    )

    await runAsync(
      'INSERT INTO messages (id, session_id, role, content) VALUES (?, ?, ?, ?)',
      [uuidv4(), session_id, 'assistant', assistantMessage]
    )

    return res.json({ reply: assistantMessage })
  } catch (err) {
    console.error('Chat postMessage error:', err.message)
    return res.status(500).json({ error: 'Failed to process chat message' })
  }
}

export default { postMessage }