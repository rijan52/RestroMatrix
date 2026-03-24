import React from 'react'
import './Sidebar.css'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
    return (
        <div className='sidebar'>
            <div className="sidebar-options">
                <NavLink to='/add' className="sidebar-option">
                    {/* <img src="" alt="" /> */}
                    <p>Add Items</p>
                </NavLink>

                <NavLink to='/list' className="sidebar-option">
                    {/* <img src="" alt="" /> */}
                    <p>List Items</p>
                </NavLink>

                <NavLink to='/category' className="sidebar-option">
                    {/* <img src="" alt="" /> */}
                    <p>Manage Categories</p>
                </NavLink>

                <NavLink to='/orders' className="sidebar-option">
                    {/* <img src="" alt="" /> */}
                    <p>Orders</p>
                </NavLink>

                <NavLink to='/reservations' className="sidebar-option">
                    {/* <img src="" alt="" /> */}
                    <p>Reservations</p>
                </NavLink>

                <NavLink to='/drivers' className="sidebar-option">
                    {/* <img src="" alt="" /> */}
                    <p>Manage Drivers</p>
                </NavLink>

                <NavLink to='/bill-qr' className="sidebar-option">
                    {/* <img src="" alt="" /> */}
                    <p>Bill QR Generator</p>
                </NavLink>

                <NavLink to='/payments' className="sidebar-option">
                    {/* <img src="" alt="" /> */}
                    <p>Payments</p>
                </NavLink>

                <NavLink to='/profile' className="sidebar-option">
                    {/* <img src="" alt="" /> */}
                    <p>Restaurant Profile</p>
                </NavLink>

            </div>
        </div>
    )
}

export default Sidebar