import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './css/MyQRCodePage.css';
import bowImage from './image/bow.png'; //[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 

import { useNavigate } from 'react-router-dom';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function MyQRCodePage() {
  const [utorid, setUtorid] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not logged in, unable to fetch QR code");
      setLoading(false);
      return;
    }

    //fetch("http://localhost:3001/users/me", {
      fetch(`${BACKEND_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.utorid) setUtorid(data.utorid);
        else setError("Failed to get utorid");
      })
      .catch(() => setError("Request failed, please try again"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="qr-container">
      <img src={bowImage} alt="bow" className="qr-bow" />
      <h2 className="qr-title">🎀 My QR Code 🎀</h2>

      {loading && <p className="qr-loading">Loading...</p>}
      {error && <p className="qr-error">{error}</p>}

      {!loading && utorid && (
        <div className="qr-card">
          <QRCodeSVG value={utorid} size={200} />
          <p className="qr-utorid">utorid: {utorid}</p>
        </div>
      )}

      <button onClick={() => navigate('/content')} className="back-to-content-btn">
        🔙 Back to Menu
      </button>
    </div>
  );
}
