import React, { useContext, useEffect, useRef, useState } from 'react'
import assets from "../../assets/assets";
import './Navbar.css'
import { Link, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("menu")
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)
  const { getTotalCartAmount, token, setToken } = useContext(StoreContext)

  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!profileOpen) return;
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setProfileOpen(false);
    navigate("/")


  }
  return (
    <div className='navbar'>
      <Link to='/'> <img src={assets.logo} alt="" className="logo" /> </Link>
      <ul className="navbar-menu">
        <Link to='/' onClick={() => setMenu("home")} className={menu === "home" ? "active" : ""}>Home</Link>
        <Link to='/menu' onClick={() => setMenu("menu")} className={menu === "menu" ? "active" : ""}>Menu</Link>
        <Link to='/reservation' onClick={() => setMenu("reservation")} className={menu === "reservation" ? "active" : ""}>Reservation</Link>
        <Link to='/contact' onClick={() => setMenu("contact-us")} className={menu === "contact-us" ? "active" : ""}>Contact us</Link>

      </ul>

      <div className='navbar-right'>
        <img src={assets.searchIcon} alt="" />
        <div className='navbar-search-icon'>
          <Link to='/cart'><img src={assets.basketIcon} alt="" /></Link>
          <div className={getTotalCartAmount() === 0 ? "" : "dot"}></div>
        </div>
        {!token ? <button onClick={() => setShowLogin(true)}>sign in</button>
          :
          <div className='navbar-profile' ref={profileRef}>
            <button
              type="button"
              className="navbar-profile-button"
              onClick={() => setProfileOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={profileOpen}
            >
              <img src={assets.addIcon} alt="Open profile menu" />
            </button>
            <ul className={`nav-profile-dropdown ${profileOpen ? "open" : ""}`}>
              <li onClick={() => {
                setProfileOpen(false);
                navigate('/myorders');
              }}><img src={assets.addIcon} alt="" /><p>Orders</p></li>
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

