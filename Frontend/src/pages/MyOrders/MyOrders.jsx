import React from 'react'
import './MyOrders.css'
import { useContext } from 'react'
import { StoreContext } from '../../context/StoreContext'
import { use } from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import parcelIcon from '../../assets/parcel-icon.png'
import assets from '../../assets/assets'
import { useNavigate } from 'react-router-dom'

const MyOrders = () => {
    const { url, token } = useContext(StoreContext);
    const [data, setData] = useState([]);
    const navigate = useNavigate();

    const fetchOrders = async () => {
        try {
            const response = await axios.post(`${url}/api/order/userorders`, {}, { headers: { token } });
            if (response.data.success) {
                setData(response.data.data || []);
            }
        } catch (error) {
            console.log(error);
            setData([]);
        }
    }

    useEffect(() => {
        if (token) {
            fetchOrders();
        }
    }, [token])



    return (
        <div className="my-orders">
            <h2>My Orders</h2>
            <div className="container">
                {data && Array.isArray(data) && data.length > 0 ? data.map((order, index) => (
                    <div key={index} className="my-orders-order">
                        <img src={assets.parcelIcon} alt="" />
                        <p>Items: {order.items.map((item, index) => {
                            if (index === order.items.length - 1) {
                                return item.name + " x " + item.quantity
                            }
                            else {
                                return item.name + " x " + item.quantity + ", "
                            }
                        })}</p>
                        <p>${order.amount}.00</p>
                        <p>Items: {order.items.length}</p>
                        <p><span>&#x25cf;</span><b>{order.status}</b></p>
                        <div className="order-actions">
                            <button onClick={fetchOrders}>Track Order</button>
                            {order.status === "Out for delivery" && (
                                <button
                                    className="live-tracking-btn"
                                    onClick={() => navigate(`/livetracking?orderId=${order._id}`)}
                                >
                                    🚗 Live Tracking
                                </button>
                            )}
                        </div>
                    </div>
                )) : <p>No orders found. Start ordering now!</p>}

            </div>


        </div>
    )
}

export default MyOrders