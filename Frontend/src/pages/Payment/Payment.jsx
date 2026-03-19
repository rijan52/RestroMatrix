import React, { useState, useEffect } from 'react';
import './Payment.css';
import { useParams, useNavigate } from 'react-router-dom';
import { getBill, initiateEsewaPayment } from '../../services/billService';

const Payment = () => {
    const { billId } = useParams();
    const navigate = useNavigate();
    const [bill, setBill] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBill = async () => {
            try {
                const response = await getBill(billId);
                setBill(response);
                setError('');
            } catch (err) {
                setError(err.message || 'Error loading bill');
            } finally {
                setLoading(false);
            }
        };

        fetchBill();

        // Refresh bill status every 5 seconds
        const interval = setInterval(fetchBill, 5000);
        return () => clearInterval(interval);
    }, [billId]);

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();

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
            const response = await initiateEsewaPayment(billId, amount);

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

                    {/* Payment Form */}
                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handlePaymentSubmit} className="payment-form">
                        <div className="form-group">
                            <label htmlFor="amount">Enter Payment Amount</label>
                            <div className="input-wrapper">
                                <span className="currency">NPR</span>
                                <input
                                    id="amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    max={bill.remainingAmount}
                                    value={paymentAmount}
                                    onChange={(e) => {
                                        setPaymentAmount(e.target.value);
                                        setError('');
                                    }}
                                    placeholder={`Max: ${bill.remainingAmount}`}
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
                            disabled={paying || !paymentAmount}
                            className="btn-pay"
                        >
                            {paying ? 'Redirecting...' : 'Proceed to Payment'}
                        </button>
                    </form>

                    {/* Info Box */}
                    <div className="info-box">
                        <div className="info-icon">ℹ️</div>
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
