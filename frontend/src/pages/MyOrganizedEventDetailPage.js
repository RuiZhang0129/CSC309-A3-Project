import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './css/MyOrganizedEventDetailPage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
//const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function MyOrganizedEventDetailPage() {
  const { id } = useParams(); // event id
  const [event, setEvent] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    capacity: '',
    pointsRemain: '',
    published: false
  });

  useEffect(() => {
    const token = localStorage.getItem("token");

    //fetch(`http://localhost:3001/events/${id}`, {
      fetch(`${BACKEND_URL}/events/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!data || data.error) {
          setMessage("❌ Load failed: " + (data.error || "Unknown error"));
        } else {
          setEvent(data);
          setForm({
            name: data.name || '',
            description: data.description || '',
            location: data.location || '',
            startTime: data.startTime?.slice(0, 16) || '',
            endTime: data.endTime?.slice(0, 16) || '',
            capacity: data.capacity ?? '',
            pointsRemain: data.pointsRemain ?? 0,
            published: data.published ?? false
          });
        }
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleUpdate = async () => {
    const token = localStorage.getItem("token");

    //const res = await fetch(`http://localhost:3001/events/${id}`, {
      const res = await fetch(`${BACKEND_URL}/events/${id}`, {
      method: "PATCH",
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...form,
        capacity: form.capacity === '' ? null : parseInt(form.capacity, 10),
        points: parseInt(form.pointsRemain, 10),
        published: form.published
      })
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("✅ Update successful!");
    } else {
      setMessage("❌ Update failed: " + (data.error || "Unknown error"));
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!event) return <p>Event not found</p>;

  return (
    <div className="event-container">
      <img src={bowImage} alt="bow" className="event-bow" />
      <h2 className="event-title">🎀 Edit Event: {event.name}</h2>

      <div className="event-form">
        <label>Name:</label>
        <input name="name" value={form.name} onChange={handleChange} />

        <label>Description:</label>
        <input name="description" value={form.description} onChange={handleChange} />

        <label>Location:</label>
        <input name="location" value={form.location} onChange={handleChange} />

        <label>Start Time:</label>
        <input name="startTime" type="datetime-local" value={form.startTime} onChange={handleChange} />

        <label>End Time:</label>
        <input name="endTime" type="datetime-local" value={form.endTime} onChange={handleChange} />

        <label>Max Capacity:</label>
        <input name="capacity" type="number" value={form.capacity} onChange={handleChange} />

        <label>Total Points Allocation:</label>
        <input name="pointsRemain" type="number" value={form.pointsRemain} onChange={handleChange} />

        <label>Published:</label>
        <input
          type="checkbox"
          name="published"
          checked={form.published}
          onChange={handleChange}
          className="checkbox-published"
        />

        <button onClick={handleUpdate} className="btn-primary">💾 Save Changes</button>
        {message && <p className="form-message">{message}</p>}
      </div>

      <button onClick={() => navigate('/my-events')} className="back-to-content-btn">
        🔙 Back
      </button>
    </div>
  );
}
