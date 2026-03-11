import React, { createContext, useState, useEffect } from 'react'

export const DriverContext = createContext()

export const DriverProvider = ({ children }) => {
    const [driverToken, setDriverToken] = useState(null)
    const [driverRole, setDriverRole] = useState(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const url = "http://localhost:4000"

    useEffect(() => {
        // Check if driver is already logged in
        const token = localStorage.getItem("driverToken")
        const role = localStorage.getItem("driverRole")

        if (token && role === "driver") {
            setDriverToken(token)
            setDriverRole(role)
            setIsAuthenticated(true)
        }
    }, [])

    const login = (token, role) => {
        localStorage.setItem("driverToken", token)
        localStorage.setItem("driverRole", role)
        setDriverToken(token)
        setDriverRole(role)
        setIsAuthenticated(true)
    }

    const logout = () => {
        localStorage.removeItem("driverToken")
        localStorage.removeItem("driverRole")
        setDriverToken(null)
        setDriverRole(null)
        setIsAuthenticated(false)
    }

    const value = {
        driverToken,
        setDriverToken,
        driverRole,
        setDriverRole,
        isAuthenticated,
        setIsAuthenticated,
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
