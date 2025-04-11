import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ManagerUserListPage() {
  const [users, setUsers] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [roleFilter, setRoleFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [order, setOrder] = useState('asc');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      page,
      limit,
      ...(roleFilter && { role: roleFilter }),
      ...(verifiedFilter && { verified: verifiedFilter }),
      orderBy: 'createdAt',
      order
    });

    fetch(`http://localhost:3001/users?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setUsers(data.results || []);
        setCount(data.count || 0);
      });
  }, [page, roleFilter, verifiedFilter, order]);

  const totalPages = Math.ceil(count / limit);

  return (
    <div style={{ padding: '20px' }}>
      <h2>📋 用户管理</h2>

      <div style={{ marginBottom: '10px' }}>
        <label>角色筛选：</label>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">全部</option>
          <option value="regular">regular</option>
          <option value="cashier">cashier</option>
          <option value="manager">manager</option>
          <option value="superuser">superuser</option>
        </select>

        <label style={{ marginLeft: '10px' }}>是否已验证：</label>
        <select value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value)}>
          <option value="">全部</option>
          <option value="true">已验证</option>
          <option value="false">未验证</option>
        </select>

        <label style={{ marginLeft: '10px' }}>排序：</label>
        <select value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="asc">注册时间升序</option>
          <option value="desc">注册时间降序</option>
        </select>
      </div>

      {users.map((user) => (
        <div key={user.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
          <p><strong>utorid:</strong> {user.utorid}</p>
          <p><strong>姓名:</strong> {user.name}</p>
          <p><strong>邮箱:</strong> {user.email}</p>
          <p><strong>角色:</strong> {user.role}</p>
          <p><strong>状态:</strong> {user.verified ? '✅ 已验证' : '❌ 未验证'}</p>
          <Link to={`/manager/users/${user.id}`}>管理用户</Link>
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
