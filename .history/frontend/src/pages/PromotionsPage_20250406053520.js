import React, { useEffect, useState } from "react";

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

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
          setError(data.error || "未找到兑换记录");
        }
      } catch (err) {
        console.error(err);
        setError("系统错误");
      }
    };
    fetchQRs();
  }, []);
  

  if (loading) return <div>加载中...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>🎁 当前可用促销</h2>
      {promotions.length === 0 ? (
        <p>目前没有可用的促销</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {promotions.map(promo => (
            <li key={promo.id} style={{
              marginBottom: "10px",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "8px"
            }}>
              <h4>{promo.name}</h4>
              <p>奖励积分: {promo.points}</p>
              {promo.minSpending && <p>最低消费: ${promo.minSpending}</p>}
              {promo.rate && <p>奖励倍率: {promo.rate}x</p>}
              <p>有效期至: {new Date(promo.endTime).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
