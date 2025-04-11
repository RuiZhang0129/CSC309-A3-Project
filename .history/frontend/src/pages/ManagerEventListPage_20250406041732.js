import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ManagerEventListPage() {
  const [events, setEvents] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
//   const [limit] = useState(10);
//   const [order, setOrder] = useState('desc');
  const [searchName, setSearchName] = useState('');
  const [published, setPublished] = useState('');
  const [type, setType] = useState('');
  const orderBy = req.query.orderBy || "startTime";
const order = req.query.order === "asc" ? "asc" : "desc";


  useEffect(() => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      page,
      limit,
      orderBy: 'startTime',
      order,
      ...(searchName && { name: searchName }),
     ...(type && { type }),
     ...(published !== "" && { published }) // ❗改这里就可以了
    });
    console.log("📡 请求参数：", params.toString());
    fetch(`http://localhost:3001/events?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setEvents(data.results || []);
        console.log("📦 活动数据返回：", data);
        setCount(data.count || 0);
      });
  }, [page, order, searchName, type, published]);

  const totalPages = Math.ceil(count / limit);

  return (
    <div style={{ padding: '20px' }}>
      <h2>📅 所有活动</h2>

      <div style={{ marginBottom: '10px' }}>
        <label>搜索名称：</label>
        <input value={searchName} onChange={(e) => setSearchName(e.target.value)} placeholder="活动名称关键词" />

        <label style={{ marginLeft: '15px' }}>排序：</label>
        <select value={order} onChange={e => setOrder(e.target.value)}>
          <option value="desc">时间降序</option>
          <option value="asc">时间升序</option>
        </select>
      </div>

      <label style={{ marginLeft: '15px' }}>发布状态：</label>
      <select value={published} onChange={e => setPublished(e.target.value)}>
        <option value="true">已发布</option>
        <option value="false">未发布</option>
      </select>

      {events.map(event => (
        <div key={event.id} style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '10px', marginBottom: '10px' }}>
          <p><strong>名称:</strong> {event.name}</p>
          <p><strong>时间:</strong> {new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleString()}</p>
          <p><strong>地点:</strong> {event.location}</p>
          <p><strong>已报名人数:</strong> {event.numGuests}</p>
          <p><strong>发布状态:</strong> {event.published ? '✅ 已发布' : '❌ 未发布'}</p>
          <p><strong>积分剩余:</strong> {event.pointsRemain}</p>
          <p><strong>已发放积分:</strong> {event.pointsAwarded}</p>
          <Link to={`/manager/events/${event.id}`}>查看详情</Link>
        </div>
      ))}

      <div style={{ marginTop: '20px' }}>
        <strong>页码：</strong>
        {[...Array(totalPages)].map((_, i) => (
          <button key={i} onClick={() => setPage(i + 1)} style={{ margin: '0 5px', backgroundColor: page === i + 1 ? '#90caf9' : '#eee' }}>
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
