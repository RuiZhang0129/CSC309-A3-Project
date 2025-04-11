import React, { useState } from 'react';

export default function ManagerCreatePromotionPage() {
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [minSpending, setMinSpending] = useState('');
  const [rate, setRate] = useState('');
  const [points, setPoints] = useState('');
  const [message, setMessage] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('automatic');

  const handleCreate = async () => {
    const token = localStorage.getItem('token');
    if (!token) return setMessage("⚠️ 请先登录");

    if (!name || !description || !type || !startTime || !endTime || !points) {
        return setMessage("❗请填写所有必填字段");
    }

    try {
      const res = await fetch("http://localhost:3001/promotions", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            name,
            description,
            type,
            startTime,
            endTime,
            minSpending: minSpending ? Number(minSpending) : null,
            rate: rate ? Number(rate) : null,
            points: Number(points)
        })          
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ 成功创建促销 ID：${data.id}`);
        setName('');
        setDescription('');
        setType('automatic');
        setStartTime('');
        setEndTime('');
        setMinSpending('');
        setRate('');
        setPoints('');
      } else {
        setMessage(`❌ 创建失败：${data.error || '未知错误'}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ 网络错误");
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🎁 创建促销</h2>
      <div>
        <label>促销名称（必填）</label><br />
        <input value={name} onChange={e => setName(e.target.value)} /><br />

        <label>开始时间（ISO 格式）</label><br />
        <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} /><br />

        <label>促销描述（必填）</label><br />
        <input value={description} onChange={e => setDescription(e.target.value)} /><br />

        <label>促销类型（必填）</label><br />
        <select value={type} onChange={e => setType(e.target.value)}>
        <option value="automatic">automatic</option>
        <option value="one-time">one-time</option>
        </select><br />

        <label>结束时间（ISO 格式）</label><br />
        <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} /><br />

        <label>最低消费金额（可选）</label><br />
        <input type="number" value={minSpending} onChange={e => setMinSpending(e.target.value)} /><br />

        <label>奖励倍率（可选）</label><br />
        <input type="number" step="0.1" value={rate} onChange={e => setRate(e.target.value)} /><br />

        <label>基础积分（必填）</label><br />
        <input type="number" value={points} onChange={e => setPoints(e.target.value)} /><br />

        <button onClick={handleCreate}>提交促销</button>
        {message && <p style={{ marginTop: '10px' }}>{message}</p>}
      </div>
    </div>
  );
}