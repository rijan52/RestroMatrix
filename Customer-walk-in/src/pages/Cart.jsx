import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { StoreContext } from "../context/StoreContext.jsx";

const Cart = () => {
    const { cartItems, foodList, getCartTotal, createOrder, tableNumber, restaurantId, apiUrl } = useContext(StoreContext);
    const [status, setStatus] = useState("");
    const [isPlacing, setIsPlacing] = useState(false);
    const [activeSessionId, setActiveSessionId] = useState("");
    const [activeOrder, setActiveOrder] = useState(null);
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

    const loadSession = useCallback(async (sessionId, options = {}) => {
        if (!sessionId || !tableNumber || !sessionStorageKey) return;

        if (!options.silent) {
            setIsLoadingOrder(true);
        }

        try {
            const response = await axios.get(`${apiUrl}/api/walkin/session/${sessionId}`);
            if (!response.data?.success || !response.data?.data) {
                return;
            }

            const session = response.data.data;
            if (restaurantId && session.restaurantId && session.restaurantId !== restaurantId) {
                localStorage.removeItem(sessionStorageKey);
                setActiveSessionId("");
                setActiveOrder(null);
                return;
            }

            if (session.status === "closed") {
                localStorage.removeItem(sessionStorageKey);
                setActiveSessionId("");
                setActiveOrder(null);
                return;
            }

            setActiveSessionId(sessionId);
            setActiveOrder(session);
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
        if (!tableNumber || !sessionStorageKey) {
            setActiveSessionId("");
            setActiveOrder(null);
            return;
        }

        const storedSessionId = localStorage.getItem(sessionStorageKey);
        if (!storedSessionId) {
            setActiveSessionId("");
            setActiveOrder(null);
            return;
        }

        loadSession(storedSessionId);

        const intervalId = setInterval(() => {
            loadSession(storedSessionId, { silent: true });
        }, 10000);

        return () => clearInterval(intervalId);
    }, [loadSession, sessionStorageKey, tableNumber]);

    const handlePlaceOrder = async () => {
        setIsPlacing(true);
        setStatus("");
        try {
            const sessionId = await createOrder();
            if (sessionStorageKey) {
                localStorage.setItem(sessionStorageKey, sessionId);
            }
            await loadSession(sessionId);
            setStatus("Order placed successfully. You can track it below until it is completed.");
        } catch (error) {
            setStatus(error?.message || "Unable to create session.");
        } finally {
            setIsPlacing(false);
        }
    };

    const currentOrderItems = activeOrder?.items || [];
    const currentOrderTotal = Number(activeOrder?.totalBillAmount || 0);
    const currentOrderStatusLabel = activeOrder?.status === "closed"
        ? "Completed"
        : "Active";

    return (
        <section>
            <div className="section-header">
                <p className="section-subtitle">Review your picks.</p>
                <h1 className="section-title">Your cart</h1>
            </div>

            {isLoadingOrder ? (
                <div className="status-card">Loading your current order...</div>
            ) : null}

            {activeOrder ? (
                <div className="cart-panel" style={{ marginBottom: 16 }}>
                    <div className="summary-row">
                        <strong>Current order</strong>
                        <span>{currentOrderStatusLabel}</span>
                    </div>
                    <div className="summary-row">
                        <span>Session</span>
                        <span>{activeOrder.sessionId}</span>
                    </div>
                    <div className="summary-row" style={{ marginTop: 8 }}>
                        <span>Items</span>
                        <span>{currentOrderItems.length}</span>
                    </div>
                    {currentOrderItems.map((item, index) => (
                        <div key={`${item.name}-${index}`} className="summary-row">
                            <span>{item.name} x {item.quantity}</span>
                            <span>${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="summary-row summary-total" style={{ marginTop: 8 }}>
                        <span>Total</span>
                        <span>Rs {currentOrderTotal.toFixed(2)}</span>
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
                                <span className="price">${(item.price * item.quantity).toFixed(2)}</span>
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
                        <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="summary-row summary-total">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
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
