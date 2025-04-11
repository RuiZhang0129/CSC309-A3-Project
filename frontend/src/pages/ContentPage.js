// src/pages/Content.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/ContentPage.css';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

export default function ContentPage() {
    const navigate = useNavigate();
    const [role, setRole] = useState(null);

    useEffect(() => {
        const storedRole = localStorage.getItem("role");
        setRole(storedRole);
    }, []);

    return (
        <div className="content-container">
            <h2 className="content-title">🎀 My Function Menu</h2>

            <div className="button-grid">
                {/* All Users */}
                <button onClick={() => navigate('/home-after-login')} className="menu-btn">Home</button>
                <button onClick={() => navigate('/points')} className="menu-btn">My Points</button>
                <button onClick={() => navigate('/transactions')} className="menu-btn">Transaction History</button>
                <button onClick={() => navigate('/events')} className="menu-btn">View Events</button>
                <button onClick={() => navigate('/promotions')} className="menu-btn">Available Promotions</button>
                <button onClick={() => navigate('/transfer')} className="menu-btn">Transfer Points</button>
                <button onClick={() => navigate('/my-qr')} className="menu-btn">My QR Code</button>
                <button onClick={() => navigate('/redeem')} className="menu-btn">Redeem Points</button>
                <button onClick={() => navigate('/redeem-qr')} className="menu-btn">Redemption QR Code</button>

                {/* Cashier */}
                {role === 'cashier' && (
                    <>
                        <button onClick={() => navigate('/register')} className="menu-btn">Register</button>
                        <button onClick={() => navigate('/cashier/create-transaction')} className="menu-btn">Create Transaction</button>
                        <button onClick={() => navigate('/cashier/process-redemption')} className="menu-btn">Process Redemption</button>
                    </>
                )}

                {/* Manager & Superuser */}
                {["manager", "superuser"].includes(role) && (
                    <>
                        <button onClick={() => navigate('/register')} className="menu-btn">Register</button>
                        <button onClick={() => navigate('/manager/users')} className="menu-btn">User Management</button>
                        <button onClick={() => navigate('/manager/transactions')} className="menu-btn">Transaction Management</button>
                        <button onClick={() => navigate('/manager/promotions')} className="menu-btn">Promotion Management</button>
                        <button onClick={() => navigate('/manager/promotions/create')} className="menu-btn">Create Promotion</button>
                        <button onClick={() => navigate('/manager/events')} className="menu-btn">Event Management</button>
                        <button onClick={() => navigate('/manager/events/create')} className="menu-btn">Create Event</button>
                        <button onClick={() => navigate('/my-events')} className="menu-btn">My Responsible Events</button>
                    </>
                )}
            </div>
        </div>
    );
}
