import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './css/ManagerTransactionDetailPage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function ManagerTransactionDetailPage() {
  const { id } = useParams();
  const [tx, setTx] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustRemark, setAdjustRemark] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    //fetch(`http://localhost:3001/transactions/${id}`, {
      fetch(`${BACKEND_URL}/transactions/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setTx(data))
      .catch(() => setMessage("Failed to load transaction info"));
  }, [id]);

  const handleMarkSuspicious = async () => {
    //const res = await fetch(`http://localhost:3001/transactions/${id}/suspicious`, {
      const res = await fetch(`${BACKEND_URL}/transactions/${id}/suspicious`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ suspicious: true })
    });
    const data = await res.json();
    if (res.ok) setMessage("✅ Marked as suspicious transaction");
    else setMessage(`❌ Mark failed: ${data.error || 'Unknown error'}`);
  };


  const handleCreateAdjustment = async () => {
    //const res = await fetch(`http://localhost:3001/transactions`, {
      const res = await fetch(`${BACKEND_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        utorid: tx.utorid,
        type: "adjustment",
        amount: parseInt(adjustAmount),
        relatedId: tx.id,
        remark: adjustRemark || "Manually adjusted by admin"
      })
    });
    const data = await res.json();
    if (res.ok) setMessage("✅ Adjustment transaction created");
    else setMessage(`❌ Creation failed: ${data.error || 'Unknown error'}`);
  };

  if (!tx) return <div>Loading...</div>;

  return (
    <div className="tx-container">
      <img src={bowImage} alt="bow" className="tx-bow" />
      <h2 className="tx-title">📄 Transaction Detail #{tx.id}</h2>

      <div className="tx-card">
        <p><strong>Type:</strong> {tx.type}</p>
        <p><strong>Points:</strong> {tx.amount}</p>
        <p><strong>User:</strong> {tx.utorid}</p>
        <p><strong>Time:</strong> {new Date(tx.createdAt).toLocaleString()}</p>
        <p><strong>Suspicious:</strong> {tx.suspicious ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Remark:</strong> {tx.remark || 'None'}</p>
      </div>

      <div className="tx-actions">
        <button onClick={handleMarkSuspicious} className="btn-warn">⚠️ Mark as Suspicious</button>
      </div>

      <div className="tx-adjust">
        <h4>📌 Create Point Adjustment:</h4>
        <label>Adjustment Amount:</label>
        <input
          type="number"
          value={adjustAmount}
          onChange={e => setAdjustAmount(e.target.value)}
        />
        <label>Remark:</label>
        <input
          value={adjustRemark}
          onChange={e => setAdjustRemark(e.target.value)}
        />
        <button onClick={handleCreateAdjustment} className="btn-primary">Submit Adjustment</button>
      </div>

      {message && <p className="tx-message">{message}</p>}

      <button onClick={() => navigate('/manager/transactions')} className="back-to-content-btn">
        🔙 Back
      </button>
    </div>
  );
}
