import React, { useState, useEffect } from "react";
import "./Orders.css";
import { toast } from "react-toastify";
import axios from "axios";
import assets from "../../assets/assets";

const Orders = ({ url }) => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [driverNames, setDriverNames] = useState({});
  const [pendingStatuses, setPendingStatuses] = useState({});
  const [drivers, setDrivers] = useState([]);

  const fetchAllDrivers = async () => {
    try {
      const response = await axios.get(`${url}/api/driver/all`);
      if (response.data.success) {
        setDrivers(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
      toast.error("Failed to load drivers");
    }
  };

  const fetchAllOrders = async () => {
    try {
      const response = await axios.get(`${url}/api/order/list`);

      if (response.data.success) {
        setOrders(response.data.data);

        const names = {};
        response.data.data.forEach((order) => {
          if (order.driverName) {
            names[order._id] = order.driverName;
          }
        });

        setDriverNames(names);
      } else {
        toast.error("Error fetching orders");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch orders");
    }
  };

  const fetchWalkInSessions = async () => {
    try {
      const response = await axios.get(`${url}/api/walkin/list`);

      if (response.data.success) {
        // Merge walk-in sessions with online orders
        setOrders((prevOrders) => {
          // Filter out any existing walk-in orders
          const onlineOrders = prevOrders.filter(
            (order) => !order.source || order.source !== "walkin"
          );
          const walkInOrders = response.data.data || [];
          return [...onlineOrders, ...walkInOrders];
        });
      }
    } catch (error) {
      console.error("Error fetching walk-in sessions:", error);
      // Don't show error toast for this, it's supplementary data
    }
  };

  const statusHandler = async (event, order) => {
    const newStatus = event.target.value;
    const isWalkIn = Boolean(order.tableNumber) || order.source === "walkin";

    if (newStatus === "Out for delivery" && !isWalkIn) {
      setPendingStatuses((prev) => ({
        ...prev,
        [order._id]: newStatus,
      }));
      return;
    }

    try {
      let response;

      if (isWalkIn) {
        // For walk-in orders, use the walk-in API endpoint with sessionId
        response = await axios.post(`${url}/api/walkin/status`, {
          sessionId: order.sessionId,
          status: newStatus,
        });
      } else {
        // For online orders, use the regular order API endpoint
        response = await axios.post(`${url}/api/order/status`, {
          orderId: order._id,
          status: newStatus,
        });
      }

      if (response.data.success) {
        await fetchAllOrders();
        await fetchWalkInSessions();
        toast.success("Order status updated successfully");
      }
    } catch (error) {
      toast.error("Failed to update order");
    }
  };

  const handleDriverNameChange = (orderId, value) => {
    setDriverNames((prev) => ({
      ...prev,
      [orderId]: value,
    }));
  };

  const updateWithDriverName = async (orderId) => {
    const driverName = driverNames[orderId] || "";

    if (!driverName.trim()) {
      toast.warning("Please select driver");
      return;
    }

    try {
      const response = await axios.post(`${url}/api/order/status`, {
        orderId,
        status: "Out for delivery",
        driverName,
      });

      if (response.data.success) {
        setPendingStatuses((prev) => {
          const newState = { ...prev };
          delete newState[orderId];
          return newState;
        });

        await fetchAllOrders();
        toast.success("Driver assigned successfully");
      } else {
        toast.error(response.data.message || "Failed to update order");
      }
    } catch (error) {
      toast.error("Server error");
    }
  };

  useEffect(() => {
    fetchAllOrders();
    fetchWalkInSessions();
    fetchAllDrivers();
  }, []);

  const sortedOrders = [...orders].sort((a, b) => {
    const aDate = new Date(a.date || 0).getTime();
    const bDate = new Date(b.date || 0).getTime();
    return bDate - aDate;
  });

  const filteredOrders = sortedOrders.filter((order) => {
    if (filter === "all") return true;

    const isWalkIn = Boolean(order.tableNumber) || order.source === "qr";
    const isOnline = Boolean(order.address) && !isWalkIn;

    return filter === "online" ? isOnline : isWalkIn;
  });

  return (
    <div className="order add">
      <h3>Order Page</h3>

      <div className="order-filters">
        <button
          className={`order-filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>

        <button
          className={`order-filter-btn ${filter === "online" ? "active" : ""}`}
          onClick={() => setFilter("online")}
        >
          Online
        </button>

        <button
          className={`order-filter-btn ${filter === "walkin" ? "active" : ""}`}
          onClick={() => setFilter("walkin")}
        >
          Walk-in
        </button>
      </div>

      <div className="order-list">
        {filteredOrders.map((order) => (
          <div key={order._id} className="order-item">
            <div>
              <p className="order-item-food">
                {order.items.map((item, index) =>
                  index === order.items.length - 1
                    ? `${item.name} x ${item.quantity}`
                    : `${item.name} x ${item.quantity}, `
                )}
              </p>

              <p className="order-item-name">
                {order.address
                  ? `${order.address.firstName} ${order.address.lastName}`
                  : `Table ${order.tableNumber || "N/A"}`}
              </p>

              {order.address && (
                <div className="order-item-address">
                  <p>{order.address.street},</p>
                  <p>
                    {order.address.city}, {order.address.state},{" "}
                    {order.address.country}
                  </p>
                </div>
              )}

              {order.address && (
                <p className="order-item-phone">{order.address.phone}</p>
              )}
              <p className="order-item-time">
                {new Date(order.date).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </p>
            </div>

            <p>Items : {order.items.length}</p>
            <p>Rs {order.amount}</p>

            <div className="order-status-container">
              <select
                onChange={(e) => statusHandler(e, order)}
                value={pendingStatuses[order._id] || order.status}
              >
                {(() => {
                  const isWalkIn = Boolean(order.tableNumber) || order.source === "walkin";
                  if (isWalkIn) {
                    return (
                      <>
                        <option value="active">Active</option>
                        <option value="awaiting_payment">Awaiting Payment</option>
                        <option value="fully_paid">Fully Paid</option>
                        <option value="closed">Closed</option>
                      </>
                    );
                  } else {
                    return (
                      <>
                        <option value="Food Processing">Food Processing</option>
                        <option value="Out for delivery">Out for delivery</option>
                        <option value="Delivered">Delivered</option>
                      </>
                    );
                  }
                })()}
              </select>

              {!((Boolean(order.tableNumber) || order.source === "walkin")) &&
                (pendingStatuses[order._id] === "Out for delivery" ||
                  order.status === "Out for delivery") && (
                  <div className="driver-assignment">
                    <select
                      value={driverNames[order._id] || ""}
                      onChange={(e) =>
                        handleDriverNameChange(order._id, e.target.value)
                      }
                      className="driver-select"
                    >
                      <option value="">Select a driver</option>

                      {drivers.map((driver) => (
                        <option key={driver._id} value={driver.name}>
                          {driver.name} -{" "}
                          {driver.driverPhone ? driver.driverPhone : "No phone"}
                        </option>
                      ))}
                    </select>

                    <button
                      className="assign-btn"
                      onClick={() => updateWithDriverName(order._id)}
                    >
                      Assign
                    </button>
                  </div>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;