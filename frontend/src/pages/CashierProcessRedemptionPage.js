import React, { useState } from 'react';
import './css/CashierProcessRedemptionPage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
import { useNavigate } from 'react-router-dom';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function CashierProcessRedemptionPage() {
  const [transactionId, setTransactionId] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleProcess = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('⚠️ Please log in first');
      return;
    }

    if (!transactionId) {
      setMessage('Please enter transaction ID');
      return;
    }

    try {
      //const res = await fetch(`http://localhost:3001/transactions/${transactionId}/processed`, {
        const res = await fetch(`${BACKEND_URL}/transactions/${transactionId}/processed`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ processed: true })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Successfully processed redemption request, transaction ID: ${data.id}`);
        setTransactionId('');
      } else {
        setMessage(`❌ Processing failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ Network error');
    }
  };

  return (
    <div className="redeem-container">
      <img src={bowImage} alt="bow" className="redeem-bow" />
      <h2 className="redeem-title">🎫 Process Redemption Request</h2>

      <div className="form-group">
        <label>Please enter redemption transaction ID:</label>
        <input
          type="text"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          className="form-input"
        />
      </div>

      <button onClick={handleProcess} className="form-button">✨ Confirm Process</button>
      <button onClick={() => navigate('/content')} className="back-to-content-btn">
        🔙 Back to Menu
      </button>

      {message && <p className="form-message">{message}</p>}
    </div>
  );
}
