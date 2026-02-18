import React, { useContext, useState } from 'react'
import assets from "../../assets/assets";
import './Navbar.css'
import { Link, useNavigate } from 'react-router';
import { StoreContext } from '../../context/StoreContext';
const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("menu")
  const { getTotalCartAmount, token, setToken } = useContext(StoreContext)

  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    navigate("/")


  }
  return (
    <div className='navbar'>
      <Link to='/'> <img src={assets.logo} alt="" className="logo" /> </Link>
      <ul className="navbar-menu">
        <Link to='/' onClick={() => setMenu("home")} className={menu === "home" ? "active" : ""}>Home</Link>
        <a href="#explore-menu" onClick={() => setMenu("menu")} className={menu === "menu" ? "active" : ""}>Menu</a>
        <a href="Reservation" onClick={() => setMenu("reservation")} className={menu === "reservation" ? "active" : ""}>Reservation</a>
        <a href="#footer" onClick={() => setMenu("contact-us")} className={menu === "contact-us" ? "active" : ""}>Contact us</a>

      </ul>

      <div className='navbar-right'>
        <img src={assets.searchIcon} alt="" />
        <div className='navbar-search-icon'>
          <Link to='/cart'><img src={assets.basketIcon} alt="" /></Link>
          <div className={getTotalCartAmount() === 0 ? "" : "dot"}></div>
        </div>
        {!token ? <button onClick={() => setShowLogin(true)}>sign in</button>
          :
          <div className='navbar-profile'>
            <img src={assets.addIcon} alt="" />
            <ul className="nav-profile-dropdown">
              <li onClick={()=>navigate('/myorders')}><img src={assets.addIcon} alt="" /><p>Orders</p></li>
              <hr />
              <li onClick={logout}><img src={assets.removeIcon} alt="" /><p>Logout</p></li>
            </ul>

          </div>}
        {/* <button onClick={() => setShowLogin(true)}>sign in
        </button> */}


      </div>

    </div>
  )
}

export default Navbar

