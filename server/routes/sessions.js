import express from 'express'
import { verifyToken } from '../middleware/auth.js'
import { createSession, getSession, listSessions } from '../controllers/sessionController.js'

const router = express.Router()

// All routes require authentication
router.use(verifyToken)

// POST /api/sessions - Create a new session
router.post('/', createSession)

// GET /api/sessions - List all sessions for user
router.get('/', listSessions)

// GET /api/sessions/:id - Get a specific session
router.get('/:id', getSession)

export default router
