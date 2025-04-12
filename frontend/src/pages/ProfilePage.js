import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './css/ProfilePage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
//const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    //fetch("http://localhost:3001/users/me", {
      fetch(`${BACKEND_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUser(data));
  }, []);

  if (!user) return <p>Loading...</p>;

  return (
    <div className="profile-container">
      <img src={bowImage} alt="bow" className="profile-bow" />
      <h2 className="profile-title">👤 My Profile</h2>

      <div className="profile-card">
        {user.avatarUrl && (
          <img
            //src={`http://localhost:3001${user.avatarUrl}`}
            src={`${BACKEND_URL}${user.avatarUrl}`}
            alt="Avatar"
            className="profile-avatar"
          />
        )}

        <p><strong>Username:</strong> {user.name}</p>
        <p><strong>UTORid:</strong> {user.utorid}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Birthday:</strong> {user.birthday || "Not provided"}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Points:</strong> {user.points}</p>
        <p><strong>Registered on:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
        <p><strong>Last login:</strong> {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never logged in"}</p>

        <Link to="/edit-profile" className="edit-button">✏️ Edit My Profile</Link>

        <button onClick={() => navigate('/content')} className="back-to-content-btn">
          🔙 Back to Menu
        </button>
      </div>
    </div>
  );
}
