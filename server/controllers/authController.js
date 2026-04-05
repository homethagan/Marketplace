import db from '../db/index.js'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

// Helper to run SQL queries with promises
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

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export const register = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' })
    }

    // Check if user already exists
    const existingUser = await getAsync('SELECT id FROM users WHERE email = ?', [email])
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10)
    const passwordHash = await bcryptjs.hash(password, salt)

    // Create user
    const userId = uuidv4()
    await runAsync(
      'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
      [userId, email, passwordHash]
    )

    // Generate token
    const token = generateToken({ id: userId, email })
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: userId, email }
    })
  } catch (err) {
    console.error('Register error:', err.message)
    res.status(500).json({ error: 'Registration failed' })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Find user by email
    const user = await getAsync('SELECT id, email, password_hash FROM users WHERE email = ?', [email])
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Compare password
    const passwordMatch = await bcryptjs.compare(password, user.password_hash)
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate token
    const token = generateToken({ id: user.id, email: user.email })
    
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email }
    })
  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ error: 'Login failed' })
  }
}

export default { register, login }
