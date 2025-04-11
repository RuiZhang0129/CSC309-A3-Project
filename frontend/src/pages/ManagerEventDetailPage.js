import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './css/ManagerEventDetailPage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function ManagerEventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [message, setMessage] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState('');
  const [points, setPoints] = useState('');
  const [published, setPublished] = useState(false);
  const [type, setType] = useState('');
  const [minSpending, setMinSpending] = useState('');
  const [rate, setRate] = useState('');

  useEffect(() => {
    const token = localStorage.getItem("token");
    //fetch(`http://localhost:3001/events/${id}`, {
      fetch(`${BACKEND_URL}/events/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setEvent(data);
        setName(data.name);
        setDescription(data.description);
        setLocation(data.location);
        setEndTime(data.endTime);
        setCapacity(data.capacity ?? '');
        setPoints(data.pointsRemain + data.pointsAwarded);
        setPublished(data.published);
        setType(data.type || '');
        setMinSpending(data.minSpending ?? '');
        setRate(data.rate ?? '');
      });
  }, [id]);

  const handleUpdate = async () => {
    const token = localStorage.getItem("token");
    //const res = await fetch(`http://localhost:3001/events/${id}`, {
      const res = await fetch(`${BACKEND_URL}/events/${id}`, {
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
        endTime,
        published: published ? true : undefined
      })
    });
    const data = await res.json();
    if (res.ok) setMessage("✅ Update successful");
    else setMessage(`❌ Update failed: ${data.error || 'Unknown error'}`);
  };

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    //const res = await fetch(`http://localhost:3001/events/${id}`, {
      const res = await fetch(`${BACKEND_URL}/events/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      navigate('/manager/events');
    } else {
      setMessage('❌ Delete failed');
    }
  };

  if (!event) return <div>Loading...</div>;

  return (
    <div className="manager-event-container">
      <img src={bowImage} alt="bow" className="manager-bow" />
      <h2 className="manager-title">📄 Event Details - {event.name}</h2>

      <div className="event-form">
        <label>Name:</label>
        <input value={name} onChange={e => setName(e.target.value)} />

        <label>Description:</label>
        <input value={description} onChange={e => setDescription(e.target.value)} />

        <label>Location:</label>
        <input value={location} onChange={e => setLocation(e.target.value)} />

        <label>End Time:</label>
        <input type="datetime-local" value={endTime?.slice(0, 16)} onChange={e => setEndTime(e.target.value)} />

        <label>Capacity (Optional):</label>
        <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} />

        <label>Total Points:</label>
        <input type="number" value={points} onChange={e => setPoints(e.target.value)} />

        <label>Published:</label>
        <input
          type="checkbox"
          className="checkbox-published"
          checked={published}
          readOnly
          onChange={e => setPublished(e.target.checked)}
        />

        <div className="button-group">
          <button onClick={handleUpdate} className="btn-primary">💾 Save Changes</button>
          <button onClick={handleDelete} className="btn-danger">🗑️ Delete Event</button>
          <button onClick={() => navigate('/manager/events')} className="back-to-content-btn">🔙 Back</button>
        </div>

        {message && <p className="form-message">{message}</p>}
      </div>
    </div>
  );
}
