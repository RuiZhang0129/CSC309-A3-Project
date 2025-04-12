import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './css/MyOrganizedEventParticipantsPage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
//const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function MyOrganizedEventParticipantsPage() {
  const { id } = useParams();
  const [guests, setGuests] = useState([]);
  const [utorid, setUtorid] = useState('');
  const [message, setMessage] = useState('');
  const handleRemoveGuest = async (userId) => {
    const token = localStorage.getItem("token");
    //const res = await fetch(`http://localhost:3001/events/${id}/guests/${userId}`, {
    const res = await fetch(`${BACKEND_URL}/events/${id}/guests/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      setGuests(prev => prev.filter(g => g.id !== userId));
      setMessage(" Guest removed");
    } else {
      setMessage(" Failed to remove");
    }
  };
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    //fetch(`http://localhost:3001/events/${id}`, {
      fetch(`${BACKEND_URL}/events/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const simplified = (data.guests || []).map(g => ({
          id: g.user.id,
          utorid: g.user.utorid,
          name: g.user.name
        }));
        setGuests(simplified);
      });
  }, [id]);

  const handleAddGuest = async () => {
    if (!utorid) {
      setMessage("Please enter UTORid");
      return;
    }

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
      setGuests(prev => [...prev, {
        id: data.guestAdded.id,
        utorid: data.guestAdded.utorid,
        name: data.guestAdded.name
      }]);
      setUtorid('');
      setMessage(" Successfully added");
    } else {
      setMessage(` Failed to add: ${data.error || 'Unknown error'}`);
    }
  };

  return (
    <div className="guest-container">
      <img src={bowImage} alt="bow" className="guest-bow" />
      <h2 className="guest-title"> Event Guest Management</h2>

      <div className="guest-form">
        <label>Add Guest UTORid:</label>
        <input
          value={utorid}
          onChange={e => setUtorid(e.target.value)}
          placeholder="Enter user UTORid"
          className="form-input"
        />
        <button onClick={handleAddGuest} className="form-button"> Add</button>
      </div>

      {message && <p className="form-message">{message}</p>}

      <h3 className="guest-subtitle"> Current Guest List:</h3>
      <ul className="guest-list">
        {guests.map(guest => (
          <li key={guest.id} className="guest-card">
            <span>{guest.utorid} ({guest.name || "Unnamed"})</span>
            <button
              onClick={() => handleRemoveGuest(guest.id)}
              className="remove-button"
            >
               Remove
            </button>
          </li>
        ))}
      </ul>

      <button onClick={() => navigate('/my-events')} className="back-to-content-btn">
         Back
      </button>
    </div>
  );
}
