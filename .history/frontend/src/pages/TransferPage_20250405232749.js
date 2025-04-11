import React, { useState } from 'react';

export default function TransferPage() {
  const [recipientUtorid, setRecipientUtorid] = useState('');
  const [points, setPoints] = useState('');
  const [message, setMessage] = useState(null);

  const handleTransfer = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("请先登录！");
      return;
    }

    const res = await fetch("http://localhost:3001/transactions/transfer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        recipientUtorid,
        points: parseInt(points)
      })
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("✅ 积分转账成功！");
      setRecipientUtorid('');
      setPoints('');
    } else {
      setMessage(`❌ 转账失败: ${data.error || '未知错误'}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>积分转账</h2>
      <div style={{ marginBottom: '10px' }}>
        <label>收款方 UTORid：</label>
        <input
          type="text"
          value={recipientUtorid}
          onChange={(e) => setRecipientUtorid(e.target.value)}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>转账积分：</label>
        <input
          type="number"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
        />
      </div>
      <button onClick={handleTransfer}>确认转账</button>
      {message && <p style={{ marginTop: '10px' }}>{message}</p>}
    </div>
  );
}
