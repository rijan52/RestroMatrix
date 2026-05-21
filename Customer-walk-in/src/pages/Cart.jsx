import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { StoreContext } from "../context/StoreContext.jsx";

const Cart = () => {
    const { cartItems, foodList, getCartTotal, createOrder, tableNumber, restaurantId, apiUrl } = useContext(StoreContext);
    const [status, setStatus] = useState("");
    const [isPlacing, setIsPlacing] = useState(false);
    const [activeOrders, setActiveOrders] = useState([]);
    const [isLoadingOrder, setIsLoadingOrder] = useState(false);

    const sessionStorageKey = useMemo(() => {
        return tableNumber ? `walkin_session_${restaurantId || "default"}_${tableNumber}` : "";
    }, [restaurantId, tableNumber]);

    const cartLines = useMemo(() => {
        return foodList
            .filter((item) => cartItems[item._id])
            .map((item) => ({
                ...item,
                quantity: cartItems[item._id]
            }));
    }, [cartItems, foodList]);

    const total = getCartTotal();

    const loadActiveOrders = useCallback(async (options = {}) => {
        if (!tableNumber || !restaurantId) return;

        if (!options.silent) {
            setIsLoadingOrder(true);
        }

        try {
            const response = await axios.get(`${apiUrl}/api/walkin/list`, {
                params: { restaurantId }
            });

            if (!response.data?.success) {
                setActiveOrders([]);
                return;
            }

            const sessions = Array.isArray(response.data.data) ? response.data.data : [];
            const matchingSessions = sessions.filter((session) => {
                return String(session.tableNumber) === String(tableNumber) && session.status !== "closed";
            });

            setActiveOrders(matchingSessions);

            const latestSession = matchingSessions[0];
            if (latestSession?.sessionId && sessionStorageKey) {
                localStorage.setItem(sessionStorageKey, latestSession.sessionId);
            }
        } catch {
            if (!options.silent) {
                setStatus("Unable to load your current order.");
            }
        } finally {
            if (!options.silent) {
                setIsLoadingOrder(false);
            }
        }
    }, [apiUrl, restaurantId, sessionStorageKey, tableNumber]);

    useEffect(() => {
        if (!tableNumber || !restaurantId) {
            setActiveOrders([]);
            return;
        }

        loadActiveOrders();

        const intervalId = setInterval(() => {
            loadActiveOrders({ silent: true });
        }, 10000);

        return () => clearInterval(intervalId);
    }, [loadActiveOrders, restaurantId, tableNumber]);

    const handlePlaceOrder = async () => {
        setIsPlacing(true);
        setStatus("");
        try {
            const sessionId = await createOrder();
            if (sessionStorageKey) {
                localStorage.setItem(sessionStorageKey, sessionId);
            }
            await loadActiveOrders();
            setStatus("Order placed successfully. You can track it below until it is completed.");
        } catch (error) {
            setStatus(error?.message || "Unable to create session.");
        } finally {
            setIsPlacing(false);
        }
    };

    const activeOrderTotal = activeOrders.reduce((total, order) => {
        return total + Number(order?.totalBillAmount || 0);
    }, 0);

    return (
        <section>
            <div className="section-header">
                <p className="section-subtitle">Review your picks.</p>
                <h1 className="section-title">Your cart</h1>
            </div>

            {isLoadingOrder ? (
                <div className="status-card">Loading your current order...</div>
            ) : null}

            {activeOrders.length > 0 ? (
                <div className="cart-panel" style={{ marginBottom: 16 }}>
                    <div className="summary-row">
                        <strong>Active current orders</strong>
                        <span>{activeOrders.length}</span>
                    </div>
                    {activeOrders.map((order, orderIndex) => {
                        const items = Array.isArray(order.items) ? order.items : [];
                        const orderTotal = Number(order.totalBillAmount || 0);

                        return (
                            <div key={order.sessionId || orderIndex} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                <div className="summary-row">
                                    <strong>Session</strong>
                                    <span>{order.sessionId}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Status</span>
                                    <span>{order.status === "fully_paid" ? "Completed" : "Active"}</span>
                                </div>
                                <div className="summary-row" style={{ marginTop: 8 }}>
                                    <span>Items</span>
                                    <span>{items.length}</span>
                                </div>
                                {items.map((item, index) => (
                                    <div key={`${order.sessionId}-${item.name}-${index}`} className="summary-row">
                                        <span>{item.name} x {item.quantity}</span>
                                        <span>Rs{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="summary-row summary-total" style={{ marginTop: 8 }}>
                                    <span>Order total</span>
                                    <span>Rs {orderTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        );
                    })}
                    <div className="summary-row summary-total" style={{ marginTop: 12 }}>
                        <span>All active orders total</span>
                        <span>Rs {activeOrderTotal.toFixed(2)}</span>
                    </div>
                </div>
            ) : null}

            <div className="cart-layout">
                <div className="cart-panel">
                    {cartLines.length === 0 ? (
                        <p className="section-subtitle">Cart is empty. Add a few dishes from the menu.</p>
                    ) : (
                        cartLines.map((item) => (
                            <div key={item._id} className="cart-item">
                                <img src={`${apiUrl}/images/${item.image}`} alt={item.name} />
                                <div>
                                    <strong>{item.name}</strong>
                                    <p className="section-subtitle">Qty {item.quantity}</p>
                                </div>
                                <span className="price">Rs{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))
                    )}
                </div>

                <div className="cart-panel cart-summary">
                    <div className="summary-row">
                        <span>Table</span>
                        <span>{tableNumber || "Not set"}</span>
                    </div>
                    <div className="summary-row">
                        <span>Subtotal</span>
                        <span>Rs {total.toFixed(2)}</span>
                    </div>
                    <div className="summary-row summary-total">
                        <span>Total</span>
                        <span>Rs {total.toFixed(2)}</span>
                    </div>
                    <button
                        className="primary-btn"
                        onClick={handlePlaceOrder}
                        disabled={!cartLines.length || !tableNumber || isPlacing}
                    >
                        {isPlacing ? "Placing order..." : "Place order"}
                    </button>
                    {status ? <div className="status-card">{status}</div> : null}
                </div>
            </div>
        </section>
    );
};

export default Cart;
