import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ManagerEventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [message, setMessage] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState('');
  const [points, setPoints] = useState('');
  const [published, setPublished] = useState(false);
  const [type, setType] = useState('');
  const [minSpending, setMinSpending] = useState('');
  const [rate, setRate] = useState('');

  

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`http://localhost:3001/events/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setEvent(data);
        setName(data.name);
        setDescription(data.description);
        setLocation(data.location);
        setEndTime(data.endTime);
        setCapacity(data.capacity ?? '');
        setPoints(data.pointsRemain + data.pointsAwarded);
        setPublished(data.published);
        setType(data.type || '');
        setMinSpending(data.minSpending ?? '');
        setRate(data.rate ?? '');
      });
  }, [id]);

  const handleUpdate = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:3001/events/${id}`, {
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
        endTime,
        published: published ? true : undefined
      })
      
    });
    const data = await res.json();
    if (res.ok) setMessage("✅ 修改成功");
    else setMessage(`❌ 修改失败：${data.error || '未知错误'}`);
  };

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:3001/events/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      navigate('/manager/events');
    } else {
      setMessage('❌ 删除失败');
    }
  };

  if (!event) return <div>加载中...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>📄 活动详情 - {event.name}</h2>

      <label>名称：</label><br />
      <input value={name} onChange={e => setName(e.target.value)} /><br />

      <label>描述：</label><br />
      <input value={description} onChange={e => setDescription(e.target.value)} /><br />

      <label>地点：</label><br />
      <input value={location} onChange={e => setLocation(e.target.value)} /><br />

      <label>结束时间：</label><br />
      <input type="datetime-local" value={endTime?.slice(0, 16)} onChange={e => setEndTime(e.target.value)} /><br />

      <label>容量（可选）：</label><br />
      <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} /><br />

      <label>总积分（manager 可更新）：</label><br />
      <input type="number" value={points} onChange={e => setPoints(e.target.value)} /><br />

      <label>是否发布：</label>
        <input
        type="checkbox"
        checked={published}
        disabled={published} // ✅ 发布后不可取消
        onChange={e => setPublished(e.target.checked)}
        />



      <button onClick={handleUpdate} style={{ marginRight: '10px' }}>保存修改</button>
      <button onClick={handleDelete} style={{ backgroundColor: '#f44336', color: 'white' }}>删除活动</button>

      {message && <p style={{ marginTop: '10px' }}>{message}</p>}
    </div>
  );
}
