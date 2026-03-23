import React from 'react'
import Navbar from './components/navbar/navbar'
import Sidebar from './components/sidebar/sidebar'
import { Route, Routes, Navigate } from 'react-router-dom'
import Add from './pages/Add/Add'
import List from './pages/List/List'
import Orders from './pages/Orders/Orders'
import Reservations from './pages/Reservations/Reservations'
import Drivers from './pages/Drivers/Drivers'
import BillQR from './pages/BillQR/BillQR'
import Payments from './pages/Payments/Payments'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const App = () => {
  const url = "http://localhost:4000"

  return (
    <div>
      <ToastContainer />
      <Navbar />
      <hr />
      <div className="app-content">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Navigate to="/add" replace />} />
          <Route path="/add" element={<Add url={url} />} />
          <Route path="/list" element={<List url={url} />} />
          <Route path="/orders" element={<Orders url={url} />} />
          <Route path="/reservations" element={<Reservations url={url} />} />
          <Route path="/drivers" element={<Drivers url={url} />} />
          <Route path="/bill-qr" element={<BillQR url={url} />} />
          <Route path="/payments" element={<Payments url={url} />} />
        </Routes>
      </div>
    </div>
  )
}

export default App