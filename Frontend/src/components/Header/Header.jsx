import React, { useContext } from 'react'
import { StoreContext } from '../../context/StoreContext'
import './Header.css'
const Header = () => {
  const { headerSettings } = useContext(StoreContext)

  return (
    <div className='header' style={{ backgroundImage: `url(${headerSettings.backgroundImage})` }}>
      <div className='header-content'>
        <h2>{headerSettings.title}</h2>
        <p>{headerSettings.content}</p>
        <button>
          {headerSettings.buttonText}
        </button>
      </div>



    </div>
  )
}

export default Header