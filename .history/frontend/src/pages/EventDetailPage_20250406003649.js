import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`http://localhost:3001/events/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError("该活动不存在或未发布");
        } else {
          setEvent(data);
        }
      })
      .catch(err => {
        setError("无法加载活动信息");
      });
  }, [id]);
  

  const handleRSVP = () => {
    const token = localStorage.getItem("token");
    fetch(`http://localhost:3001/events/${id}/guests/me`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("报名失败");
        return res.json();
      })
      .then(data => {
        setRsvpSuccess(true);
      })
      .catch(err => setError("报名失败，可能是已报名或活动已结束"));
  };

  if (error) return <div>{error}</div>;
  if (!event) return <div>加载中...</div>;

  return (
    <div>
      <h2>{event.name}</h2>
      <p><strong>地点：</strong>{event.location}</p>
      <p><strong>开始时间：</strong>{new Date(event.startTime).toLocaleString()}</p>
      <p><strong>结束时间：</strong>{new Date(event.endTime).toLocaleString()}</p>
      <p><strong>活动介绍：</strong>{event.description}</p>
      <p><strong>当前报名人数：</strong>{event.numGuests}</p>

      {rsvpSuccess ? (
        <p style={{ color: 'green' }}>✅ 报名成功！</p>
      ) : (
        <button onClick={handleRSVP}>我要参加</button>
      )}
    </div>
  );
}
