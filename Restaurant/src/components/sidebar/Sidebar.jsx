import React from 'react'
import './Sidebar.css'
import { NavLink, useParams } from 'react-router-dom'

const Sidebar = () => {
    const { restaurantId } = useParams();
    return (
        <div className='sidebar'>
            <div className="sidebar-options">
                <NavLink to={`/restaurant/${restaurantId}/dashboard`} className="sidebar-option">
                    <p>Dashboard</p>
                </NavLink>
                <NavLink to={`/restaurant/${restaurantId}/orders`} className="sidebar-option">
                    <p>Orders</p>
                </NavLink>
                <NavLink to={`/restaurant/${restaurantId}/add`} className="sidebar-option">
                    <p>Add Items</p>
                </NavLink>
                <NavLink to={`/restaurant/${restaurantId}/list`} className="sidebar-option">
                    <p>List Items</p>
                </NavLink>
                <NavLink to={`/restaurant/${restaurantId}/category`} className="sidebar-option">
                    <p>Manage Categories</p>
                </NavLink>
                <NavLink to={`/restaurant/${restaurantId}/reservations`} className="sidebar-option">
                    <p>Reservations</p>
                </NavLink>
                <NavLink to={`/restaurant/${restaurantId}/drivers`} className="sidebar-option">
                    <p>Manage Drivers</p>
                </NavLink>
                <NavLink to={`/restaurant/${restaurantId}/bill-qr`} className="sidebar-option">
                    <p>Bill QR Generator</p>
                </NavLink>
                <NavLink to={`/restaurant/${restaurantId}/payments`} className="sidebar-option">
                    <p>Payments</p>
                </NavLink>
                <NavLink to={`/restaurant/${restaurantId}/profile`} className="sidebar-option">
                    <p>Restaurant Profile</p>
                </NavLink>
                <NavLink to={`/restaurant/${restaurantId}/header-customization`} className="sidebar-option">
                    <p>Header Customization</p>
                </NavLink>
                <NavLink to={`/restaurant/${restaurantId}/website-link`} className="sidebar-option">
                    <p>Website Link</p>
                </NavLink>
            </div>
        </div>
    )
}

export default Sidebar