import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios.js'
import { getApiErrorMessage } from '../utils/apiError.js'

const pad = (value) => String(value).padStart(2, '0')

const formatHms = (seconds) => {
  const safe = Math.max(0, Number(seconds) || 0)
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const secs = safe % 60
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`
}

const formatTime = (isoString) => {
  if (!isoString) return ''
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const WorkspacePage = () => {
  const { sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [agentName, setAgentName] = useState('Agent')
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [expired, setExpired] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chatError, setChatError] = useState('')
  const bottomRef = useRef(null)

  const sessionEndMs = useMemo(() => {
    if (!session?.started_at || !session?.duration_minutes) return null
    return new Date(session.started_at).getTime() + Number(session.duration_minutes) * 60 * 1000
  }, [session])

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      try {
        const [sessionRes, agentsRes] = await Promise.all([
          api.get(`/sessions/${sessionId}`),
          api.get('/agents')
        ])

        const loadedSession = sessionRes.data?.session
        setSession(loadedSession)

        const serverRemaining = Number(loadedSession?.time_remaining_seconds || 0)
        const isServerExpired = loadedSession?.is_expired || loadedSession?.expired || serverRemaining <= 0

        setRemainingSeconds(serverRemaining)
        setExpired(Boolean(isServerExpired))

        const foundAgent = (agentsRes.data?.agents || []).find(
          (agent) => Number(agent.id) === Number(loadedSession?.agent_id)
        )
        if (foundAgent) {
          setAgentName(foundAgent.name)
        }
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load workspace.'))
      } finally {
        setLoading(false)
      }
    }

    fetchWorkspaceData()
  }, [sessionId])

  useEffect(() => {
    if (!sessionEndMs || expired) return undefined

    const intervalId = setInterval(() => {
      const nextRemaining = Math.max(0, Math.floor((sessionEndMs - Date.now()) / 1000))
      setRemainingSeconds(nextRemaining)

      if (nextRemaining <= 0) {
        setExpired(true)
      }
    }, 1000)

    return () => clearInterval(intervalId)
  }, [sessionEndMs, expired])

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, sending])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || sending || expired) return

    setChatError('')
    setSending(true)

    const userMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString()
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')

    try {
      const response = await api.post('/chat', {
        session_id: sessionId,
        message: trimmed
      })

      const assistantMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: response.data?.reply || '',
        created_at: new Date().toISOString()
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      if (err?.response?.status === 403) {
        setExpired(true)
        setChatError('Your session has expired')
      } else {
        setChatError(getApiErrorMessage(err, 'Failed to send message.'))
      }
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-zinc-200">
        Loading workspace...
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
    <section className="mx-auto flex h-[75vh] max-w-5xl flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl shadow-zinc-950/40">
      <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">{agentName}</h2>
          <p className="text-xs text-zinc-400">Session #{sessionId}</p>
        </div>
        <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm font-medium text-zinc-200">
          {formatHms(remainingSeconds)}
        </div>
      </header>

      {expired ? (
        <div className="border-b border-amber-800 bg-amber-900/50 px-5 py-3 text-sm font-medium text-amber-200">
          Session Expired
        </div>
      ) : null}

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
        {messages.length === 0 ? (
          <div className="mx-auto mt-8 max-w-md rounded-lg border border-zinc-800 bg-zinc-950/70 p-4 text-center text-sm text-zinc-400">
            Start the conversation with your agent.
          </div>
        ) : null}

        {messages.map((msg) => {
          const isUser = msg.role === 'user'
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow ${
                  isUser
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'border border-zinc-700 bg-zinc-800 text-zinc-100'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-6">{msg.content}</p>
                <p className={`mt-2 text-[11px] ${isUser ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}

        {sending ? (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-300">
              Assistant is typing...
            </div>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <footer className="border-t border-zinc-800 bg-zinc-950 p-4">
        {chatError ? <p className="mb-2 text-sm text-red-300">{chatError}</p> : null}
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={expired ? 'Session expired' : 'Type your message...'}
            disabled={expired || sending}
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none ring-zinc-400 focus:ring disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={expired || sending || !input.trim()}
            className="rounded-md bg-zinc-100 px-4 py-2 font-semibold text-zinc-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send
          </button>
        </div>
      </footer>
    </section>
  )
}

export default WorkspacePage
