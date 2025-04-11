import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ManagerPromotionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [promotion, setPromotion] = useState(null);
  const [message, setMessage] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('automatic');
  const [minSpending, setMinSpending] = useState('');
  const [rate, setRate] = useState('');
  const [points, setPoints] = useState('');
  const [endTime, setEndTime] = useState('');
  const role = localStorage.getItem("role");

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`http://localhost:3001/promotions/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setPromotion(data);
        setName(data.name);
        setDescription(data.description);
        setType(data.type);
        setMinSpending(data.minSpending || '');
        setRate(data.rate || '');
        setPoints(data.points);
        setEndTime(data.endTime);
      });
  }, [id]);

  const handleUpdate = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:3001/promotions/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        description,
        type,
        minSpending: minSpending ? Number(minSpending) : null,
        rate: rate ? Number(rate) : null,
        points: Number(points),
        endTime
      })
    });
    const data = await res.json();
    if (res.ok) setMessage("✅ 更新成功");
    else setMessage(`❌ 更新失败：${data.error || '未知错误'}`);
  };

  const handleDelete = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:3001/promotions/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      navigate('/manager/promotions');
    } else {
      setMessage('❌ 删除失败');
    }
  };

  if (!promotion) return <div>加载中...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>🎯 管理促销 - {promotion.name}</h2>

      <label>名称：</label><br />
      <input value={name} onChange={e => setName(e.target.value)} /><br />

      <label>描述：</label><br />
      <input value={description} onChange={e => setDescription(e.target.value)} /><br />

      <label>类型：</label><br />
      <select value={type} onChange={e => setType(e.target.value)}>
        <option value="automatic">automatic</option>
        <option value="one-time">one-time</option>
      </select><br />

      <label>最低消费：</label><br />
      <input type="number" value={minSpending} onChange={e => setMinSpending(e.target.value)} /><br />

      <label>奖励倍率：</label><br />
      <input type="number" step="0.1" value={rate} onChange={e => setRate(e.target.value)} /><br />

      <label>积分：</label><br />
      <input type="number" value={points} onChange={e => setPoints(e.target.value)} /><br />

      <label>结束时间：</label><br />
      <input type="datetime-local" value={endTime?.slice(0, 16)} onChange={e => setEndTime(e.target.value)} /><br /><br />

      {["manager", "superuser"].includes(role) && (
  <>
    <button onClick={handleUpdate} style={{ marginRight: '10px' }}>保存修改</button>
    <button onClick={handleDelete} style={{ backgroundColor: '#f44336', color: 'white' }}>删除促销</button>
  </>
)}


      {message && <p style={{ marginTop: '10px' }}>{message}</p>}
    </div>
  );
}
