import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function MyOrganizedEventAwardPage() {
  const { id } = useParams(); // event id
  const [guests, setGuests] = useState([]);
  const [utorid, setUtorid] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`http://localhost:3001/events/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const simplified = (data.guests || []).map(g => ({
          utorid: g.user.utorid,
          name: g.user.name
        }));
        setGuests(simplified);
      });
  }, [id]);

  const handleAward = async (toAll = false) => {
    if (!toAll && !utorid) {
      setMessage("❗请输入 UTORid");
      return;
    }

    const parsedAmount = parseInt(amount);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      setMessage("❗请输入有效的正整数积分数");
      return;
    }

    const token = localStorage.getItem("token");

    const res = await fetch(`http://localhost:3001/events/${id}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        type: "event",
        amount: parsedAmount,
        ...(toAll ? {} : { utorid })
      })
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(toAll ? "✅ 已向所有嘉宾发放积分" : `✅ 已向 ${utorid} 发放积分`);
      setUtorid('');
      setAmount('');
    } else {
      setMessage(`❌ 发放失败：${data.error || '未知错误'}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🎁 发放活动积分</h2>

      <div style={{ marginBottom: '10px' }}>
        <label>发放积分数：</label><br />
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="如 20"
        /><br />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>单个用户 UTORid（可选）：</label><br />
        <input
          value={utorid}
          onChange={e => setUtorid(e.target.value)}
          placeholder="填写则发给该用户，不填写则发给全部嘉宾"
        /><br />
      </div>

      <div>
        <button onClick={() => handleAward(false)}>发放给指定用户</button>
        <button onClick={() => handleAward(true)} style={{ marginLeft: '10px' }}>
          发放给所有嘉宾
        </button>
      </div>

      {message && <p style={{ marginTop: '10px' }}>{message}</p>}

      <h3>嘉宾列表：</h3>
      <ul>
        {guests.map((g, i) => (
          <li key={i}>
            {g.utorid}（{g.name || "无名"})
          </li>
        ))}
      </ul>
    </div>
  );
}
