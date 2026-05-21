import React from 'react'
import Navbar from './components/navbar/Navbar'
import Sidebar from './components/sidebar/Sidebar'
import { Route, Routes, Navigate } from 'react-router-dom'
import Add from './pages/Add/Add'
import List from './pages/List/List'
import Category from './pages/Category/Category'
import Orders from './pages/Orders/Orders'
import Reservations from './pages/Reservations/Reservations'
import Drivers from './pages/Drivers/Drivers'
import BillQR from './pages/BillQR/BillQR'
import Payments from './pages/Payments/Payments'
import Profile from './pages/Profile/Profile'
import HeaderCustomization from './pages/HeaderCustomization/HeaderCustomization'
import RestaurantLogin from './pages/Login/Login'
import Register from './pages/Register/Register'
import WebsiteLink from './pages/Website-link/WebsiteLink'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from './pages/Dashboard/Dashboard'




const App = () => {
  const url = "http://localhost:4000"

  return (
    <div>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<RestaurantLogin url={url} />} />
        <Route path="/register" element={<Register url={url} />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/restaurant/:restaurantId/*" element={<RestaurantLayout url={url} />} />
      </Routes>
    </div>
  )
}

// Layout for all restaurant routes
const RestaurantLayout = ({ url }) => {
  return (
    <div>
      <Navbar />
      <hr />
      <div className="app-content">
        <Sidebar />
        <Routes>
          <Route path="dashboard" element={<Dashboard url={url} />} />
          <Route path="add" element={<Add url={url} />} />
          <Route path="list" element={<List url={url} />} />
          <Route path="category" element={<Category url={url} />} />
          <Route path="orders" element={<Orders url={url} />} />
          <Route path="reservations" element={<Reservations url={url} />} />
          <Route path="drivers" element={<Drivers url={url} />} />
          <Route path="bill-qr" element={<BillQR url={url} />} />
          <Route path="payments" element={<Payments url={url} />} />
          <Route path="profile" element={<Profile url={url} />} />
          <Route path="header-customization" element={<HeaderCustomization url={url} />} />
          <Route path="website-link" element={<WebsiteLink />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App