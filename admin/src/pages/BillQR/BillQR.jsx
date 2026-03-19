import React, { useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';
import { toast } from 'react-toastify';
import { createBill } from '../../services/billService';
import './BillQR.css';

const BillQR = ({ url }) => {
    const [tableNumber, setTableNumber] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [billData, setBillData] = useState(null);
    const qrRef = useRef();

    // Generate Bill and QR
    const handleGenerateQR = async (e) => {
        e.preventDefault();

        if (!tableNumber || !totalAmount) {
            toast.error('Please fill all fields');
            return;
        }

        if (tableNumber <= 0 || totalAmount <= 0) {
            toast.error('Values must be greater than 0');
            return;
        }

        setLoading(true);
        try {
            const response = await createBill(
                parseInt(tableNumber),
                parseFloat(totalAmount)
            );

            if (response.billId) {
                setBillData({
                    billId: response.billId,
                    paymentUrl: response.paymentUrl,
                    tableNumber: parseInt(tableNumber),
                    totalAmount: parseFloat(totalAmount)
                });
                setTableNumber('');
                setTotalAmount('');
                toast.success('Bill QR generated successfully!');
            } else {
                toast.error('Error generating bill');
            }
        } catch (error) {
            toast.error(error.message || 'Error generating bill');
        } finally {
            setLoading(false);
        }
    };

    // Copy payment link
    const handleCopyLink = () => {
        const fullUrl = `http://localhost:5173/pay/${billData.billId}`;
        navigator.clipboard.writeText(fullUrl);
        toast.success('Payment link copied to clipboard!');
    };

    // Print QR Code
    const handlePrintQR = async () => {
        if (!qrRef.current) return;

        try {
            const dataUrl = await toPng(qrRef.current);
            const printWindow = window.open('', '', 'width=600,height=700');

            printWindow.document.write(`
                <html>
                <head>
                    <title>Bill QR Code</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            padding: 20px;
                        }
                        h1 { margin: 10px 0; }
                        .info { font-size: 18px; margin: 5px 0; font-weight: bold; }
                        img { margin: 20px 0; border: 2px solid #333; padding: 10px; }
                    </style>
                </head>
                <body>
                    <h1>Bill QR Code</h1>
                    <div class="info">Table: ${billData.tableNumber}</div>
                    <div class="info">Amount: NPR ${billData.totalAmount}</div>
                    <img src="${dataUrl}" />
                    <p>Bill ID: ${billData.billId}</p>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        } catch (error) {
            toast.error('Failed to generate QR image');
        }
    };

    return (
        <div className="billqr-wrapper">
            <div className="billqr-container">
                <div className="billqr-header">
                    <h1>Generate Bill QR Code</h1>
                    <p className="billqr-subtitle">Create payment links for table bills</p>
                </div>

                {!billData ? (
                    <div className="billqr-content">
                        <form onSubmit={handleGenerateQR} className="billqr-form">
                            <div className="form-group">
                                <label htmlFor="table">Table Number</label>
                                <input
                                    id="table"
                                    type="number"
                                    min="1"
                                    value={tableNumber}
                                    onChange={(e) => setTableNumber(e.target.value)}
                                    placeholder="Enter table number"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="amount">Total Amount (NPR)</label>
                                <input
                                    id="amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={totalAmount}
                                    onChange={(e) => setTotalAmount(e.target.value)}
                                    placeholder="Enter total amount"
                                />
                            </div>

                            <button type="submit" disabled={loading} className="btn-generate">
                                {loading ? 'Generating...' : 'Generate QR Code'}
                            </button>
                        </form>

                        <div className="info-guide">
                            <div className="guide-item">
                                <div className="guide-icon">📋</div>
                                <div>
                                    <h4>Table Number</h4>
                                    <p>Identify which table this bill is for</p>
                                </div>
                            </div>
                            <div className="guide-item">
                                <div className="guide-icon">💰</div>
                                <div>
                                    <h4>Bill Amount</h4>
                                    <p>Enter the total bill amount in NPR</p>
                                </div>
                            </div>
                            <div className="guide-item">
                                <div className="guide-icon">📱</div>
                                <div>
                                    <h4>QR Code</h4>
                                    <p>Generate a scannable QR for customers</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="billqr-content bill-display-content">
                        {/* Bill Info */}
                        <div className="bill-info-section">
                            <h2 className="section-title">Bill Details</h2>
                            <div className="bill-info">
                                <div className="info-row">
                                    <span className="label">Bill ID</span>
                                    <span className="value">{billData.billId}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Table Number</span>
                                    <span className="value">{billData.tableNumber}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Total Amount</span>
                                    <span className="value">NPR {billData.totalAmount}</span>
                                </div>
                            </div>
                        </div>

                        {/* QR Code Section */}
                        <div className="qr-display-section">
                            <h2 className="section-title">QR Code</h2>
                            <div className="qr-section" ref={qrRef}>
                                <QRCode
                                    value={`http://localhost:5173/pay/${billData.billId}`}
                                    size={256}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>
                        </div>

                        {/* Payment Link Section */}
                        <div className="payment-link-section">
                            <h2 className="section-title">Payment Link</h2>
                            <div className="link-display">
                                <input
                                    type="text"
                                    readOnly
                                    value={`http://localhost:5173/pay/${billData.billId}`}
                                    className="link-input"
                                />
                                <button onClick={handleCopyLink} className="btn-copy">
                                    📋 Copy
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="button-group">
                            <button onClick={handlePrintQR} className="btn-print">
                                🖨️ Print QR
                            </button>
                            <button
                                onClick={() => setBillData(null)}
                                className="btn-new"
                            >
                                ➕ Generate New Bill
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillQR;
