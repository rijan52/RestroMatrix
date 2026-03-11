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
import TableReservation from "./pages/TableReservation/TableReservation";
import Menu from "./pages/Menu/Menu";
import Contact from "./pages/Contact/Contact";
import LiveTracking from "./pages/LiveTracking/LiveTracking";
import DriverTracking from "./pages/DriverTracking/DriverTracking";
import DriverDashboard from "./pages/DriverDashboard/DriverDashboard";

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

  const isDriverPage = location.pathname === "/driver-dashboard" || location.pathname === "/driver-tracking"

  return (
    <>
      {showLogin && <LoginPopup setShowLogin={setShowLogin} />}
      <div className="app">
        {!isDriverPage && <Navbar setShowLogin={setShowLogin} />}

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order" element={<PlaceOrder />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/myorders" element={<MyOrders />} />
          <Route path="/livetracking" element={<LiveTracking />} />

          {/* Driver Protected Routes */}
          <Route
            path="/driver-dashboard"
            element={
              <ProtectedDriverRoute>
                <DriverDashboard />
              </ProtectedDriverRoute>
            }
          />
          <Route
            path="/driver-tracking"
            element={
              <ProtectedDriverRoute>
                <DriverTracking />
              </ProtectedDriverRoute>
            }
          />

          <Route path="/reservation" element={<TableReservation />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>

        {!isDriverPage && <Footer />}
      </div>
    </>
  );
};

export default App;






