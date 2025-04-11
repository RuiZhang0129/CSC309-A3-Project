// src/pages/HomePage.js
import React, { useEffect, useState } from 'react';
import "./css/HomePageAfterLogin.css";
import { useNavigate } from 'react-router-dom';
import bowImage from "./image/bow.png";//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

export default function HomePage() {
    const [role, setRole] = useState('');
    const [points, setPoints] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [events, setEvents] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const storedRole = localStorage.getItem("role");
        setRole(storedRole);

        const token = localStorage.getItem("token");

        if (storedRole === "regular") {

            //fetch("http://localhost:3001/users/me", {
                fetch(`${BACKEND_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    setPoints(data.points);
                });

            //fetch("http://localhost:3001/users/me/transactions?page=1&limit=3", {
                fetch(`${BACKEND_URL}/users/me/transactions?page=1&limit=3`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    setTransactions(data.results || []);
                });
        }

        if (storedRole === "manager" || storedRole === "superuser") {
            //fetch("http://localhost:3001/promotions", {
            fetch(`${BACKEND_URL}/promotions`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setPromotions(data.results || []));

            //fetch("http://localhost:3001/events", {
            fetch(`${BACKEND_URL}/events`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setEvents(data.results || []));
        }
    }, []);

    const goTo = (path) => navigate(path);

    return (
        <div className="afterlogin-container">
            <h1 className="hello-title">🎀 Welcome Back 🎀</h1>

            {role === "regular" && (
                <div className="regular-dashboard">
                    <h2>🎯 Current Points: {points ?? 'Loading...'}</h2>
                    <h3>📒 Recent Transactions:</h3>
                    <ul className="transaction-list">
                        {transactions.map(tx => (
                            <li key={tx.id}>
                                <strong>{tx.type}</strong>: {tx.amount} pts ({new Date(tx.createdAt).toLocaleDateString()})
                            </li>
                        ))}
                    </ul>
                    <button onClick={() => goTo('/content')}>🎀 Go to Menu</button>
                </div>
            )}

            {role === "cashier" && (
                <div className="cashier-panel">
                    <button onClick={() => goTo('/cashier/create-transaction')}>🧾 Create Transaction</button>
                    <button onClick={() => goTo('/cashier/process-redemption')}>🎫 Process Redemption</button>
                    <button onClick={() => goTo('/content')}>Back to Menu</button>
                </div>
            )}

            {(role === "manager" || role === "superuser") && (
                <div className="manager-dashboard">
                    <button onClick={() => goTo('/manager/users')}>👥 User Management</button>
                    <button onClick={() => goTo('/manager/promotions')}>🎁 View Promotions</button>
                    <button onClick={() => goTo('/manager/events')}>📅 Event Management</button>
                    <button onClick={() => goTo('/content')}>🎀 Go to Menu</button>

                    <h3 className="section-title">📅 All Events</h3>
                    <div className="scroll-section">
                        {events.map(event => (
                            <div key={event.id} className="scroll-card">
                                <strong>{event.name}</strong>
                                <p>{new Date(event.startTime).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>

                    <h3 className="section-title">🎁 Current Promotions</h3>
                    <div className="scroll-section">
                        {promotions.map(promo => (
                            <div key={promo.id} className="scroll-card">
                                <strong>{promo.name}</strong>
                                <p>{promo.points} pts / {new Date(promo.endTime).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
