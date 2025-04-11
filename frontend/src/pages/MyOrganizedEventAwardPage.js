import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './css/MyOrganizedEventAwardPage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function MyOrganizedEventAwardPage() {
  const { id } = useParams(); // event id
  const [guests, setGuests] = useState([]);
  const [utorid, setUtorid] = useState('');
  const [amount, setAmount] = useState('');
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
        const simplified = (data.guests || []).map(g => ({
          utorid: g.user.utorid,
          name: g.user.name
        }));
        setGuests(simplified);
      });
  }, [id]);

  const handleAward = async (toAll = false) => {
    if (!toAll && !utorid) {
      setMessage("❗Please enter UTORid");
      return;
    }

    const parsedAmount = parseInt(amount);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      setMessage("❗Please enter a valid positive integer for points");
      return;
    }

    const token = localStorage.getItem("token");

    //const res = await fetch(`http://localhost:3001/events/${id}/transactions`, {
      const res = await fetch(`${BACKEND_URL}/events/${id}/transactions`,{
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        type: "event",
        amount: parsedAmount,
        ...(toAll ? {} : { utorid })
      })
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(toAll ? "✅ Points awarded to all guests" : `✅ Points awarded to ${utorid}`);
      setUtorid('');
      setAmount('');
    } else {
      setMessage(`❌ Award failed: ${data.error || 'Unknown error'}`);
    }
  };

  return (
    <div className="award-container">
      <img src={bowImage} alt="bow" className="award-bow" />
      <h2 className="award-title">🎁 Award Event Points</h2>

      <div className="award-form">
        <label>Points to Award:</label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="e.g. 20"
        />

        <label>Single User UTORid (Optional):</label>
        <input
          value={utorid}
          onChange={e => setUtorid(e.target.value)}
          placeholder="Fill in to award one user, leave empty to award all guests"
        />

        <div className="button-group">
          <button onClick={() => handleAward(false)} className="btn-primary">🎯 Award This User</button>
          <button onClick={() => handleAward(true)} className="btn-primary">📢 Award All Guests</button>
        </div>

        {message && <p className="form-message">{message}</p>}
      </div>

      <h3 className="guest-title">👥 Guest List:</h3>
      <ul className="guest-list">
        {guests.map((g, i) => (
          <li key={i}>
            {g.utorid} ({g.name || "No Name"})
          </li>
        ))}
      </ul>

      <button onClick={() => navigate('/my-events')} className="back-to-content-btn">
        🔙 Back
      </button>
    </div>
  );
}
