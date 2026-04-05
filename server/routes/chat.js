import express from 'express'
import { verifyToken } from '../middleware/auth.js'
import { postMessage } from '../controllers/chatController.js'

const router = express.Router()

router.post('/', verifyToken, postMessage)

export default router