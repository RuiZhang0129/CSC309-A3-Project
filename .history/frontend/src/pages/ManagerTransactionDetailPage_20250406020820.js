import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function ManagerTransactionDetailPage() {
    const { transactionId } = useParams();
  const [tx, setTx] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustRemark, setAdjustRemark] = useState('');
  const [message, setMessage] = useState('');

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`http://localhost:3001/transactions/${transactionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setTx(data))
      .catch(() => setMessage("无法加载交易信息"));
  }, [transactionId]);

  const handleMarkSuspicious = async () => {
    const res = await fetch(`http://localhost:3001/transactions/${transactionId}/suspicious`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ suspicious: true })
    });
    const data = await res.json();
    if (res.ok) setMessage("✅ 已标记为可疑交易");
    else setMessage(`❌ 标记失败：${data.error || '未知错误'}`);
  };

  
  const handleCreateAdjustment = async () => {
    const res = await fetch(`http://localhost:3001/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        utorid: tx.utorid,
        type: "adjustment",
        amount: parseInt(adjustAmount),
        relatedId: tx.id,
        remark: adjustRemark || "由管理员手动调整"
      })
    });
    const data = await res.json();
    if (res.ok) setMessage("✅ 已创建 adjustment 交易");
    else setMessage(`❌ 创建失败：${data.error || '未知错误'}`);
  };

  if (!tx) return <div>加载中...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>📄 交易详情 #{tx.id}</h2>
      <p><strong>类型:</strong> {tx.type}</p>
      <p><strong>积分:</strong> {tx.amount}</p>
      <p><strong>用户:</strong> {tx.utorid}</p>
      <p><strong>时间:</strong> {new Date(tx.createdAt).toLocaleString()}</p>
      <p><strong>可疑:</strong> {tx.suspicious ? '✅ 是' : '❌ 否'}</p>
      <p><strong>备注:</strong> {tx.remark || '无'}</p>

      <div style={{ marginTop: '20px' }}>
        <button onClick={handleMarkSuspicious} style={{ marginRight: '10px' }}>标记为可疑</button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h4>📌 创建 adjustment 调整：</h4>
        <label>积分调整数（正为加，负为减）:</label>
        <input type="number" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} /><br />
        <label>备注：</label>
        <input value={adjustRemark} onChange={e => setAdjustRemark(e.target.value)} /><br />
        <button onClick={handleCreateAdjustment}>提交调整</button>
      </div>

      {message && <p style={{ marginTop: '10px' }}>{message}</p>}
    </div>
  );
}
