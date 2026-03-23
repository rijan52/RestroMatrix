import React, { useState, useEffect } from 'react';
import './Payment.css';
import { useParams, useNavigate } from 'react-router-dom';
import { getBill, initiateEsewaPayment, getBillPayments } from '../../services/billService';

const Payment = () => {
    const { billId } = useParams();
    const navigate = useNavigate();
    const [bill, setBill] = useState(null);
    const [customerName, setCustomerName] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState('');
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [showHistoryDetails, setShowHistoryDetails] = useState(false);

    useEffect(() => {
        const fetchBillAndPayments = async () => {
            try {
                const [billResponse, paymentsResponse] = await Promise.all([
                    getBill(billId),
                    getBillPayments(billId)
                ]);

                setBill(billResponse);
                setPaymentHistory(Array.isArray(paymentsResponse?.data) ? paymentsResponse.data : []);
                setError('');
            } catch (err) {
                setError(err.message || 'Error loading bill');
            } finally {
                setLoading(false);
            }
        };

        fetchBillAndPayments();

        // Refresh bill status every 5 seconds
        const interval = setInterval(fetchBillAndPayments, 5000);
        return () => clearInterval(interval);
    }, [billId]);

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();

        if (!customerName.trim()) {
            setError('Please enter your name');
            return;
        }

        if (!paymentAmount) {
            setError('Please enter payment amount');
            return;
        }

        const amount = parseFloat(paymentAmount);

        if (amount <= 0) {
            setError('Amount must be greater than 0');
            return;
        }

        if (amount > bill.remainingAmount) {
            setError(`Amount cannot exceed remaining balance (NPR ${bill.remainingAmount})`);
            return;
        }

        setPaying(true);
        setError('');

        try {
            const response = await initiateEsewaPayment(billId, amount, customerName);

            if (response.paymentEndpoint && response.signature) {
                // Create form and submit to eSewa
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = response.paymentEndpoint;

                const fields = {
                    amount: response.amount,
                    tax_amount: response.tax_amount,
                    total_amount: response.total_amount,
                    transaction_uuid: response.transaction_uuid,
                    product_code: response.product_code,
                    product_name: response.product_name,
                    product_service_charge: response.product_service_charge,
                    product_delivery_charge: response.product_delivery_charge,
                    success_url: response.success_url,
                    failure_url: response.failure_url,
                    signed_field_names: response.signed_field_names,
                    signature: response.signature
                };

                for (const [key, value] of Object.entries(fields)) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = value;
                    form.appendChild(input);
                }

                document.body.appendChild(form);
                form.submit();
            } else {
                setError('Error initiating payment. Please try again.');
                setPaying(false);
            }
        } catch (err) {
            setError(err.message || 'Error initiating payment');
            setPaying(false);
        }
    };

    if (loading) {
        return (
            <div className="payment-container">
                <div className="loading">Loading bill details...</div>
            </div>
        );
    }

    if (!bill) {
        return (
            <div className="payment-container">
                <div className="error-message">
                    {error || 'Unable to load bill. Please check the bill ID.'}
                </div>
            </div>
        );
    }

    if (bill.status === 'PAID') {
        return (
            <div className="payment-container">
                <div className="paid-message">
                    <h2>Bill Already Paid</h2>
                    <p>This bill has been fully paid. Thank you!</p>
                    <div className="bill-details">
                        <div className="detail-row">
                            <span>Total Amount:</span>
                            <span className="amount">NPR {bill.totalAmount}</span>
                        </div>
                        <div className="detail-row">
                            <span>Paid Amount:</span>
                            <span className="amount">NPR {bill.paidAmount}</span>
                        </div>
                        <div className="detail-row">
                            <span>Status:</span>
                            <span className="status paid">PAID ✓</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const successfulPayments = paymentHistory.filter((payment) => payment.status === 'SUCCESS');

    return (
        <div className="payment-wrapper">
            <div className="payment-container">
                <div className="payment-header">
                    <h1>Bill Payment</h1>
                    <p className="payment-subtitle">Complete your payment securely</p>
                </div>

                <div className="payment-content">
                    {/* Bill Summary */}
                    <div className="bill-summary">
                        <h2 className="summary-title">Payment Summary</h2>
                        <div className="summary-grid">
                            <div className="summary-item">
                                <span className="label">Total Amount</span>
                                <span className="value">NPR {bill.totalAmount}</span>
                            </div>
                            <div className="summary-item">
                                <span className="label">Amount Paid</span>
                                <span className="value paid">NPR {bill.paidAmount}</span>
                            </div>
                            <div className="summary-item">
                                <span className="label">Remaining</span>
                                <span className="value remaining">NPR {bill.remainingAmount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="progress-section">
                        <div className="progress-header">
                            <span className="progress-label">Payment Progress</span>
                            <span className="progress-percentage">
                                {Math.round((bill.paidAmount / bill.totalAmount) * 100)}% Completed
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${(bill.paidAmount / bill.totalAmount) * 100}%`
                                }}
                            ></div>
                        </div>
                    </div>

                    <div className="payment-history">
                        <div className="history-header">
                            <h3 className="history-title">Paid Amount History</h3>
                            <div className="history-meta">
                                <span className="history-count">{successfulPayments.length} payment(s)</span>
                                <button
                                    type="button"
                                    className="history-toggle"
                                    onClick={() => setShowHistoryDetails((prev) => !prev)}
                                >
                                    {showHistoryDetails ? 'Hide' : 'View'}
                                </button>
                            </div>
                        </div>

                        {!showHistoryDetails ? (
                            <p className="history-empty">Payment details are hidden. Click View to see.</p>
                        ) : successfulPayments.length === 0 ? (
                            <p className="history-empty">No completed payments yet.</p>
                        ) : (
                            <div className="history-list">
                                {successfulPayments.map((payment, index) => (
                                    <div
                                        key={payment._id || `${payment.transactionId}-${index}`}
                                        className="history-item"
                                    >
                                        <div className="history-person">
                                            <span className="history-name">{payment.customerName || 'Guest'}</span>
                                            <span className="history-time">
                                                {new Date(payment.paidAt || payment.createdAt).toLocaleString('en-NP', { hour12: true })}
                                            </span>
                                        </div>
                                        <span className="history-amount">NPR {Number(payment.amount || 0).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Payment Form */}
                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handlePaymentSubmit} className="payment-form">
                        <div className="form-group">
                            <label htmlFor="name">Your Name</label>
                            <input
                                id="name"
                                type="text"
                                value={customerName}
                                onChange={(e) => {
                                    setCustomerName(e.target.value);
                                    setError('');
                                }}
                                placeholder="Enter your full name"
                                disabled={paying}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="amount">Enter Payment Amount</label>
                            <div className="input-wrapper">
                                <span className="currency">Rs: </span>
                                <input
                                    id="amount"
                                    type="number"
                                    min="10"
                                    step="10"
                                    max={bill.remainingAmount}
                                    value={paymentAmount}
                                    onChange={(e) => {
                                        setPaymentAmount(e.target.value);
                                        setError('');
                                    }}
                                    placeholder={`${bill.remainingAmount}`}
                                    disabled={paying}
                                />
                            </div>
                        </div>

                        {paymentAmount && (
                            <div className="quick-buttons">
                                <button
                                    type="button"
                                    onClick={() => setPaymentAmount(bill.remainingAmount)}
                                    className="quick-btn quick-btn-full"
                                >
                                    Pay Full
                                    <span className="quick-btn-amount">NPR {bill.remainingAmount}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentAmount((bill.remainingAmount / 2).toFixed(2))}
                                    className="quick-btn quick-btn-half"
                                >
                                    Pay Half
                                    <span className="quick-btn-amount">NPR {(bill.remainingAmount / 2).toFixed(2)}</span>
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={paying || !paymentAmount || !customerName.trim()}
                            className="btn-pay"
                        >
                            {paying ? 'Redirecting...' : 'Proceed to Payment'}
                        </button>
                    </form>

                    {/* Info Box */}
                    <div className="info-box">
                        <div className="info-icon"></div>
                        <div className="info-content">
                            <p className="info-title">Share Your Payment Link</p>
                            <p className="info-text">Multiple customers can split this bill. Share the payment link with others to collect payments.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
