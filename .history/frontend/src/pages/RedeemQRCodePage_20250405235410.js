import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react'; // ⚠️ 使用正确的命名

export default function RedeemQRCodePage() {
  const [transaction, setTransaction] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQR = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:3001/users/me/redemption-qr", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setTransaction(data);
        } else {
          setError(data.error || '未找到兑换请求');
        }
      } catch (err) {
        console.error(err);
        setError("系统错误");
      }
    };
    fetchQR();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>兑换二维码</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {transaction && (
        <>
          <p>兑换请求 ID: {transaction.id}</p>
          <QRCodeSVG value={String(transaction.id)} size={256} />
        </>
      )}
    </div>
  );
}
