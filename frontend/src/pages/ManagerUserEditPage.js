import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './css/ManagerUserEditPage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
//const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function ManagerUserEditPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [verified, setVerified] = useState(false);
  const [role, setRole] = useState('regular');
  const [suspicious, setSuspicious] = useState(false);
  const [message, setMessage] = useState('');
  const currentUserRole = localStorage.getItem("role");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    //fetch(`http://localhost:3001/users/${id}`, {
      fetch(`${BACKEND_URL}/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setVerified(data.verified);
        setRole(data.role);
        setSuspicious(data.suspicious);
      })
      .catch(() => setMessage(" Failed to get user information"));
  }, [id]);

  const handleUpdate = async () => {
    const token = localStorage.getItem('token');
    const payload = { verified, role, suspicious };

    //const res = await fetch(`http://localhost:3001/users/${id}`, {
      const res = await fetch(`${BACKEND_URL}/users/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(" User information updated");
    } else {
      setMessage(` Update failed: ${data.error || 'Unknown error'}`);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="user-edit-container">
      <img src={bowImage} alt="bow" className="user-edit-bow" />
      <h2 className="user-title"> Manage User - {user.utorid}</h2>

      <div className="user-card">
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>

        <label>
          <input
            type="checkbox"
            checked={verified}
            onChange={e => setVerified(e.target.checked)}
            className="checkbox-green"
          />
           Verified
        </label>

        <label>
          <span>Role:</span>
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="regular">regular</option>
            <option value="cashier">cashier</option>
            {(currentUserRole === "superuser") && (
              <>
                <option value="manager">manager</option>
                <option value="superuser">superuser</option>
              </>
            )}
          </select>
        </label>

        <label>
          <input
            type="checkbox"
            checked={suspicious}
            onChange={e => setSuspicious(e.target.checked)}
            className="checkbox-red"
          />
           Mark as Suspicious
        </label>

        <div className="button-group">
          <button onClick={handleUpdate} className="btn-primary"> Save Changes</button>
          <button onClick={() => navigate('/manager/users')} className="back-to-content-btn">
             Back
          </button>
        </div>

        {message && <p className="form-message">{message}</p>}
      </div>
    </div>
  );
}
