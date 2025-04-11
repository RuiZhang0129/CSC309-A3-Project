import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function MyOrganizedEventListPage() {
  const [events, setEvents] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [order, setOrder] = useState('desc');

  useEffect(() => {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams({
      organizedOnly: "true",
      page,
      limit,
      orderBy: "startTime",
      order
    });

    fetch(`http://localhost:3001/events?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setEvents(data.results || []);
        setCount(data.count || 0);
      });
  }, [page, order]);

  const totalPages = Math.ceil(count / limit);

  return (
    <div style={{ padding: '20px' }}>
      <h2>📋 我负责的活动</h2>

      <label>排序：</label>
      <select value={order} onChange={e => setOrder(e.target.value)} style={{ marginBottom: '10px' }}>
        <option value="desc">时间降序</option>
        <option value="asc">时间升序</option>
      </select>

      {events.length === 0 && <p>暂无活动</p>}

      {events.map(event => (
        <div key={event.id} style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '10px', marginBottom: '10px' }}>
          <p><strong>名称:</strong> {event.name}</p>
          <p><strong>时间:</strong> {new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleString()}</p>
          <p><strong>地点:</strong> {event.location}</p>
          <p><strong>人数:</strong> {event.numGuests ?? 0}</p>
          <Link to={`/my-events/${event.id}`}>查看详情</Link>
          <span style={{ margin: '0 10px' }}>|</span>
          <Link to={`/my-events/${event.id}/participants`}>管理嘉宾</Link>
          <span style={{ margin: '0 10px' }}>|</span>
          <Link to={`/my-events/${event.id}/award`}>发放积分</Link>
        </div>
      ))}

      {totalPages > 1 && (
        <div style={{ marginTop: '20px' }}>
          <strong>页码：</strong>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              style={{
                margin: '0 5px',
                backgroundColor: page === i + 1 ? '#90caf9' : '#eee'
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
