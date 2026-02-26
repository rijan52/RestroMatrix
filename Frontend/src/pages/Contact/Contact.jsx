import React from "react";
import "./Contact.css";

const Contact = () => {
  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="contact-hero-text">
          <p className="contact-kicker">CONTACT RESTROMATRIX</p>
          <h1>Let's plan your next meal together.</h1>
          <p className="contact-subtitle">
            Questions, feedback, or a private event in mind? Our team responds
            within one business day.
          </p>
          <div className="contact-hero-actions">
            <button className="contact-primary">Send a message</button>
            <button className="contact-ghost">Call us now</button>
          </div>
        </div>
        <div className="contact-hero-card">
          <div>
            <h3>Today at RestroMatrix</h3>
            <p>Open 10:00 AM - 10:30 PM</p>
          </div>
          <div>
            <h4>Quick Reach</h4>
            <p>+977 9834450676</p>
            <p>contact@restromatrix.com</p>
          </div>
        </div>
      </section>

      <section className="contact-grid">
        <div className="contact-info">
          <h2>Visit or reserve a table</h2>
          <p>
            We are located in the heart of the city with valet parking, a cozy
            lounge, and chef-led tasting menus every weekend.
          </p>
          <div className="contact-cards">
            <div className="contact-card">
              <h4>Address</h4>
              <p>Thamel Road, Kathmandu, Nepal</p>
            </div>
            <div className="contact-card">
              <h4>Reservations</h4>
              <p>Group bookings and celebrations</p>
              <p>+977 9812345678</p>
            </div>
            <div className="contact-card">
              <h4>Support</h4>
              <p>Delivery support and feedback</p>
              <p>support@restromatrix.com</p>
            </div>
          </div>
        </div>

        <form className="contact-form">
          <h3>Send us a note</h3>
          <div className="contact-field">
            <label htmlFor="contact-name">Full name</label>
            <input id="contact-name" type="text" placeholder="Enter your name" />
          </div>
          <div className="contact-field">
            <label htmlFor="contact-email">Email address</label>
            <input
              id="contact-email"
              type="email"
              placeholder="Enter your email"
            />
          </div>
          <div className="contact-field">
            <label htmlFor="contact-topic">Topic</label>
            <select id="contact-topic" defaultValue="reservation">
              <option value="reservation">Reservation</option>
              <option value="feedback">Feedback</option>
              <option value="events">Private events</option>
              <option value="support">Support</option>
            </select>
          </div>
          <div className="contact-field">
            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              rows="5"
              placeholder="Tell us how we can help"
            ></textarea>
          </div>
          <button type="submit" className="contact-primary">
            Submit message
          </button>
        </form>
      </section>

      <section className="contact-map">
        <div>
          <h3>Find us quickly</h3>
          <p>
            Landmark: Opposite City Mall, 2 minutes from the main taxi stand.
          </p>
        </div>
        <div className="contact-map-frame">
          <iframe
            title="RestroMatrix location"
            src="https://www.google.com/maps?q=Thamel%20Road%2C%20Kathmandu%2C%20Nepal&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          ></iframe>
        </div>
      </section>
    </div>
  );
};

export default Contact;
