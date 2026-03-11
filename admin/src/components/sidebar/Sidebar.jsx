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

                <NavLink to='/orders' className="sidebar-option">
                    {/* <img src="" alt="" /> */}
                    <p>Orders</p>
                </NavLink>

                <NavLink to='/reservations' className="sidebar-option">
                    {/* <img src="" alt="" /> */}
                    <p>Reservations</p>
                </NavLink>

                <NavLink to='/driver-tracking' className="sidebar-option">
                    {/* <img src="" alt="" /> */}
                    <p>Driver Tracking</p>
                </NavLink>

                <NavLink to='/drivers' className="sidebar-option">
                    {/* <img src="" alt="" /> */}
                    <p>Manage Drivers</p>
                </NavLink>

            </div>
        </div>
    )
}

export default Sidebar