import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './css/ManagerUserListPage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
//const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function ManagerUserListPage() {
  const [users, setUsers] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [roleFilter, setRoleFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [order, setOrder] = useState('asc');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      page,
      limit,
      ...(roleFilter && { role: roleFilter }),
      ...(verifiedFilter && { verified: verifiedFilter }),
      orderBy: 'createdAt',
      order
    });

    //fetch(`http://localhost:3001/users?${params.toString()}`, {
      fetch(`${BACKEND_URL}/users?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setUsers(data.results || []);
        setCount(data.count || 0);
      });
  }, [page, roleFilter, verifiedFilter, order]);

  const totalPages = Math.ceil(count / limit);

  return (
    <div className="userlist-container">
      <img src={bowImage} alt="bow" className="userlist-bow" />
      <h2 className="userlist-title">📋 User Management</h2>

      <div className="filter-row">
        <label>Role:</label>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All</option>
          <option value="regular">regular</option>
          <option value="cashier">cashier</option>
          <option value="manager">manager</option>
          <option value="superuser">superuser</option>
        </select>

        <label>Verified:</label>
        <select value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value)}>
          <option value="">All</option>
          <option value="true">Verified</option>
          <option value="false">Not Verified</option>
        </select>

        <label>Sort:</label>
        <select value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="asc">Registration Time Ascending</option>
          <option value="desc">Registration Time Descending</option>
        </select>
      </div>

      <div className="user-card-list">
        {users.map((user) => (
          <div key={user.id} className="user-card">
            <p><strong>utorid:</strong> {user.utorid}</p>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>Status:</strong> {user.verified ? '✅ Verified' : '❌ Not Verified'}</p>
            <Link to={`/manager/users/${user.id}`} className="manage-link">🔧 Manage User</Link>
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
