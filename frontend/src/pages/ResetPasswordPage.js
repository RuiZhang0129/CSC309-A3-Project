import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import './css/ResetPasswordPage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
//const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function ResetPasswordPage() {
  const { resetToken } = useParams();  // Read resetToken from URL
  const [utorid, setUtorid] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      //const res = await fetch(`http://localhost:3001/auth/resets/${resetToken}`, {
        const res = await fetch(`${BACKEND_URL}/auth/resets/${resetToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utorid, password })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Activation failed");

      alert("Password set successfully! You can now log in!");
      navigate("/login");
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="reset-container">
      <img src={bowImage} alt="bow" className="reset-bow" />
      <h2 className="reset-title"> Set Password to Activate Account</h2>

      <form className="reset-form" onSubmit={handleReset}>
        <input
          placeholder="Enter your utorid"
          value={utorid}
          onChange={(e) => setUtorid(e.target.value)}
        />
        <input
          type="password"
          placeholder="Set a new password (include upper/lowercase, numbers, and special characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="btn-primary">Set Password and Activate</button>
        {message && <p className="form-message"> {message}</p>}
      </form>

      <button onClick={() => navigate('/content')} className="back-to-content-btn">
         Back to Menu
      </button>
    </div>
  );
}
