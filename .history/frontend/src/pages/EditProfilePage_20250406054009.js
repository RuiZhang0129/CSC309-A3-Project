export default function EditProfilePage() {
    return <h1>编辑资料页面</h1>;
  }

  import React, { useEffect, useState } from 'react';

export default function EditProfilePage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    birthday: '',
    avatar: null
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:3001/users/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setForm({
          name: data.name || '',
          email: data.email || '',
          birthday: data.birthday || '',
          avatar: null
        });
      });
  }, []);

  const handleChange = e => {
    const { name, value, files } = e.target;
    if (name === "avatar") {
      setForm(prev => ({ ...prev, avatar: files[0] }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    if (form.name) formData.append("name", form.name);
    if (form.email) formData.append("email", form.email);
    if (form.birthday) formData.append("birthday", form.birthday);
    if (form.avatar) formData.append("avatar", form.avatar);

    const res = await fetch("http://localhost:3001/users/me", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("✅ 修改成功");
    } else {
      setMessage(`❌ 修改失败：${data.error || '未知错误'}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>✏️ 编辑我的资料</h2>

      <label>姓名：</label><br />
      <input name="name" value={form.name} onChange={handleChange} /><br />

      <label>邮箱：</label><br />
      <input name="email" value={form.email} onChange={handleChange} /><br />

      <label>生日：</label><br />
      <input type="date" name="birthday" value={form.birthday} onChange={handleChange} /><br />

      <label>上传头像：</label><br />
      <input type="file" name="avatar" accept="image/*" onChange={handleChange} /><br /><br />

      <button onClick={handleSubmit}>保存修改</button>
      {message && <p>{message}</p>}
    </div>
  );
}
