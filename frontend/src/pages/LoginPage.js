import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./css/LoginPage.css";
import bowImage from "./image/bow.png"; //[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
//const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function LoginPage() {
  const [utorid, setUtorid] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      //const res = await fetch("http://localhost:3001/auth/tokens", {
      const res = await fetch(`${BACKEND_URL}/auth/tokens`, {

        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ utorid, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      const decoded = jwtDecode(data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", decoded.role); 
      navigate("/home-after-login");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <img src={bowImage} alt="bow" className="corner-bow" />
      <h1 className="login-title"> Hello Kitty Login </h1>
      <form onSubmit={handleLogin} className="login-form">
        <input
          type="text"
          placeholder="UTORid"
          value={utorid}
          onChange={(e) => setUtorid(e.target.value)}
          className="login-input"
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
        />
        <button type="submit" className="login-button">
          Login
        </button>
        {error && <p className="login-error">{error}</p>}

        <div className="extra-buttons">
          <button type="button" onClick={() => navigate("/")} className="back-btn"> Back to Home</button>
        </div>

      </form>
    </div>
  );
}
