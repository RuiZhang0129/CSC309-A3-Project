import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './css/RedeemQRCodePage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';


export default function RedeemQRCodePage() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQRs = async () => {
      const token = localStorage.getItem("token");
      try {
        //const res = await fetch("http://localhost:3001/users/me/redemptions", {
          const res = await fetch(`${BACKEND_URL}/users/me/redemptions`,{
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setTransactions(data.results || []);
        } else {
          setError(data.error || 'No redemption records found');
        }
      } catch (err) {
        console.error(err);
        setError("System error");
      }
    };
    fetchQRs();
  }, []);

  return (
    <div className="redeemqr-container">
      <img src={bowImage} alt="bow" className="redeemqr-bow" />
      <h2 className="redeemqr-title">🎫 My Redemption Request QR Codes</h2>

      {error && <p className="redeemqr-error">{error}</p>}

      {transactions.length === 0 ? (
        <p className="redeemqr-empty">No redemption records 😿</p>
      ) : (
        <div className="redeemqr-list">
          {transactions.map(tx => (
            <div key={tx.id} className="redeemqr-card">
              <p><strong>ID:</strong> {tx.id}</p>
              <p><strong>Points:</strong> {tx.amount}</p>
              <p><strong>Status:</strong> {tx.processed ? "✅ Processed" : "⏳ Pending"}</p>
              <QRCodeSVG value={String(tx.id)} size={180} />
            </div>
          ))}
        </div>
      )}

      <button onClick={() => navigate('/content')} className="back-to-content-btn">
        🔙 Back to Menu
      </button>
    </div>
  );
}
