import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../agent-marketplace.db')

// Create connection with verbose mode for debugging
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message)
  } else {
    console.log('Connected to SQLite database at:', dbPath)
  }
})

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON', (err) => {
  if (err) {
    console.error('Error enabling foreign keys:', err.message)
  }
})

export default db
