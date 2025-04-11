// src/RegisterPage.js
import React, { useState } from 'react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      alert(`注册成功：${data.email}`);
    } catch (err) {
      alert('注册失败');
      console.error(err);
    }
  };

  return (
    <div>
      <h2>注册</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="USER">User</option>
          <option value="CASHIER">Cashier</option>
          <option value="MANAGER">Manager</option>
        </select>
        <button type="submit">注册</button>
      </form>
    </div>
  );
}
