import React, { useContext, useEffect, useRef, useState } from 'react'
import assets from "../../assets/assets";
import './Navbar.css'
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
const Navbar = ({ setShowLogin }) => {
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)
  const { getTotalCartAmount, token, setToken, restaurantLogo } = useContext(StoreContext)

  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

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
      <Link to='/'> <img src={restaurantLogo} alt="Restaurant logo" className="logo" /> </Link>
      <ul className="navbar-menu">
        <Link to='/' className={isActive('/') ? 'active' : ''}>Home</Link>
        <Link to='/menu' className={isActive('/menu') ? 'active' : ''}>Menu</Link>
        <Link to='/reservation' className={isActive('/reservation') ? 'active' : ''}>Reservation</Link>
        <Link to='/contact' className={isActive('/contact') ? 'active' : ''}>Contact us</Link>

      </ul>

      <div className='navbar-right'>
        <img src={assets.searchIcon} alt="" />
        <div className='navbar-search-icon'>
          <Link to='/cart'><img src={assets.basketIcon} alt="" /></Link>
          <div className={getTotalCartAmount() === 0 ? "" : "dot"}></div>
        </div>
        {!token ? (
          <button onClick={() => setShowLogin(true)} className='sign-in-btn'>sign in</button>
        )
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

