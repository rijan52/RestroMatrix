import React, { useState, useEffect, useRef } from 'react'
import './DriverDashboard.css'
import { useNavigate } from 'react-router-dom'
import io from 'socket.io-client'

const DriverDashboard = () => {
    const navigate = useNavigate()
    const socketRef = useRef(null)

    const [driverName] = useState('Ramesh Kumar')
    const [availableOrders, setAvailableOrders] = useState([])
    const [activeDelivery, setActiveDelivery] = useState(null)
    const [deliveryHistory, setDeliveryHistory] = useState([])
    const [isOnline, setIsOnline] = useState(false)

    // Initialize Socket.io
    useEffect(() => {
        socketRef.current = io('http://localhost:4000', {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 10
        })

        // Listen for new orders
        socketRef.current.on('new-order-available', (order) => {
            setAvailableOrders(prev => [order, ...prev])
        })

        // Listen for active delivery updates
        socketRef.current.on('active-delivery-update', (delivery) => {
            setActiveDelivery(delivery)
        })

        // Listen for delivery completion
        socketRef.current.on('delivery-completed-notify', (delivery) => {
            setActiveDelivery(null)
            setDeliveryHistory(prev => [delivery, ...prev])
        })

        // When driver goes online
        socketRef.current.emit('driver-online', {
            driverId: 'driver-' + Date.now(),
            driverName: driverName
        })

        return () => {
            socketRef.current.disconnect()
        }
    }, [])

    // Mock available orders on component load
    useEffect(() => {
        const mockOrders = [
            {
                orderId: 'ORD-001',
                customerName: 'Raj Kumar',
                pickupTime: '5 min',
                deliveryLocation: 'Thamel, Kathmandu',
                items: ['Biryani', 'Momos', 'Coke'],
                totalAmount: 'Rs. 1,250',
                distance: '2.5 km'
            },
            {
                orderId: 'ORD-002',
                customerName: 'Priya Sharma',
                pickupTime: '10 min',
                deliveryLocation: 'Patan, Lalitpur',
                items: ['Momo', 'Chowein', 'Juice'],
                totalAmount: 'Rs. 890',
                distance: '3.2 km'
            },
            {
                orderId: 'ORD-003',
                customerName: 'Anil Thapa',
                pickupTime: '3 min',
                deliveryLocation: 'Bhaktapur',
                items: ['Pizza', 'Garlic Bread', 'Coke'],
                totalAmount: 'Rs. 1,450',
                distance: '5.8 km'
            }
        ]
        setAvailableOrders(mockOrders)
    }, [])

    // Accept an order and start delivery
    const handleAcceptOrder = (order) => {
        setActiveDelivery(order)
        setAvailableOrders(prev => prev.filter(o => o.orderId !== order.orderId))

        // Notify backend
        if (socketRef.current) {
            socketRef.current.emit('order-accepted', {
                orderId: order.orderId,
                driverId: 'driver-' + Date.now()
            })
        }
    }

    // Decline an order
    const handleDeclineOrder = (orderId) => {
        setAvailableOrders(prev => prev.filter(o => o.orderId !== orderId))

        if (socketRef.current) {
            socketRef.current.emit('order-declined', {
                orderId: orderId,
                driverId: 'driver-' + Date.now()
            })
        }
    }

    // Start tracking delivery
    const handleStartTracking = (orderId) => {
        navigate(`/driver-tracking?orderId=${orderId}`)
    }

    // Toggle online/offline status
    const toggleOnlineStatus = () => {
        setIsOnline(!isOnline)

        if (socketRef.current) {
            if (!isOnline) {
                socketRef.current.emit('driver-online', {
                    driverId: 'driver-' + Date.now(),
                    driverName: driverName
                })
            } else {
                socketRef.current.emit('driver-offline', {
                    driverId: 'driver-' + Date.now()
                })
            }
        }
    }

    return (
        <div className="driver-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div className="header-left">
                    <h1>🚗 Driver Dashboard</h1>
                    <p>Welcome, {driverName}</p>
                </div>
                <div className="header-right">
                    <button 
                        className={`online-toggle ${isOnline ? 'online' : 'offline'}`}
                        onClick={toggleOnlineStatus}
                    >
                        {isOnline ? '🟢 Online' : '🔴 Offline'}
                    </button>
                </div>
            </div>

            <div className="dashboard-container">
                {/* Active Delivery Section */}
                {activeDelivery && (
                    <div className="active-delivery-section">
                        <h2>📦 Active Delivery</h2>
                        <div className="active-delivery-card">
                            <div className="delivery-header">
                                <h3>{activeDelivery.orderId}</h3>
                                <span className="badge active">In Progress</span>
                            </div>
                            <div className="delivery-details">
                                <div className="detail-item">
                                    <label>📍 Delivery To:</label>
                                    <p>{activeDelivery.customerName}</p>
                                    <small>{activeDelivery.deliveryLocation}</small>
                                </div>
                                <div className="detail-item">
                                    <label>📦 Items:</label>
                                    <ul>
                                        {activeDelivery.items.map((item, idx) => (
                                            <li key={idx}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="detail-item">
                                    <label>💰 Total Amount:</label>
                                    <p className="amount">{activeDelivery.totalAmount}</p>
                                </div>
                            </div>
                            <button 
                                className="btn btn-track"
                                onClick={() => handleStartTracking(activeDelivery.orderId)}
                            >
                                📍 Start GPS Tracking
                            </button>
                        </div>
                    </div>
                )}

                {/* Available Orders Section */}
                <div className="available-orders-section">
                    <div className="section-header">
                        <h2>🆕 Available Orders</h2>
                        <span className="count-badge">{availableOrders.length}</span>
                    </div>

                    {availableOrders.length > 0 ? (
                        <div className="orders-list">
                            {availableOrders.map((order) => (
                                <div key={order.orderId} className="order-card">
                                    <div className="order-header">
                                        <h3>{order.orderId}</h3>
                                        <span className="distance">{order.distance}</span>
                                    </div>

                                    <div className="order-body">
                                        <div className="customer-info">
                                            <p className="customer-name">👤 {order.customerName}</p>
                                            <p className="delivery-location">📍 {order.deliveryLocation}</p>
                                        </div>

                                        <div className="order-items">
                                            <p className="items-label">Items:</p>
                                            <div className="items-tags">
                                                {order.items.map((item, idx) => (
                                                    <span key={idx} className="item-tag">{item}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="order-footer">
                                            <div className="order-info">
                                                <p className="pickup-time">⏱️ Ready in: {order.pickupTime}</p>
                                                <p className="amount">💰 {order.totalAmount}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="order-actions">
                                        <button 
                                            className="btn-accept"
                                            onClick={() => handleAcceptOrder(order)}
                                        >
                                            ✅ Accept
                                        </button>
                                        <button 
                                            className="btn-decline"
                                            onClick={() => handleDeclineOrder(order.orderId)}
                                        >
                                            ❌ Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-orders">
                            <p>😴 No orders available right now</p>
                            <small>Orders will appear here when available</small>
                        </div>
                    )}
                </div>

                {/* Delivery History Section */}
                {deliveryHistory.length > 0 && (
                    <div className="delivery-history-section">
                        <h2>✅ Delivery History</h2>
                        <div className="history-list">
                            {deliveryHistory.slice(0, 5).map((delivery, idx) => (
                                <div key={idx} className="history-item">
                                    <span className="history-id">{delivery.orderId}</span>
                                    <span className="history-customer">{delivery.customerName}</span>
                                    <span className="history-badge">Delivered</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Stats */}
            <div className="floating-stats">
                <div className="stat-box">
                    <p className="stat-label">Today's Deliveries</p>
                    <p className="stat-value">{deliveryHistory.length}</p>
                </div>
                <div className="stat-box">
                    <p className="stat-label">Rating</p>
                    <p className="stat-value">⭐ 4.8</p>
                </div>
            </div>
        </div>
    )
}

export default DriverDashboard
