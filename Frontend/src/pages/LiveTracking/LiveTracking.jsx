import React, { useEffect, useRef, useState, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./LiveTracking.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import io from "socket.io-client";
import { StoreContext } from "../../context/StoreContext";

const LiveTracking = () => {

    const mapRef = useRef(null);
    const mapContainer = useRef(null);
    const socketRef = useRef(null);
    const driverMarkerRef = useRef(null);
    const customerMarkerRef = useRef(null);
    const routeRef = useRef(null);

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { url } = useContext(StoreContext);

    const [order, setOrder] = useState(null);
    const [driver, setDriver] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    const [customerLocation, setCustomerLocation] = useState(null);

    // Fetch order and driver data
    useEffect(() => {
        const fetchOrderData = async () => {
            try {
                const orderId = searchParams.get("orderId");
                if (!orderId) {
                    setError("Order ID not provided");
                    setLoading(false);
                    return;
                }

                // Fetch order details
                const orderResponse = await axios.get(`${url}/api/order/${orderId}`);
                if (orderResponse.data.success) {
                    const orderData = orderResponse.data.data;
                    setOrder(orderData);

                    // Fetch driver details if driverName exists
                    if (orderData.driverName) {
                        try {
                            setDriver(orderData);
                        } catch (driverError) {
                            console.log("Could not fetch driver details:", driverError);
                        }
                    }
                } else {
                    setError("Order not found");
                }
            } catch (err) {
                console.error("Error fetching order:", err);
                setError("Failed to fetch order details");
            } finally {
                setLoading(false);
            }
        };

        fetchOrderData();
    }, [searchParams, url]);

    // Get customer's current real-time location
    useEffect(() => {
        if (!navigator.geolocation) {
            console.error("Geolocation not supported");
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                console.log("Customer real-time location updated:", latitude, longitude);
                setCustomerLocation({ lat: latitude, lng: longitude });
            },
            (error) => {
                console.error("Error getting customer location:", error.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );

        return () => {
            console.log("Cleaning up geolocation watch");
            navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    // Initialize map after order data is loaded
    useEffect(() => {

        if (!mapRef.current && order && customerLocation) {

            mapRef.current = L.map(mapContainer.current).setView([customerLocation.lat, customerLocation.lng], 13);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap contributors",
                maxZoom: 19,
            }).addTo(mapRef.current);

            // Customer marker - use current location
            const customerIcon = L.icon({
                iconUrl: "https://cdn-icons-png.flaticon.com/512/3177/3177361.png",
                iconSize: [35, 35]
            });

            customerMarkerRef.current = L.marker([customerLocation.lat, customerLocation.lng], { icon: customerIcon })
                .addTo(mapRef.current)
                .bindPopup(`📍 You: ${order.address?.street || "Your Location"}`);

            // Driver marker - will be updated via socket
            const driverIcon = L.icon({
                iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                iconSize: [35, 35]
            });

            if (driverLocation) {
                driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], { icon: driverIcon })
                    .addTo(mapRef.current)
                    .bindPopup(`🚗 Driver: ${order.driverName || "In Transit"}`);
            }

            setTimeout(() => {
                mapRef.current.invalidateSize();
            }, 200);
        } else if (mapRef.current && customerLocation && customerMarkerRef.current) {
            // Update customer marker position in real-time
            customerMarkerRef.current.setLatLng([customerLocation.lat, customerLocation.lng]);
            customerMarkerRef.current.setPopupContent(`📍 You: ${order?.address?.street || "Your Location"}`);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };

    }, [order, customerLocation]);

    // Socket connection for real-time driver location
    useEffect(() => {
        if (!url || !order) return;

        socketRef.current = io(url, {
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
        });

        socketRef.current.on("connect", () => {
            console.log("Socket connected to live tracking");

            // Join order room to receive driver location updates
            socketRef.current.emit('join-order-room', {
                orderId: order._id,
                customerId: order.userId || 'unknown',
                role: "customer"
            });
        });

        socketRef.current.on("driver-location-updated", (data) => {
            console.log("Received driver-location-updated event:", data);

            if (!mapRef.current) {
                console.log("Map not ready, buffering driver location");
                return;
            }

            const { latitude, longitude } = data;
            console.log("Updating driver location:", latitude, longitude);
            setDriverLocation({ lat: latitude, lng: longitude });

            // Update or create driver marker
            const driverIcon = L.icon({
                iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                iconSize: [35, 35],
                iconAnchor: [17, 35]
            });

            if (driverMarkerRef.current) {
                console.log("Updating existing driver marker");
                driverMarkerRef.current.setLatLng([latitude, longitude]);
            } else {
                console.log("Creating new driver marker");
                driverMarkerRef.current = L.marker([latitude, longitude], { icon: driverIcon })
                    .addTo(mapRef.current)
                    .bindPopup(`🚗 Driver: ${order.driverName || "In Transit"}`);
            }

            // Update polyline between driver and customer
            if (customerLocation) {
                if (routeRef.current) {
                    routeRef.current.setLatLngs([
                        [latitude, longitude],
                        [customerLocation.lat, customerLocation.lng],
                    ]);
                } else {
                    routeRef.current = L.polyline(
                        [
                            [latitude, longitude],
                            [customerLocation.lat, customerLocation.lng],
                        ],
                        { color: "blue", weight: 3, dashArray: "5,5" }
                    ).addTo(mapRef.current);
                }

                // Fit both markers in view
                const bounds = L.latLngBounds([
                    [latitude, longitude],
                    [customerLocation.lat, customerLocation.lng],
                ]);
                mapRef.current.fitBounds(bounds, { padding: [50, 50] });
            }
        });

        socketRef.current.on("delivery-status-updated", (data) => {
            console.log("Delivery status:", data);
        });

        socketRef.current.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.emit("leave-order-room", {
                    orderId: order._id,
                    role: "customer"
                });
                socketRef.current.disconnect();
            }
        };
    }, [url, order, customerLocation]);

    /* ============ SEND CUSTOMER LOCATION VIA SOCKET ============ */

    useEffect(() => {
        if (!socketRef.current || !customerLocation || !order?._id) return;

        console.log(" Starting customer location broadcast for order:", order._id);

        // Send customer location every 5 seconds
        const locationInterval = setInterval(() => {
            if (socketRef.current?.connected) {
                socketRef.current.emit('customer-location-update', {
                    orderId: order._id,
                    customerId: order.customerId || 'unknown',
                    latitude: customerLocation.lat,
                    longitude: customerLocation.lng
                });

                console.log("📤 Sent customer location via socket:", {
                    orderId: order._id,
                    lat: customerLocation.lat,
                    lng: customerLocation.lng
                });
            } else {
                console.warn("⚠️ Socket not connected, retrying...");
            }
        }, 5000);

        return () => {
            console.log("🛑 Stopping customer location broadcast");
            clearInterval(locationInterval);
        };
    }, [customerLocation, order]);

    if (loading) {
        return <div className="live-tracking live-tracking-state"><p>Loading order details...</p></div>;
    }

    if (error) {
        return <div className="live-tracking live-tracking-state"><p style={{ color: 'red' }}>{error}</p></div>;
    }

    if (!order) {
        return <div className="live-tracking live-tracking-state"><p>Order not found</p></div>;
    }

    const getProgressSteps = (status) => {
        const steps = ["Order Placed", "Preparing", "Out for Delivery", "Delivered"];
        const currentIndex = steps.findIndex(s => s.replace(" ", "") === status.replace(" ", ""));
        return currentIndex >= 0 ? currentIndex : 2;
    };

    const progressIndex = getProgressSteps(order.status);
    const progressPercentage = ((progressIndex + 1) / 4) * 100;

    return (
        <div className="live-tracking">

            <div className="tracking-header">
                <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
                <h2>Live Order Tracking</h2>
                <p className="order-id">Order #{order._id.slice(-4).toUpperCase()}</p>
            </div>

            <div className="tracking-container">

                {/* Map */}
                <div className="map-section">
                    <div id="map" ref={mapContainer}></div>

                    <div className="tracking-status">
                        🚚 {order.driverName ? `${order.driverName} is on the way to your location` : "Driver assigned to your order"}
                    </div>
                </div>

                {/* Tracking Info */}
                <div className="tracking-info">

                    {/* Progress */}
                    <div className="progress-section">
                        <h3>Order Progress</h3>

                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
                        </div>

                        <div className="progress-steps">
                            <div className={`step ${progressIndex >= 0 ? 'active' : ''}`}><span>Order Placed</span></div>
                            <div className={`step ${progressIndex >= 1 ? 'active' : ''}`}><span>Preparing</span></div>
                            <div className={`step ${progressIndex >= 2 ? 'active' : ''}`}><span>Out for Delivery</span></div>
                            <div className={`step ${progressIndex >= 3 ? 'active' : ''}`}><span>Delivered</span></div>
                        </div>
                    </div>

                    {/* Locations */}
                    {(driverLocation || customerLocation) && (
                        <div className="locations-section" style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '10px',
                            padding: '15px',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '8px',
                            marginBottom: '15px'
                        }}>
                            {driverLocation && (
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: 'white',
                                    borderRadius: '6px',
                                    border: '1px solid #ddd'
                                }}>
                                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '12px', color: '#666' }}>🚗 Driver Location</p>
                                    <p style={{ margin: '0', fontSize: '13px', fontFamily: 'monospace', color: '#333' }}>
                                        {driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}
                                    </p>
                                </div>
                            )}
                            {customerLocation && (
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: 'white',
                                    borderRadius: '6px',
                                    border: '1px solid #ddd'
                                }}>
                                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '12px', color: '#666' }}>📍 Your Location</p>
                                    <p style={{ margin: '0', fontSize: '13px', fontFamily: 'monospace', color: '#333' }}>
                                        {customerLocation.lat.toFixed(4)}, {customerLocation.lng.toFixed(4)}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Driver */}
                    <div className="driver-section">
                        <h3>Driver Details</h3>

                        <div className="driver-info">

                            <div className="driver-avatar">🚴</div>

                            <div className="driver-details">
                                <p className="driver-name">{order.driverName || 'Driver not assigned'}</p>
                                <p className="driver-vehicle">
                                    {order.driverVehicle ? `${order.driverVehicle}` : 'Vehicle not specified'}
                                </p>
                                <div className="driver-rating">
                                    <span className="stars">⭐ {order.driverRating ? order.driverRating.toFixed(1) : 'N/A'}</span>
                                </div>
                            </div>

                            <div className="driver-actions">
                                {order.driverPhone ? (
                                    <a href={`tel:${order.driverPhone}`} className="call-btn">📞</a>
                                ) : (
                                    <span className="call-btn" style={{ opacity: 0.5 }}>📞</span>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Items */}
                    <div className="items-section">
                        <h3>Order Items</h3>

                        <div className="items-list">

                            {order.items && order.items.length > 0 ? (
                                order.items.map((item, index) => (
                                    <div key={index} className="item">
                                        <span>{item.name} x{item.quantity}</span>
                                        <span>Rs {(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))
                            ) : (
                                <p>No items found</p>
                            )}

                        </div>
                    </div>

                    {/* ETA */}
                    <div className="time-section">
                        <h3>Order Total</h3>
                        <p className="estimated-time">Rs {order.amount.toFixed(2)}</p>
                    </div>

                    {/* Support */}
                    <div className="support-section">
                        <button className="support-btn">
                            Contact Support
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LiveTracking;