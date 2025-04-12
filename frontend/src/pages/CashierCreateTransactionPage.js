import React, { useState } from 'react';
import './css/CashierCreateTransactionPage.css';
import bowImage from './image/bow.png';//external image at: https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html
//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
import { useNavigate } from 'react-router-dom';
//const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;


export default function CashierCreateTransactionPage() {
  const [utorid, setUtorid] = useState('');
  const [type, setType] = useState('purchase');
  const [spent, setSpent] = useState('');
  const [remark, setRemark] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleCreate = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('⚠️ Please log in first');
      return;
    }

    const payload = {
      utorid,
      type,
      remark: remark || ''
    };

    if (type === 'purchase') {
      payload.spent = parseFloat(spent);
    } else if (type === 'event') {
      payload.amount = parseInt(spent);
    }

    try {
      const res = await fetch(`${BACKEND_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Transaction created successfully. ID: ${data.id}`);
        setUtorid('');
        setSpent('');
        setRemark('');
      } else {
        setMessage(`❌ Failed to create: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ Network error');
    }
  };

  return (
    <div className="cashier-container">
      <img src={bowImage} alt="bow" className="cashier-bow" />
      <h2 className="cashier-title">🎀 Create Transaction 🎀</h2>

      <div className="form-group">
        <label>User UTORid:</label>
        <input value={utorid} onChange={e => setUtorid(e.target.value)} className="form-input" />
      </div>

      <div className="form-group">
        <label>Transaction Type:</label>
        <select value={type} onChange={e => setType(e.target.value)} className="form-input">
          <option value="purchase">Purchase</option>
          <option value="event">Event Reward</option>
        </select>
      </div>

      <div className="form-group">
        <label>{type === 'purchase' ? 'Amount $' : 'Reward Points:'}</label>
        <input type="number" value={spent} onChange={e => setSpent(e.target.value)} className="form-input" />
      </div>

      <div className="form-group">
        <label>Remark (optional):</label>
        <input value={remark} onChange={e => setRemark(e.target.value)} className="form-input" />
      </div>

      <button onClick={handleCreate} className="form-button">🧾 Confirm Create</button>

      <button onClick={() => navigate('/content')} className="back-to-content-btn">
        🔙 Back to Menu
      </button>

      {message && <p className="form-message">{message}</p>}
    </div>
  );
}
