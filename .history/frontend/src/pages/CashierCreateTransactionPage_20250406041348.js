import React, { useState } from 'react';

export default function CashierCreateTransactionPage() {
  const [utorid, setUtorid] = useState('');
  const [type, setType] = useState('purchase');
  const [spent, setSpent] = useState('');
  const [remark, setRemark] = useState('');
  const [message, setMessage] = useState('');
  const [published, setPublished] = useState('');

  const handleCreate = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('⚠️ 请先登录');
      return;
    }

    const payload = {
      utorid,
      type,
      remark: remark || ''
    };

    if (type === 'purchase') {
      payload.spent = parseFloat(spent);
    } else if (type === 'event') {
      payload.amount = parseInt(spent);
    }

    try {
      const res = await fetch('http://localhost:3001/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ 成功创建交易 ID：${data.id}`);
        setUtorid('');
        setSpent('');
        setRemark('');
      } else {
        setMessage(`❌ 创建失败：${data.error || '未知错误'}`);
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ 网络错误');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🧾 创建交易</h2>
      <div>
      <label>是否发布：</label><br />
<select value={published} onChange={e => setPublished(e.target.value)}>
  <option value="">请选择</option>
  <option value="true">✅ 已发布</option>
  <option value="false">❌ 未发布</option>
</select><br /><br />

        <label>用户 UTORid：</label>
        <input value={utorid} onChange={e => setUtorid(e.target.value)} />
      </div>
      <div>
        <label>交易类型：</label>
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="purchase">消费（purchase）</option>
          <option value="event">活动奖励（event）</option>
        </select>
      </div>
      <div>
        <label>{type === 'purchase' ? '消费金额 $' : '积分奖励数量'}：</label>
        <input type="number" value={spent} onChange={e => setSpent(e.target.value)} />
      </div>
      <div>
        <label>备注（可选）：</label>
        <input value={remark} onChange={e => setRemark(e.target.value)} />
      </div>
      <button onClick={handleCreate}>确认创建</button>
      {message && <p style={{ marginTop: '10px' }}>{message}</p>}
    </div>
  );
}
