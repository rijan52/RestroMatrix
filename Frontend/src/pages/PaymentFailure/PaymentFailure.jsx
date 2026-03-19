import React from 'react';
import './PaymentResult.css';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentFailure = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const transactionId = searchParams.get('transaction_uuid');
    // Extract billId from transaction format: BILL_<billId>_<timestamp>
    const parts = transactionId?.split('_');
    const billId = parts && parts.length >= 2 ? parts[1] : null;

    return (
        <div className="result-container failure">
            <div className="result-card">
                <div className="failure-icon">✕</div>
                <h1>Payment Failed</h1>

                <div className="bill-info">
                    <p className="subtitle">
                        Unable to process your payment. Please try again.
                    </p>

                    {transactionId && (
                        <div className="info-section">
                            <div className="info-row">
                                <span className="label">Transaction ID:</span>
                                <span className="value">{transactionId}</span>
                            </div>
                        </div>
                    )}

                    <div className="error-message">
                        <p>
                            ⚠️ Your payment could not be processed. This may be due to:
                        </p>
                        <ul>
                            <li>Insufficient balance in your eSewa account</li>
                            <li>Network connectivity issues</li>
                            <li>Invalid payment details</li>
                            <li>Transaction timeout</li>
                        </ul>
                    </div>
                </div>

                <div className="button-group">
                    {billId && (
                        <button
                            onClick={() => navigate(`/pay/${billId}`)}
                            className="btn btn-primary"
                        >
                            Try Again
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/')}
                        className="btn btn-secondary"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentFailure;
