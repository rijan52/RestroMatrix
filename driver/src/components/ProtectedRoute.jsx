import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { DriverContext } from '../context/DriverContext'

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useContext(DriverContext)

    // Wait for authentication check to complete
    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1a1a', color: 'white' }}>Loading...</div>
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return children
}

export default ProtectedRoute
