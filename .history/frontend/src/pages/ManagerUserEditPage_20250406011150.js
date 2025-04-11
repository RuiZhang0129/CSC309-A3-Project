import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function ManagerUserEditPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [verified, setVerified] = useState(false);
  const [role, setRole] = useState('regular');
  const [suspicious, setSuspicious] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`http://localhost:3001/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setVerified(data.verified);
        setRole(data.role);
        setSuspicious(data.suspicious);
      })
      .catch(() => setMessage("❌ 获取用户信息失败"));
  }, [id]);

  const handleUpdate = async () => {
    const token = localStorage.getItem('token');
    const payload = { verified, role, suspicious };

    const res = await fetch(`http://localhost:3001/users/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("✅ 用户信息已更新");
    } else {
      setMessage(`❌ 更新失败：${data.error || '未知错误'}`);
    }
  };

  if (!user) return <div>加载中...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>🛠️ 管理用户 - {user.utorid}</h2>
      <p><strong>姓名:</strong> {user.name}</p>
      <p><strong>邮箱:</strong> {user.email}</p>

      <div>
        <label>是否已验证：</label>
        <input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} />
      </div>

      <div>
        <label>角色：</label>
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="regular">regular</option>
          <option value="cashier">cashier</option>
          <option value="manager">manager</option>
          <option value="superuser">superuser</option>
        </select>
      </div>

      <div>
        <label>是否标记为可疑：</label>
        <input type="checkbox" checked={suspicious} onChange={e => setSuspicious(e.target.checked)} />
      </div>

      <button onClick={handleUpdate}>保存修改</button>
      {message && <p style={{ marginTop: '10px' }}>{message}</p>}
    </div>
  );
}
