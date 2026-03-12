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

  /* ---------------- FETCH ASSIGNED ORDERS ---------------- */

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
      } catch (error) {
        console.error("Fetch orders error:", error);
      }
    };

    if (driverToken) fetchOrders();
  }, [url, driverToken]);

  /* ---------------- MAP INIT ---------------- */

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = L.map(mapContainer.current).setView([27.7172, 85.324], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    mapRef.current = map;

    setTimeout(() => map.invalidateSize(), 500);
  }, []);

  /* ---------------- CUSTOMER MARKER ---------------- */

  useEffect(() => {
    if (!selectedOrder || !mapRef.current) return;

    const lat = parseFloat(selectedOrder.address?.latitude) || 27.7172;
    const lng = parseFloat(selectedOrder.address?.longitude) || 85.324;

    const customerLoc = { lat, lng };

    setCustomerLocation(customerLoc);
    customerLocationRef.current = customerLoc;

    if (customerMarkerRef.current) {
      customerMarkerRef.current.setLatLng([lat, lng]);
    } else {
      customerMarkerRef.current = L.marker([lat, lng], {
        icon: customerIcon,
      }).addTo(mapRef.current);

      customerMarkerRef.current.bindPopup("Customer Location");
    }

    mapRef.current.setView([lat, lng], 14);
  }, [selectedOrder]);

  /* ---------------- SOCKET CONNECTION ---------------- */

  useEffect(() => {
    if (!url || !driverToken) return;

    socketRef.current = io(url, {
      auth: { token: driverToken },
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      console.log("Socket Connected");
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Socket error:", err.message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [url, driverToken]);

  /* ---------------- DRIVER LOCATION ---------------- */

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const driverLoc = { lat: latitude, lng: longitude };
        setDriverLocation(driverLoc);

        /* DRIVER MARKER */

        if (mapRef.current) {
          if (driverMarkerRef.current) {
            driverMarkerRef.current.setLatLng([latitude, longitude]);
          } else {
            driverMarkerRef.current = L.marker([latitude, longitude], {
              icon: driverIcon,
            }).addTo(mapRef.current);

            driverMarkerRef.current.bindPopup("You (Driver)");
          }
        }

        /* SEND LOCATION TO SERVER */

        if (socketRef.current && selectedOrder?._id) {
          const payload = {
            orderId: selectedOrder._id,
            latitude,
            longitude,
          };

          console.log("Sending driver location:", payload);

          socketRef.current.emit("driver-location-update", payload);
        }

        /* DRAW ROUTE */

        const customerLoc = customerLocationRef.current;

        if (mapRef.current && customerLoc) {
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
              { color: "blue", weight: 3 }
            ).addTo(mapRef.current);
          }

          const bounds = L.latLngBounds([
            [latitude, longitude],
            [customerLoc.lat, customerLoc.lng],
          ]);

          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [selectedOrder]);

  /* ---------------- UI ---------------- */

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

        <div className="dashboard-layout">
          {/* MAP */}
          <div className="map-section">
            <div ref={mapContainer} className="map-container"></div>
          </div>

          {/* ORDERS */}
          <div className="info-section">
            <div className="section-card">
              <h3>Assigned Orders</h3>

              <div className="orders">
                {assignedOrders.map((order) => (
                  <div
                    key={order._id}
                    className={`order-item ${
                      selectedOrder?._id === order._id ? "active" : ""
                    }`}
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