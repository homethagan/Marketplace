import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios.js'
import { getApiErrorMessage } from '../utils/apiError.js'

const AgentDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await api.get('/agents')
        const found = (response.data?.agents || []).find((item) => String(item.id) === String(id))

        if (!found) {
          setError('Agent not found.')
          return
        }

        setAgent(found)
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load agent details.'))
      } finally {
        setLoading(false)
      }
    }

    fetchAgent()
  }, [id])

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-200">
        Loading agent details...
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div className="rounded-xl border border-red-800 bg-red-950 p-8 text-red-200">
        {error || 'Agent not found.'}
      </div>
    )
  }

  const promptPreview =
    agent.system_prompt?.length > 100
      ? `${agent.system_prompt.slice(0, 100)}...`
      : agent.system_prompt || ''

  return (
    <section className="mx-auto max-w-3xl rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-100">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">{agent.name}</h2>
        <span className="rounded-full border border-emerald-600 bg-emerald-900/50 px-3 py-1 text-sm font-medium text-emerald-300">
          ${agent.hourly_rate}/hr
        </span>
      </div>

      <p className="mb-6 text-zinc-300">{agent.description}</p>

      <div className="mb-8 rounded-lg border border-zinc-700 bg-zinc-950/70 p-4">
        <p className="mb-1 text-xs uppercase tracking-wide text-zinc-400">System Prompt Preview</p>
        <p className="text-sm text-zinc-200">{promptPreview}</p>
      </div>

      <button
        type="button"
        onClick={() => navigate(`/hire/${agent.id}`)}
        className="rounded-md bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-white"
      >
        Hire This Agent
      </button>
    </section>
  )
}

export default AgentDetailPage
