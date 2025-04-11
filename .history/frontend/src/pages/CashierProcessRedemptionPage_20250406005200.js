import React, { useState } from 'react';

export default function CashierProcessRedemptionPage() {
  const [transactionId, setTransactionId] = useState('');
  const [message, setMessage] = useState('');

  const handleProcess = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('⚠️ 请先登录');
      return;
    }

    if (!transactionId) {
      setMessage('请输入交易 ID');
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/transactions/${transactionId}/processed`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ processed: true })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ 成功处理兑换请求，交易 ID：${data.id}`);
        setTransactionId('');
      } else {
        setMessage(`❌ 处理失败：${data.error || '未知错误'}`);
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ 网络错误');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🎫 处理兑换请求</h2>
      <div>
        <label>请输入兑换交易 ID：</label>
        <input
          type="text"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
        />
      </div>
      <button onClick={handleProcess} style={{ marginTop: '10px' }}>确认处理</button>
      {message && <p style={{ marginTop: '10px' }}>{message}</p>}
    </div>
  );
}