import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './css/ManagerPromotionListPage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

export default function ManagerPromotionListPage() {
  const [promotions, setPromotions] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [order, setOrder] = useState('desc');
  const [searchName, setSearchName] = useState('');
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
      ...(type && { type })
    });

    //fetch(`http://localhost:3001/promotions?${params}`, {
      fetch(`${BACKEND_URL}/promotions?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setPromotions(data.results || []);
        setCount(data.count || 0);
      });
  }, [page, order, searchName, type]);

  const totalPages = Math.ceil(count / limit);

  return (
    <div className="promo-container">
      <img src={bowImage} alt="bow" className="promo-bow" />
      <h2 className="promo-title">📦 All Promotions</h2>

      <div className="promo-filters">
        <label>Type:</label>
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="">All</option>
          <option value="automatic">automatic</option>
          <option value="one-time">one-time</option>
        </select>

        <label>Search Name:</label>
        <input
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          placeholder="Promotion name keywords"
        />

        <label>Sort:</label>
        <select value={order} onChange={e => setOrder(e.target.value)}>
          <option value="desc">Start time descending</option>
          <option value="asc">Start time ascending</option>
        </select>
      </div>

      <div className="promo-card-list">
        {promotions.map(promo => (
          <div key={promo.id} className="promo-card">
            <p><strong>🎀 Name:</strong> {promo.name}</p>
            <p><strong>🎁 Points:</strong> {promo.points}</p>
            <p><strong>🕒 Validity:</strong> {new Date(promo.startTime).toLocaleString()} - {new Date(promo.endTime).toLocaleString()}</p>
            <Link to={`/manager/promotions/${promo.id}`} className="promo-link">🔍 View Details</Link>
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
        🔙 Back to Menu
      </button>
    </div>
  );
}
