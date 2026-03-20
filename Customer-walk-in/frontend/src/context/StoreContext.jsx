import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = ({ children }) => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4001";
    const [foodList, setFoodList] = useState([]);
    const [cartItems, setCartItems] = useState({});
    const [tableNumber, setTableNumber] = useState("");
    const [isLoadingMenu, setIsLoadingMenu] = useState(true);

    const fetchMenu = useCallback(async () => {
        try {
            const response = await axios.get(`${apiUrl}/api/food/list`);
            if (response.data?.success) {
                setFoodList(response.data.data || []);
            }
        } finally {
            setIsLoadingMenu(false);
        }
    }, [apiUrl]);

    useEffect(() => {
        fetchMenu();
    }, [fetchMenu]);

    const addToCart = (itemId) => {
        setCartItems((prev) => ({
            ...prev,
            [itemId]: (prev[itemId] || 0) + 1
        }));
    };

    const removeFromCart = (itemId) => {
        setCartItems((prev) => {
            const nextQty = (prev[itemId] || 0) - 1;
            if (nextQty <= 0) {
                const { [itemId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [itemId]: nextQty };
        });
    };

    const clearCart = () => {
        setCartItems({});
    };

    const getCartTotal = useCallback(() => {
        return Object.entries(cartItems).reduce((total, [itemId, qty]) => {
            const item = foodList.find((food) => food._id === itemId);
            if (!item) return total;
            return total + item.price * qty;
        }, 0);
    }, [cartItems, foodList]);

    const buildOrderItems = useCallback(() => {
        return Object.entries(cartItems)
            .map(([itemId, qty]) => {
                const item = foodList.find((food) => food._id === itemId);
                if (!item) return null;
                return {
                    menuId: item._id,
                    name: item.name,
                    price: item.price,
                    quantity: qty
                };
            })
            .filter(Boolean);
    }, [cartItems, foodList]);

    const createOrder = useCallback(async () => {
        const items = buildOrderItems();
        const totalBillAmount = getCartTotal();
        if (!tableNumber) {
            throw new Error("Table number is required");
        }
        if (!items.length) {
            throw new Error("Cart is empty");
        }
        const response = await axios.post(`${apiUrl}/api/walkin/session/create`, {
            tableNumber,
            items,
            totalBillAmount
        });
        if (!response.data?.success) {
            throw new Error(response.data?.message || "Unable to create session");
        }
        clearCart();
        return response.data.data?.sessionId;
    }, [apiUrl, buildOrderItems, getCartTotal, tableNumber]);

    const contextValue = useMemo(() => {
        return {
            apiUrl,
            foodList,
            cartItems,
            tableNumber,
            setTableNumber,
            isLoadingMenu,
            addToCart,
            removeFromCart,
            getCartTotal,
            createOrder
        };
    }, [
        apiUrl,
        foodList,
        cartItems,
        tableNumber,
        isLoadingMenu,
        addToCart,
        removeFromCart,
        getCartTotal,
        createOrder
    ]);

    return <StoreContext.Provider value={contextValue}>{children}</StoreContext.Provider>;
};

export default StoreContextProvider;
