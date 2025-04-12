import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./css/RegisterPage.css";
import bowImage from "./image/bow.png"; //[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
//const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function RegisterPage() {
  const [utorid, setUtorid] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('regular');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validate = () => {
    if (!/^[a-zA-Z0-9]{8}$/.test(utorid)) {
      return "utorid must be 8 letters or digits";
    }
    if (name.length < 1 || name.length > 50) {
      return "Name must be between 1 and 50 characters";
    }
    if (!email.endsWith('@mail.utoronto.ca')) {
      return "Must register with a University of Toronto email";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not logged in, unable to register a new user!");
      return;
    }

    try {
      //const res = await fetch('http://localhost:3001/users', {
        const res = await fetch(`${BACKEND_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`  // Add this line
        },
        body: JSON.stringify({ utorid, name, email, role })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      navigate(`/reset-password/${data.resetToken}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="register-container">
      <img src={bowImage} alt="bow" className="corner-bow" />
      <h2 className="register-title"> User Registration </h2>
      <form onSubmit={handleSubmit} className="register-form">
        <input
          placeholder="UTORid"
          value={utorid}
          onChange={(e) => setUtorid(e.target.value)}
          className="register-input"
        />
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="register-input"
        />
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="register-input"
        />
        <input
          type="password"
          placeholder="Password will be set upon activation"
          value={password}
          disabled
          className="register-input"
        />
        <label className="register-label">Role:</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="register-select"
        >
          <option value="regular">Regular</option>
          <option value="cashier">Cashier</option>
          <option value="manager">Manager</option>
        </select>

        <button type="submit" className="register-button">
          Register
        </button>

        {error && <p className="register-error">{error}</p>}

        <div className="extra-buttons">
          <button type="button" onClick={() => navigate('/')} className="back-btn"> Back to Home</button>
          <button type="button" onClick={() => navigate('/login')} className="back-btn"> Go to Login</button>
        </div>
      </form>
    </div>
  );
}
