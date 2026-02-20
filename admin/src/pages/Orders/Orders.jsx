import React, { useState, useEffect } from 'react'
import './Orders.css'
import { toast } from 'react-toastify'
import axios from 'axios'
import assets from '../../assets/assets'


const Orders = ({ url }) => {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState("all")

  const fetchAllOrders = async () => {
    const response = await axios.get(`${url}/api/order/list`)
    if (response.data.success) {
      setOrders(response.data.data)
      console.log(response.data.data)
    } else {
      toast.error("Error")
    }
  }

  const statusHandler = async (event, orderId) => {
    console.log("Updating order:", orderId, "to status:", event.target.value);
    const response = await axios.post(`${url}/api/order/status`, {
      orderId,
      status: event.target.value
    })
    console.log("Response:", response.data);
    if (response.data.success) {
      await fetchAllOrders()
    }
  }

  useEffect(() => {
    fetchAllOrders()
  }, [])

  const sortedOrders = [...orders].sort((a, b) => {
    const aDate = new Date(a.date || 0).getTime()
    const bDate = new Date(b.date || 0).getTime()
    return bDate - aDate
  })

  const filteredOrders = sortedOrders.filter((order) => {
    if (filter === "all") return true
    const isWalkIn = Boolean(order.tableNumber) || order.source === "qr"
    const isOnline = Boolean(order.address) && !isWalkIn
    return filter === "online" ? isOnline : isWalkIn
  })

  return (
    <div className="order add">
      <h3>Order Page</h3>
      <div className="order-filters">
        <button
          type="button"
          className={`order-filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          type="button"
          className={`order-filter-btn ${filter === "online" ? "active" : ""}`}
          onClick={() => setFilter("online")}
        >
          Online
        </button>
        <button
          type="button"
          className={`order-filter-btn ${filter === "walkin" ? "active" : ""}`}
          onClick={() => setFilter("walkin")}
        >
          Walk-in
        </button>
      </div>

      <div className="order-list">
        {filteredOrders.map((order) => (
          <div key={order._id} className="order-item">
            <img src={assets.parcelIcon} alt="" />

            <div>
              <p className="order-item-food">
                {order.items.map((item, index) => {
                  if (index === order.items.length - 1) {
                    return item.name + " x " + item.quantity
                  }
                  else {
                    return item.name + " x " + item.quantity + ","
                  }
                })}
              </p>
              <p className="order-item-name">
                {order.address
                  ? `${order.address.firstName} ${order.address.lastName}`
                  : `Table ${order.tableNumber || "N/A"}`}
              </p>
              {order.address ? (
                <div className="order-item-address">
                  <p>{order.address.street + ","}</p>
                  <p>{order.address.city + ", " + order.address.state + ", " + order.address.country}</p>
                </div>
              ) : null}
              {order.address ? <p className="order-item-phone">{order.address.phone}</p> : null}
            </div>
            <p>Items : {order.items.length}</p>
            <p>${order.amount}</p>
            <select onChange={(event) => statusHandler(event, order._id)} value={order.status}>
              <option value="Food Processing">Food Processing</option>
              <option value="Out for delivery">Out for delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Orders
