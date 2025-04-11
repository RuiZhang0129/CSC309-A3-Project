import React, { useEffect, useState } from "react";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://localhost:3001/events?page=1&limit=10", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.results || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching events:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>加载中...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>📅 当前已发布的活动</h2>
      {events.length === 0 ? (
        <p>暂无可用活动。</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {events.map(event => (
            <li key={event.id} style={{
              marginBottom: "12px",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px"
            }}>
              <h4>{event.name}</h4>
              <p>地点: {event.location}</p>
              <p>时间: {new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleString()}</p>
              <a href={`/events/${event.id}`}>查看详情</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
