// App.jsx
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/LandingPage/LandingPage";
import Register from "../../Restaurant/src/pages/Register/Register";

const RESTAURANT_LOGIN_URL = "http://localhost:5174/login";

function LoginRedirect() {
  useEffect(() => {
    window.location.replace(RESTAURANT_LOGIN_URL);
  }, []);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginRedirect />} />
        <Route path="/Register" element={<Register url="http://localhost:4000" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;