import React, { useState, useEffect } from 'react'
import './Home.css'
import Header from '../../components/Header/Header'
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'
import { useParams } from 'react-router-dom'

const Home = () => {
  const [category, setCategory] = useState("All");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { restaurantId } = useParams();

  // Handle scroll events for back to top button and progress bar
  useEffect(() => {
    const handleScroll = () => {
      // Back to top button visibility
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }

      // Scroll progress
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="home">
      
      <Header />
      
      {/* About Restaurant Section - NEW */}
      <section className="about-restaurant-section">
        <div className="about-container">
          <div className="about-content">
            <h2 className="about-title">Welcome to Our Restaurant</h2>
            <p className="about-description">
              We take pride in serving delicious, freshly prepared meals made with 
              the finest ingredients. Our chefs bring culinary expertise to every dish, 
              ensuring an unforgettable dining experience for you and your loved ones.
            </p>
            <div className="about-features">
              <div className="about-feature">
                <div>
                  <h4>Fresh Ingredients</h4>
                  <p>Locally sourced, quality assured</p>
                </div>
              </div>
              <div className="about-feature">
                <div>
                  <h4>Expert Chefs</h4>
                  <p>Passionate about culinary excellence</p>
                </div>
              </div>
              <div className="about-feature">
                <div>
                  <h4>Award Winning</h4>
                  <p>Recognized for outstanding service</p>
                </div>
              </div>
              <div className="about-feature">
                <div>
                  <h4>Fast Delivery</h4>
                  <p>Hot & fresh at your doorstep</p>
                </div>
              </div>
            </div>
            <button className="about-btn">Learn More About Us</button>
          </div>
          <div className="about-image">
            <div className="about-image-grid">
              <img 
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop" 
                alt="Restaurant interior" 
                className="about-img-main"
              />
              <img 
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop" 
                alt="Delicious food" 
                className="about-img-small about-img-1"
              />
              <img 
                src="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=300&fit=crop" 
                alt="Chef cooking" 
                className="about-img-small about-img-2"
              />
            </div>
          </div>
        </div>
      </section>

      <ExploreMenu 
        category={category} 
        setCategory={setCategory} 
        restaurantId={restaurantId} 
      />
      
      <FoodDisplay 
        category={category} 
        restaurantId={restaurantId} 
      />

      {/* Social Proof Section */}
      <section className="social-proof-section">
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-number">500+</span>
            <span className="stat-label">Happy Customers</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">50+</span>
            <span className="stat-label">Dish Varieties</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">30min</span>
            <span className="stat-label">Fast Delivery</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Customer Support</span>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="newsletter-container">
          <h3>Subscribe to Our Newsletter</h3>
          <p>Get updates about new dishes and exclusive offers</p>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Enter your email address" />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </section>

      {/* Back to Top Button */}
      <button 
        className={`back-to-top ${showBackToTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </div>
  )
}

export default Home