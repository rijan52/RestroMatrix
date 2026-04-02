// App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/LandingPage/LandingPage";
import Login from "../../Restaurant/src/pages/Login/Login";
import Register from "../../Restaurant/src/pages/Register/Register";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login url="http://localhost:4000" />} />
        <Route path="/Register" element={<Register url="http://localhost:4000" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;