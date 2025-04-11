// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';

import HomePage from './HomePage';
import LoginPage from './LoginPage';
import ProfilePage from './ProfilePage';
import EditProfilePage from './EditProfilePage';
import RegisterPage from './RegisterPage';

<Route path="/register" element={<RegisterPage />} />


function NavBar() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "user"; // 默认角色 user

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <nav style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
      <Link to="/" style={{ marginRight: '10px' }}>首页</Link>
      {role && (
        <>
          <Link to="/profile" style={{ marginRight: '10px' }}>我的资料</Link>
          <Link to="/edit-profile" style={{ marginRight: '10px' }}>编辑资料</Link>
          <button onClick={handleLogout}>登出</button>
        </>
      )}
    </nav>
  );
}

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/edit-profile" element={<EditProfilePage />} />
      </Routes>
    </Router>
  );
}



export default App;
