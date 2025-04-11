import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './css/MyOrganizedEventListPage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

export default function MyOrganizedEventListPage() {
  const [events, setEvents] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [order, setOrder] = useState('desc');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams({
      organizedOnly: "true",
      page,
      limit,
      orderBy: "startTime",
      order
    });

    //fetch(`http://localhost:3001/events?${params}`, {
      fetch(`http://localhost:3001/events?${params}`, {

      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setEvents(data.results || []);
        setCount(data.count || 0);
      });
  }, [page, order]);

  const totalPages = Math.ceil(count / limit);

  return (
    <div className="eventlist-container">
      <h2 className="eventlist-title">📋 Events I'm Responsible For</h2>

      <div className="eventlist-filters">
        <label>Sort by:</label>
        <select value={order} onChange={e => setOrder(e.target.value)}>
          <option value="desc">Time Descending</option>
          <option value="asc">Time Ascending</option>
        </select>
      </div>

      {events.length === 0 ? (
        <p style={{ textAlign: "center" }}>No events yet</p>
      ) : (
        <div className="event-card-list">
          {events.map(event => (
            <div key={event.id} className="event-card">
              <p><strong>📌 Name:</strong> {event.name}</p>
              <p><strong>🕒 Time:</strong> {new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleString()}</p>
              <p><strong>📍 Location:</strong> {event.location}</p>
              <p><strong>👥 Number of Guests:</strong> {event.numGuests ?? 0}</p>
              <div>
                <Link to={`/my-events/${event.id}`} className="event-link">View Details</Link>
                <span> | </span>
                <Link to={`/my-events/${event.id}/participants`} className="event-link">Manage Guests</Link>
                <span> | </span>
                <Link to={`/my-events/${event.id}/award`} className="event-link">Distribute Points</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <strong>Page:</strong>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`page-button ${page === i + 1 ? 'active' : ''}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <button onClick={() => navigate('/content')} className="back-to-content-btn">
        🔙 Back to Menu
      </button>
    </div>
  );
}
