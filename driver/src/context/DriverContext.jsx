import React, { createContext, useState, useEffect } from 'react'

// ✅ Helper function to decode JWT and extract userId
const decodeToken = (token) => {
    try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        )
        return JSON.parse(jsonPayload)
    } catch (error) {
        console.error('❌ Failed to decode token:', error)
        return null
    }
}

export const DriverContext = createContext()

export const DriverProvider = ({ children }) => {
    const [driverToken, setDriverToken] = useState(null)
    const [driverId, setDriverId] = useState(null)  // ✅ Added
    const [driverRole, setDriverRole] = useState(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)  // ✅ Added loading state
    const url = "http://localhost:4000"

    useEffect(() => {
        // Check if driver is already logged in
        const token = localStorage.getItem("driverToken")
        const role = localStorage.getItem("driverRole")

        if (token && role === "driver") {
            setDriverToken(token)
            setDriverRole(role)
            setIsAuthenticated(true)

            // ✅ Extract driver ID from token
            const decoded = decodeToken(token)
            if (decoded && decoded.id) {
                setDriverId(decoded.id)
                console.log('✅ Driver ID loaded from token:', decoded.id)
            }
        }

        // ✅ Mark loading as complete
        setIsLoading(false)
    }, [])

    const login = (token, role) => {
        localStorage.setItem("driverToken", token)
        localStorage.setItem("driverRole", role)
        setDriverToken(token)
        setDriverRole(role)
        setIsAuthenticated(true)

        // ✅ Extract driver ID from token
        const decoded = decodeToken(token)
        if (decoded && decoded.id) {
            setDriverId(decoded.id)
            console.log('✅ Driver ID set from login token:', decoded.id)
        }
    }

    const logout = () => {
        localStorage.removeItem("driverToken")
        localStorage.removeItem("driverRole")
        setDriverToken(null)
        setDriverRole(null)
        setDriverId(null)  // ✅ Clear driver ID
        setIsAuthenticated(false)
    }

    const value = {
        driverToken,
        setDriverToken,
        driverId,  // ✅ Export driver ID
        setDriverId,
        driverRole,
        setDriverRole,
        isAuthenticated,
        setIsAuthenticated,
        isLoading,  // ✅ Export loading state
        login,
        logout,
        url
    }

    return (
        <DriverContext.Provider value={value}>
            {children}
        </DriverContext.Provider>
    )
}
