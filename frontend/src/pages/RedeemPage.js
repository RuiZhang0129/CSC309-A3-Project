import React, { useState } from 'react';
import './css/RedeemPage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
import { useNavigate } from 'react-router-dom';
//const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function RedeemPage() {
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRedeem = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage("⚠️ Please log in first");
      return;
    }

    try {
      //const res = await fetch("http://localhost:3001/users/me/transactions", {
        const res = await fetch(`${BACKEND_URL}/users/me/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          type: "redemption",
          amount: parseInt(amount),
          remark
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Redemption request submitted successfully! Transaction ID: ${data.id}`);
        setAmount('');
        setRemark('');
      } else {
        setMessage(`❌ Failed: ${data.error}`);
      }

    } catch (err) {
      console.error("Redeem error:", err);
      setMessage("❌ System error");
    }
  };

  return (
    <div className="redeem-container">
      <img src={bowImage} alt="bow" className="redeem-bow" />
      <h2 className="redeem-title">🎁 Points Redemption</h2>

      <div className="form-group">
        <label>Amount to Redeem:</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Remark (optional):</label>
        <input
          type="text"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          className="form-input"
        />
      </div>

      <button onClick={handleRedeem} className="form-button">✨ Submit Redemption Request</button>

      {message && <p className="form-message">{message}</p>}

      <button onClick={() => navigate('/content')} className="back-to-content-btn">
        🔙 Back to Menu
      </button>
    </div>
  );
}
