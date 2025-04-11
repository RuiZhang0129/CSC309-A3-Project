import React, { useState } from 'react';

export default function RedeemPage() {
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [message, setMessage] = useState('');

  const handleRedeem = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage("⚠️ 请先登录");
      return;
    }

    try {
      const res = await fetch("http://localhost:3001/users/me/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          type: "redemption",
          amount: parseInt(amount),
          remark
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ 兑换请求提交成功！交易 ID：${data.id}`);
        setAmount('');
        setRemark('');
      } else {
        setMessage(`❌ 失败：${data.error}`);
      }

    } catch (err) {
      console.error("Redeem error:", err);
      setMessage("❌ 系统错误");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>积分兑换</h2>
      <div>
        <label>兑换积分数量：</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div>
        <label>备注（可选）：</label>
        <input
          type="text"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
        />
      </div>
      <button onClick={handleRedeem}>提交兑换请求</button>
      {message && <p>{message}</p>}
    </div>
  );
}
