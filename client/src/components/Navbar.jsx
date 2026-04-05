import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const linkBaseClass = 'rounded-md px-3 py-2 text-sm font-medium transition'

const Navbar = () => {
  const { token, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold tracking-wide text-zinc-100">
          Agent Marketplace
        </Link>

        {token ? (
          <div className="flex items-center gap-2">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `${linkBaseClass} ${isActive ? 'bg-zinc-700 text-white' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`
              }
            >
              Dashboard
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-white"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `${linkBaseClass} ${isActive ? 'bg-zinc-700 text-white' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`
              }
            >
              Login
            </NavLink>
            <NavLink
              to="/signup"
              className={({ isActive }) =>
                `${linkBaseClass} ${isActive ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-100 text-zinc-900 hover:bg-white'}`
              }
            >
              Sign Up
            </NavLink>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
