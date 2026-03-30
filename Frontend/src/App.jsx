import React, { useState, useEffect } from "react";

import { Route, Routes, Navigate, useLocation, useParams } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Home from "./pages/Home/Home";
import Cart from "./pages/Cart/Cart";
import PlaceOrder from "./pages/PlaceOrder/PlaceOrder.JSX";
import Footer from "./components/Footer/Footer";
import LoginPopup from "./components/LoginPopup/LoginPopup";
import Verify from "./pages/Verify/Verify";
import MyOrders from "./pages/MyOrders/MyOrders";
import LiveTracking from "./pages/LiveTracking/LiveTracking";
import TableReservation from "./pages/TableReservation/TableReservation";
import Menu from "./pages/Menu/Menu";
import Contact from "./pages/Contact/Contact";
import Payment from "./pages/Payment/Payment";
import PaymentSuccess from "./pages/PaymentSuccess/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure/PaymentFailure";
import OrderConfirmation from "./pages/OrderConfirmation/OrderConfirmation";

// Protected Route Component
const ProtectedDriverRoute = ({ children }) => {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  if (role !== "driver" || !token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const ProtectedCheckoutRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const location = useLocation();

  if (!token || role === "driver") {
    return <Navigate to="/login" replace state={{ redirectTo: location.pathname }} />;
  }

  return children;
};

const App = () => {
  const [showLogin, setShowLogin] = useState(false)
  const [isDriverLoggedIn, setIsDriverLoggedIn] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const role = localStorage.getItem("role");
    setIsDriverLoggedIn(role === "driver");
  }, [location])

  const isDriverPage = location.pathname === "/driver-tracking"
  const isTrackingPage = location.pathname === "/live-tracking"
  const isPaymentPage = location.pathname.startsWith("/pay/") || location.pathname.startsWith("/payment/")
  const isLoginPage = location.pathname === "/login"

  return (
    <>
      {showLogin && <LoginPopup setShowLogin={setShowLogin} />}
      <div className="app">
        <Routes>
          <Route path="/login" element={<LoginPopup isPageMode={true} />} />
          <Route path="/" element={<FallbackPage />} />
          <Route path="/restaurant/:restaurantId/*" element={<RestaurantLayout setShowLogin={setShowLogin} />} />
          {/* Payment and tracking routes can remain global if needed */}
          <Route path="/pay/:billId" element={<Payment />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />
          <Route path="/live-tracking" element={<LiveTracking />} />
          <Route path="*" element={<FallbackPage />} />
        </Routes>
        {!isDriverPage && !isTrackingPage && !isPaymentPage && !isLoginPage && <Footer />}
      </div>
    </>
  );
};

// Layout for all restaurant routes
const RestaurantLayout = ({ setShowLogin }) => {
  const { restaurantId } = useParams();
  if (!restaurantId) {
    return <FallbackPage />;
  }
  return (
    <>
      <Navbar setShowLogin={setShowLogin} />
      <Routes>
        <Route index element={<Home />} />
        <Route path="home" element={<Home />} />
        <Route path="menu" element={<Menu />} />
        <Route path="cart" element={<Cart />} />
        <Route path="order" element={<ProtectedCheckoutRoute><PlaceOrder /></ProtectedCheckoutRoute>} />
        <Route path="order-confirmation/:orderId" element={<OrderConfirmation />} />
        <Route path="verify" element={<Verify />} />
        <Route path="myorders" element={<MyOrders />} />
        <Route path="reservation" element={<TableReservation />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  );
}

// Fallback page if no restaurantId
const FallbackPage = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>Please select a restaurant to continue.</h2>
    <p>Or use a direct link like <code>/restaurant/&lt;restaurantId&gt;/menu</code></p>
  </div>
);

export default App;






