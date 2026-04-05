import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import PrivateRoute from './components/PrivateRoute.jsx'
import Navbar from './components/Navbar.jsx'
import HomePage from './pages/HomePage.jsx'
import AgentDetailPage from './pages/AgentDetailPage.jsx'
import HirePage from './pages/HirePage.jsx'
import WorkspacePage from './pages/WorkspacePage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import './App.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <main className="mx-auto max-w-7xl p-4 md:p-6">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/agents/:id" element={<AgentDetailPage />} />
            <Route path="/hire/:id" element={<HirePage />} />
            <Route path="/workspace/:sessionId" element={<WorkspacePage />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
