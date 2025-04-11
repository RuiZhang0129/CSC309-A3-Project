import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ManagerPromotionListPage() {
  const [promotions, setPromotions] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [order, setOrder] = useState('desc');
  const [searchName, setSearchName] = useState('');
  const [type, setType] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
        page,
        limit,
        orderBy: 'startTime',
        order,
        ...(searchName && { name: searchName }),
        ...(type && { type })
    });
      
    fetch(`http://localhost:3001/promotions?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setPromotions(data.results || []);
        setCount(data.count || 0);
      });
  }, [page, order, searchName, type]);

  const totalPages = Math.ceil(count / limit);

  return (
    <div style={{ padding: '20px' }}>
      <h2>📦 所有促销</h2>

    <label style={{ marginLeft: '15px' }}>类型：</label>
    <select value={type} onChange={e => setType(e.target.value)}>
    <option value="">全部</option>
    <option value="automatic">automatic</option>
    <option value="one-time">one-time</option>
    </select>

      <div style={{ marginBottom: '10px' }}>
        <label>搜索名称：</label>
        <input value={searchName} onChange={(e) => setSearchName(e.target.value)} placeholder="促销名称关键字" />

        <label style={{ marginLeft: '15px' }}>排序：</label>
        <select value={order} onChange={e => setOrder(e.target.value)}>
          <option value="desc">起始时间降序</option>
          <option value="asc">起始时间升序</option>
        </select>
      </div>

      {promotions.map(promo => (
        <div key={promo.id} style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '10px', marginBottom: '10px' }}>
          <p><strong>名称:</strong> {promo.name}</p>
          <p><strong>积分:</strong> {promo.points}</p>
          <p><strong>有效期:</strong> {new Date(promo.startTime).toLocaleString()} - {new Date(promo.endTime).toLocaleString()}</p>
          <Link to={`/manager/promotions/${promo.id}`}>查看详情</Link>
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
