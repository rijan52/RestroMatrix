import React, { useState, useEffect, useRef } from 'react'
import './LiveTracking.css'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import io from 'socket.io-client'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix leaflet markers
import leafletIcon from 'leaflet/dist/images/marker-icon.png'
import leafletIconShadow from 'leaflet/dist/images/marker-shadow.png'

// Driver marker (Red)
const driverIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MSA0MSI+PGNpcmNsZSBjeD0iMjAuNSIgY3k9IjIwLjUiIHI9IjE4IiBmaWxsPSIjZmYzMzMzIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [1, -34]
})

// Customer marker (Blue)
const customerIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MSA0MSI+PGNpcmNsZSBjeD0iMjAuNSIgY3k9IjIwLjUiIHI9IjE4IiBmaWxsPSIjMzMzM2ZmIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [1, -34]
})

const LiveTracking = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const orderId = searchParams.get('orderId')
    const url = "http://localhost:4000"

    const mapContainer = useRef(null)
    const mapRef = useRef(null)
    const socketRef = useRef(null)

    const driverMarkerRef = useRef(null)
    const customerMarkerRef = useRef(null)
    const polylineRef = useRef(null)

    const [order, setOrder] = useState(null)
    const [driverInfo, setDriverInfo] = useState(null)
    const [driverLocation, setDriverLocation] = useState(null)
    const [deliveryProgress, setDeliveryProgress] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [distance, setDistance] = useState(null)

    // Fetch order details
    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!orderId) {
                setError("No order ID provided")
                setLoading(false)
                return
            }

            try {
                const response = await axios.get(`${url}/api/order/${orderId}`)
                if (response.data.success) {
                    setOrder(response.data.data)
                    setDeliveryProgress(getProgressFromStatus(response.data.data.status))
                } else {
                    setError("Order not found")
                }
            } catch (err) {
                setError("Failed to load order details")
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchOrderDetails()
    }, [orderId])

    // Get progress percentage from status
    const getProgressFromStatus = (status) => {
        switch (status) {
            case "Food Processing":
                return 25
            case "Out for delivery":
                return 75
            case "Delivered":
                return 100
            default:
                return 0
        }
    }

    // Initialize map
    useEffect(() => {
        if (mapContainer.current && !mapRef.current) {
            mapRef.current = L.map(mapContainer.current).setView([27.7172, 85.3240], 13)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(mapRef.current)
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
            }
        }
    }, [])

    // Setup customer location marker when order loads
    useEffect(() => {
        if (order && order.address && mapRef.current) {
            const { latitude = 27.7172, longitude = 85.3240 } = order.address

            if (customerMarkerRef.current) {
                customerMarkerRef.current.setLatLng([latitude, longitude])
            } else {
                customerMarkerRef.current = L.marker([latitude, longitude], { icon: customerIcon })
                    .addTo(mapRef.current)
                    .bindPopup(`Delivery to ${order.address.firstName} ${order.address.lastName}`)
            }

            mapRef.current.setView([latitude, longitude], 14)
        }
    }, [order])

    // Initialize Socket.io for real-time driver location
    useEffect(() => {
        socketRef.current = io('http://localhost:4000', {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 10
        })

        // Receive driver location updates
        socketRef.current.on('receive-location', (data) => {
            const { id, latitude, longitude } = data
            setDriverLocation({ lat: latitude, lng: longitude })

            if (mapRef.current) {
                if (driverMarkerRef.current) {
                    driverMarkerRef.current.setLatLng([latitude, longitude])
                } else {
                    driverMarkerRef.current = L.marker([latitude, longitude], { icon: driverIcon })
                        .addTo(mapRef.current)
                        .bindPopup('Delivery Driver')
                }

                // Draw polyline between driver and customer
                if (customerMarkerRef.current) {
                    const customerLat = customerMarkerRef.current.getLatLng().lat
                    const customerLng = customerMarkerRef.current.getLatLng().lng

                    if (polylineRef.current) {
                        polylineRef.current.setLatLngs([[latitude, longitude], [customerLat, customerLng]])
                    } else {
                        polylineRef.current = L.polyline([[latitude, longitude], [customerLat, customerLng]], {
                            color: '#ff7800',
                            weight: 2,
                            opacity: 0.7
                        }).addTo(mapRef.current)
                    }

                    // Calculate distance
                    const dist = calculateDistance(latitude, longitude, customerLat, customerLng)
                    setDistance(dist.toFixed(2))
                }
            }
        })

        return () => {
            socketRef.current?.disconnect()
        }
    }, [])

    // Calculate distance between two coordinates (Haversine formula)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371 // Radius of the Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    if (loading) {
        return <div className="live-tracking"><p>Loading order details...</p></div>
    }

    if (error || !order) {
        return (
            <div className="live-tracking">
                <p>{error || "No order found"}</p>
                <button onClick={() => navigate('/myorders')}>Go Back to Orders</button>
            </div>
        )
    }

    return (
        <div className="live-tracking">
            <div className="tracking-header">
                <button className="back-btn" onClick={() => navigate('/myorders')}>← Back</button>
                <h2>Live Delivery Tracking</h2>
                <p className="order-id">Order ID: {order?._id}</p>
            </div>

            <div className="tracking-container">
                <div className="map-section">
                    <div ref={mapContainer} className="map-container"></div>
                </div>

                <div className="tracking-info">
                    <div className="order-details">
                        <h3>Order Details</h3>
                        <p><strong>Status:</strong> {order?.status || 'Processing'}</p>
                        <p><strong>Amount:</strong> ${order?.amount}</p>
                        <p><strong>Items:</strong> {order?.items?.length || 0} items</p>
                        {distance && <p><strong>Distance to Delivery:</strong> {distance} km</p>}
                    </div>

                    {order?.status === "Out for delivery" && (
                        <div className="driver-details">
                            <h3>Driver Information</h3>
                            <p><strong>Driver:</strong> {order?.driverName || 'Not assigned'}</p>
                            <p className="driver-status">🟢 Driver is on the way</p>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${deliveryProgress}%` }}></div>
                            </div>
                            <p className="progress-text">{deliveryProgress}% Complete</p>
                        </div>
                    )}

                    {order?.status === "Delivered" && (
                        <div className="driver-details delivered">
                            <h3>✓ Delivery Complete</h3>
                            <p>Your order has been delivered</p>
                        </div>
                    )}

                    {order?.status === "Food Processing" && (
                        <div className="driver-details processing">
                            <h3>Preparing Your Order</h3>
                            <p>Your food is being prepared in the restaurant</p>
                        </div>
                    )}

                    <div className="delivery-address">
                        <h3>Delivery Address</h3>
                        <p>{order?.address?.firstName} {order?.address?.lastName}</p>
                        <p>{order?.address?.street}</p>
                        <p>{order?.address?.city}, {order?.address?.state}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LiveTracking