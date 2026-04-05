import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios.js'
import { getApiErrorMessage } from '../utils/apiError.js'

const HomePage = () => {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await api.get('/agents')
        setAgents(response.data?.agents || [])
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load agents.'))
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-200">
        Loading agents...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-800 bg-red-950 p-8 text-red-200">
        {error}
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <header className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-100">
        <h2 className="text-2xl font-semibold">Available Agents</h2>
        <p className="mt-2 text-sm text-zinc-400">Pick an agent and start a paid workspace session.</p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <article
            key={agent.id}
            className="flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-lg shadow-zinc-950/40"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-zinc-100">{agent.name}</h3>
              <span className="rounded-full border border-emerald-600 bg-emerald-900/50 px-3 py-1 text-xs font-medium text-emerald-300">
                ${agent.hourly_rate}/hr
              </span>
            </div>

            <p className="mb-5 flex-1 text-sm leading-6 text-zinc-300">{agent.description}</p>

            <button
              type="button"
              onClick={() => navigate(`/hire/${agent.id}`)}
              className="w-full rounded-md bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-white"
            >
              Hire
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

export default HomePage
