import React from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css"; // import the CSS file

const features = [
    {
        title: "Menu Management",
        description: "Create, update, and organize your menu in minutes.",
        icon: (
            <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M5 6h14M5 12h14M5 18h8" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        title: "Order Tracking",
        description: "Track each order from placement to delivery in real-time.",
        icon: (
            <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        title: "QR Code Ordering",
        description: "Let guests scan and order instantly from their table.",
        icon: (
            <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
                <path d="M14 14h2v2h-2zM18 14h2v6h-6v-2" />
            </svg>
        ),
    },
    {
        title: "Reservation Control",
        description: "Handle bookings and table flow with clear service visibility.",
        icon: (
            <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="4" y="6" width="16" height="14" rx="2" />
                <path d="M8 4v4M16 4v4M4 10h16" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        title: "Payments & Billing",
        description: "Monitor transactions and billing performance with confidence.",
        icon: (
            <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="6" width="18" height="12" rx="2" />
                <path d="M3 10h18M7 14h4" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        title: "Delivery & Drivers",
        description: "Track driver assignments and order delivery progress in real time.",
        icon: (
            <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 7h11v8H3zM14 10h4l3 3v2h-2" />
                <circle cx="7" cy="17" r="2" />
                <circle cx="18" cy="17" r="2" />
            </svg>
        ),
    },
];

const steps = [
    {
        title: "Configure restaurant profile",
        description: "Set up branding, categories, and operating preferences once.",
    },
    {
        title: "Manage menu and orders",
        description: "Keep menu items updated and process active orders from one place.",
    },
    {
        title: "Optimize service daily",
        description: "Use reservation, payment, and delivery tools to improve operations.",
    },
];

const Landing = () => {
    return (
        <div className="landing-page">
            <header className="header">
                <div className="header-inner">
                    <Link to="/" className="brand">RestroMatrix</Link>
                    <nav className="nav">
                        <a href="#home">Home</a>
                        <a href="#features">Features</a>
                        <a href="#how-it-works">How it works</a>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </nav>
                    <div className="header-actions">
                        <Link to="/register" className="header-register">Register Restaurant</Link>
                        <Link to="/login" className="header-login">Restaurant Login</Link>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section id="home" className="hero">
                    <div className="hero-content">
                        <p className="badge">Restaurant SaaS Platform</p>
                        <h1>Manage Your Restaurant Smarter</h1>
                        <p>Streamline orders, control menus, enable QR table ordering, and track analytics from one professional dashboard.</p>
                        <div className="hero-buttons">
                            <Link to="/login" className="get-started">Get Started</Link>
                           
                        </div>
                    </div>

                    <div className="hero-stats-card">
                        <h3>Operations at a glance</h3>
                        <div className="hero-stats-grid">
                            <div>
                                <span>Menu updates</span>
                                <strong>Fast publishing</strong>
                            </div>
                            <div>
                                <span>Order flow</span>
                                <strong>Live tracking</strong>
                            </div>
                            <div>
                                <span>Walk-in support</span>
                                <strong>QR ready</strong>
                            </div>
                            <div>
                                <span>Restaurant control</span>
                                <strong>Secure login</strong>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="features">
                    <h2>Features built for restaurant operations</h2>
                    <p>Everything you need to run daily service with speed, visibility, and control.</p>
                    <div className="feature-grid">
                        {features.map(feature => (
                            <div key={feature.title} className="feature-card">
                                {feature.icon}
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="how-it-works" className="steps">
                    <h2>How RestroMatrix works</h2>
                    <p>Simple setup and a single workspace for your full restaurant operation.</p>
                    <div className="steps-grid">
                        {steps.map((step, index) => (
                            <div key={step.title} className="step-card">
                                <span className="step-badge">Step {index + 1}</span>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="cta">
                    <div>
                        <h2>Ready to run smarter service?</h2>
                        <p>Sign in and manage daily operations from your restaurant dashboard.</p>
                    </div>
                    <div className="cta-actions">
                        <Link to="/register">Register Restaurant</Link>
                        <Link to="/login" className="cta-login">Open Restaurant Panel</Link>
                    </div>
                </section>
            </main>

            <footer className="footer">
                <div className="footer-inner">
                    <h3>RestroMatrix</h3>
                    <p>Modern restaurant operations for menu, orders, reservations, and payments.</p>
                </div>
                <div className="footer-bottom">© {new Date().getFullYear()} RestroMatrix. All rights reserved.</div>
            </footer>
        </div>
    );
};

export default Landing;