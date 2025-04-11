import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function RedeemQRCodePage() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQRs = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:3001/users/me/redemptions", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setTransactions(data.results || []);
        } else {
          setError(data.error || '未找到兑换记录');
        }
      } catch (err) {
        console.error(err);
        setError("系统错误");
      }
    };
    fetchQRs();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>🎫 所有兑换请求二维码</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {transactions.length === 0 ? (
        <p>目前没有兑换记录</p>
      ) : (
        transactions.map(tx => (
          <div key={tx.id} style={{
            marginBottom: '20px',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '8px'
          }}>
            <p><strong>ID:</strong> {tx.id}</p>
            <p><strong>积分:</strong> {tx.amount}</p>
            <p><strong>状态:</strong> {tx.processed ? "✅ 已处理" : "⏳ 未处理"}</p>
            <QRCodeSVG value={String(tx.id)} size={200} />
          </div>
        ))
      )}
    </div>
  );
}
