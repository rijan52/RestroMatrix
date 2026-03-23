import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./Payments.css";

const formatCurrency = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

const Payments = ({ url }) => {
    const [loading, setLoading] = useState(false);
    const [onlinePayments, setOnlinePayments] = useState([]);
    const [splitPayments, setSplitPayments] = useState([]);

    const fetchSplitPaymentsWithFallback = async () => {
        try {
            const splitResponse = await axios.get(`${url}/api/bills/payments/split`);
            if (splitResponse?.data?.success) {
                return splitResponse.data.data || [];
            }
            return [];
        } catch (error) {
            if (error?.response?.status !== 404) {
                throw error;
            }

            const billsResponse = await axios.get(`${url}/api/bills/list?limit=100`);
            if (!billsResponse?.data?.success) return [];

            const bills = billsResponse.data.data || [];

            const paymentsByBill = await Promise.all(
                bills.map(async (bill) => {
                    try {
                        const response = await axios.get(`${url}/api/bills/${bill._id}/payments`);
                        if (!response?.data?.success) return [];

                        const billPayments = response.data.data || [];
                        return billPayments
                            .filter((payment) => payment.status === "SUCCESS")
                            .map((payment) => ({
                                ...payment,
                                billId: {
                                    _id: bill._id,
                                    tableNumber: bill.tableNumber,
                                    totalAmount: bill.totalAmount,
                                    paidAmount: bill.paidAmount,
                                    remainingAmount: bill.remainingAmount,
                                    status: bill.status,
                                },
                            }));
                    } catch (billPaymentError) {
                        if (billPaymentError?.response?.status === 404) {
                            return [];
                        }
                        throw billPaymentError;
                    }
                })
            );

            return paymentsByBill.flat();
        }
    };

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const [ordersResponse, splitData] = await Promise.all([
                axios.get(`${url}/api/order/list`),
                fetchSplitPaymentsWithFallback(),
            ]);

            const orderData = ordersResponse?.data?.success
                ? ordersResponse.data.data || []
                : [];

            const onlineOnly = orderData
                .filter((order) => {
                    const isOnline = Boolean(order.address);
                    const status = String(order.paymentStatus || "").toLowerCase();
                    const paid = order.payment === true || status === "completed";
                    return isOnline && paid;
                })
                .map((order) => ({
                    id: order._id,
                    orderCode: `#${String(order._id).slice(-6).toUpperCase()}`,
                    customerName: `${order.address?.firstName || ""} ${order.address?.lastName || ""}`.trim() || "N/A",
                    phone: order.address?.phone || "N/A",
                    amount: Number(order.amount || 0),
                    method: "eSewa",
                    transactionId: order.esewaTransactionId || order.esewaTransactionCode || "N/A",
                    date: order.date,
                    paymentStatus: order.paymentStatus || "Completed",
                }));

            const groupedSplit = splitData.reduce((accumulator, payment) => {
                const billId = payment.billId?._id || "UNKNOWN";
                const paidAt = payment.paidAt || payment.updatedAt || payment.createdAt;
                const paymentAmount = Number(payment.amount || 0);

                if (!accumulator[billId]) {
                    accumulator[billId] = {
                        id: billId,
                        sessionId: payment.billId?._id ? `BILL-${String(payment.billId._id).slice(-6).toUpperCase()}` : "N/A",
                        tableNumber: payment.billId?.tableNumber ?? "N/A",
                        amountPaid: 0,
                        transactionUuid: payment.transactionId || "N/A",
                        refId: payment.esewaDetails?.refId || payment.esewaDetails?.esewaTransactionId || "N/A",
                        paidAt,
                        totalPaidAmount: Number(payment.billId?.paidAmount || 0),
                        totalBillAmount: Number(payment.billId?.totalAmount || 0),
                    };
                }

                accumulator[billId].amountPaid += paymentAmount;

                const existingTime = new Date(accumulator[billId].paidAt || 0).getTime();
                const currentTime = new Date(paidAt || 0).getTime();

                if (currentTime >= existingTime) {
                    accumulator[billId].paidAt = paidAt;
                    accumulator[billId].transactionUuid = payment.transactionId || accumulator[billId].transactionUuid;
                    accumulator[billId].refId =
                        payment.esewaDetails?.refId ||
                        payment.esewaDetails?.esewaTransactionId ||
                        accumulator[billId].refId;
                    accumulator[billId].totalPaidAmount = Number(payment.billId?.paidAmount || accumulator[billId].totalPaidAmount || 0);
                    accumulator[billId].totalBillAmount = Number(payment.billId?.totalAmount || accumulator[billId].totalBillAmount || 0);
                }

                return accumulator;
            }, {});

            const splitOnly = Object.values(groupedSplit)
                .sort((a, b) => new Date(b.paidAt || 0).getTime() - new Date(a.paidAt || 0).getTime());

            setOnlinePayments(onlineOnly);
            setSplitPayments(splitOnly);
        } catch (error) {
            console.error("Error loading payment data:", error);
            toast.error("Failed to load payment data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const summary = useMemo(() => {
        const onlineTotal = onlinePayments.reduce((sum, payment) => sum + payment.amount, 0);
        const splitTotal = splitPayments.reduce((sum, payment) => sum + payment.amountPaid, 0);

        return {
            onlineCount: onlinePayments.length,
            splitCount: splitPayments.length,
            onlineTotal,
            splitTotal,
            grandTotal: onlineTotal + splitTotal,
        };
    }, [onlinePayments, splitPayments]);

    return (
        <div className="payments">
            <div className="payments-header">
                <div>
                    <h3>Payments</h3>
                    <p>Track online payment collection and walk-in split payments.</p>
                </div>
                <button type="button" className="payments-refresh" onClick={fetchPayments} disabled={loading}>
                    {loading ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            <div className="payments-summary-grid">
                <div className="payments-summary-card">
                    <span>Online Payments</span>
                    <h4>{summary.onlineCount}</h4>
                    <p>{formatCurrency(summary.onlineTotal)}</p>
                </div>
                <div className="payments-summary-card">
                    <span>Split Payments</span>
                    <h4>{summary.splitCount}</h4>
                    <p>{formatCurrency(summary.splitTotal)}</p>
                </div>
                <div className="payments-summary-card">
                    <span>Total Received</span>
                    <h4>{formatCurrency(summary.grandTotal)}</h4>
                    <p>Online + Split payments</p>
                </div>
            </div>

            <div className="payments-panels">
                <section className="payments-panel">
                    <div className="panel-header">
                        <h4>Online Order Payments</h4>
                        <span>{onlinePayments.length} records</span>
                    </div>

                    {onlinePayments.length === 0 ? (
                        <div className="payments-empty">No online payments found.</div>
                    ) : (
                        <div className="payments-table-wrap">
                            <table className="payments-table">
                                <thead>
                                    <tr>
                                        <th>Order</th>
                                        <th>Customer</th>
                                        <th>Phone</th>
                                        <th>Method</th>
                                        <th>Transaction</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {onlinePayments.map((payment) => (
                                        <tr key={payment.id}>
                                            <td>{payment.orderCode}</td>
                                            <td>{payment.customerName}</td>
                                            <td>{payment.phone}</td>
                                            <td>{payment.method}</td>
                                            <td>{payment.transactionId}</td>
                                            <td>{formatCurrency(payment.amount)}</td>
                                            <td>
                                                {payment.date
                                                    ? new Date(payment.date).toLocaleString()
                                                    : "N/A"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="payments-panel">
                    <div className="panel-header">
                        <h4>Walk-in Split Payments</h4>
                        <span>{splitPayments.length} records</span>
                    </div>

                    {splitPayments.length === 0 ? (
                        <div className="payments-empty">No split payments found.</div>
                    ) : (
                        <div className="payments-table-wrap">
                            <table className="payments-table">
                                <thead>
                                    <tr>
                                        <th>Session</th>
                                        <th>Table</th>
                                        <th>Paid Amount</th>
                                        <th>Transaction UUID</th>
                                        <th>Reference</th>
                                        <th>Session Paid</th>
                                        <th>Session Bill</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {splitPayments.map((payment) => (
                                        <tr key={payment.id}>
                                            <td>{payment.sessionId}</td>
                                            <td>{payment.tableNumber}</td>
                                            <td>{formatCurrency(payment.amountPaid)}</td>
                                            <td>{payment.transactionUuid}</td>
                                            <td>{payment.refId}</td>
                                            <td>{formatCurrency(payment.totalPaidAmount)}</td>
                                            <td>{formatCurrency(payment.totalBillAmount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Payments;
