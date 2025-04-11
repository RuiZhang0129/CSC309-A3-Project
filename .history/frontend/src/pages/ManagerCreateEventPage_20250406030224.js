import React, { useState } from 'react';

export default function ManagerCreateEventPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState('');
  const [points, setPoints] = useState('');
  const [message, setMessage] = useState('');

  const handleCreate = async () => {
    const token = localStorage.getItem("token");
    if (!token) return setMessage("⚠️ 请先登录");

    if (!name || !description || !location || !startTime || !endTime || !points) {
      return setMessage("❗请填写所有必填字段");
    }

    try {
      const res = await fetch("http://localhost:3001/events", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          location,
          startTime,
          endTime,
          capacity: capacity ? Number(capacity) : null,
          points: Number(points)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ 活动创建成功，ID：${data.id}`);
        setName(''); setDescription(''); setLocation(''); setStartTime(''); setEndTime(''); setCapacity(''); setPoints('');
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
      <h2>📅 创建活动</h2>
      <div>
        <label>名称：</label><br />
        <input value={name} onChange={e => setName(e.target.value)} /><br />

        <label>描述：</label><br />
        <input value={description} onChange={e => setDescription(e.target.value)} /><br />

        <label>地点：</label><br />
        <input value={location} onChange={e => setLocation(e.target.value)} /><br />

        <label>开始时间：</label><br />
        <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} /><br />

        <label>结束时间：</label><br />
        <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} /><br />

        <label>容量（可选）</label><br />
        <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} /><br />

        <label>总积分分配：</label><br />
        <input type="number" value={points} onChange={e => setPoints(e.target.value)} /><br /><br />

        <button onClick={handleCreate}>提交</button>
        {message && <p style={{ marginTop: '10px' }}>{message}</p>}
      </div>
    </div>
  );
}
