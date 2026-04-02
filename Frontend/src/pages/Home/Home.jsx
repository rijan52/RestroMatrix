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
      {/* Scroll Progress Bar */}
      <div 
        className="scroll-progress" 
        style={{ width: `${scrollProgress}%` }}
      />

      <Header />
      <ExploreMenu 
        category={category} 
        setCategory={setCategory} 
        restaurantId={restaurantId} 
      />
      <FoodDisplay 
        category={category} 
        restaurantId={restaurantId} 
      />

      {/* Social Proof Section - Added for professional look */}
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

      {/* Newsletter Section - Added for professional look */}
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