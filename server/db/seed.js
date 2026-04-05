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

// Helper function to get all rows
const allAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

const sampleAgents = [
  {
    name: 'PDF Generator',
    description: 'Generates structured PDF content from user prompts',
    system_prompt: 'You are a PDF content generator. When a user describes what they want, respond with well-structured content ready to be formatted into a PDF.',
    hourly_rate: 2,
    category: 'Document Generation'
  },
  {
    name: 'Content Writing Companion',
    description: 'Helps draft blogs, emails, and marketing copy',
    system_prompt: 'You are an expert content writer. Help users draft blogs, emails, and marketing copy that is engaging and professional.',
    hourly_rate: 3,
    category: 'Writing'
  },
  {
    name: 'Learn English',
    description: 'Conversational English tutor',
    system_prompt: 'You are a friendly English tutor. Converse naturally with the user, gently correct any grammar mistakes, and help them practice English.',
    hourly_rate: 2,
    category: 'Education'
  },
  {
    name: 'Code Reviewer',
    description: 'Reviews code snippets and suggests improvements',
    system_prompt: 'You are an expert code reviewer. Analyze code snippets provided by the user, identify issues, and suggest clear improvements with explanations.',
    hourly_rate: 4,
    category: 'Development'
  },
  {
    name: 'Data Summarizer',
    description: 'Summarizes long text or data into key points',
    system_prompt: 'You are a data summarization expert. Take long texts, reports, or data and return clear, concise bullet-point summaries.',
    hourly_rate: 2,
    category: 'Analysis'
  }
]

export const seedDatabase = async () => {
  try {
    console.log('Checking if seed data exists...')

    // Check if agents table has data
    const agents = await allAsync('SELECT COUNT(*) as count FROM agents')
    
    if (agents[0].count === 0) {
      console.log('Seeding sample agents...')

      for (const agent of sampleAgents) {
        await runAsync(
          `INSERT INTO agents (name, description, system_prompt, hourly_rate, category)
           VALUES (?, ?, ?, ?, ?)`,
          [agent.name, agent.description, agent.system_prompt, agent.hourly_rate, agent.category]
        )
      }

      console.log(`✓ Successfully seeded ${sampleAgents.length} agents`)
    } else {
      console.log('✓ Agents table already contains data, skipping seed')
    }
  } catch (err) {
    console.error('Error seeding database:', err.message)
    throw err
  }
}

export default seedDatabase
