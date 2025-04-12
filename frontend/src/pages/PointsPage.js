import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/PointsPage.css';
import bowImage from './image/bow.png'; //[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
//const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function PointsPage() {
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError("Not logged in, unable to fetch point information.");
      setLoading(false);
      return;
    }

    //fetch("http://localhost:3001/users/me", {
      fetch(`${BACKEND_URL}/users/me`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => {
        console.log("📡 Response status code:", res.status);
        return res.json();
      })
      .then(data => {
        console.log(" Retrieved user info:", data);
        if (data.points !== undefined) {
          setPoints(data.points);
        } else {
          setError("Unable to retrieve point data.");
        }
      })
      .catch(err => {
        console.error(" Request error:", err);
        setError("Request error: " + err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="points-container">
      <img src={bowImage} alt="bow" className="points-bow" />
      <h2 className="points-title"> My Available Points </h2>

      {loading && <p className="points-loading">Loading points...</p>}
      {error && <p className="points-error">{error}</p>}

      {points !== null && !loading && (
        <p className="points-value">{points} pts</p>
      )}

      <button onClick={() => navigate('/content')} className="back-to-content-btn">
         Back to Menu
      </button>
    </div>
  );
}
