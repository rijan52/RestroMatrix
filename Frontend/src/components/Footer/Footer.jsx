import React, { useContext } from 'react'
import './Footer.css'
import assets from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext'
const Footer = () => {
    const year = new Date().getFullYear()
    const { restaurantLogo, restaurantContact } = useContext(StoreContext)
    const contactPhone = restaurantContact?.phoneNumber || ""
    const contactEmail = restaurantContact?.email || ""

    return (
        <footer className='footer' id='footer'>
            <div className='footer-content'>
                <div className='footer-content-left'>
                    <img
                        src={restaurantLogo || assets.logo}
                        alt="Restaurant logo"
                        className='footer-logo'
                        onError={(e) => {
                            e.currentTarget.src = assets.logo;
                        }}
                    />
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
                        <li>
                            {contactPhone ? (
                                <a href={`tel:${contactPhone.replace(/\s+/g, "")}`}>{contactPhone}</a>
                            ) : (
                                <span>Phone not available</span>
                            )}
                        </li>
                        <li>
                            {contactEmail ? (
                                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                            ) : (
                                <span>Email not available</span>
                            )}
                        </li>
                    </ul>

                </div>
            </div>
            <hr />
            <div className='footer-bottom-brand'>
                <img
                    src={restaurantLogo || assets.logo}
                    alt="Restaurant logo"
                    className='footer-logo footer-logo-small'
                    onError={(e) => {
                        e.currentTarget.src = assets.logo;
                    }}
                />
            </div>
            <p className='footer-copyright'>Copyright {year} © restromatrix.com - All rights reserved.</p>
        </footer>
    )
}

export default Footer