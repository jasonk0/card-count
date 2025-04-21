import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Cards from './pages/Cards'
import UsageHistory from './pages/UsageHistory'
import Layout from './components/Layout'
import Calendar from './pages/Calendar'
import './index.css'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="cards" element={<Cards />} />
          <Route path="history" element={<UsageHistory />} />
          <Route path="calendar" element={<Calendar />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
