import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import "./css/EventsPage.css";
import bowImage from "./image/bow.png"; //[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    //fetch("http://localhost:3001/events?page=1&limit=10", {
      fetch(`${BACKEND_URL}/events?page=1&limit=10`, {

      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.results || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching events:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="events-container">
      <img src={bowImage} alt="bow" className="events-bow" />
      <h2 className="events-title">🎀 Currently Published Events 🎀</h2>

      {loading ? (
        <p className="events-loading">Loading...</p>
      ) : events.length === 0 ? (
        <p className="events-empty">😿 No available events</p>
      ) : (
        <ul className="events-list">
          {events.map(event => (
            <li className="event-card" key={event.id}>
              <h4>🎉 {event.name}</h4>
              <p>📍 Location: {event.location}</p>
              <p>🕒 Time: {new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleString()}</p>
              <a href={`/events/${event.id}`} className="event-link">View Details</a>
            </li>
          ))}
        </ul>
      )}
      <button onClick={() => navigate('/content')} className="back-to-content-btn">
        🔙 Back to Menu
      </button>
    </div>
  );
}
