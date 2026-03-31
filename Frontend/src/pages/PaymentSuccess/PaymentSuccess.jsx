import React, { useState, useEffect } from 'react';
import './PaymentResult.css';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getBill } from '../../services/billService';

const PaymentSuccess = () => {
    // Auto-redirect to My Orders with correct restaurantId and params
    useEffect(() => {
        if (!loading && bill) {
            const restaurantId = getRestaurantId();
            if (restaurantId) {
                const params = new URLSearchParams();
                if (paymentSuccess) params.set('payment_success', paymentSuccess);
                if (transactionId) params.set('transaction_uuid', transactionId);
                if (orderId) params.set('orderId', orderId);
                navigate(`/restaurant/${restaurantId}/myorders?${params.toString()}`, { replace: true });
            }
        }
    }, [loading, bill]);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);

    const transactionId = searchParams.get('transaction_uuid');
    const orderId = searchParams.get('orderId');
    const paymentSuccess = searchParams.get('payment_success');
    // transaction_uuid format we generate: <billId>_<timestamp>_<random>
    const parts = transactionId?.split('_');
    const billId = parts && parts.length >= 2 ? parts[0] : null;
    // Helper to get restaurantId from bill or fallback
    const getRestaurantId = () => {
        if (bill && bill.restaurantId) return bill.restaurantId;
        // fallback: try to get from localStorage or URL if needed
        try {
            const lastPath = window.localStorage.getItem('lastRestaurantPath');
            if (lastPath) {
                const match = lastPath.match(/\/restaurant\/(.*?)\//);
                if (match && match[1]) return match[1];
            }
        } catch { }
        // fallback: try to get from current URL
        const match = window.location.pathname.match(/\/restaurant\/(.*?)\//);
        if (match && match[1]) return match[1];
        return null;
    };

    useEffect(() => {
        const fetchBill = async () => {
            if (billId) {
                try {
                    const response = await getBill(billId);
                    setBill(response);
                } catch (err) {
                    console.error('Error fetching bill:', err);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchBill();
    }, [billId]);

    if (loading) {
        return (
            <div className="result-container">
                <div className="result-card">
                    <div className="loading">Loading...</div>
                </div>
            </div>
        );
    }

    const isFullyPaid = bill && bill.status === 'PAID';

    return (
        <div className="result-container success">
            <div className="result-card">
                <div className="success-icon">✓</div>
                <h1>Payment Successful!</h1>

                {bill && (
                    <div className="bill-info">
                        <p className="subtitle">
                            Your payment has been processed successfully.
                        </p>

                        <div className="info-section">
                            <div className="info-row">
                                <span className="label">Transaction ID:</span>
                                <span className="value">{transactionId}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Total Amount:</span>
                                <span className="value">NPR {bill.totalAmount}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Paid Amount:</span>
                                <span className="value paid">NPR {bill.paidAmount}</span>
                            </div>
                            <div className="info-row">
                                <span className="label">Remaining Amount:</span>
                                <span className="value remaining">
                                    NPR {bill.remainingAmount}
                                </span>
                            </div>
                        </div>

                        {isFullyPaid && (
                            <div className="full-payment-message">
                                <h2>🎉 Bill Has Been Fully Paid!</h2>
                                <p>Thank you for your payment. This bill is now complete.</p>
                            </div>
                        )}

                        {!isFullyPaid && (
                            <div className="partial-payment-message">
                                <p>
                                    ℹ️ This bill can still accept payments from other customers.
                                    Share the payment link: <code>/pay/{billId}</code>
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="button-group">
                    <button
                        onClick={() => navigate('/')}
                        className="btn btn-primary"
                    >
                        Go to Home
                    </button>
                    <button
                        onClick={() => {
                            const restaurantId = getRestaurantId();
                            if (restaurantId) {
                                const params = new URLSearchParams();
                                if (paymentSuccess) params.set('payment_success', paymentSuccess);
                                if (transactionId) params.set('transaction_uuid', transactionId);
                                if (orderId) params.set('orderId', orderId);
                                navigate(`/restaurant/${restaurantId}/myorders?${params.toString()}`);
                            } else {
                                alert('Restaurant ID not found.');
                            }
                        }}
                        className="btn btn-success"
                    >
                        Go to My Orders
                    </button>
                    {!isFullyPaid && (
                        <button
                            onClick={() => navigate(`/pay/${billId}`)}
                            className="btn btn-secondary"
                        >
                            Make Another Payment
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
