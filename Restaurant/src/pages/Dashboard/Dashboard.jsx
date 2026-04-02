import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "./Dashboard.css";

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString()}`;

const isToday = (dateInput) => {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
};

const isWithinLastDays = (dateInput, days) => {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return false;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
};

const getStatusClass = (status) => {
  const normalized = String(status || "").toLowerCase();

  if (normalized.includes("delivered") || normalized.includes("completed") || normalized.includes("confirmed") || normalized.includes("seated") || normalized.includes("success")) {
    return "status-badge status-green";
  }

  if (normalized.includes("cancel") || normalized.includes("failed") || normalized.includes("rejected") || normalized.includes("declined")) {
    return "status-badge status-red";
  }

  return "status-badge status-yellow";
};

const normalizeRestaurantId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "");
  }

  return String(value || "");
};

const isSameRestaurant = (recordRestaurantId, currentRestaurantId) =>
  normalizeRestaurantId(recordRestaurantId) === normalizeRestaurantId(currentRestaurantId);

const Dashboard = ({ url }) => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const apiBaseUrl = url || import.meta.env.VITE_API_URL || "http://localhost:4000";

  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [products, setProducts] = useState([]);
  const [bills, setBills] = useState([]);

  const fetchOverviewData = async () => {
    if (!restaurantId) {
      setOrders([]);
      setReservations([]);
      setProducts([]);
      setBills([]);
      return;
    }

    setLoading(true);
    try {
      const [ordersResponse, reservationsResponse, productsResponse, billsResponse] =
        await Promise.all([
          axios.get(`${apiBaseUrl}/api/order/list`, { params: { restaurantId } }),
          axios.get(`${apiBaseUrl}/api/reservation/list`, { params: { restaurantId } }),
          axios.get(`${apiBaseUrl}/api/food/list`, { params: { restaurantId } }),
          axios.get(`${apiBaseUrl}/api/bills/list`, {
            params: { restaurantId, limit: 200 },
          }),
        ]);

      const incomingOrders = ordersResponse?.data?.success ? ordersResponse.data.data || [] : [];
      const incomingReservations =
        reservationsResponse?.data?.success ? reservationsResponse.data.data || [] : [];
      const incomingProducts =
        productsResponse?.data?.success ? productsResponse.data.data || [] : [];
      const incomingBills = billsResponse?.data?.success ? billsResponse.data.data || [] : [];

      setOrders(
        incomingOrders.filter((order) =>
          isSameRestaurant(order.restaurantId, restaurantId)
        )
      );
      setReservations(
        incomingReservations.filter((reservation) =>
          isSameRestaurant(reservation.restaurantId, restaurantId)
        )
      );
      setProducts(
        incomingProducts.filter((product) =>
          isSameRestaurant(product.restaurantId, restaurantId)
        )
      );
      setBills(
        incomingBills.filter((bill) => isSameRestaurant(bill.restaurantId, restaurantId))
      );
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load overview dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, [restaurantId, apiBaseUrl]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );
  }, [orders]);

  const sortedReservations = useMemo(() => {
    return [...reservations].sort((a, b) => {
      const aDate = new Date(`${a.date || ""} ${a.time || ""}`).getTime();
      const bDate = new Date(`${b.date || ""} ${b.time || ""}`).getTime();
      return bDate - aDate;
    });
  }, [reservations]);

  const activeDeliveries = useMemo(() => {
    return sortedOrders.filter((order) => {
      const status = String(order.status || "").toLowerCase();
      return status.includes("out for delivery") || status.includes("delivery");
    });
  }, [sortedOrders]);

  const paymentSummary = useMemo(() => {
    const paidOnline = orders
      .filter((order) => {
        const isOnline = Boolean(order.address);
        const status = String(order.paymentStatus || "").toLowerCase();
        return isOnline && (order.payment === true || status === "completed");
      })
      .reduce((sum, order) => sum + Number(order.amount || 0), 0);

    const pendingOnline = orders
      .filter((order) => {
        const isOnline = Boolean(order.address);
        const status = String(order.paymentStatus || "").toLowerCase();
        return isOnline && !(order.payment === true || status === "completed");
      })
      .reduce((sum, order) => sum + Number(order.amount || 0), 0);

    const paidBills = bills.reduce((sum, bill) => sum + Number(bill.paidAmount || 0), 0);
    const pendingBills = bills.reduce(
      (sum, bill) => sum + Number(bill.remainingAmount || 0),
      0
    );

    return {
      totalPayments: paidOnline + paidBills,
      pendingPayments: pendingOnline + pendingBills,
    };
  }, [orders, bills]);

  const metrics = useMemo(() => {
    const todayOrders = orders.filter((order) => isToday(order.date)).length;

    const revenueToday = orders
      .filter((order) => isToday(order.date))
      .reduce((sum, order) => sum + Number(order.amount || 0), 0);

    const revenueWeek = orders
      .filter((order) => isWithinLastDays(order.date, 7))
      .reduce((sum, order) => sum + Number(order.amount || 0), 0);

    return {
      todayOrders,
      revenueToday,
      revenueWeek,
      totalReservations: reservations.length,
      activeDeliveries: activeDeliveries.length,
      totalProducts: products.length,
    };
  }, [orders, reservations.length, activeDeliveries.length, products.length]);

  const recentOrders = sortedOrders.slice(0, 5);
  const recentReservations = sortedReservations.slice(0, 5);
  const recentActiveDeliveries = activeDeliveries.slice(0, 5);

  return (
    <div className="overview-dashboard">
      <div className="overview-header">
        <div>
          <h2>Overview Dashboard</h2>
          <p>Essential business snapshot for quick decisions.</p>
        </div>
        <button type="button" className="overview-refresh" onClick={fetchOverviewData}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <section className="metrics-grid">
        <div className="metric-card">
          <p>Total Orders (Today)</p>
          <h3>{metrics.todayOrders}</h3>
        </div>

        <div className="metric-card">
          <p>Total Revenue (Today / Week)</p>
          <h3>{formatCurrency(metrics.revenueToday)}</h3>
          <span>{formatCurrency(metrics.revenueWeek)}</span>
        </div>

        <div className="metric-card">
          <p>Total Reservations</p>
          <h3>{metrics.totalReservations}</h3>
        </div>

        <div className="metric-card">
          <p>Active Deliveries</p>
          <h3>{metrics.activeDeliveries}</h3>
        </div>

        <div className="metric-card">
          <p>Total Products</p>
          <h3>{metrics.totalProducts}</h3>
        </div>
      </section>

      <section className="dashboard-panels">
        <article className="panel-card">
          <div className="panel-head">
            <h4>Recent Orders</h4>
            <button
              type="button"
              className="view-all-btn"
              onClick={() => navigate(`/restaurant/${restaurantId}/orders`)}
            >
              View All
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <p className="empty-text">No recent orders found.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer Name</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td>#{String(order._id || "").slice(-6).toUpperCase()}</td>
                      <td>
                        {order.address
                          ? `${order.address.firstName || ""} ${order.address.lastName || ""}`.trim() || "N/A"
                          : `Table ${order.tableNumber || "N/A"}`}
                      </td>
                      <td>{formatCurrency(order.amount)}</td>
                      <td>
                        <span className={getStatusClass(order.status)}>{order.status || "Pending"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <h4>Recent Reservations</h4>
            <button
              type="button"
              className="view-all-btn"
              onClick={() => navigate(`/restaurant/${restaurantId}/reservations`)}
            >
              View All
            </button>
          </div>

          {recentReservations.length === 0 ? (
            <p className="empty-text">No recent reservations found.</p>
          ) : (
            <ul className="simple-list">
              {recentReservations.map((reservation) => (
                <li key={reservation._id}>
                  <div>
                    <h5>{reservation.name || "N/A"}</h5>
                    <p>
                      {reservation.date || "N/A"} at {reservation.time || "N/A"}
                    </p>
                  </div>
                  <span className={getStatusClass(reservation.status)}>
                    {reservation.status || "Pending"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel-card">
          <div className="panel-head">
            <h4>Delivery Status</h4>
            <button
              type="button"
              className="view-all-btn"
              onClick={() => navigate(`/restaurant/${restaurantId}/drivers`)}
            >
              View All
            </button>
          </div>

          {recentActiveDeliveries.length === 0 ? (
            <p className="empty-text">No active deliveries right now.</p>
          ) : (
            <ul className="simple-list">
              {recentActiveDeliveries.map((delivery) => (
                <li key={delivery._id}>
                  <div>
                    <h5>{delivery.driverName || "Driver not assigned"}</h5>
                    <p>Order #{String(delivery._id || "").slice(-6).toUpperCase()}</p>
                  </div>
                  <span className={getStatusClass(delivery.status)}>{delivery.status || "Pending"}</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel-card payment-summary-card">
          <div className="panel-head">
            <h4>Payment Summary</h4>
            <button
              type="button"
              className="view-all-btn"
              onClick={() => navigate(`/restaurant/${restaurantId}/payments`)}
            >
              View All
            </button>
          </div>

          <div className="payment-grid">
            <div className="payment-item">
              <p>Total Payments</p>
              <h5>{formatCurrency(paymentSummary.totalPayments)}</h5>
            </div>
            <div className="payment-item">
              <p>Pending Payments</p>
              <h5>{formatCurrency(paymentSummary.pendingPayments)}</h5>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};

export default Dashboard;
