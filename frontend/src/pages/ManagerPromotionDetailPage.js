import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './css/ManagerPromotionDetailPage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function ManagerPromotionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [promotion, setPromotion] = useState(null);
  const [message, setMessage] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('automatic');
  const [minSpending, setMinSpending] = useState('');
  const [rate, setRate] = useState('');
  const [points, setPoints] = useState('');
  const [endTime, setEndTime] = useState('');
  const role = localStorage.getItem("role");

  useEffect(() => {
    const token = localStorage.getItem('token');
    //fetch(`http://localhost:3001/promotions/${id}`, {
      fetch(`${BACKEND_URL}/promotions/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setPromotion(data);
        setName(data.name);
        setDescription(data.description);
        setType(data.type);
        setMinSpending(data.minSpending || '');
        setRate(data.rate || '');
        setPoints(data.points);
        setEndTime(data.endTime);
      });
  }, [id]);

  const handleUpdate = async () => {
    const token = localStorage.getItem('token');
    //const res = await fetch(`http://localhost:3001/promotions/${id}`, {
      const res = await fetch(`${BACKEND_URL}/promotions/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        description,
        type,
        minSpending: minSpending ? Number(minSpending) : null,
        rate: rate ? Number(rate) : null,
        points: Number(points),
        endTime
      })
    });
    const data = await res.json();
    if (res.ok) setMessage("✅ Update successful");
    else setMessage(`❌ Update failed: ${data.error || 'Unknown error'}`);
  };

  const handleDelete = async () => {
    const token = localStorage.getItem('token');
    //const res = await fetch(`http://localhost:3001/promotions/${id}`, {
      const res = await fetch(`${BACKEND_URL}/promotions/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      navigate('/manager/promotions');
    } else {
      setMessage('❌ Deletion failed');
    }
  };

  if (!promotion) return <div>Loading...</div>;

  return (
    <div className="promo-detail-container">
      <img src={bowImage} alt="bow" className="promo-bow" />
      <h2 className="promo-title">🎯 Manage Promotion - {promotion.name}</h2>

      <div className="promo-form">
        <label>Name:</label>
        <input value={name} onChange={e => setName(e.target.value)} />

        <label>Description:</label>
        <input value={description} onChange={e => setDescription(e.target.value)} />

        <label>Type:</label>
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="automatic">automatic</option>
          <option value="one-time">one-time</option>
        </select>

        <label>Minimum Spending:</label>
        <input type="number" value={minSpending} onChange={e => setMinSpending(e.target.value)} />

        <label>Reward Rate:</label>
        <input type="number" step="0.1" value={rate} onChange={e => setRate(e.target.value)} />

        <label>Points:</label>
        <input type="number" value={points} onChange={e => setPoints(e.target.value)} />

        <label>End Time:</label>
        <input type="datetime-local" value={endTime?.slice(0, 16)} onChange={e => setEndTime(e.target.value)} />

        {["manager", "superuser"].includes(role) && (
          <div className="button-group">
            <button onClick={handleUpdate} className="btn-primary">💾 Save Changes</button>
            <button onClick={handleDelete} className="btn-danger">🗑️ Delete Promotion</button>
            <button onClick={() => navigate('/manager/promotions')} className="back-to-content-btn">
              🔙 Back
            </button>
          </div>
        )}

        {message && <p className="form-message">{message}</p>}

      </div>
    </div>
  );
}
