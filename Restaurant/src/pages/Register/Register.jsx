import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

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
                <h2>Register Restaurant</h2>
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
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="Enter email"
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
                        placeholder="Enter password"
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
                    <label htmlFor="address">Address</label>
                    <input
                        id="address"
                        name="address"
                        type="text"
                        value={form.address}
                        onChange={handleChange}
                        required
                        placeholder="Enter address"
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>
        </div>
    );
};

export default Register;
