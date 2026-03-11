import React, { useState, useContext } from 'react'
import './DriverLogin.css'
import { useNavigate } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios'

const DriverLogin = () => {
    const navigate = useNavigate()
    const { url, setToken } = useContext(StoreContext)
    const [currState, setCurrState] = useState("Login")
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState({
        name: "",
        email: "",
        password: "",
        driverPhone: "",
        driverVehicle: ""
    })

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData(data => ({
            ...data,
            [name]: value
        }))
    }

    const onLogin = async (event) => {
        event.preventDefault()
        setLoading(true)
        
        try {
            let newUrl = url;
            let loginData = { email: data.email, password: data.password }
            
            if (currState === "Login") {
                newUrl += "/api/user/login"
            }
            else {
                newUrl += "/api/user/register"
                loginData = {
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    role: "driver",
                    driverPhone: data.driverPhone,
                    driverVehicle: data.driverVehicle
                }
            }

            const response = await axios.post(newUrl, loginData);
            
            if (response.data.success) {
                // Check if user is a driver
                if (response.data.role === "driver" || currState === "Sign Up") {
                    setToken(response.data.token);
                    localStorage.setItem("token", response.data.token)
                    localStorage.setItem("role", "driver")
                    localStorage.setItem("driverName", response.data.data?.name || data.name)
                    
                    // Redirect to driver dashboard
                    navigate('/driver-dashboard')
                } else {
                    alert("This account is not registered as a driver. Please use customer login.")
                    setCurrState("Login")
                }
            }
            else {
                alert(response.data.message)
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Login failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='driver-login-container'>
            <div className="driver-login-wrapper">
                <form onSubmit={onLogin} className="driver-login-form">
                    <div className='login-header'>
                        <h1>🚗 Driver Portal</h1>
                        <p>Efficient Delivery Management</p>
                    </div>

                    <div className='login-title'>
                        <h2>{currState === "Login" ? "Driver Login" : "Become a Driver"}</h2>
                    </div>

                    <div className="login-inputs">
                        {currState === "Sign Up" && (
                            <>
                                <input 
                                    name='name' 
                                    onChange={onChangeHandler} 
                                    value={data.name} 
                                    type="text" 
                                    placeholder='Your Full Name' 
                                    required 
                                />
                                <input 
                                    name='driverPhone' 
                                    onChange={onChangeHandler} 
                                    value={data.driverPhone} 
                                    type="tel" 
                                    placeholder='Phone Number' 
                                    required 
                                />
                                <input 
                                    name='driverVehicle' 
                                    onChange={onChangeHandler} 
                                    value={data.driverVehicle} 
                                    type="text" 
                                    placeholder='Vehicle Number (e.g., BA-23-PA-1234)' 
                                    required 
                                />
                            </>
                        )}
                        
                        <input 
                            name='email' 
                            onChange={onChangeHandler} 
                            value={data.email} 
                            type="email" 
                            placeholder='Email Address' 
                            required 
                        />
                        
                        <input 
                            name='password' 
                            onChange={onChangeHandler} 
                            value={data.password} 
                            type="password" 
                            placeholder='Password' 
                            required 
                        />
                    </div>

                    <button type='submit' disabled={loading} className="login-btn">
                        {loading ? 'Processing...' : (currState === "Sign Up" ? "Create Driver Account" : "Driver Login")}
                    </button>

                    <div className="terms">
                        <input type="checkbox" required />
                        <p>
                            I agree to the terms and conditions of the driver agreement
                        </p>
                    </div>

                    <div className="toggle-state">
                        {currState === "Login"
                            ? <p>New driver? <span onClick={() => {
                                setCurrState("Sign Up")
                                setData({ name: "", email: "", password: "", driverPhone: "", driverVehicle: "" })
                            }}>Register here</span></p>
                            : <p>Already registered? <span onClick={() => {
                                setCurrState("Login")
                                setData({ name: "", email: "", password: "", driverPhone: "", driverVehicle: "" })
                            }}>Login here</span></p>
                        }
                    </div>

                    <div className="customer-login-link">
                        <p>Are you a customer? <a href="/">Go to Customer Login</a></p>
                    </div>
                </form>

                <div className="driver-login-info">
                    <h3>🚗 Why Become a Driver?</h3>
                    <ul>
                        <li>✓ Flexible Working Hours</li>
                        <li>✓ Competitive Earnings</li>
                        <li>✓ Real-time Order Tracking</li>
                        <li>✓ GPS Navigation Support</li>
                        <li>✓ Customer Ratings & Reviews</li>
                        <li>✓ Weekly Payouts</li>
                    </ul>

                    <h3>📱 How It Works</h3>
                    <ol>
                        <li>Register your account with vehicle details</li>
                        <li>Go online whenever you're available</li>
                        <li>Accept delivery orders from your area</li>
                        <li>Use GPS tracking to navigate to customers</li>
                        <li>Deliver food and mark as complete</li>
                        <li>Get paid for each delivery</li>
                    </ol>
                </div>
            </div>
        </div>
    )
}

export default DriverLogin
