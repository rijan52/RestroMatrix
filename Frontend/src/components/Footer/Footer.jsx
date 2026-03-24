import React, { useContext } from 'react'
import './Footer.css'
import assets from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext'
const Footer = () => {
    const year = new Date().getFullYear()
    const { restaurantLogo } = useContext(StoreContext)

    return (
        <footer className='footer' id='footer'>
            <div className='footer-content'>
                <div className='footer-content-left'>
                    <img src={restaurantLogo} alt="Restaurant logo" className='footer-logo' />
                    <p>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Laudantium nihil iusto, maiores ducimus assumenda, quaerat earum recusandae iste consequuntur, et voluptatum laborum doloribus? Possimus earum, nisi repellat inventore necessitatibus illum?</p>
                    <div className="footer-social-icon">
                        <a href="#" aria-label="Facebook">
                            <img src={assets.facebookIcon} alt='Facebook' />
                        </a>
                        <a href="#" aria-label="X (Twitter)">
                            <img src={assets.twitterIcon} alt='X (Twitter)' />
                        </a>
                        <a href="#" aria-label="WhatsApp">
                            <img src={assets.whatsappIcon} alt='WhatsApp' />
                        </a>
                    </div>
                </div>
                <div className="footer-content-center">
                    <h2>COMPANY</h2>
                    <ul>
                        <li><a href="#">Home</a></li>
                        <li><a href="#">About us</a></li>
                        <li><a href="#">Delivery</a></li>
                        <li><a href="#">Privacy policy</a></li>
                    </ul>
                </div>
                <div className="footer-content-right">
                    <h2>GET IN TOUCH</h2>
                    <ul>
                        <li><a href="tel:+9779834450676">+977 9834450676</a></li>
                        <li><a href="mailto:contact@restromatrix.com">contact@restromatrix.com</a></li>
                    </ul>

                </div>
            </div>
            <hr />
            <p className='footer-copyright'>Copyright {year} © restromatrix.com — All rights reserved.</p>
        </footer>
    )
}

export default Footer