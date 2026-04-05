import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initializeSchema, seedDatabase } from './db/index.js'
import authRouter from './routes/auth.js'
import agentsRouter from './routes/agents.js'
import sessionsRouter from './routes/sessions.js'
import chatRouter from './routes/chat.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRouter)
app.use('/api/agents', agentsRouter)
app.use('/api/sessions', sessionsRouter)
app.use('/api/chat', chatRouter)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' })
})

// Initialize database on startup
const initializeDatabase = async () => {
  try {
    await initializeSchema()
    await seedDatabase()
    console.log('Database initialized and seeded successfully')
  } catch (err) {
    console.error('Failed to initialize database:', err.message)
    process.exit(1)
  }
}

// Start server
const startServer = async () => {
  await initializeDatabase()
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
  })
}

startServer()
