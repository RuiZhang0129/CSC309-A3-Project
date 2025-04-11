import React, { useState } from 'react';

export default function TransferPage() {
  const [utorid, setUtorid] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const handleTransfer = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('⚠️ 请先登录');
      return;
    }

    if (!utorid || !amount || parseInt(amount) <= 0) {
      setMessage('❗请输入合法的 utorid 和积分数量');
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/users/${utorid}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: "transfer",
          amount: parseInt(amount),
          remark: "手动转账"
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ 成功转账给 ${data.recipient}，交易 ID：${data.id}`);
        setUtorid('');
        setAmount('');
      } else {
        setMessage(`❌ 失败：${data.error}`);
      }

    } catch (err) {
      setMessage('❌ 系统错误');
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>积分转账</h2>
      <div>
        <label>收款人 UTORid：</label>
        <input value={utorid} onChange={(e) => setUtorid(e.target.value)} />
      </div>
      <div>
        <label>转账积分数量：</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <button onClick={handleTransfer}>确认转账</button>
      {message && <p>{message}</p>}
    </div>
  );
}
