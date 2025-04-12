import React, { useState } from 'react';
import './css/TransferPage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
import { useNavigate } from 'react-router-dom';
//const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function TransferPage() {
  const [utorid, setUtorid] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleTransfer = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage(' Please log in first');
      return;
    }

    if (!utorid || !amount || parseInt(amount) <= 0) {
      setMessage('Please enter a valid utorid and points amount');
      return;
    }

    try {
      //const res = await fetch(`http://localhost:3001/users/${utorid}/transactions`, {
        const res = await fetch(`${BACKEND_URL}/users/${utorid}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: "transfer",
          amount: parseInt(amount),
          remark: "Manual transfer"
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(` Successfully transferred to ${data.recipient}, Transaction ID: ${data.id}`);
        setUtorid('');
        setAmount('');
      } else {
        setMessage(` Failed: ${data.error}`);
      }

    } catch (err) {
      setMessage(' System error');
      console.error(err);
    }
  };

  return (
    <div className="transfer-container">
      <img src={bowImage} alt="bow" className="transfer-bow" />
      <h2 className="transfer-title"> Points Transfer </h2>

      <div className="form-group">
        <label>Recipient UTORid:</label>
        <input
          value={utorid}
          onChange={(e) => setUtorid(e.target.value)}
          className="form-input"
        />
      </div>
      <div className="form-group">
        <label>Transfer Amount:</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="form-input"
        />
      </div>

      <button onClick={handleTransfer} className="transfer-button">
         Confirm Transfer
      </button>

      {message && <p className="transfer-message">{message}</p>}

      <button onClick={() => navigate('/content')} className="back-to-content-btn">
         Back to Menu
      </button>
    </div>
  );
}
