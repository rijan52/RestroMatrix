import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useContext } from 'react'
import { DriverContext } from './context/DriverContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import './App.css'

function App() {
    const { isAuthenticated } = useContext(DriverContext)

    return (
        <BrowserRouter>
            <Routes>
                {/* Redirect root to login or dashboard based on auth status */}
                <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />

                {/* Public login route */}
                <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />

                {/* Protected routes */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Catch all - redirect to login */}
                <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
