import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios.js'
import { useAuth } from '../context/AuthContext.jsx'
import { getApiErrorMessage } from '../utils/apiError.js'

const HirePage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()

  const persistedToken = localStorage.getItem('agent_marketplace_token')
  const authToken = token || persistedToken

  const [agent, setAgent] = useState(null)
  const [hours, setHours] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [error, setError] = useState('')
  const redirectTimeoutRef = useRef(null)

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

    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [id])

  if (!authToken) {
    return <Navigate to="/login" replace />
  }

  const handleConfirmAndPay = async () => {
    if (!agent) return

    setError('')
    setSubmitting(true)

    try {
      const response = await api.post('/sessions', {
        agent_id: agent.id,
        duration_hours: Number(hours)
      })

      const sessionId = response.data?.session?.id
      if (!sessionId) {
        throw new Error('We could not create your session. Please try again.')
      }

      setShowConfirmation(true)
      redirectTimeoutRef.current = setTimeout(() => {
        navigate(`/workspace/${sessionId}`)
      }, 2000)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to create session.'))
    } finally {
      setSubmitting(false)
    }
  }

  const numericRate = Number(agent?.hourly_rate || 0)
  const totalCost = Number(hours) * numericRate

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-200">
        Loading hire details...
      </div>
    )
  }

  if (error && !agent) {
    return (
      <div className="rounded-xl border border-red-800 bg-red-950 p-8 text-red-200">
        {error}
      </div>
    )
  }

  return (
    <>
      <section className="mx-auto max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-100">
        <h2 className="mb-4 text-2xl font-semibold">Hire Agent</h2>

        <div className="mb-6 rounded-lg border border-zinc-700 bg-zinc-950/70 p-4">
          <p className="text-lg font-semibold">{agent?.name}</p>
          <p className="mt-1 text-sm text-zinc-300">${numericRate}/hour</p>
        </div>

        <div className="mb-5">
          <label htmlFor="hours" className="mb-2 block text-sm font-medium text-zinc-300">
            Select hours (1-8)
          </label>
          <input
            id="hours"
            type="number"
            min={1}
            max={8}
            step={1}
            value={hours}
            onChange={(e) => {
              const value = Number(e.target.value)
              if (Number.isNaN(value)) return
              setHours(Math.min(8, Math.max(1, value)))
            }}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none ring-zinc-400 focus:ring"
          />
        </div>

        <div className="mb-6 rounded-md border border-zinc-700 bg-zinc-950 p-4">
          <p className="text-sm text-zinc-400">Total Cost</p>
          <p className="text-2xl font-bold text-zinc-100">${totalCost.toFixed(2)}</p>
        </div>

        {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}

        <button
          type="button"
          onClick={handleConfirmAndPay}
          disabled={submitting || showConfirmation}
          className="w-full rounded-md bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Processing...' : 'Confirm & Pay'}
        </button>
      </section>

      {showConfirmation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-xl border border-emerald-700 bg-zinc-900 p-6 text-center text-zinc-100 shadow-2xl">
            <p className="text-xl font-semibold text-emerald-300">Payment Confirmed!</p>
            <p className="mt-2 text-sm text-zinc-300">Preparing your workspace...</p>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default HirePage
