import { createContext, useEffect, useState } from "react"
import axios from "axios"


export const StoreContext = createContext(null)

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const url = "http://localhost:4000";
  const [token, setToken] = useState("");
  const [food_list, setFoodList] = useState([]);
  const [role, setRole] = useState("");

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = async (itemId) => {
    if (!cartItems[itemId]) {
      setCartItems((prev) => ({ ...prev, [itemId]: 1 }))
    }
    else {
      setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }))
    }
    if (token) {
      axios.post(url + "/api/cart/add", { itemId }, { headers: { token } })
    }
  }
  const removeFromCart = async (itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }));
    if (token) {
      await axios.post(url + "/api/cart/remove", { itemId }, { headers: { token } })
    }
  }

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        let itemInfo = food_list.find((product) => product._id === item)
        totalAmount += itemInfo.price * cartItems[item];
      }

    }
    return totalAmount;
  }

  const fetchFoodList = async () => {
    const response = await axios.get(url + "/api/food/list");
    setFoodList(response.data.data)
  }
  const loadCartData = async (tokenValue) => {
    try {
      const response = await axios.get(url + "/api/cart/get", { headers: { token: tokenValue } });
      if (response.data.success && response.data.cartData && Object.keys(response.data.cartData).length > 0) {
        // Only use backend cart if it has items
        setCartItems(response.data.cartData);
      }
      // If backend cart is empty, keep the localStorage cart that was already loaded
    } catch (error) {
      console.log("Error loading cart from backend:", error);
      // Keep localStorage cart on error
    }
  }


  useEffect(() => {
    // Load cart from localStorage first
    const savedCart = localStorage.getItem("cartItems");
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }

    if (localStorage.getItem("token")) {
      setToken(localStorage.getItem("token"));
    }
    if (localStorage.getItem("role")) {
      setRole(localStorage.getItem("role"));
    }
    async function loadData() {
      await fetchFoodList();
      if (localStorage.getItem("token")) {
        const tokenValue = localStorage.getItem("token");
        setToken(tokenValue);
        await loadCartData(tokenValue);
      }
    }
    loadData();
  }, [])

  // Sync cart to backend whenever it changes and user is logged in
  useEffect(() => {
    if (token && Object.keys(cartItems).length > 0) {
      // Sync each item to backend
      Object.entries(cartItems).forEach(([itemId, quantity]) => {
        if (quantity > 0) {
          axios.post(url + "/api/cart/add", { itemId }, { headers: { token } }).catch(err => console.log(err));
        }
      });
    }
  }, [token])

  const contextValue = {
    food_list,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    role,
    setRole,
    url,
    token,
    setToken


  }

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  )
}

export default StoreContextProvider
