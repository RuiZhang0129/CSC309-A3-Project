import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/EditProfilePage.css';
import bowImage from './image/bow.png';//[1] 58pic, “Bow drawn clipart transparent PNG HD, hand drawn wind cute cartoon bow, Childrens Day, six one, Bow PNG image for free download,” Pngtree, https://pngtree.com/freepng/hand-drawn-wind-cute-cartoon-bow_5469614.html (accessed Apr. 9, 2025). 
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function EditProfilePage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    birthday: '',
    avatar: null
  });
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    //fetch("http://localhost:3001/users/me", {
      fetch(`${BACKEND_URL}/users/me`, {
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

    //const res = await fetch("http://localhost:3001/users/me", {
      const res = await fetch(`${BACKEND_URL}/users/me`, {

      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("✅ Successfully updated");
    } else {
      setMessage(`❌ Update failed: ${data.error || 'Unknown error'}`);
    }
  };

  return (
    <div className="edit-container">
      <img src={bowImage} alt="bow" className="edit-bow" />
      <h2 className="edit-title">🎀 Edit My Profile</h2>

      <div className="form-group">
        <label>Name:</label>
        <input name="name" value={form.name} onChange={handleChange} className="form-input" />
      </div>

      <div className="form-group">
        <label>Email:</label>
        <input name="email" value={form.email} onChange={handleChange} className="form-input" />
      </div>

      <div className="form-group">
        <label>Birthday:</label>
        <input type="date" name="birthday" value={form.birthday} onChange={handleChange} className="form-input" />
      </div>

      <div className="form-group">
        <label>Upload Avatar:</label>
        <input type="file" name="avatar" accept="image/*" onChange={handleChange} className="form-file" />
      </div>

      <div className="form-group">
        <label>Change Password?</label>
        <button onClick={() => navigate('/change-password')} className="password-change-btn"> Change Password </button>
      </div>

      <button onClick={handleSubmit} className="form-button">Save Changes</button>
      <button onClick={() => navigate('/profile')} className="back-to-content-btn">
        🔙 Back
      </button>

    </div>
  );
}
