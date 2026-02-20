import { useContext } from "react";
import { StoreContext } from "../context/StoreContext.jsx";

const MenuItemCard = ({ item }) => {
    const { cartItems, addToCart, removeFromCart, apiUrl } = useContext(StoreContext);
    const quantity = cartItems[item._id] || 0;

    return (
        <article className="menu-card">
            <img src={`${apiUrl}/images/${item.image}`} alt={item.name} />
            <div>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
            </div>
            <div className="price-row">
                <span className="price">${item.price.toFixed(2)}</span>
                {quantity === 0 ? (
                    <button className="primary-btn" onClick={() => addToCart(item._id)}>
                        Add
                    </button>
                ) : (
                    <div className="counter">
                        <button onClick={() => removeFromCart(item._id)}>-</button>
                        <span>{quantity}</span>
                        <button onClick={() => addToCart(item._id)}>+</button>
                    </div>
                )}
            </div>
        </article>
    );
};

export default MenuItemCard;
