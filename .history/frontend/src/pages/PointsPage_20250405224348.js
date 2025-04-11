import React, { useEffect, useState } from 'react';

export default function PointsPage() {
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError("未登录，无法获取积分信息。");
      setLoading(false);
      return;
    }

    fetch("http://localhost:3001/users/me", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.points !== undefined) {
          setPoints(data.points);
        } else {
          setError("无法获取积分数据。");
        }
      })
      .catch(err => setError("请求出错: " + err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>我的可用积分</h2>
      {loading && <p>加载中...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {points !== null && !loading && (
        <p style={{ fontSize: "24px", fontWeight: "bold" }}>{points} 分</p>
      )}
    </div>
  );
}
