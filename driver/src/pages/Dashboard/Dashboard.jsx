import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DriverContext } from "../../context/DriverContext";
import "./Dashboard.css";

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Customer marker
const customerIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

// Driver marker
const driverIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/744/744465.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout, url, driverToken, driverId } = useContext(DriverContext);

  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const socketRef = useRef(null);

  const driverMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const routeRef = useRef(null);

  const [assignedOrders, setAssignedOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [socketStatus, setSocketStatus] = useState("disconnected");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  /* ============ FETCH ASSIGNED ORDERS ============ */
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${url}/api/order/driver/assigned`, {
          headers: { token: driverToken },
        });
        if (res.data.success) {
          setAssignedOrders(res.data.data);
          if (res.data.data.length > 0 && !selectedOrder) {
            setSelectedOrder(res.data.data[0]);
          }
        }
      } catch (error) {
        console.error("Fetch orders error:", error.response?.data || error.message);
      }
    };
    if (driverToken) fetchOrders();
    const interval = setInterval(() => {
      if (driverToken) fetchOrders();
    }, 30000);
    return () => clearInterval(interval);
  }, [url, driverToken, selectedOrder]);

  /* ============ INITIALIZE MAP ============ */
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = L.map(mapContainer.current).setView([27.7172, 85.324], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);
  }, []);

  /* ============ SOCKET CONNECTION ============ */
  useEffect(() => {
    if (!url || !selectedOrder || selectedOrder.status !== "Out for delivery") return;

    socketRef.current = io(url, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on("connect", () => {
      setSocketStatus("connected");
      socketRef.current.emit("join-order-room", {
        orderId: selectedOrder._id,
        driverId: driverId,
        role: "driver",
      });
    });

    socketRef.current.on("delivery-status-updated", (data) => {
      setSocketStatus("status-updated");
      console.log("Delivery status updated:", data);
    });

    socketRef.current.on("disconnect", () => setSocketStatus("disconnected"));

    socketRef.current.on("connect_error", () => setSocketStatus("connection-error"));

    socketRef.current.on("error", () => setSocketStatus("error"));

    socketRef.current.on("customer-location-updated", (data) => {
      const { latitude, longitude } = data;
      setCustomerLocation({ lat: latitude, lng: longitude });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave-order-room", {
          orderId: selectedOrder._id,
          role: "driver",
        });
        socketRef.current.disconnect();
      }
    };
  }, [url, selectedOrder, driverId]);

  /* ============ DRIVER LOCATION TRACKING ============ */
  useEffect(() => {
    if (!navigator.geolocation || !selectedOrder || selectedOrder.status !== "Out for delivery") return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const driverLoc = { lat: latitude, lng: longitude };
        setDriverLocation(driverLoc);

        // Update driver marker on map
        if (mapRef.current) {
          if (driverMarkerRef.current) {
            driverMarkerRef.current.setLatLng([latitude, longitude]);
          } else {
            driverMarkerRef.current = L.marker([latitude, longitude], { icon: driverIcon })
              .addTo(mapRef.current)
              .bindPopup(`You (Driver)\nAccuracy: ${accuracy.toFixed(0)}m`);
          }
          mapRef.current.setView([latitude, longitude], 15);
        }

        // Emit driver location to customers in this order room (only if "Out for delivery")
        if (socketRef.current && socketRef.current.connected && selectedOrder?._id && selectedOrder.status === "Out for delivery") {
          socketRef.current.emit("driver-location-update", {
            orderId: selectedOrder._id,
            driverId,
            latitude,
            longitude,
          });
        }
      },
      (err) => {
        // Handle specific geolocation errors
        if (err.code === err.PERMISSION_DENIED) {
          console.error("Location permission denied. Please enable location access in browser settings.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          console.error("Location unavailable. Device cannot get GPS signal.");
        } else if (err.code === err.TIMEOUT) {
          console.error("Location timeout. Getting position is taking too long.");
        } else {
          console.error("Geolocation error:", err);
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }
    );

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [selectedOrder, driverId]);

  /* ============ UPDATE CUSTOMER MARKER ============ */
  useEffect(() => {
    if (!customerLocation || !mapRef.current) return;
    const { lat, lng } = customerLocation;

    if (customerMarkerRef.current) {
      customerMarkerRef.current.setLatLng([lat, lng]);
    } else {
      customerMarkerRef.current = L.marker([lat, lng], { icon: customerIcon })
        .addTo(mapRef.current)
        .bindPopup("Customer Location");
    }

    if (driverLocation) {
      const driverLat = driverLocation.lat;
      const driverLng = driverLocation.lng;

      if (routeRef.current) {
        routeRef.current.setLatLngs([
          [driverLat, driverLng],
          [lat, lng],
        ]);
      } else {
        routeRef.current = L.polyline([[driverLat, driverLng], [lat, lng]], {
          color: "blue",
          weight: 3,
          dashArray: "5,5",
        }).addTo(mapRef.current);
      }

      const bounds = L.latLngBounds([
        [driverLat, driverLng],
        [lat, lng],
      ]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [customerLocation, driverLocation]);

  /* ---------------- UI ---------------- */
  return (
    <div className="driver-dashboard-container">
      <nav className="driver-navbar">
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <h1>RestroMatrix Driver</h1>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              borderRadius: "6px",
              backgroundColor:
                socketStatus === "joined-order"
                  ? "rgba(59, 130, 246, 0.1)"
                  : socketStatus === "connected"
                    ? "rgba(34, 197, 94, 0.1)"
                    : "rgba(239, 68, 68, 0.1)",
              fontSize: "11px",
              fontWeight: "bold",
              color:
                socketStatus === "joined-order"
                  ? "#1e40af"
                  : socketStatus === "connected"
                    ? "#065f46"
                    : "#7f1d1d",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              border:
                socketStatus === "joined-order"
                  ? "1px solid rgba(59, 130, 246, 0.3)"
                  : socketStatus === "connected"
                    ? "1px solid rgba(34, 197, 94, 0.3)"
                    : "1px solid rgba(239, 68, 68, 0.3)",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor:
                  socketStatus === "joined-order"
                    ? "#3b82f6"
                    : socketStatus === "connected"
                      ? "#22c55e"
                      : "#ef4444",
                animation:
                  socketStatus === "connected" || socketStatus === "joined-order"
                    ? "pulse 2s infinite"
                    : "none",
              }}
            ></span>
            {socketStatus}
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </nav>

      <div className="driver-dashboard-content">
        <h2>Delivery Dashboard</h2>

        <div className="dashboard-layout">
          <div className="map-section">
            <div ref={mapContainer} className="map-container"></div>
          </div>

          <div className="info-section">
            {selectedOrder ? (
              <div className="order-details-container">
                {/* Order Header */}
                <div className="order-details-header">
                  <div className="order-id-section">
                    <h3>Order #{selectedOrder._id.slice(-6).toUpperCase()}</h3>
                    <span className={`status-badge status-${selectedOrder.status?.toLowerCase().replace(/\s+/g, "-")}`}>
                      {selectedOrder.status || "Pending"}
                    </span>
                  </div>
                  <p className="order-date">
                    {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>

                {/* Customer Info Card */}
                <div className="details-card">
                  <h4 className="card-title">👤 Customer</h4>
                  <div className="info-row">
                    <span className="label">Name:</span>
                    <span className="value">{selectedOrder.address?.firstName || "N/A"}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Phone:</span>
                    <span className="value">{selectedOrder.address?.phone || "N/A"}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Address:</span>
                    <span className="value">{selectedOrder.address?.street || "N/A"}</span>
                  </div>
                </div>

                {/* Delivery Info Card */}
                <div className="details-card">
                  <h4 className="card-title">🚚 Delivery</h4>
                  <div className="info-row">
                    <span className="label">Status:</span>
                    <span className={`status-text status-${selectedOrder.status?.toLowerCase().replace(/\s+/g, "-")}`}>
                      {selectedOrder.status || "Pending"}
                    </span>
                  </div>
                  {customerLocation && driverLocation && (
                    <div className="info-row">
                      <span className="label">Distance:</span>
                      <span className="value">
                        {(
                          Math.sqrt(
                            Math.pow(customerLocation.lat - driverLocation.lat, 2) +
                            Math.pow(customerLocation.lng - driverLocation.lng, 2)
                          ) * 111
                        ).toFixed(1)} km
                      </span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="label">ETA:</span>
                    <span className="value">~15 mins</span>
                  </div>
                </div>

                {/* Items Card */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className="details-card">
                    <h4 className="card-title">📦 Items</h4>
                    <div className="items-list">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="item-row">
                          <div className="item-info">
                            <span className="item-name">{item.name}</span>
                            <span className="item-qty">x{item.quantity}</span>
                          </div>
                          <span className="item-price">Rs {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="items-total">
                      <span>Total:</span>
                      <span className="total-price">Rs {selectedOrder.amount}</span>
                    </div>
                  </div>
                )}

                {/* Order Lists */}
                <div className="section-card">
                  <h3>📋 Other Assigned Orders</h3>
                  <div className="orders">
                    {assignedOrders.map((order) => (
                      <div
                        key={order._id}
                        className={`order-item ${selectedOrder?._id === order._id ? "active" : ""}`}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <strong>#{order._id.slice(-6)}</strong>
                        <p>{order.address?.firstName}</p>
                        <p>{order.address?.phone}</p>
                        <span>Rs {order.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="section-card">
                <h3>📋 Assigned Orders</h3>
                <div className="orders">
                  {assignedOrders.map((order) => (
                    <div
                      key={order._id}
                      className={`order-item ${selectedOrder?._id === order._id ? "active" : ""}`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <strong>#{order._id.slice(-6)}</strong>
                      <p>{order.address?.firstName}</p>
                      <p>{order.address?.phone}</p>
                      <span>Rs {order.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {driverLocation && customerLocation && (
          <div className="dashboard-cards">
            <div className="dashboard-card">
              <h3>Your Location</h3>
              <p>{driverLocation.lat.toFixed(4)}</p>
              <small>{driverLocation.lng.toFixed(4)}</small>
            </div>

            <div className="dashboard-card">
              <h3>Customer Location</h3>
              <p>{customerLocation.lat.toFixed(4)}</p>
              <small>{customerLocation.lng.toFixed(4)}</small>
            </div>

            <div className="dashboard-card">
              <h3>Active Orders</h3>
              <p>{assignedOrders.length}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;