// src/pages/TransferPage.js
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

    try {
      // 获取接收者 ID（需要后端支持 name= 查询）
      const userRes = await fetch(`http://localhost:3001/users?name=${utorid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = await userRes.json();
      const recipient = userData.results?.[0];
      if (!recipient) {
        setMessage('❌ 找不到该 utorid 的用户');
        return;
      }

      // 发起 transfer 请求
      const res = await fetch(`http://localhost:3001/users/${recipient.id}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: "transfer",
          amount: parseInt(amount),
          remark: "前端手动转账"
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ 转账成功！交易 ID：${data.id}`);
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
