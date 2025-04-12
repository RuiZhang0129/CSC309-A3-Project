import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/ChangePasswordPage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
//const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function ChangePassword() {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setMessage('');

        const token = localStorage.getItem('token');
        if (!token) {
            setMessage("⚠️ Please log in first");
            return;
        }

        try {
            //const res = await fetch("http://localhost:3001/users/me/password", {
                const res = await fetch(`${BACKEND_URL}/users/me/password`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ old: oldPassword, new: newPassword })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Modification failed");

            setMessage("✅ Password changed successfully!");
            setOldPassword('');
            setNewPassword('');
        } catch (err) {
            setMessage(`❌ ${err.message}`);
        }
    };

    return (
        <div className="change-container">
            <img src={bowImage} alt="bow" className="change-bow" />
            <h2 className="change-title">🔐 Change Password</h2>

            <form className="change-form" onSubmit={handleChangePassword}>
                <input
                    type="password"
                    placeholder="Enter current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Set new password (at least 8 characters, including uppercase/lowercase/number/special character)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
                <button type="submit" className="btn-primary">Confirm Change</button>
                {message && <p className="form-message">{message}</p>}
            </form>

            <button onClick={() => navigate('/edit-profile')} className="back-to-content-btn">
                🔙 Back
            </button>
        </div>
    );
}
