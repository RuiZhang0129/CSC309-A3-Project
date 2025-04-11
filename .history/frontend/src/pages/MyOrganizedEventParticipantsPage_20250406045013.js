import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function MyOrganizedEventParticipantsPage() {
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
        const simplified = (data.guests || []).map(g => ({
          id: g.user.id,
          utorid: g.user.utorid,
          name: g.user.name
        }));
        setGuests(simplified);
      });
  }, [id]);

  const handleAddGuest = async () => {
    if (!utorid) {
      setMessage("❗请输入 UTORid");
      return;
    }

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
      setGuests(prev => [...prev, {
        id: data.guestAdded.id,
        utorid: data.guestAdded.utorid,
        name: data.guestAdded.name
      }]);
      setUtorid('');
      setMessage("✅ 添加成功");
    } else {
      setMessage(`❌ 添加失败：${data.error || '未知错误'}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>👥 活动嘉宾管理</h2>

      <div style={{ marginBottom: '10px' }}>
        <label>添加嘉宾 UTORid：</label><br />
        <input
          value={utorid}
          onChange={e => setUtorid(e.target.value)}
          placeholder="输入用户 UTORid"
        />
        <button onClick={handleAddGuest} style={{ marginLeft: '10px' }}>添加</button>
      </div>

      {message && <p>{message}</p>}

      <h3>当前嘉宾：</h3>
      <ul>
        {guests.map(guest => (
          <li key={guest.id}>
            {guest.utorid}（{guest.name || "无名"}）
          </li>
        ))}
      </ul>
    </div>
  );
}
