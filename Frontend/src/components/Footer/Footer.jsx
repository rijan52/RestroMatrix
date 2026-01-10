import React from 'react'
import'./Footer.css'
import assets from '../../assets/assets'
const Footer = () => {
  return (
    <div className='footer' id='footer'>
        <div className='footer-content'>
            <div className='footer-content-left'>
            <img src={assets.logo} alt="" />
            <p>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Laudantium nihil iusto, maiores ducimus assumenda, quaerat earum recusandae iste consequuntur, et voluptatum laborum doloribus? Possimus earum, nisi repellat inventore necessitatibus illum?</p>
            <div className="footer-social-icon">
                <img src={assets.facebookIcon} alt=''/>
                <img src={assets.twitterIcon} alt=''/>
                <img src={assets.whatsappIcon} alt=''/>
            </div>
            </div>
            <div className="footer-content-center">
                <h2>COMPANY</h2>
                <ul>
                    <li>Home</li>
                    <li>About us</li>
                    <li>Delivery</li>
                    <li>Privacy policy</li>
                </ul>
            </div>
            <div className="footer-content-right">
                <h2>GET IN TOUCH</h2>
                <ul>
                    <li>+977 9834450676</li>
                    <li>contact@restromatrix.com</li>
                </ul>

            </div>
            </div>
            <hr />
            <p className='footer-copyright'>Copyright 2025 @ restromatrix.com - All Right Reserved.</p>
            </div>
  )
}

export default Footer