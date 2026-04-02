import { createContext, useEffect, useState } from "react"
import axios from "axios"
import assets from "../assets/assets"


export const StoreContext = createContext(null)

const normalizeCartData = (rawCart = {}) => {
  return Object.entries(rawCart).reduce((acc, [itemId, quantity]) => {
    const parsedQty = Number(quantity) || 0;
    if (parsedQty > 0) {
      acc[itemId] = parsedQty;
    }
    return acc;
  }, {});
};

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const [isCartHydrated, setIsCartHydrated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const url = "http://localhost:4000";
  const [token, setToken] = useState(() => sessionStorage.getItem("token") || "");
  const [food_list, setFoodList] = useState([]);
  const [role, setRole] = useState(() => sessionStorage.getItem("role") || "");
  const [restaurantLogo, setRestaurantLogo] = useState(assets.logo);
  const [headerSettings, setHeaderSettings] = useState({
    title: "Order your favourite food here",
    content:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Possimus saepe neque, maxime consequatur obcaecati, sequi doloribus autem aperiam consectetur ratione facilis! Debitis dolore omnis eligendi laboriosam inventore explicabo assumenda magnam.",
    buttonText: "View Menu",
    backgroundImage: "/header.png",
    exploreMenuTitle: "Explore Our Menu",
    exploreMenuDescription:
      "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Sequi dignissimos quasi, mollitia recusandae at magnam iste, inventore debitis perferendis vel magni in? Rerum aliquam modi maxime vitae cupiditate sapiente commodi?",
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isCartHydrated) {
      return;
    }
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems, isCartHydrated]);

  useEffect(() => {
    if (token) {
      sessionStorage.setItem("token", token);
    } else {
      sessionStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (role) {
      sessionStorage.setItem("role", role);
    } else {
      sessionStorage.removeItem("role");
    }
  }, [role]);

  const addToCart = async (itemId) => {
    if (!token) {
      setShowLogin(true);
      return;
    }

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
      const quantity = Number(cartItems[item]) || 0;
      if (quantity <= 0) continue;

      const itemInfo = food_list.find((product) => product._id === item);
      if (!itemInfo || typeof itemInfo.price !== "number") continue;

      totalAmount += itemInfo.price * quantity;

    }
    return totalAmount;
  }

  const fetchFoodList = async () => {
    const response = await axios.get(url + "/api/food/list");
    setFoodList(response.data.data)
  }

  const fetchCartData = async () => {
    if (!token) {
      setCartItems({});
      localStorage.removeItem("cartItems");
      sessionStorage.removeItem("cartItems");
      return;
    }

    try {
      const response = await axios.get(url + "/api/cart/get", { headers: { token } });
      if (response.data?.success) {
        const normalizedCart = normalizeCartData(response.data.cartData || {});
        setCartItems(normalizedCart);
        localStorage.setItem("cartItems", JSON.stringify(normalizedCart));
      }
    } catch (error) {
      console.log("Error fetching cart:", error);
    }
  }

  const clearCart = async () => {
    setCartItems({});
    localStorage.removeItem("cartItems");
    sessionStorage.removeItem("cartItems");
  }

  const fetchRestaurantProfile = async () => {
    try {
      const response = await axios.get(url + "/api/restaurant-profile");
      if (response.data?.success) {
        const profileData = response.data?.data || {};

        if (profileData.logo) {
          setRestaurantLogo(`${url}/images/${profileData.logo}?t=${Date.now()}`);
        } else {
          setRestaurantLogo(assets.logo);
        }

        setHeaderSettings({
          title: profileData.headerTitle || "Order your favourite food here",
          content:
            profileData.headerContent ||
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Possimus saepe neque, maxime consequatur obcaecati, sequi doloribus autem aperiam consectetur ratione facilis! Debitis dolore omnis eligendi laboriosam inventore explicabo assumenda magnam.",
          buttonText: profileData.headerButtonText || "View Menu",
          backgroundImage: profileData.headerBackgroundImage
            ? `${url}/images/${profileData.headerBackgroundImage}?t=${Date.now()}`
            : "/header.png",
          exploreMenuTitle: profileData.exploreMenuTitle || "Explore Our Menu",
          exploreMenuDescription:
            profileData.exploreMenuDescription ||
            "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Sequi dignissimos quasi, mollitia recusandae at magnam iste, inventore debitis perferendis vel magni in? Rerum aliquam modi maxime vitae cupiditate sapiente commodi?",
        });
      } else {
        setRestaurantLogo(assets.logo);
      }
    } catch (error) {
      console.log("Error loading restaurant profile:", error);
      setRestaurantLogo(assets.logo);
    }
  }
  useEffect(() => {
    // Load cart from localStorage first
    const savedCart = localStorage.getItem("cartItems");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch {
        setCartItems({});
      }
    }
    setIsCartHydrated(true);

    // Clean up legacy persistent auth keys.
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    async function loadData() {
      await fetchFoodList();
      await fetchRestaurantProfile();
      if (token) {
        await fetchCartData();
      }
    }
    loadData();
  }, [])

  // Always load canonical cart from backend when auth state changes.
  useEffect(() => {
    if (token) {
      fetchCartData();
    } else {
      setCartItems({});
      localStorage.removeItem("cartItems");
      sessionStorage.removeItem("cartItems");
    }
  }, [token])

  useEffect(() => {
    const handleLogoUpdated = () => {
      fetchRestaurantProfile();
    };

    window.addEventListener("restaurant-logo-updated", handleLogoUpdated);
    return () => window.removeEventListener("restaurant-logo-updated", handleLogoUpdated);
  }, [])

  useEffect(() => {
    const handleHeaderUpdated = () => {
      fetchRestaurantProfile();
    };

    window.addEventListener("restaurant-header-updated", handleHeaderUpdated);
    return () => window.removeEventListener("restaurant-header-updated", handleHeaderUpdated);
  }, [])

  const contextValue = {
    food_list,
    cartItems,
    setCartItems,
    showLogin,
    setShowLogin,
    addToCart,
    removeFromCart,
    clearCart,
    fetchCartData,
    getTotalCartAmount,
    role,
    setRole,
    restaurantLogo,
    headerSettings,
    fetchRestaurantProfile,
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
