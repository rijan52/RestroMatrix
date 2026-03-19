import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { DriverContext } from "../../context/DriverContext";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login, url } = useContext(DriverContext);

  const [data, setData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onChangeHandler = (event) => {
    const { name, value } = event.target;

    setData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const onLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${url}/api/driver/login`, data);

      if (response.data.success) {
        const userRole = response.data.role || "customer";

        if (userRole === "driver") {
          login(response.data.token, userRole);
          navigate("/dashboard");
        } else {
          setError("Only drivers can access this application");
        }
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    }

    setLoading(false);
  };

  return (
    <div className="driver-login-container">
      <div className="driver-login-box">
        <h1 className="driver-login-title">RestroMatrix Driver</h1>
        <p className="driver-login-subtitle">Delivery Partner Login</p>

        <form onSubmit={onLogin} className="driver-login-form">
          {error && <div className="driver-error-message">{error}</div>}

          <div className="form-group">
            <input
              name="email"
              type="email"
              placeholder="your-email@example.com"
              value={data.email}
              onChange={onChangeHandler}
              required
            />
          </div>

          <div className="form-group">
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={data.password}
              onChange={onChangeHandler}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="driver-login-btn"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="driver-login-info">
          <p>For driver access, please contact the restaurant management.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;