import { useContext, useMemo, useState } from "react";
import { StoreContext } from "../context/StoreContext.jsx";

const Cart = () => {
    const { cartItems, foodList, getCartTotal, createOrder, tableNumber, apiUrl } = useContext(StoreContext);
    const [status, setStatus] = useState("");
    const [isPlacing, setIsPlacing] = useState(false);

    const cartLines = useMemo(() => {
        return foodList
            .filter((item) => cartItems[item._id])
            .map((item) => ({
                ...item,
                quantity: cartItems[item._id]
            }));
    }, [cartItems, foodList]);

    const total = getCartTotal();

    const handlePlaceOrder = async () => {
        setIsPlacing(true);
        setStatus("");
        try {
            const sessionId = await createOrder();
            setStatus(`Session created! Your session ID is ${sessionId}.`);
        } catch (error) {
            setStatus(error?.message || "Unable to create session.");
        } finally {
            setIsPlacing(false);
        }
    };

    return (
        <section>
            <div className="section-header">
                <p className="section-subtitle">Review your picks.</p>
                <h1 className="section-title">Your cart</h1>
            </div>

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
