import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useContext } from 'react'
import { DriverContext } from './context/DriverContext'
import ProtectedRoute from './components/ProtectedRoute'
import ScrollToTop from './components/ScrollToTop'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import './App.css'

function App() {
    const { isAuthenticated } = useContext(DriverContext)

    return (
        <BrowserRouter>
            <ScrollToTop />
            <Routes>
                {/* Redirect root to login */}
                <Route path="/" element={<Navigate to="/login" />} />

                {/* Public login route */}
                <Route path="/login" element={<Login />} />

                {/* Protected dashboard route */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

                {/* Catch all - redirect to login */}
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
