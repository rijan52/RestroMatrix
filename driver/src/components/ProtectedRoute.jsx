import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { DriverContext } from '../context/DriverContext'

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useContext(DriverContext)

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return children
}

export default ProtectedRoute
