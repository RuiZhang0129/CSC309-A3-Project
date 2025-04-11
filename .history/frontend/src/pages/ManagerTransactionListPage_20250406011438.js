import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ManagerTransactionListPage() {
  const [transactions, setTransactions] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [type, setType] = useState('');
  const [suspicious, setSuspicious] = useState('');
  const [order, setOrder] = useState('desc');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      page,
      limit,
      ...(type && { type }),
      ...(suspicious && { suspicious }),
      orderBy: 'createdAt',
      order
    });

    fetch(`http://localhost:3001/transactions?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setTransactions(data.results || []);
        setCount(data.count || 0);
      });
  }, [page, type, suspicious, order]);

  const totalPages = Math.ceil(count / limit);

  return (
    <div style={{ padding: '20px' }}>
      <h2>📑 所有交易记录</h2>

      <div style={{ marginBottom: '10px' }}>
        <label>类型：</label>
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="">全部</option>
          <option value="purchase">purchase</option>
          <option value="adjustment">adjustment</option>
          <option value="transfer">transfer</option>
          <option value="redemption">redemption</option>
          <option value="event">event</option>
        </select>

        <label style={{ marginLeft: '10px' }}>是否可疑：</label>
        <select value={suspicious} onChange={e => setSuspicious(e.target.value)}>
          <option value="">全部</option>
          <option value="true">是</option>
          <option value="false">否</option>
        </select>

        <label style={{ marginLeft: '10px' }}>排序：</label>
        <select value={order} onChange={e => setOrder(e.target.value)}>
          <option value="desc">时间降序</option>
          <option value="asc">时间升序</option>
        </select>
      </div>

      {transactions.map(tx => (
        <div key={tx.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '6px' }}>
          <p><strong>ID:</strong> {tx.id}</p>
          <p><strong>类型:</strong> {tx.type}</p>
          <p><strong>积分:</strong> {tx.amount}</p>
          <p><strong>用户:</strong> {tx.utorid}</p>
          <p><strong>时间:</strong> {new Date(tx.createdAt).toLocaleString()}</p>
          <p><strong>可疑:</strong> {tx.suspicious ? '✅' : '❌'}</p>
          <Link to={`/manager/transactions/${tx.id}`}>查看详情</Link>
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
