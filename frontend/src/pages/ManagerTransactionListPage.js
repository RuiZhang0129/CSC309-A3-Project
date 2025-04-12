import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './css/ManagerTransactionListPage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
//const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function ManagerTransactionListPage() {
  const [transactions, setTransactions] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [type, setType] = useState('');
  const [suspicious, setSuspicious] = useState('');
  const [order, setOrder] = useState('desc');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      page,
      limit,
      ...(type && { type }),
      ...(suspicious && { suspicious }),
      orderBy: 'createdAt',
      order
    });

    //fetch(`http://localhost:3001/transactions?${params.toString()}`, {
      fetch(`${BACKEND_URL}/transactions?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(async data => {
        const txs = data.results || [];

        // Extract relatedId to find utorid
        const relatedIdSet = new Set();
        txs.forEach(tx => {
          if (tx.relatedId) relatedIdSet.add(tx.relatedId);
        });

        const utoridMap = {};
        await Promise.all(
          [...relatedIdSet].map(async (id) => {
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
              console.warn(" Failed to fetch related utorid", id);
            }
          })
        );

        const enriched = txs.map(tx => ({
          ...tx,
          relatedUtorid: utoridMap[tx.relatedId] || null
        }));

        setTransactions(enriched);
        setCount(data.count || 0);
      });
  }, [page, type, suspicious, order]);

  const totalPages = Math.ceil(count / limit);

  return (
    <div className="txlist-container">
      <img src={bowImage} alt="bow" className="txlist-bow" />
      <h2 className="txlist-title"> All Transactions</h2>

      <div className="filter-row">
        <label>Type:</label>
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="">All</option>
          <option value="purchase">purchase</option>
          <option value="adjustment">adjustment</option>
          <option value="transfer">transfer</option>
          <option value="redemption">redemption</option>
          <option value="event">event</option>
        </select>

        <label>Suspicious:</label>
        <select value={suspicious} onChange={e => setSuspicious(e.target.value)}>
          <option value="">All</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>

        <label>Order:</label>
        <select value={order} onChange={e => setOrder(e.target.value)}>
          <option value="desc">Time Descending</option>
          <option value="asc">Time Ascending</option>
        </select>
      </div>

      <div className="tx-card-list">
        {transactions.map(tx => (
          <div key={tx.id} className={`tx-card ${tx.suspicious ? 'suspicious' : ''} ${tx.type}`}>
            <p><strong>ID:</strong> {tx.id}</p>
            <p><strong>Type:</strong> {tx.type}</p>
            <p><strong>Points:</strong> {tx.amount}</p>
            <p><strong>User:</strong> {tx.user?.utorid || tx.relatedId}</p>
            <p><strong>Time:</strong> {new Date(tx.createdAt).toLocaleString()}</p>
            <p><strong>Suspicious:</strong> {tx.suspicious ? ' Yes' : ' No'}</p>
            <Link to={`/manager/transactions/${tx.id}`} className="tx-link"> View Detail</Link>
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
