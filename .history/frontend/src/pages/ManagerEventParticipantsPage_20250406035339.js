import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function ManagerEventParticipantsPage() {
  const { id } = useParams();
  const [guests, setGuests] = useState([]);
  const [utorid, setUtorid] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`http://localhost:3001/events/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const simplified = data.guests.map(g => ({
          id: g.user.id,
          utorid: g.user.utorid,
          name: g.user.name
        }));
        setGuests(simplified);
      });
  }, [id]);

  const handleAddGuest = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:3001/events/${id}/guests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ utorid })
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("✅ 添加成功");
      setGuests([...guests, {
        id: data.guestAdded.id,
        utorid: data.guestAdded.utorid,
        name: data.guestAdded.name
      }]);
      setUtorid('');
    } else {
      setMessage(`❌ 添加失败: ${data.error}`);
    }
  };

  const handleRemove = async (userId) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:3001/events/${id}/guests/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setGuests(guests.filter(g => g.id !== userId));
    } else {
      setMessage("❌ 移除失败");
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>👥 活动参与者管理</h2>

      <div>
        <label>添加用户 UTORid：</label>
        <input value={utorid} onChange={e => setUtorid(e.target.value)} />
        <button onClick={handleAddGuest}>添加</button>
      </div>

      {message && <p style={{ marginTop: '10px' }}>{message}</p>}

      <h3>当前参与者列表：</h3>
      <ul>
        {guests.map(guest => (
          <li key={guest.id}>
            {guest.utorid} ({guest.name || '无名'})
            <button onClick={() => handleRemove(guest.id)} style={{ marginLeft: '10px' }}>移除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
