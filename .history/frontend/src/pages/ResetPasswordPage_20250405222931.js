import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ResetPasswordPage() {
  const { resetToken } = useParams();  // 从 URL 中读取 resetToken
  const [utorid, setUtorid] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch(`http://localhost:3001/auth/resets/${resetToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utorid, password })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "激活失败");

      alert("密码设置成功！现在你可以登录了！");
      navigate("/login");
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>设置密码以激活账户</h2>
      <form onSubmit={handleReset}>
        <div>
          <input
            placeholder="请输入你的 utorid"
            value={utorid}
            onChange={(e) => setUtorid(e.target.value)}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="设置新密码（包含大小写、数字和特殊字符）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit">设置密码并激活</button>
      </form>
      {message && <p style={{ color: "red" }}>{message}</p>}
    </div>
  );
}
