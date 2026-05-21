import React, { useContext, useState, useEffect } from 'react'
import { StoreContext } from '../../context/StoreContext'
import { useNavigate, useParams } from 'react-router-dom'
import './Header.css'

const Header = () => {
  const { headerSettings } = useContext(StoreContext)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [showScrollIndicator, setShowScrollIndicator] = useState(true)
  const navigate = useNavigate()
  const { restaurantId } = useParams()

  useEffect(() => {
    // Hide scroll indicator after user scrolls
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollIndicator(false)
      } else {
        setShowScrollIndicator(true)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    })
  }

  const handleViewMenu = () => {
    if (restaurantId) {
      navigate(`/restaurant/${restaurantId}/menu`)
      return
    }

    navigate('/order')
  }

  return (
    <div className='header' style={{ backgroundImage: `url(${headerSettings.backgroundImage})` }}>
      {/* Loading indicator */}
      {!imageLoaded && (
        <div className="header-loading"></div>
      )}

      {/* Background image preload */}
      <img
        src={headerSettings.backgroundImage}
        style={{ display: 'none' }}
        onLoad={() => setImageLoaded(true)}
        alt=""
      />

      <div className='header-content'>
        <h2>{headerSettings.title}</h2>
        <p>{headerSettings.content}</p>
        <button type="button" onClick={handleViewMenu}>
          {headerSettings.buttonText}
        </button>
      </div>

      {/* Scroll Indicator */}
      {showScrollIndicator && (
        <div className="scroll-indicator" onClick={handleScrollDown}>
          <span></span>
          <p>Scroll Down</p>
        </div>
      )}

      {/* Decorative Wave */}
      <div className="header-wave">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            fill="var(--background, #F8FAFC)"
            opacity="0.9"
          />
        </svg>
      </div>
    </div>
  )
}

export default Header