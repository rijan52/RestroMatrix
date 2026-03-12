import React, { useState } from 'react'
import './LoginPopup.css'
import assets from '../../assets/assets'
import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios'



const LoginPopup = ({ setShowLogin }) => {

  const navigate = useNavigate()
  const { url, setToken, setRole } = useContext(StoreContext)
  const [currState, setCurrState] = useState("Login")
  const [data, setData] = useState({
    name: "",
    email: "",
    password: ""
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
    let newUrl = url;
    if (currState === "Login") {
      newUrl += "/api/customer/login"
    }
    else {
      newUrl += "/api/customer/register"
    }

    const response = await axios.post(newUrl, data);
    if (response.data.success) {
      setToken(response.data.token);
      localStorage.setItem("token", response.data.token)

      // Save role
      const userRole = response.data.role || "customer";
      setRole(userRole);
      localStorage.setItem("role", userRole)

      setShowLogin(false);

      // Redirect driver to driver dashboard
      if (userRole === "driver") {
        navigate("/driver-dashboard");
      }
    }
    else {
      alert(response.data.message)
    }
  }


  return (
    <div className='login-popup'>
      <form onSubmit={onLogin} action="" className="login-popup-container">
        <div className='login-popup-title'>
          <h2>{currState}</h2>
          <img onClick={() => setShowLogin(false)} src={assets.crossIcon} alt="" />
        </div>
        <div className="login-popup-inputs">
          {currState === "Login" ? <></> : <input name='name' onChange={onChangeHandler} value={data.name} type="text" placeholder='Your name' required />}
          <input name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Your email' required />
          <input name='password' onChange={onChangeHandler} value={data.password} type="password" placeholder='Password' required />
        </div>
        <button type='submit'>{currState === "Sign Up" ? "Create account" : "Login"}</button>
        <div className="login-popup-condition">
          <input type="checkbox" required />
          <p>
            By continuing, i agree to the terms of use and privacy policy
          </p>
        </div>
        {currState === "Login"
          ?
          <p>Create a new account? <span onClick={() => setCurrState("Sign Up")}>Click here</span></p>
          : <p>Already have an account? <span onClick={() => setCurrState("Login")}>Login here</span></p>
        }


      </form>
    </div>
  )
}

export default LoginPopup