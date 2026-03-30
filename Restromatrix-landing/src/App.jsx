// App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/LandingPage/LandingPage";
import Login from "../../Restaurant/src/pages/Login/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login/>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;