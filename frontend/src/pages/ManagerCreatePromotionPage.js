import React, { useState } from 'react';
import './css/ManagerCreatePromotionPage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 

import { useNavigate } from 'react-router-dom';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function ManagerCreatePromotionPage() {
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [minSpending, setMinSpending] = useState('');
  const [rate, setRate] = useState('');
  const [points, setPoints] = useState('');
  const [message, setMessage] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('automatic');
  const navigate = useNavigate();

  const handleCreate = async () => {
    const token = localStorage.getItem('token');
    if (!token) return setMessage("⚠️ Please log in first");

    if (!name || !description || !type || !startTime || !endTime || !points) {
      return setMessage("❗Please fill in all required fields");
    }

    try {
      //const res = await fetch("http://localhost:3001/promotions", {
        const res = await fetch(`${BACKEND_URL}/promotions`, {

        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          type,
          startTime,
          endTime,
          minSpending: minSpending ? Number(minSpending) : null,
          rate: rate ? Number(rate) : null,
          points: Number(points)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Promotion created successfully ID: ${data.id}`);
        setName('');
        setDescription('');
        setType('automatic');
        setStartTime('');
        setEndTime('');
        setMinSpending('');
        setRate('');
        setPoints('');
      } else {
        setMessage(`❌ Creation failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Network error");
    }
  };

  return (
    <div className="promo-create-container">
      <img src={bowImage} alt="bow" className="promo-bow" />
      <h2 className="promo-title">🎁 Create Promotion</h2>

      <div className="promo-form">
        <label>Promotion Name (Required)</label>
        <input value={name} onChange={e => setName(e.target.value)} className="form-input" />

        <label>Start Time</label>
        <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="form-input" />

        <label>End Time</label>
        <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="form-input" />

        <label>Promotion Type (Required)</label>
        <select value={type} onChange={e => setType(e.target.value)} className="form-input">
          <option value="automatic">automatic</option>
          <option value="one-time">one-time</option>
        </select>

        <label>Promotion Description (Required)</label>
        <input value={description} onChange={e => setDescription(e.target.value)} className="form-input" />

        <label>Minimum Spending (Optional)</label>
        <input type="number" value={minSpending} onChange={e => setMinSpending(e.target.value)} className="form-input" />

        <label>Reward Rate (Optional)</label>
        <input type="number" step="0.1" value={rate} onChange={e => setRate(e.target.value)} className="form-input" />

        <label>Base Points (Required)</label>
        <input type="number" value={points} onChange={e => setPoints(e.target.value)} className="form-input" />

        <button onClick={handleCreate} className="form-button">✨ Submit Promotion</button>

        <button onClick={() => navigate('/content')} className="back-to-content-btn">
          🔙 Back to Menu
        </button>

        {message && <p className="form-message">{message}</p>}
      </div>
    </div>
  );
}
