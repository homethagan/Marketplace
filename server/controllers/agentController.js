import db from '../db/index.js'

// Helper to get all rows
const allAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

export const getAgents = async (req, res) => {
  try {
    const agents = await allAsync(
      'SELECT id, name, description, system_prompt, hourly_rate, category, created_at FROM agents ORDER BY id'
    )
    
    res.json({
      message: 'Agents retrieved successfully',
      agents
    })
  } catch (err) {
    console.error('Get agents error:', err.message)
    res.status(500).json({ error: 'Failed to retrieve agents' })
  }
}

export default { getAgents }
