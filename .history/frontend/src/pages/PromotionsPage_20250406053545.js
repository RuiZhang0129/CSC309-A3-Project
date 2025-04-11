import React, { useEffect, useState } from "react";

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:3001/promotions", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setPromotions(data.results || []);
        setLoading(false);
        console.log("🧪 后端返回的促销数据：", data.results);
      })
      .catch(err => {
        console.error("Error fetching promotions:", err);
        setLoading(false);
      });
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
