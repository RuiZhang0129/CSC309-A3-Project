import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './css/ManagerEventParticipantsPage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
//const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function ManagerEventParticipantsPage() {
  const { id } = useParams();
  const [guests, setGuests] = useState([]);
  const [utorid, setUtorid] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    //fetch(`http://localhost:3001/events/${id}`, {
      fetch(`${BACKEND_URL}/events/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const simplified = data.guests.map(g => ({
          id: g.user.id,
          utorid: g.user.utorid,
          name: g.user.name
        }));
        setGuests(simplified);
      });
  }, [id]);

  const handleAddGuest = async () => {
    const token = localStorage.getItem("token");
    //const res = await fetch(`http://localhost:3001/events/${id}/guests`, {
      const res = await fetch(`${BACKEND_URL}/events/${id}/guests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ utorid })
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(" Successfully Added");
      setGuests([...guests, {
        id: data.guestAdded.id,
        utorid: data.guestAdded.utorid,
        name: data.guestAdded.name
      }]);
      setUtorid('');
    } else {
      setMessage(` Failed to Add: ${data.error}`);
    }
  };

  const handleRemove = async (userId) => {
    const token = localStorage.getItem("token");
    //const res = await fetch(`http://localhost:3001/events/${id}/guests/${userId}`, {
      const res = await fetch(`${BACKEND_URL}/events/${id}/guests/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setGuests(guests.filter(g => g.id !== userId));
    } else {
      setMessage(" Failed to Remove");
    }
  };

  return (
    <div className="participant-container">
      <img src={bowImage} alt="bow" className="participant-bow" />
      <h2 className="participant-title"> Event Participant Management</h2>

      <div className="participant-form">
        <label>Enter UTORid to Add Participant:</label>
        <input
          value={utorid}
          onChange={e => setUtorid(e.target.value)}
          className="form-input"
          placeholder="Please enter utorid"
        />
        <button onClick={handleAddGuest} className="form-button"> Add</button>
      </div>

      {message && <p className="form-message">{message}</p>}

      <h3 className="participant-subtitle"> Current Participant List:</h3>
      <ul className="guest-list">
        {guests.map(guest => (
          <li key={guest.id} className="guest-card">
            <span>{guest.utorid} ({guest.name || 'Unnamed'})</span>
            <button onClick={() => handleRemove(guest.id)} className="remove-button"> Remove</button>
          </li>
        ))}
      </ul>

      <button onClick={() => navigate('/content')} className="back-to-content-btn">
         Back to Menu
      </button>
    </div>
  );
}
