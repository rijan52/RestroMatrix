import React from 'react'
import './Navbar.css'

const Navbar = () => {
  return (
    <div className='navbar'>
      <div className="navbar-brand">
        <span className="navbar-brand-mark">RM</span>
        <div>
          <p className="navbar-title">RestroMatrix</p>
          <p className="navbar-subtitle">Admin Console</p>
        </div>
      </div>
      <div className="navbar-meta">
        <span className="navbar-pill">Admin</span>
        <div className="navbar-avatar">RA</div>
      </div>
    </div>
  )
}

export default Navbar