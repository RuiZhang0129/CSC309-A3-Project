import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function MyOrganizedEventDetailPage() {
  const { id } = useParams(); // event id
  const [event, setEvent] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    capacity: '',
    pointsRemain: '',
    published: false
  });

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`http://localhost:3001/events/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!data || data.error) {
          setMessage("❌ 加载失败：" + (data.error || "未知错误"));
        } else {
          setEvent(data);
          setForm({
            name: data.name || '',
            description: data.description || '',
            location: data.location || '',
            startTime: data.startTime?.slice(0, 16) || '',
            endTime: data.endTime?.slice(0, 16) || '',
            capacity: data.capacity ?? '',
            pointsRemain: data.pointsRemain ?? 0,
            published: data.published ?? false
          });
        }
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleUpdate = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch(`http://localhost:3001/events/${id}`, {
      method: "PATCH",
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...form,
        capacity: form.capacity === '' ? null : parseInt(form.capacity, 10),
        points: parseInt(form.pointsRemain, 10),
        published: form.published
      })
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("✅ 更新成功！");
    } else {
      setMessage("❌ 更新失败：" + (data.error || "未知错误"));
    }
  };

  if (loading) return <p>加载中...</p>;
  if (!event) return <p>找不到该活动</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>📄 活动详情</h2>

      <div>
        <label>名称：</label><br />
        <input name="name" value={form.name} onChange={handleChange} /><br />

        <label>描述：</label><br />
        <input name="description" value={form.description} onChange={handleChange} /><br />

        <label>地点：</label><br />
        <input name="location" value={form.location} onChange={handleChange} /><br />

        <label>开始时间：</label><br />
        <input name="startTime" type="datetime-local" value={form.startTime} onChange={handleChange} /><br />

        <label>结束时间：</label><br />
        <input name="endTime" type="datetime-local" value={form.endTime} onChange={handleChange} /><br />

        <label>人数上限：</label><br />
        <input name="capacity" type="number" value={form.capacity} onChange={handleChange} /><br />

        <label>总积分分配：</label><br />
        <input name="pointsRemain" type="number" value={form.pointsRemain} onChange={handleChange} /><br />

        <label>是否发布：</label>
        <input type="checkbox" name="published" checked={form.published} onChange={handleChange} /><br /><br />

        <button onClick={handleUpdate}>保存修改</button>

        {message && <p style={{ marginTop: '10px' }}>{message}</p>}
      </div>
    </div>
  );
}
