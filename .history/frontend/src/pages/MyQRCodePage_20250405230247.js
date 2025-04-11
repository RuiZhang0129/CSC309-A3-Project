import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function MyQRCodePage() {
  const [utorid, setUtorid] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("未登录，无法获取 QR 码");
      setLoading(false);
      return;
    }

    fetch("http://localhost:3001/users/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.utorid) setUtorid(data.utorid);
        else setError("未能获取 utorid");
      })
      .catch(() => setError("请求失败，请重试"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>我的 QR 码</h2>
      {loading && <p>加载中...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && utorid && (
        <div>
          <QRCode value={utorid} size={200} />
          <p style={{ marginTop: "10px" }}>utorid: {utorid}</p>
        </div>
      )}
    </div>
  );
}
