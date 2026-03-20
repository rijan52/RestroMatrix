import React, { useState, useEffect } from 'react';
import './OrderConfirmation.css';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const OrderConfirmation = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                if (!token) {
                    setError('Authentication required. Please log in.');
                    setLoading(false);
                    return;
                }

                const response = await axios.get(
                    `http://localhost:4000/api/order/${orderId}`,
                    { headers: { token } }
                );

                if (response.data.success) {
                    setOrder(response.data.data);
                    setError('');
                } else {
                    setError(response.data.message || 'Failed to fetch order details');
                }
            } catch (err) {
                console.error('Error fetching order:', err);
                setError(err.response?.data?.message || 'Error loading order details');
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId, token]);

    if (loading) {
        return (
            <div className="confirmation-container">
                <div className="confirmation-card">
                    <div className="loading">Loading order details...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="confirmation-container error">
                <div className="confirmation-card">
                    <div className="error-icon">✗</div>
                    <h1>Error Loading Order</h1>
                    <p className="error-message">{error}</p>
                    <div className="button-group">
                        <button
                            onClick={() => navigate('/')}
                            className="btn btn-primary"
                        >
                            Go to Home
                        </button>
                        <button
                            onClick={() => navigate('/cart')}
                            className="btn btn-secondary"
                        >
                            Back to Cart
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="confirmation-container">
                <div className="confirmation-card">
                    <div className="error-icon">✗</div>
                    <h1>Order Not Found</h1>
                    <p>We couldn't find the order details.</p>
                    <div className="button-group">
                        <button
                            onClick={() => navigate('/')}
                            className="btn btn-primary"
                        >
                            Go to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const deliveryAddress = order.address;
    const addressString = deliveryAddress
        ? `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state}, ${deliveryAddress.zip}, ${deliveryAddress.country}`
        : 'Address not available';

    return (
        <div className="confirmation-container success">
            <div className="confirmation-card">
                <div className="success-icon">✓</div>
                <h1>Order Confirmed!</h1>

                <div className="order-info">
                    <p className="subtitle">
                        Your order has been successfully placed and is being prepared.
                    </p>

                    {/* Order Details Section */}
                    <div className="info-section">
                        <h2 className="section-title">Order Details</h2>

                        <div className="info-row">
                            <span className="label">Order ID:</span>
                            <span className="value order-id">{order._id}</span>
                        </div>

                        <div className="info-row">
                            <span className="label">Status:</span>
                            <span className={`status-badge ${order.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                {order.status || 'Processing'}
                            </span>
                        </div>

                        <div className="info-row">
                            <span className="label">Payment Status:</span>
                            <span className={`payment-status ${order.paymentStatus?.toLowerCase()}`}>
                                {order.paymentStatus || 'Pending'}
                            </span>
                        </div>

                        <div className="info-row">
                            <span className="label">Order Time:</span>
                            <span className="value">
                                {new Date(order.date).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Delivery Address Section */}
                    <div className="info-section">
                        <h2 className="section-title">Delivery Address</h2>
                        <div className="address-box">
                            <p>{addressString}</p>
                            <p className="phone">📞 {deliveryAddress?.phone}</p>
                        </div>
                    </div>

                    {/* Order Items Section */}
                    <div className="info-section">
                        <h2 className="section-title">Order Items</h2>
                        <div className="items-list">
                            {order.items && order.items.length > 0 ? (
                                order.items.map((item, index) => (
                                    <div key={index} className="item-row">
                                        <span className="item-name">
                                            {item.name}
                                        </span>
                                        <span className="item-qty">
                                            x{item.quantity}
                                        </span>
                                        <span className="item-price">
                                            Rs {(item.price * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p>No items in order</p>
                            )}
                        </div>
                    </div>

                    {/* Order Summary Section */}
                    <div className="info-section">
                        <h2 className="section-title">Order Summary</h2>
                        <div className="summary-box">
                            <div className="summary-row">
                                <span>Subtotal:</span>
                                <span>Rs {(order.amount - 2).toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Delivery Fee:</span>
                                <span>Rs 2.00</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total Amount:</span>
                                <span>Rs {order.amount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Info Section */}
                    <div className="info-section payment-info">
                        <h2 className="section-title">Payment Information</h2>
                        <div className="payment-message">
                            <p>
                                <strong>Payment Status:</strong> {order.paymentStatus || 'Pending'}
                            </p>
                            <p className="info-text">
                                Your order will be prepared once payment is confirmed.
                                {order.paymentStatus === 'Pending' && (
                                    <> You can complete payment later from your orders page.</>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="button-group">
                    <button
                        onClick={() => navigate('/myorders')}
                        className="btn btn-primary"
                    >
                        View My Orders
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="btn btn-secondary"
                    >
                        Continue Shopping
                    </button>
                </div>

                {/* Next Steps */}
                <div className="next-steps">
                    <h3>What's Next?</h3>
                    <ol>
                        <li>Order Confirmed - We've received your order</li>
                        <li>Preparing - Chef is preparing your food</li>
                        <li>Out for Delivery - Driver is on the way</li>
                        <li>Delivered - Order completed</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation;
