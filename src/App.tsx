import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Cards from './pages/Cards'
import UsageHistory from './pages/UsageHistory'
import Layout from './components/Layout'
import Calendar from './pages/Calendar'
import QuickRecord from './pages/QuickRecord'
import TokenManager from './pages/TokenManager'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import './index.css'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="cards" element={<Cards />} />
          <Route path="history" element={<UsageHistory />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="quick-record" element={<QuickRecord />} />
          <Route path="token-manager" element={<TokenManager />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
