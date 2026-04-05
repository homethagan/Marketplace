import db from './db.js'

// Helper function to run SQL with promise wrapper
const runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err)
      else resolve(this)
    })
  })
}

export const initializeSchema = async () => {
  try {
    console.log('Initializing database schema...')

    // Create users table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✓ Users table created')

    // Create agents table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        system_prompt TEXT NOT NULL,
        hourly_rate REAL NOT NULL,
        category TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✓ Agents table created')

    // Create sessions table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        agent_id INTEGER NOT NULL,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        duration_minutes INTEGER,
        expired BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (agent_id) REFERENCES agents(id)
      )
    `)
    console.log('✓ Sessions table created')

    // Create messages table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )
    `)
    console.log('✓ Messages table created')

    console.log('Database schema initialized successfully')
  } catch (err) {
    console.error('Error initializing schema:', err.message)
    throw err
  }
}

export default initializeSchema
