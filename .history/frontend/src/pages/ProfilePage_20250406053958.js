export default function ProfilePage() {
    return <h1>我的资料</h1>;
  }

  import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:3001/users/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUser(data));
  }, []);

  if (!user) return <p>加载中...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>👤 我的资料</h2>
      {user.avatarUrl && (
        <img src={`http://localhost:3001${user.avatarUrl}`} alt="头像" width="120" />
      )}
      <p><strong>用户名：</strong>{user.name}</p>
      <p><strong>UTORid：</strong>{user.utorid}</p>
      <p><strong>邮箱：</strong>{user.email}</p>
      <p><strong>生日：</strong>{user.birthday || "未填写"}</p>
      <p><strong>角色：</strong>{user.role}</p>
      <p><strong>积分：</strong>{user.points}</p>
      <p><strong>注册时间：</strong>{new Date(user.createdAt).toLocaleDateString()}</p>
      <p><strong>最近登录：</strong>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "从未登录"}</p>

      <h3>🎁 当前可用促销</h3>
      {user.promotions.length === 0 ? (
        <p>暂无促销</p>
      ) : (
        <ul>
          {user.promotions.map(p => (
            <li key={p.id}>
              {p.name}（积分：{p.points}）到期：{new Date(p.endTime).toLocaleDateString()}
            </li>
          ))}
        </ul>
      )}

      <Link to="/edit-profile">✏️ 编辑我的资料</Link>
    </div>
  );
}
