import React, { useState, useEffect } from "react";

import { Route, Routes, Navigate, useLocation } from "react-router-dom";
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

  return (
    <>
      {showLogin && <LoginPopup setShowLogin={setShowLogin} />}
      <div className="app">
        {!isDriverPage && !isTrackingPage && !isPaymentPage && <Navbar setShowLogin={setShowLogin} />}

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order" element={<PlaceOrder />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/myorders" element={<MyOrders />} />
          <Route path="/live-tracking" element={<LiveTracking />} />
          <Route path="/reservation" element={<TableReservation />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/pay/:billId" element={<Payment />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {!isDriverPage && !isTrackingPage && !isPaymentPage && <Footer />}
      </div>
    </>
  );
};

export default App;






