import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { DriverContext } from '../../context/DriverContext'
import './Dashboard.css'

const Dashboard = () => {
    const navigate = useNavigate()
    const { logout, driverRole } = useContext(DriverContext)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="driver-dashboard">
            <nav className="driver-navbar">
                <div className="driver-nav-left">
                    <h1>RestroMatrix Driver</h1>
                </div>
                <div className="driver-nav-right">
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>
            </nav>

            <div className="driver-dashboard-content">
                <h2>Welcome to Driver Dashboard</h2>
                <p>Your delivery management center</p>

                <div className="dashboard-cards">
                    <div className="dashboard-card">
                        <h3>Active Deliveries</h3>
                        <p className="card-number">0</p>
                    </div>
                    <div className="dashboard-card">
                        <h3>Today's Earnings</h3>
                        <p className="card-number">Rs 0</p>
                    </div>
                    <div className="dashboard-card">
                        <h3>Rating</h3>
                        <p className="card-number">⭐ 4.8</p>
                    </div>
                    <div className="dashboard-card">
                        <h3>Total Deliveries</h3>
                        <p className="card-number">0</p>
                    </div>
                </div>

                <div className="dashboard-section">
                    <h3>Coming Soon</h3>
                    <p>Delivery tracking, earnings, and more features will be available soon!</p>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
