import React, { useState } from 'react'
import './LoginPopup.css'
import assets from '../../assets/assets'
import { useContext } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios'



const LoginPopup = ({ setShowLogin, isPageMode = false }) => {

  const navigate = useNavigate()
  const location = useLocation()
  const { url, setToken, setRole } = useContext(StoreContext)
  const { restaurantId } = useParams();
  const [currState, setCurrState] = useState("Login")
  const [data, setData] = useState({
    name: "",
    email: "",
    password: ""
  })
  const [passwordError, setPasswordError] = useState("")
  const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/


  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data => ({
      ...data,
      [name]: value
    }))
    if (name === 'password') {
      setPasswordError('')
    }
  }


  const onLogin = async (event) => {
    event.preventDefault()

    if (!strongPasswordPattern.test(data.password)) {
      setPasswordError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.')
      return
    }

    let newUrl = url;
    newUrl += currState === "Login"
      ? `/api/customer/${restaurantId}/login`
      : `/api/customer/${restaurantId}/register`;

    const response = await axios.post(newUrl, data);
    if (response.data.success) {
      setToken(response.data.token);
      sessionStorage.setItem("token", response.data.token);

      // Save role
      const userRole = response.data.role || "customer";
      setRole(userRole);
      sessionStorage.setItem("role", userRole);

      // Redirect driver to driver dashboard
      if (userRole === "driver") {
        navigate("/driver-dashboard");
        return;
      }

      const redirectTo = location.state?.redirectTo || localStorage.getItem('postLoginRedirect')
      if (redirectTo) {
        localStorage.removeItem('postLoginRedirect')
        navigate(redirectTo)
        if (setShowLogin) {
          setShowLogin(false)
        }
        return
      }

      if (isPageMode) {
        navigate('/')
      } else if (setShowLogin) {
        setShowLogin(false)
      }
    }
    else {
      alert(response.data.message)
    }
  }


  if (!restaurantId) {
    return (
      <div className='login-popup'>
        <div className="login-popup-container">
          <div className='login-popup-title'>
            <h2>Restaurant Not Selected</h2>
            <img
              onClick={() => {
                if (isPageMode) {
                  navigate('/')
                  return
                }
                if (setShowLogin) {
                  setShowLogin(false)
                }
              }}
              src={assets.crossIcon}
              alt=""
            />
          </div>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p>No restaurant selected. Please use a restaurant link (e.g. <code>/restaurant/&lt;restaurantId&gt;/menu</code>).</p>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className='login-popup'>
      <form onSubmit={onLogin} action="" className="login-popup-container">
        <div className='login-popup-title'>
          <h2>{currState}</h2>
          <img
            onClick={() => {
              if (isPageMode) {
                navigate('/')
                return
              }
              if (setShowLogin) {
                setShowLogin(false)
              }
            }}
            src={assets.crossIcon}
            alt=""
          />
        </div>
        <div className="login-popup-inputs">
          {currState === "Login" ? <></> : <input name='name' onChange={onChangeHandler} value={data.name} type="text" placeholder='Your name' required />}
          <input name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Your email' required />
          <input
            name='password'
            onChange={onChangeHandler}
            value={data.password}
            type="password"
            placeholder='Password'
            required
            minLength={8}
            pattern='(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}'
            title='Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
          />
          <p className='password-hint'>Use 8+ chars with uppercase, lowercase, number, and special character.</p>
          {passwordError && <p className='password-error'>{passwordError}</p>}
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