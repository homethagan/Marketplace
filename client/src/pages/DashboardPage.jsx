import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios.js'
import { getApiErrorMessage } from '../utils/apiError.js'

const formatDate = (isoString) => new Date(isoString).toLocaleString()

const DashboardPage = () => {
  const [sessions, setSessions] = useState([])
  const [agentById, setAgentById] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [sessionsRes, agentsRes] = await Promise.all([
          api.get('/sessions'),
          api.get('/agents')
        ])

        const sessionList = sessionsRes.data?.sessions || []
        const agents = agentsRes.data?.agents || []
        const nextAgentById = {}

        for (const agent of agents) {
          nextAgentById[agent.id] = agent
        }

        setAgentById(nextAgentById)
        setSessions(sessionList)
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load dashboard.'))
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const activeSessions = useMemo(
    () => sessions.filter((session) => !session.is_expired && !session.expired && session.time_remaining_seconds > 0),
    [sessions]
  )

  const pastSessions = useMemo(
    () => sessions.filter((session) => session.is_expired || session.expired || session.time_remaining_seconds <= 0),
    [sessions]
  )

  const totalSpent = useMemo(() => {
    return sessions.reduce((sum, session) => {
      const rate = Number(agentById[session.agent_id]?.hourly_rate || 0)
      const hours = Number(session.duration_minutes || 0) / 60
      return sum + rate * hours
    }, 0)
  }, [sessions, agentById])

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-200">
        Loading dashboard...
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
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="mt-2 text-sm text-zinc-400">Track active sessions and billing history.</p>
      </header>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-sm text-zinc-400">Total Amount Spent</p>
        <p className="mt-1 text-3xl font-bold text-zinc-100">${totalSpent.toFixed(2)}</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="mb-4 text-lg font-semibold text-zinc-100">Active Sessions</h3>
        {activeSessions.length === 0 ? (
          <p className="text-sm text-zinc-400">No active sessions.</p>
        ) : (
          <div className="space-y-3">
            {activeSessions.map((session) => {
              const agent = agentById[session.agent_id]
              return (
                <div
                  key={session.id}
                  className="flex flex-col gap-3 rounded-lg border border-zinc-700 bg-zinc-950/60 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-zinc-100">{agent?.name || `Agent #${session.agent_id}`}</p>
                    <p className="text-sm text-zinc-400">Time left: {session.time_remaining_seconds}s</p>
                  </div>
                  <Link
                    to={`/workspace/${session.id}`}
                    className="inline-flex items-center justify-center rounded-md bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-white"
                  >
                    Continue
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="mb-4 text-lg font-semibold text-zinc-100">Past Sessions</h3>
        {pastSessions.length === 0 ? (
          <p className="text-sm text-zinc-400">No past sessions.</p>
        ) : (
          <div className="space-y-3">
            {pastSessions.map((session) => {
              const agent = agentById[session.agent_id]
              const rate = Number(agent?.hourly_rate || 0)
              const hours = Number(session.duration_minutes || 0) / 60
              const totalCost = rate * hours

              return (
                <div key={session.id} className="rounded-lg border border-zinc-700 bg-zinc-950/60 p-4">
                  <p className="font-medium text-zinc-100">{agent?.name || `Agent #${session.agent_id}`}</p>
                  <p className="mt-1 text-sm text-zinc-400">Date: {formatDate(session.started_at)}</p>
                  <p className="text-sm text-zinc-400">Duration: {session.duration_minutes} minutes</p>
                  <p className="text-sm text-zinc-300">Total: ${totalCost.toFixed(2)}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default DashboardPage
