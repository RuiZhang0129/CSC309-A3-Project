import React, { useEffect, useState } from "react";
import "./css/TransactionsPage.css";
import bowImage from "./image/bow.png";//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 

import { useNavigate } from 'react-router-dom';
//const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [typeFilter, setTypeFilter] = useState("");
  const [order, setOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams({
      page,
      limit,
      ...(typeFilter && { type: typeFilter }),
      orderBy: "createdAt",
      order
    });

    //fetch(`http://localhost:3001/users/me/transactions?${params}`, {
      fetch(`${BACKEND_URL}/users/me/transactions?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(async (data) => {
        const transactions = data.results || [];

        const relatedIdSet = new Set();
        transactions.forEach(tx => {
          if (tx.relatedId) relatedIdSet.add(tx.relatedId);
        });

        const utoridMap = {};
        await Promise.all(
          Array.from(relatedIdSet).map(async (id) => {
            try {
              //const res = await fetch(`http://localhost:3001/users/${id}/utorid`, {
                const res = await fetch(`${BACKEND_URL}/users/${id}/utorid`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (res.ok) {
                const json = await res.json();
                utoridMap[id] = json.utorid;
              }
            } catch (err) {
              console.warn(` Failed to get utorid: /users/${id}/utorid`, err);
            }
          })
        );

        const enriched = transactions.map(tx => ({
          ...tx,
          relatedUtorid: utoridMap[tx.relatedId] || null
        }));

        setTransactions(enriched);
        setCount(data.count || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, typeFilter, order]);


  const typeColor = (type) => {
    switch (type) {
      case "transfer": return "#e3f2fd";
      case "redemption": return "#fce4ec";
      case "purchase": return "#fff3e0";
      case "adjustment": return "#ede7f6";
      case "event": return "#f1f8e9";
      default: return "#f5f5f5";
    }
  };

  const totalPages = Math.ceil(count / limit);

  return (
    <div className="tx-container">
      <img src={bowImage} alt="bow" className="tx-bow" />
      <h2 className="tx-title"> My Transactions</h2>

      <div className="tx-controls">
        <label>Transaction Type:</label>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All</option>
          <option value="transfer">Transfer</option>
          <option value="redemption">Redemption</option>
          <option value="purchase">Purchase</option>
          <option value="adjustment">Adjustment</option>
          <option value="event">Event Reward</option>
        </select>

        <label>Sort:</label>
        <select value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        transactions.map((tx) => (
          <div
            key={tx.id}
            className="tx-card"
            style={{ backgroundColor: typeColor(tx.type) }}
          >
            <p><strong>Type:</strong> {tx.type}</p>
            <p><strong>Points:</strong> {tx.amount > 0 ? "+" : ""}{tx.amount}</p>
            <p><strong>Related:</strong> {tx.relatedUtorid || `${tx.relatedId}`}</p>
            <p><strong>Remark:</strong> {tx.remark || "None"}</p>
            <p><strong>Time:</strong> {new Date(tx.createdAt).toLocaleString()}</p>
          </div>
        ))
      )}


      <div className="tx-pagination">
        <strong>Page:</strong>
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`tx-page-button ${i + 1 === page ? "active" : ""}`}
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
