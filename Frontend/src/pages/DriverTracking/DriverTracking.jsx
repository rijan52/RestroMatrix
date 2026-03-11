import React, { useState, useEffect, useRef } from 'react'
import './DriverTracking.css'
import { useSearchParams, useNavigate } from 'react-router-dom'
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

const DriverTracking = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const orderId = searchParams.get('orderId')

    const mapContainer = useRef(null)
    const mapRef = useRef(null)
    const socketRef = useRef(null)

    const driverMarkerRef = useRef(null)
    const customerMarkerRef = useRef(null)
    const polylineRef = useRef(null)

    const [deliveryOrder, setDeliveryOrder] = useState(null)
    const [driverLocation, setDriverLocation] = useState(null)
    const [customerLocation, setCustomerLocation] = useState(null)
    const [isDeliveryActive, setIsDeliveryActive] = useState(false)
    const [deliveryStatus, setDeliveryStatus] = useState('ready') // ready, pickup, on-way, delivered
    const [isTracking, setIsTracking] = useState(false)
    const [distance, setDistance] = useState(null)
    const watchIdRef = useRef(null)

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

    // Initialize Socket.io
    useEffect(() => {
        socketRef.current = io('http://localhost:4000', {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 10
        })

        // Receive customer location updates
        socketRef.current.on('customer-location', (data) => {
            const { latitude, longitude } = data
            setCustomerLocation({ lat: latitude, lng: longitude })

            if (mapRef.current) {
                if (customerMarkerRef.current) {
                    customerMarkerRef.current.setLatLng([latitude, longitude])
                } else {
                    customerMarkerRef.current = L.marker([latitude, longitude], { icon: customerIcon })
                        .addTo(mapRef.current)
                        .bindPopup('Customer Delivery Location')
                }

                // Draw polyline between driver and customer if both locations are available
                if (driverLocation) {
                    updatePolyline([driverLocation.lat, driverLocation.lng], [latitude, longitude])
                }
            }
        })

        // Listen for order assignment
        socketRef.current.on('order-assigned', (data) => {
            setDeliveryOrder(data)
            setCustomerLocation({
                lat: data.deliveryAddress?.latitude || 27.7172,
                lng: data.deliveryAddress?.longitude || 85.3240
            })
        })

        // Listen for delivery updates from backend
        socketRef.current.on('delivery-status-update', (data) => {
            setDeliveryStatus(data.status)
        })

        return () => {
            socketRef.current.disconnect()
        }
    }, [driverLocation])

    // Calculate distance between two points (Haversine formula)
    const calculateDistance = (lat1, lng1, lat2, lng2) => {
        const R = 6371 // Radius of Earth in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLng = (lng2 - lng1) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c
        return distance.toFixed(2)
    }

    // Update polyline between driver and customer
    const updatePolyline = (driverCoords, customerCoords) => {
        if (!mapRef.current) return

        if (polylineRef.current) {
            mapRef.current.removeLayer(polylineRef.current)
        }

        polylineRef.current = L.polyline([driverCoords, customerCoords], {
            color: '#3388ff',
            weight: 3,
            opacity: 0.8,
            dashArray: '5, 5'
        }).addTo(mapRef.current)

        // Calculate and display distance
        const dist = calculateDistance(driverCoords[0], driverCoords[1], customerCoords[0], customerCoords[1])
        setDistance(dist)

        // Fit map to show both locations
        const bounds = L.latLngBounds([driverCoords, customerCoords])
        mapRef.current.fitBounds(bounds, { padding: [50, 50] })
    }

    // Track driver location
    useEffect(() => {
        if (!isDeliveryActive) return

        if (navigator.geolocation) {
            setIsTracking(true)
            watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords
                    setDriverLocation({ lat: latitude, lng: longitude })

                    // Emit driver location to server
                    if (socketRef.current) {
                        socketRef.current.emit('driver-location', {
                            driverId: 'driver-' + Date.now(),
                            orderId: orderId,
                            latitude,
                            longitude,
                            timestamp: new Date().toISOString()
                        })
                    }

                    // Update driver marker
                    if (mapRef.current) {
                        if (driverMarkerRef.current) {
                            driverMarkerRef.current.setLatLng([latitude, longitude])
                        } else {
                            driverMarkerRef.current = L.marker([latitude, longitude], { icon: driverIcon })
                                .addTo(mapRef.current)
                                .bindPopup('Your Location')
                        }
                    }

                    // Update polyline if customer location exists
                    if (customerLocation) {
                        updatePolyline([latitude, longitude], [customerLocation.lat, customerLocation.lng])
                    }
                },
                (error) => {
                    console.error('Geolocation error:', error)
                    alert('Please enable location access')
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            )
        }

        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current)
            }
        }
    }, [isDeliveryActive, customerLocation])

    // Handle start delivery
    const handleStartDelivery = () => {
        setIsDeliveryActive(true)
        setDeliveryStatus('on-way')

        // Notify server
        if (socketRef.current) {
            socketRef.current.emit('delivery-started', {
                orderId: orderId,
                status: 'on-way'
            })
        }
    }

    // Handle complete delivery
    const handleCompleteDelivery = () => {
        setIsDeliveryActive(false)
        setDeliveryStatus('delivered')

        // Notify server
        if (socketRef.current) {
            socketRef.current.emit('delivery-completed', {
                orderId: orderId,
                status: 'delivered',
                timestamp: new Date().toISOString()
            })
        }

        alert('Delivery completed!')
        navigate('/myorders')
    }

    // Mock delivery order if not provided
    useEffect(() => {
        if (!deliveryOrder) {
            const mockOrder = {
                orderId: orderId || 'ORD-' + Date.now(),
                items: [
                    { name: 'Biryani', quantity: 1 },
                    { name: 'Momos', quantity: 2 },
                    { name: 'Coke', quantity: 1 }
                ],
                customerName: 'Raj Kumar',
                customerPhone: '+977 9841001234',
                deliveryAddress: 'Thamel, Kathmandu',
                totalAmount: 'Rs. 1,250'
            }
            setDeliveryOrder(mockOrder)
            setCustomerLocation({
                lat: 27.7172,
                lng: 85.3240
            })
        }
    }, [orderId])

    return (
        <div className="driver-tracking">
            <div className="tracking-header">
                <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
                <h2>🚗 Driver Delivery Tracking</h2>
                <p className="order-id">Order ID: {deliveryOrder?.orderId}</p>
            </div>

            <div className="tracking-container">
                {/* Map Section */}
                <div className="map-section">
                    <div
                        ref={mapContainer}
                        className="map-placeholder"
                        style={{ width: '100%', height: '450px' }}
                    ></div>
                    {!isTracking && isDeliveryActive && (
                        <div className="tracking-status-error">
                            <p>⚠️ Enabling GPS tracking...</p>
                        </div>
                    )}
                    {isTracking && (
                        <div className="tracking-status-active">
                            <p>✅ GPS tracking active</p>
                        </div>
                    )}
                </div>

                {/* Driver Info & Controls */}
                <div className="tracking-info">
                    {/* Delivery Status */}
                    <div className="status-section">
                        <h3>Delivery Status</h3>
                        <div className="status-indicator">
                            <span className={`status-badge ${deliveryStatus}`}>
                                {deliveryStatus === 'ready' && '📍 Ready for Pickup'}
                                {deliveryStatus === 'pickup' && '📦 Picking Up Order'}
                                {deliveryStatus === 'on-way' && '🚗 On the Way'}
                                {deliveryStatus === 'delivered' && '✅ Delivered'}
                            </span>
                        </div>
                    </div>

                    {/* Distance Info */}
                    {distance && (
                        <div className="distance-section">
                            <h3>Distance to Delivery</h3>
                            <p className="distance-value">{distance} km</p>
                        </div>
                    )}

                    {/* Customer Details */}
                    {deliveryOrder && (
                        <div className="customer-section">
                            <h3>Customer Details</h3>
                            <div className="customer-info">
                                <div className="customer-avatar">👤</div>
                                <div className="customer-details">
                                    <p className="customer-name">{deliveryOrder.customerName}</p>
                                    <p className="customer-phone">{deliveryOrder.customerPhone}</p>
                                    <p className="delivery-address">📍 {deliveryOrder.deliveryAddress}</p>
                                </div>
                                <div className="customer-actions">
                                    <a href={`tel:${deliveryOrder.customerPhone}`} className="call-btn" title="Call Customer">📞</a>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Location Info */}
                    <div className="location-info-section">
                        {driverLocation && (
                            <div className="location-box driver-location-box">
                                <h4>🚗 Your Location</h4>
                                <p>Lat: {driverLocation.lat.toFixed(4)}</p>
                                <p>Lng: {driverLocation.lng.toFixed(4)}</p>
                            </div>
                        )}
                        {customerLocation && (
                            <div className="location-box customer-location-box">
                                <h4>📍 Customer Location</h4>
                                <p>Lat: {customerLocation.lat.toFixed(4)}</p>
                                <p>Lng: {customerLocation.lng.toFixed(4)}</p>
                            </div>
                        )}
                    </div>

                    {/* Order Items */}
                    {deliveryOrder && (
                        <div className="items-section">
                            <h3>Order Items</h3>
                            <div className="items-list">
                                {deliveryOrder.items.map((item, index) => (
                                    <div key={index} className="item">
                                        <span className="item-name">{item.name}</span>
                                        <span className="item-qty">x{item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="order-total">
                                <strong>Total: {deliveryOrder.totalAmount}</strong>
                            </div>
                        </div>
                    )}

                    {/* Control Buttons */}
                    <div className="control-section">
                        {!isDeliveryActive ? (
                            <button
                                className="btn btn-start"
                                onClick={handleStartDelivery}
                            >
                                🚗 Start Delivery
                            </button>
                        ) : (
                            <>
                                <button
                                    className="btn btn-complete"
                                    onClick={handleCompleteDelivery}
                                >
                                    ✅ Complete Delivery
                                </button>
                                <button
                                    className="btn btn-cancel"
                                    onClick={() => {
                                        setIsDeliveryActive(false)
                                        setDeliveryStatus('ready')
                                    }}
                                >
                                    ❌ Cancel
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DriverTracking
