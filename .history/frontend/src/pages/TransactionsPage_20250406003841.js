import React, { useEffect, useState } from "react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [typeFilter, setTypeFilter] = useState("");
  const [order, setOrder] = useState("desc");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams({
      page,
      limit,
      ...(typeFilter && { type: typeFilter }),
      orderBy: "createdAt",
      order
    });

    fetch(`http://localhost:3001/users/me/transactions?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setTransactions(data.results || []);
        setCount(data.count || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, typeFilter, order]);

  const typeColor = (type) => {
    switch (type) {
      case "transfer": return "#e3f2fd";
      case "redemption": return "#fce4ec";
      case "purchase": return "#fff3e0";
      case "adjustment": return "#ede7f6";
      case "event": return "#f1f8e9";
      default: return "#f5f5f5";
    }
  };

  const totalPages = Math.ceil(count / limit);

  return (
    <div style={{ padding: "20px" }}>
      <h2>📒 我的交易记录</h2>

      <div style={{ marginBottom: "10px" }}>
        <label>交易类型：</label>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">全部</option>
          <option value="transfer">转账</option>
          <option value="redemption">兑换</option>
          <option value="purchase">消费</option>
          <option value="adjustment">调整</option>
          <option value="event">活动奖励</option>
        </select>

        <label style={{ marginLeft: "15px" }}>排序：</label>
        <select value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="desc">最新在前</option>
          <option value="asc">最早在前</option>
        </select>
      </div>

      {loading ? (
        <p>加载中...</p>
      ) : (
        transactions.map((tx) => (
          <div key={tx.id} style={{
            backgroundColor: typeColor(tx.type),
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "8px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)"
          }}>
            <p><strong>类型：</strong>{tx.type}</p>
            <p><strong>积分变动：</strong>{tx.amount > 0 ? '+' : ''}{tx.amount}</p>
            <p><strong>相关人：</strong>{tx.relatedUtorid || `ID: ${tx.relatedId}`}</p>
            <p><strong>备注：</strong>{tx.remark || '无'}</p>
            <p><strong>时间：</strong>{new Date(tx.createdAt).toLocaleString()}</p>
          </div>
        ))
      )}

      <div style={{ marginTop: "20px" }}>
        <strong>页码：</strong>
        {[...Array(totalPages)].map((_, i) => (
          <button key={i} onClick={() => setPage(i + 1)} style={{
            margin: "0 5px",
            backgroundColor: i + 1 === page ? "#90caf9" : "#eee"
          }}>
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
