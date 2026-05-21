import React from 'react'
import './Sidebar.css'
import { NavLink, useParams } from 'react-router-dom'

const Sidebar = () => {
    const { restaurantId } = useParams();

    const menuSections = [
        {
            title: 'Dashboard',
            items: [
                { path: 'dashboard', label: 'Overview', tooltip: 'Overview' },
            ],
        },
        {
            title: 'Order Management',
            items: [
                { path: 'orders', label: 'Orders', tooltip: 'Orders' },
                { path: 'reservations', label: 'Reservations', tooltip: 'Reservations' },
            ],
        },
        {
            title: 'Product Management',
            items: [
                { path: 'add', label: 'Add Product', tooltip: 'Add Product' },
                { path: 'list', label: 'Product List', tooltip: 'Product List' },
                { path: 'category', label: 'Categories', tooltip: 'Categories' },
            ],
        },
        {
            title: 'Delivery Management',
            items: [
                { path: 'drivers', label: 'Drivers', tooltip: 'Drivers' },
            ],
        },
        {
            title: 'Finance & Payments',
            items: [
                { path: 'payments', label: 'Payments', tooltip: 'Payments' },
                { path: 'bill-qr', label: 'Invoice / QR Billing', tooltip: 'Invoice / QR Billing' },
            ],
        },
        {
            title: 'Restaurant Settings',
            items: [
                { path: 'profile', label: 'Restaurant Profile', tooltip: 'Restaurant Profile' },
                { path: 'website-link', label: 'Website Configuration', tooltip: 'Website Configuration' },
                { path: 'header-customization', label: 'Header Customization', tooltip: 'Header Customization' },
            ],
        },
    ];

    return (
        <div className='sidebar'>


            <div className="sidebar-options">
                {menuSections.map((section) => (
                    <section className="sidebar-section" key={section.title}>
                        <p className="sidebar-section-title">{section.title}</p>
                        <div className="sidebar-section-items">
                            {section.items.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={`/restaurant/${restaurantId}/${item.path}`}
                                    className="sidebar-option"
                                    data-tooltip={item.tooltip}
                                >
                                    <p>{item.label}</p>
                                </NavLink>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            <div className="sidebar-footer">
                <div className="logout-btn">
                    <p>Logout</p>
                </div>
            </div>
        </div>
    )
}

export default Sidebar