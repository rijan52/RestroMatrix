import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DriverContext } from "../../context/DriverContext";
import "./Dashboard.css";

// Fix Leaflet default marker
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
  iconUrl:
    "https://cdn-icons-png.flaticon.com/512/854/854894.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

// Driver marker
const driverIcon = L.icon({
  iconUrl:
    "https://cdn-icons-png.flaticon.com/512/854/854894.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout, url, driverToken } = useContext(DriverContext);

  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const socketRef = useRef(null);

  const driverMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const routeRef = useRef(null);
  const customerLocationRef = useRef(null);

  const [assignedOrders, setAssignedOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Fetch assigned orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${url}/api/order/driver/assigned`, {
          headers: { token: driverToken },
        });

        if (res.data.success) {
          setAssignedOrders(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedOrder(res.data.data[0]);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (driverToken) fetchOrders();
  }, [url, driverToken]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapRef.current) return;

    const map = L.map(mapContainer.current).setView([27.7172, 85.324], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }, []);

  // Show customer marker
  useEffect(() => {
    if (!selectedOrder || !mapRef.current) return;

    const lat = parseFloat(selectedOrder.address?.latitude) || 27.7172;
    const lng = parseFloat(selectedOrder.address?.longitude) || 85.324;

    setCustomerLocation({ lat, lng });
    customerLocationRef.current = { lat, lng };

    if (customerMarkerRef.current) {
      customerMarkerRef.current.setLatLng([lat, lng]);
    } else {
      customerMarkerRef.current = L.marker([lat, lng], {
        icon: customerIcon,
      }).addTo(mapRef.current);
      customerMarkerRef.current.bindPopup("📍 Customer");
    }

    // Fit both markers in view if driver location exists
    if (driverLocation) {
      const bounds = L.latLngBounds([
        [driverLocation.lat, driverLocation.lng],
        [lat, lng],
      ]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else {
      mapRef.current.setView([lat, lng], 14);
    }
  }, [selectedOrder, driverLocation]);

  // Socket connection - only create once
  useEffect(() => {
    if (!url || !driverToken) return;

    socketRef.current = io(url, {
      auth: {
        token: driverToken,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connected");
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socketRef.current.on("driver-location", (data) => {
      if (!mapRef.current) return;

      const { latitude, longitude } = data;
      setDriverLocation({ lat: latitude, lng: longitude });

      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng([latitude, longitude]);
      } else {
        driverMarkerRef.current = L.marker([latitude, longitude], {
          icon: driverIcon,
        }).addTo(mapRef.current);
        driverMarkerRef.current.bindPopup("🚗 You (Driver)");
      }

      // Update polyline using ref
      const customerLoc = customerLocationRef.current;
      if (customerLoc && mapRef.current) {
        if (routeRef.current) {
          routeRef.current.setLatLngs([
            [latitude, longitude],
            [customerLoc.lat, customerLoc.lng],
          ]);
        } else {
          routeRef.current = L.polyline(
            [
              [latitude, longitude],
              [customerLoc.lat, customerLoc.lng],
            ],
            { color: "blue", weight: 3, dashArray: "5,5" }
          ).addTo(mapRef.current);
        }

        // Fit both markers in view
        const bounds = L.latLngBounds([
          [latitude, longitude],
          [customerLoc.lat, customerLoc.lng],
        ]);
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [url, driverToken]);

  // Get driver's real-time location
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setDriverLocation({ lat: latitude, lng: longitude });

        if (socketRef.current) {
          socketRef.current.emit("driver-location", {
            latitude,
            longitude,
          });
        }

        // Fit both markers in view
        const customerLoc = customerLocationRef.current;
        if (mapRef.current && customerLoc) {
          const bounds = L.latLngBounds([
            [latitude, longitude],
            [customerLoc.lat, customerLoc.lng],
          ]);
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div className="driver-dashboard">
      <nav className="driver-navbar">
        <h1>🚗 RestroMatrix Driver</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </nav>

      <div className="driver-dashboard-content">
        <h2>Delivery Dashboard</h2>
        <p>Real-time order tracking and delivery management</p>

        <div className="dashboard-layout">
          {/* Map */}
          <div className="map-section">
            <div ref={mapContainer} className="map-container"></div>
          </div>

          {/* Orders */}
          <div className="info-section">
            <div className="section-card">
              <div className="section-header">
                <h3>📦 Assigned Orders</h3>
              </div>

              <div className="orders">
                {assignedOrders.map((order) => (
                  <div
                    key={order._id}
                    className={`order-item ${selectedOrder?._id === order._id ? "active" : ""}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <strong>#{order._id.slice(-6)}</strong>
                    <p>👤 {order.address?.firstName}</p>
                    <p>📞 {order.address?.phone}</p>
                    <span>💰 Rs {order.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {driverLocation && customerLocation && (
          <div className="dashboard-cards">
            <div className="dashboard-card">
              <h3>🚗 Your Location</h3>
              <p className="card-number">
                {driverLocation.lat.toFixed(4)}°
              </p>
              <p style={{ fontSize: '12px', color: '#808080', margin: '4px 0 0 0' }}>
                {driverLocation.lng.toFixed(4)}°
              </p>
            </div>

            <div className="dashboard-card">
              <h3>📍 Customer Location</h3>
              <p className="card-number">
                {customerLocation.lat.toFixed(4)}°
              </p>
              <p style={{ fontSize: '12px', color: '#808080', margin: '4px 0 0 0' }}>
                {customerLocation.lng.toFixed(4)}°
              </p>
            </div>

            <div className="dashboard-card">
              <h3>📋 Active Orders</h3>
              <p className="card-number">{assignedOrders.length}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;