import React, { useState } from 'react';
import './css/ManagerCreateEventPage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 

import { useNavigate } from 'react-router-dom';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

export default function ManagerCreateEventPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState('');
  const [points, setPoints] = useState('');
  const [published, setPublished] = useState(''); 
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleCreate = async () => {
    const token = localStorage.getItem("token");
    if (!token) return setMessage("⚠️ Please log in first");

    if (!name || !description || !location || !startTime || !endTime || !points || published === '') {
      return setMessage("❗Please fill in all required fields (including publication status)");
    }

    try {
      //const res = await fetch("http://localhost:3001/events", {
        const res = await fetch(`${BACKEND_URL}/events`, {

        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          location,
          startTime,
          endTime,
          capacity: capacity ? Number(capacity) : null,
          points: Number(points),
          published: published === 'true'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Event created successfully, ID: ${data.id}`);
        setName(''); setDescription(''); setLocation(''); setStartTime(''); setEndTime('');
        setCapacity(''); setPoints(''); setPublished('');
      } else {
        setMessage(`❌ Creation failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Network error");
    }
  };

  return (
    <div className="event-create-container">
      <img src={bowImage} alt="bow" className="event-bow" />
      <h2 className="event-title">📅 Create Event</h2>

      <div className="event-form">
        <label>📛 Event Name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="form-input" />

        <label>📝 Event Description</label>
        <input value={description} onChange={e => setDescription(e.target.value)} className="form-input" />

        <label>📍 Event Location</label>
        <input value={location} onChange={e => setLocation(e.target.value)} className="form-input" />

        <label>🕐 Start Time</label>
        <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="form-input" />

        <label>🕔 End Time</label>
        <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="form-input" />

        <label>👥 Capacity (Optional)</label>
        <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} className="form-input" />

        <label>🎁 Total Points Allocation</label>
        <input type="number" value={points} onChange={e => setPoints(e.target.value)} className="form-input" />

        <label>📣 Publish?</label>
        <select value={published} onChange={e => setPublished(e.target.value)} className="form-input">
          <option value="">Please Select</option>
          <option value="true">✅ Published</option>
          <option value="false">❌ Not Published</option>
        </select>

        <button onClick={handleCreate} className="form-button">✨ Submit Event</button>

        <button onClick={() => navigate('/content')} className="back-to-content-btn">
          🔙 Back to Menu
        </button>

        {message && <p className="form-message">{message}</p>}
      </div>
    </div>
  );
}
