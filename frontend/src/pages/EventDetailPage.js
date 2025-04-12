import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './css/EventDetailPage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
//const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    //fetch(`http://localhost:3001/events/${id}`, {
      fetch(`${BACKEND_URL}/events/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError("The event does not exist or has not been published");
        } else {
          setEvent(data);
        }
      })
      .catch(err => {
        setError("Failed to load event information");
      });
  }, [id]);


  const handleRSVP = () => {
    const token = localStorage.getItem("token");
    //fetch(`http://localhost:3001/events/${id}/guests/me`, {
      fetch(`${BACKEND_URL}/events/${id}/guests/me`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("RSVP failed");
        return res.json();
      })
      .then(data => {
        setRsvpSuccess(true);
      })
      .catch(err => setError("RSVP failed, possibly already registered or event has ended"));
  };

  if (error) return <div>{error}</div>;
  if (!event) return <div>Loading...</div>;

  return (
    <div className="event-detail-container">
      <img src={bowImage} alt="bow" className="event-bow" />
      <div className="event-card">
        <h2 className="event-title"> {event.name}</h2>
        <p><strong> Location:</strong> {event.location}</p>
        <p><strong> Start:</strong> {new Date(event.startTime).toLocaleString()}</p>
        <p><strong> End:</strong> {new Date(event.endTime).toLocaleString()}</p>
        <p><strong> Description:</strong> {event.description}</p>
        <p><strong> Current number of guests:</strong> {event.numGuests}</p>

        <button onClick={() => navigate('/events')} className="back-to-content-btn">
           Back
        </button>

        {rsvpSuccess ? (
          <p className="event-success"> Successfully registered! We look forward to your participation </p>
        ) : (
          <button className="event-button" onClick={handleRSVP}>
             I want to join
          </button>
        )}
      </div>
    </div>
  );
}
