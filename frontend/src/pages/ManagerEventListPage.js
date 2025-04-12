import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './css/ManagerEventListPage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
//const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function ManagerEventListPage() {
  const [events, setEvents] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [order, setOrder] = useState('desc');
  const [searchName, setSearchName] = useState('');
  const [published, setPublished] = useState('');
  const [type, setType] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      page,
      limit,
      orderBy: 'startTime',
      order,
      ...(searchName && { name: searchName }),
      ...(type && { type }),
      ...(published !== "" && { published }) 
    });
    console.log(" Request Params:", params.toString());
    //fetch(`http://localhost:3001/events?${params}`, {
      fetch(`${BACKEND_URL}/events?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setEvents(data.results || []);
        console.log(" Event Data Returned:", data);
        setCount(data.count || 0);
      });
  }, [page, order, searchName, type, published]);

  const totalPages = Math.ceil(count / limit);

  return (
    <div className="eventlist-container">
      <img src={bowImage} alt="bow" className="eventlist-bow" />
      <h2 className="eventlist-title"> All Events</h2>

      <div className="eventlist-filters">
        <input
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          placeholder="🔍 Search Event Name"
        />

        <select value={order} onChange={e => setOrder(e.target.value)}>
          <option value="desc"> Time Descending</option>
          <option value="asc"> Time Ascending</option>
        </select>

        <select value={published} onChange={e => setPublished(e.target.value)}>
          <option value="">All</option>
          <option value="true"> Published</option>
          <option value="false"> Unpublished</option>
        </select>
      </div>

      <div className="event-card-list">
        {events.map(event => (
          <div key={event.id} className="event-card">
            <p><strong> Name:</strong> {event.name}</p>
            <p><strong> Location:</strong> {event.location}</p>
            <p><strong> Time:</strong> {new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleString()}</p>
            <p><strong> Guests:</strong> {event.numGuests}</p>
            <p><strong> Status:</strong> {event.published ? ' Published' : ' Unpublished'}</p>
            <p><strong> Points Remaining:</strong> {event.pointsRemain}</p>
            <p><strong> Points Awarded:</strong> {event.pointsAwarded}</p>
            <Link to={`/manager/events/${event.id}`} className="event-link"> View Details</Link>
          </div>
        ))}
      </div>

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

      <button onClick={() => navigate('/content')} className="back-to-content-btn">
         Back to Menu
      </button>
    </div>
  );
}
