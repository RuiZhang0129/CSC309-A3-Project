import React, { useState } from 'react';

export default function RegisterPage() {
  const [utorid, setUtorid] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');

  const validate = () => {
    if (!/^[a-zA-Z0-9]{8}$/.test(utorid)) {
      return "utorid 必须是 8 位英文字母或数字";
    }
    if (name.length < 1 || name.length > 50) {
      return "姓名长度必须在 1 到 50 个字符之间";
    }
    if (!email.endsWith('@mail.utoronto.ca')) {
      return "必须使用多伦多大学邮箱注册";
    }
    if (password.length < 6) {
      return "密码长度必须至少 6 位";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utorid, name, email, password, role })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "注册失败");
      }

      alert(`注册成功：${data.utorid}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>注册</h2>
      <form onSubmit={handleSubmit}>
        <div><input placeholder="utorid" value={utorid} onChange={(e) => setUtorid(e.target.value)} /></div>
        <div><input placeholder="姓名" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><input placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><input placeholder="密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <div>
          <label>角色：</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">User</option>
            <option value="cashier">Cashier</option>
            <option value="manager">Manager</option>
          </select>
        </div>
        <button type="submit">注册</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
