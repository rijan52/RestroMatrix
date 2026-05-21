import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Register.css';

const Register = ({ url }) => {
    const [form, setForm] = useState({
        restaurantName: '',
        email: '',
        password: '',
        phoneNumber: '',
        address: '',
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(`${url}/api/restaurant-profile/register`, form);
            if (response.data.success) {
                toast.success('Registration successful! Please login.');
                navigate('/login');
            } else {
                toast.error(response.data.message || 'Registration failed');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <form className="register-form" onSubmit={handleSubmit} autoComplete="off">
                <h2>Create Your Restaurant Account</h2>
                
                <div className="form-container">
                    {/* Left Column - Form Fields */}
                    <div className="form-left">
                        <div className="form-group">
                            <label htmlFor="restaurantName">Restaurant Name</label>
                            <input
                                id="restaurantName"
                                name="restaurantName"
                                type="text"
                                value={form.restaurantName}
                                onChange={handleChange}
                                required
                                placeholder="Enter restaurant name"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                placeholder="Enter email address"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                placeholder="Create a strong password"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="phoneNumber">Phone Number</label>
                            <input
                                id="phoneNumber"
                                name="phoneNumber"
                                type="text"
                                value={form.phoneNumber}
                                onChange={handleChange}
                                required
                                placeholder="Enter phone number"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="address">Restaurant Address</label>
                            <input
                                id="address"
                                name="address"
                                type="text"
                                value={form.address}
                                onChange={handleChange}
                                required
                                placeholder="Enter complete address"
                            />
                        </div>
                    </div>
                    
                    {/* Right Column - Benefits Section */}
                    <div className="form-right">
                        <div className="benefits-header">
                            <h3>Why join RestroMatrix?</h3>
                            <p>Everything you need to run your restaurant efficiently</p>
                        </div>
                        
                        <div className="benefits-list">
                            <div className="benefit-item">
                                <div className="benefit-content">
                                    <h4>Complete Restaurant Management</h4>
                                    <p>Manage menu, orders, reservations, and staff from one dashboard</p>
                                </div>
                            </div>
                            
                            <div className="benefit-item">
                                <div className="benefit-content">
                                    <h4>QR Code Ordering</h4>
                                    <p>Allow customers to scan and order directly from their tables</p>
                                </div>
                            </div>
                            
                            <div className="benefit-item">
                                <div className="benefit-content">
                                    <h4>Integrated Payments</h4>
                                    <p>Accept payments online and track all transactions securely</p>
                                </div>
                            </div>
                            
                            <div className="benefit-item">
                                <div className="benefit-content">
                                    <h4>Real-time Analytics</h4>
                                    <p>Make data-driven decisions with detailed insights and reports</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="stats-card">
                            <div className="stats-number">5000+</div>
                            <div className="stats-label">Restaurants Trust Us</div>
                        </div>
                    </div>
                </div>
                
                <div className="submit-container">
                    <button type="submit" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Restaurant Account'}
                    </button>
                    
                    <div className="login-link">
                        <p>Already have an account? <a href="/login">Sign in here</a></p>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Register;