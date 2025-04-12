import React, { useEffect, useState } from "react";
import './css/PromotionsPage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
import { useNavigate } from 'react-router-dom';
//const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    //fetch("http://localhost:3001/promotions", {
      fetch(`${BACKEND_URL}/promotions`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setPromotions(data.results || []);
        setLoading(false);
        console.log("🧪 Promotions data returned from backend:", data.results);
      })
      .catch(err => {
        console.error("Error fetching promotions:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="promo-container">
      <img src={bowImage} alt="bow" className="promo-bow" />
      <h2 className="promo-title">🎁 Currently Available Promotions</h2>

      {loading ? (
        <p className="promo-loading">Loading...</p>
      ) : promotions.length === 0 ? (
        <p className="promo-empty">😿 No available promotions</p>
      ) : (
        <ul className="promo-list">
          {promotions.map(promo => (
            <li key={promo.id} className="promo-card">
              <h4>🎉 {promo.name}</h4>
              <p>💰 Reward Points: <strong>{promo.points}</strong></p>
              {promo.minSpending && <p>📉 Minimum Spending: ${promo.minSpending}</p>}
              {promo.rate && <p>🧮 Reward Rate: {promo.rate}x</p>}
              <p>⏰ Valid Until: {new Date(promo.endTime).toLocaleString()}</p>
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
