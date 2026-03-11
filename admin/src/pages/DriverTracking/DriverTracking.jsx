import React, { useState, useEffect, useRef } from 'react'
import './DriverTracking.css'
import { useSearchParams, useNavigate } from 'react-router-dom'
import io from 'socket.io-client'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'

// Fix leaflet markers
import leafletIcon from 'leaflet/dist/images/marker-icon.png'
import leafletIconShadow from 'leaflet/dist/images/marker-shadow.png'

const driverIcon = L.icon({
    iconUrl: leafletIcon,
    shadowUrl: leafletIconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

const customerIcon = L.divIcon({
    html: `<div style="background-color: #4CAF50; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">📍</div>`,
    iconSize: [30, 30],
    className: 'custom-icon'
})

const restaurantIcon = L.divIcon({
    html: `<div style="background-color: #FF9800; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🏪</div>`,
    iconSize: [30, 30],
    className: 'custom-icon'
})

const DriverTracking = ({ url }) => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const currentOrderId = searchParams.get('orderId')

    const mapContainer = useRef(null)
    const mapRef = useRef(null)
    const socketRef = useRef(null)
    const routeControl = useRef(null)

    const [activeOrders, setActiveOrders] = useState([])
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [driverLocation, setDriverLocation] = useState(null)
    const [customerLocation, setCustomerLocation] = useState(null)
    const [isTracking, setIsTracking] = useState(false)
    const [deliveryStatus, setDeliveryStatus] = useState('on-the-way')
    const [estimatedTime, setEstimatedTime] = useState('25 mins')
    const [distance, setDistance] = useState('2.5 km')
    const [isOnline, setIsOnline] = useState(true)

    const markersRef = useRef({})

    // Initialize map
    useEffect(() => {
        if (mapContainer.current && !mapRef.current) {
            mapRef.current = L.map(mapContainer.current).setView([27.7172, 85.3240], 13)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(mapRef.current)
        }
    }, [])

    // Initialize Socket.io
    useEffect(() => {
        socketRef.current = io('http://localhost:3000', {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 10
        })

        // Receive customer location
        socketRef.current.on('receive-location', (data) => {
            const { latitude, longitude } = data
            setCustomerLocation({ lat: latitude, lng: longitude })

            if (mapRef.current) {
                if (markersRef.current['customer']) {
                    markersRef.current['customer'].setLatLng([latitude, longitude])
                } else {
                    markersRef.current['customer'] = L.marker([latitude, longitude], { icon: customerIcon })
                        .addTo(mapRef.current)
                        .bindPopup('Customer Location')
                }
            }
        })

        // Listen for order updates from dispatch
        socketRef.current.on('order-assigned', (order) => {
            setActiveOrders(prev => [...prev, order])
        })

        socketRef.current.on('order-cancelled', (orderId) => {
            setActiveOrders(prev => prev.filter(o => o._id !== orderId))
            if (selectedOrder?._id === orderId) {
                setSelectedOrder(null)
            }
        })

        return () => {
            socketRef.current.disconnect()
        }
    }, [])

    // Track driver location
    useEffect(() => {
        if (navigator.geolocation && isOnline) {
            setIsTracking(true)
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords
                    setDriverLocation({ lat: latitude, lng: longitude })

                    // Emit driver location to server
                    if (socketRef.current && selectedOrder) {
                        socketRef.current.emit('driver-location', {
                            orderId: selectedOrder._id,
                            driverId: 'current-driver-id',
                            latitude,
                            longitude,
                            status: deliveryStatus
                        })
                    }

                    // Update driver marker
                    if (mapRef.current) {
                        if (markersRef.current['driver']) {
                            markersRef.current['driver'].setLatLng([latitude, longitude])
                        } else {
                            markersRef.current['driver'] = L.marker([latitude, longitude], { icon: driverIcon })
                                .addTo(mapRef.current)
                                .bindPopup('Your Location')
                        }
                    }
                },
                (error) => {
                    console.error('Geolocation error:', error)
                    setIsTracking(false)
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            )

            return () => {
                navigator.geolocation.clearWatch(watchId)
            }
        }
    }, [selectedOrder, deliveryStatus, isOnline])

    // Update route when locations change
    useEffect(() => {
        if (mapRef.current && driverLocation && selectedOrder?.deliveryAddress) {
            // Remove existing route
            if (routeControl.current) {
                mapRef.current.removeControl(routeControl.current)
            }

            // Add new route
            try {
                routeControl.current = L.Routing.control({
                    waypoints: [
                        L.latLng(driverLocation.lat, driverLocation.lng),
                        L.latLng(selectedOrder.deliveryLat || 27.7172, selectedOrder.deliveryLng || 85.3240)
                    ],
                    routeWhileDragging: true,
                    createMarker: () => null // Don't create default markers
                }).addTo(mapRef.current)

                // Fit bounds
                const group = new L.featureGroup([
                    L.marker([driverLocation.lat, driverLocation.lng]),
                    L.marker([selectedOrder.deliveryLat || 27.7172, selectedOrder.deliveryLng || 85.3240])
                ])
                mapRef.current.fitBounds(group.getBounds().pad(0.1))
            } catch (error) {
                console.error('Routing error:', error)
            }
        }
    }, [driverLocation, selectedOrder])

    // Fetch active orders (mock data)
    useEffect(() => {
        const mockOrders = [
            {
                _id: 'ORD-001',
                orderId: 'ORD-001',
                customerName: 'Amit Singh',
                customerPhone: '9841234567',
                deliveryAddress: 'Thamel, Kathmandu',
                deliveryLat: 27.7149,
                deliveryLng: 85.3265,
                restaurantLat: 27.7172,
                restaurantLng: 85.3240,
                items: [
                    { name: 'Momos', quantity: 2 },
                    { name: 'Dal Bhat', quantity: 1 }
                ],
                total: 500,
                status: 'picked-up'
            },
            {
                _id: 'ORD-002',
                orderId: 'ORD-002',
                customerName: 'Priya Sharma',
                customerPhone: '9841234568',
                deliveryAddress: 'Lazimpat, Kathmandu',
                deliveryLat: 27.7320,
                deliveryLng: 85.3340,
                restaurantLat: 27.7172,
                restaurantLng: 85.3240,
                items: [
                    { name: 'Biryani', quantity: 1 }
                ],
                total: 350,
                status: 'pending'
            }
        ]

        setActiveOrders(mockOrders)

        // Set initial selected order if orderId is in query params
        if (currentOrderId) {
            const order = mockOrders.find(o => o._id === currentOrderId)
            if (order) setSelectedOrder(order)
        } else if (mockOrders.length > 0) {
            setSelectedOrder(mockOrders[0])
        }
    }, [currentOrderId])

    const handleStatusChange = (newStatus) => {
        setDeliveryStatus(newStatus)

        // Emit status update to server
        if (socketRef.current && selectedOrder) {
            socketRef.current.emit('update-delivery-status', {
                orderId: selectedOrder._id,
                status: newStatus
            })
        }

        // Show confirmation
        const statusLabels = {
            'picked-up': '✓ Order Picked Up',
            'on-the-way': '🚗 On the Way',
            'delivered': '✓ Delivered'
        }
        // toast.success(statusLabels[newStatus])
    }

    const handleCallCustomer = () => {
        if (selectedOrder?.customerPhone) {
            window.location.href = `tel:${selectedOrder.customerPhone}`
        }
    }

    const handleToggleOnline = () => {
        setIsOnline(!isOnline)
    }

    const handleGoBack = () => {
        navigate('/orders')
    }

    return (
        <div className="driver-tracking">
            {/* Header */}
            <div className="tracking-header">
                <button className="back-btn" onClick={handleGoBack}>← Back to Orders</button>
                <h2>🚗 Driver Live Tracking</h2>
                <button
                    className={`online-btn ${isOnline ? 'active' : ''}`}
                    onClick={handleToggleOnline}
                >
                    {isOnline ? '🟢 Online' : '🔴 Offline'}
                </button>
            </div>

            <div className="driver-tracking-container">
                {/* Left Sidebar - Orders List */}
                <div className="orders-sidebar">
                    <h3>Active Deliveries</h3>
                    {activeOrders.length === 0 ? (
                        <div className="no-orders">
                            <p>No active deliveries</p>
                        </div>
                    ) : (
                        <div className="orders-list">
                            {activeOrders.map((order) => (
                                <div
                                    key={order._id}
                                    className={`order-card ${selectedOrder?._id === order._id ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedOrder(order)
                                        setDeliveryStatus(order.status)
                                    }}
                                >
                                    <div className="order-header">
                                        <span className="order-id">{order.orderId}</span>
                                        <span className={`status-badge ${order.status}`}>
                                            {order.status === 'pending' ? '⏳ Pending' : '✓ Picked'}
                                        </span>
                                    </div>
                                    <p className="customer-name">{order.customerName}</p>
                                    <p className="address-short">{order.deliveryAddress.substring(0, 30)}...</p>
                                    <p className="items-count"><strong>{order.items.length}</strong> item(s)</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="tracking-main">
                    {selectedOrder ? (
                        <>
                            {/* Map */}
                            <div className="map-wrapper">
                                <div ref={mapContainer} className="map-container" style={{ width: '100%', height: '400px' }}></div>
                                {!isTracking && (
                                    <div className="location-warning">
                                        <p>⚠️ Enable location permission</p>
                                    </div>
                                )}
                            </div>

                            {/* Tracking Info */}
                            <div className="tracking-info">
                                <div className="order-details">
                                    <div className="detail-section">
                                        <h3>🛍️ Order Details</h3>
                                        <p className="order-id-large">Order: <strong>{selectedOrder.orderId}</strong></p>
                                        <div className="items-list">
                                            {selectedOrder.items.map((item, idx) => (
                                                <div key={idx} className="item">
                                                    <span>{item.name}</span>
                                                    <span>x{item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="total">Total: Rs. {selectedOrder.total}</p>
                                    </div>

                                    <div className="detail-section">
                                        <h3>📍 Delivery Location</h3>
                                        <p><strong>{selectedOrder.customerName}</strong></p>
                                        <p className="address">{selectedOrder.deliveryAddress}</p>
                                        {selectedOrder.deliveryLat && selectedOrder.deliveryLng && (
                                            <p className="coordinates">
                                                {selectedOrder.deliveryLat.toFixed(4)}, {selectedOrder.deliveryLng.toFixed(4)}
                                            </p>
                                        )}
                                    </div>

                                    <div className="detail-section">
                                        <h3>📞 Customer Contact</h3>
                                        <button className="call-btn" onClick={handleCallCustomer}>
                                            📞 Call {selectedOrder.customerPhone}
                                        </button>
                                    </div>

                                    <div className="detail-section">
                                        <h3>📊 Delivery Status</h3>
                                        <div className="status-buttons">
                                            <button
                                                className={`status-btn ${deliveryStatus === 'picked-up' ? 'active' : ''}`}
                                                onClick={() => handleStatusChange('picked-up')}
                                            >
                                                ✓ Picked Up
                                            </button>
                                            <button
                                                className={`status-btn ${deliveryStatus === 'on-the-way' ? 'active' : ''}`}
                                                onClick={() => handleStatusChange('on-the-way')}
                                            >
                                                🚗 On the Way
                                            </button>
                                            <button
                                                className={`status-btn ${deliveryStatus === 'delivered' ? 'active' : ''}`}
                                                onClick={() => handleStatusChange('delivered')}
                                            >
                                                ✓ Delivered
                                            </button>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <h3>⏱️ Estimate</h3>
                                        <div className="estimate-info">
                                            <div className="estimate-item">
                                                <span>Distance:</span>
                                                <strong>{distance}</strong>
                                            </div>
                                            <div className="estimate-item">
                                                <span>ETA:</span>
                                                <strong>{estimatedTime}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {driverLocation && (
                                        <div className="detail-section">
                                            <h3>📍 Your Location</h3>
                                            <p className="coordinates">
                                                Lat: {driverLocation.lat.toFixed(6)}<br />
                                                Lng: {driverLocation.lng.toFixed(6)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="no-order-selected">
                            <p>Select an order to start tracking</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DriverTracking
