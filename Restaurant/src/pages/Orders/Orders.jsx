import React, { useState, useEffect } from "react";
import "./Orders.css";
import { toast } from "react-toastify";
import axios from "axios";
import assets from "../../assets/assets";
import { useParams } from 'react-router-dom';

const Orders = ({ url }) => {
  const { restaurantId } = useParams();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [driverNames, setDriverNames] = useState({});
  const [pendingStatuses, setPendingStatuses] = useState({});
  const [drivers, setDrivers] = useState([]);

  const normalizeRestaurantId = (value) => {
    if (value && typeof value === "object") {
      return String(value._id || value.id || "");
    }
    return String(value || "");
  };

  const isSameRestaurant = (recordRestaurantId, currentRestaurantId) =>
    normalizeRestaurantId(recordRestaurantId) === normalizeRestaurantId(currentRestaurantId);

  const getDriverPhone = (driver) =>
    driver?.phone || driver?.driverPhone || driver?.contactNumber || "No phone";

  const updateOrderInState = (orderId, updates) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === orderId || order.sessionId === orderId
          ? { ...order, ...updates }
          : order
      )
    );
  };

  const isWalkInOrder = (order) => Boolean(order.tableNumber) || order.source === "walkin";

  const getWalkInStatusBucket = (order) => (order.status === "closed" ? "closed" : "active");

  const getWalkInGroupKey = (order) => {
    const table = String(order.tableNumber || "").trim();
    const restaurant = normalizeRestaurantId(order.restaurantId);
    const statusBucket = getWalkInStatusBucket(order);
    return `${restaurant}::${table}::${statusBucket}`;
  };

  const mergeWalkInOrdersByTable = (ordersList) => {
    const walkInGroups = new Map();
    const mergedOrders = [];

    ordersList.forEach((order) => {
      if (!isWalkInOrder(order)) {
        mergedOrders.push(order);
        return;
      }

      const groupKey = getWalkInGroupKey(order);
      const existingGroup = walkInGroups.get(groupKey);

      if (!existingGroup) {
        walkInGroups.set(groupKey, {
          ...order,
          _id: `walkin-${groupKey}`,
          sessionIds: [order.sessionId],
          sessions: [order],
          totalBillAmount: Number(order.totalBillAmount || order.amount || 0),
          date: order.date || order.updatedAt || order.createdAt,
          status: order.status,
          statusBucket: getWalkInStatusBucket(order),
        });
        return;
      }

      existingGroup.sessionIds.push(order.sessionId);
      existingGroup.sessions.push(order);
      existingGroup.totalBillAmount += Number(order.totalBillAmount || order.amount || 0);
      existingGroup.date = new Date(existingGroup.date || 0).getTime() >= new Date(order.date || order.updatedAt || order.createdAt || 0).getTime()
        ? existingGroup.date
        : (order.date || order.updatedAt || order.createdAt);

      if (existingGroup.status !== "active" && order.status === "active") {
        existingGroup.status = "active";
      }
    });

    walkInGroups.forEach((group) => {
      mergedOrders.push({
        ...group,
        amount: group.totalBillAmount,
        source: "walkin",
      });
    });

    return mergedOrders;
  };

  const fetchAllDrivers = async () => {
    if (!restaurantId) {
      setDrivers([]);
      return;
    }

    try {
      const response = await axios.get(`${url}/api/driver/all`, {
        params: { restaurantId },
      });
      if (response.data.success) {
        const filteredDrivers = (response.data.data || []).filter(
          (driver) =>
            normalizeRestaurantId(driver.restaurantId) ===
            normalizeRestaurantId(restaurantId)
        );
        setDrivers(filteredDrivers);
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
        const names = {};
        response.data.data.forEach((order) => {
          if (order.driverName) {
            names[order._id] = order.driverName;
          }
        });

        setDriverNames(names);
        return response.data.data || [];
      } else {
        toast.error("Error fetching orders");
        return [];
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch orders");
      return [];
    }
  };

  const fetchWalkInSessions = async () => {
    try {
      const response = await axios.get(`${url}/api/walkin/list`, {
        params: restaurantId ? { restaurantId } : undefined,
      });

      if (response.data.success) {
        return response.data.data || [];
      }

      return [];
    } catch (error) {
      console.error("Error fetching walk-in sessions:", error);
      return [];
    }
  };

  const statusHandler = async (event, order) => {
    const newStatus = event.target.value;
    const isWalkIn = isWalkInOrder(order);

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
        const sessionIds = Array.isArray(order.sessionIds) && order.sessionIds.length > 0
          ? order.sessionIds
          : [order.sessionId];

        const responses = await Promise.all(
          sessionIds.map((sessionId) =>
            axios.post(`${url}/api/walkin/status`, {
              sessionId,
              status: newStatus,
            })
          )
        );

        response = responses[0];
      } else {
        // For online orders, use the regular order API endpoint
        response = await axios.post(`${url}/api/order/status`, {
          orderId: order._id,
          status: newStatus,
        });
      }

      if (response.data.success) {
        if (isWalkIn) {
          const sessionIds = Array.isArray(order.sessionIds) && order.sessionIds.length > 0
            ? order.sessionIds
            : [order.sessionId];

          setOrders((prevOrders) =>
            prevOrders.map((item) =>
              sessionIds.includes(item.sessionId)
                ? { ...item, status: newStatus }
                : item
            )
          );
        } else {
          updateOrderInState(order._id || order.sessionId, { status: newStatus });
        }

        if (isWalkIn) {
          setPendingStatuses((prev) => {
            const nextState = { ...prev };
            delete nextState[order._id];
            return nextState;
          });
        }

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

        setDriverNames((prev) => ({
          ...prev,
          [orderId]: driverName,
        }));

        updateOrderInState(orderId, {
          status: "Out for delivery",
          driverName,
        });

        toast.success("Driver assigned successfully");
      } else {
        toast.error(response.data.message || "Failed to update order");
      }
    } catch (error) {
      toast.error("Server error");
    }
  };

  useEffect(() => {
    const loadOrders = async () => {
      const [onlineOrders, walkInOrders] = await Promise.all([
        fetchAllOrders(),
        fetchWalkInSessions(),
      ]);

      const mergedOrders = mergeWalkInOrdersByTable([
        ...onlineOrders,
        ...walkInOrders,
      ].filter((order) => isSameRestaurant(order.restaurantId, restaurantId)));

      setOrders(mergedOrders);
    };

    loadOrders();
    fetchAllDrivers();
  }, [restaurantId]);

  const sortedOrders = [...orders].sort((a, b) => {
    const aDate = new Date(a.date || 0).getTime();
    const bDate = new Date(b.date || 0).getTime();
    return bDate - aDate;
  });

  const filteredOrders = sortedOrders.filter((order) => {
    // Only show orders for the current restaurant
    if (!isSameRestaurant(order.restaurantId, restaurantId)) return false;

    if (filter === "all") return true;

    const isWalkIn = isWalkInOrder(order);
    const isOnline = Boolean(order.address) && !isWalkIn;

    return filter === "online" ? isOnline : isWalkIn;
  });

  const displayOrders = (() => {
    const walkInGroups = new Map();
    const displayRows = [];

    filteredOrders.forEach((order) => {
      if (!isWalkInOrder(order)) {
        displayRows.push(order);
        return;
      }

      const groupKey = getWalkInGroupKey(order);
      const existingGroup = walkInGroups.get(groupKey);

      if (!existingGroup) {
        walkInGroups.set(groupKey, {
          ...order,
          _id: `display-${groupKey}`,
          sessionIds: Array.isArray(order.sessionIds)
            ? [...order.sessionIds]
            : [order.sessionId].filter(Boolean),
          sessions: Array.isArray(order.sessions) ? [...order.sessions] : [order],
          totalBillAmount: Number(order.totalBillAmount || order.amount || 0),
          statusBucket: getWalkInStatusBucket(order),
        });
        return;
      }

      existingGroup.sessionIds = Array.from(
        new Set([
          ...existingGroup.sessionIds,
          ...(Array.isArray(order.sessionIds) ? order.sessionIds : [order.sessionId]).filter(Boolean),
        ])
      );
      existingGroup.sessions = [...(existingGroup.sessions || []), ...(Array.isArray(order.sessions) ? order.sessions : [order])];
      existingGroup.totalBillAmount += Number(order.totalBillAmount || order.amount || 0);

      const existingTime = new Date(existingGroup.date || 0).getTime();
      const nextTime = new Date(order.date || order.updatedAt || order.createdAt || 0).getTime();
      if (nextTime > existingTime) {
        existingGroup.date = order.date || order.updatedAt || order.createdAt;
      }

      if (order.status === "active") {
        existingGroup.status = "active";
      }
    });

    walkInGroups.forEach((group) => {
      displayRows.push({
        ...group,
        amount: group.totalBillAmount,
        source: "walkin",
      });
    });

    return displayRows;
  })();

  return (
    <div className="order">
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
        {displayOrders.map((order) => {
          const orderItems = isWalkInOrder(order)
            ? (order.sessions || []).flatMap((session) => session.items || [])
            : (order.items || []);
          const displayAmount = isWalkInOrder(order) ? order.totalBillAmount : order.amount;
          const displayStatus = isWalkInOrder(order)
            ? ((pendingStatuses[order._id] || order.status) === "closed" ? "closed" : "active")
            : (pendingStatuses[order._id] || order.status);

          return (
            <div key={order._id} className="order-item">
              <div>
                {isWalkInOrder(order) && Array.isArray(order.sessionIds) && order.sessionIds.length > 1 ? (
                  <div className="order-item-food">
                    {orderItems.map((item, index) => (
                      <p key={`${order._id}-${item.name}-${index}`}>
                        {item.name} x {item.quantity}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="order-item-food">
                    {orderItems.map((item, index) =>
                      index === orderItems.length - 1
                        ? `${item.name} x ${item.quantity}`
                        : `${item.name} x ${item.quantity}, `
                    )}
                  </p>
                )}

                <p className="order-item-name">
                  {order.address
                    ? `${order.address.firstName} ${order.address.lastName}`
                    : `Table ${order.tableNumber || "N/A"}`}
                </p>

                {isWalkInOrder(order) && (
                  <p className="order-item-time">
                    {getWalkInStatusBucket(order) === "closed" ? "Completed" : "Active"}
                  </p>
                )}

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

              <p>Items : {orderItems.length}</p>
              <p>Rs {displayAmount}</p>

              <div className="order-status-container">
                <select
                  onChange={(e) => statusHandler(e, order)}
                  value={displayStatus}
                >
                  {(() => {
                    const isWalkIn = isWalkInOrder(order);
                    if (isWalkIn) {
                      return (
                        <>
                          <option value="active">Active</option>
                          <option value="closed">Completed</option>
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
                            {getDriverPhone(driver)}
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
          );
        })}
      </div>
    </div>
  );
};

export default Orders;