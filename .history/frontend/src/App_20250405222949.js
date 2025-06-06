// src/App.js
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';


import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import RegisterPage from './pages/RegisterPage';


function NavBar() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setMenuOpen(false);
    navigate("/login");
  };

  return (
    <nav style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
      <Link to="/" style={{ marginRight: '10px' }}>首页</Link>
      <Link to="/register" style={{ marginRight: '10px' }}>注册</Link>

      {!role && (
        <Link to="/login" style={{ marginRight: '10px' }}>登录</Link>
      )}

      {role && (
        <div style={{ display: 'inline-block', position: 'relative' }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ marginLeft: '10px' }}>
            我的账号 ⬇
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute',
              top: '35px',
              right: '0',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '5px',
              padding: '10px',
              zIndex: 1000,
              boxShadow: '0px 2px 10px rgba(0,0,0,0.1)'
            }}>
              <div style={{ marginBottom: '5px' }}>
                <Link to="/profile" onClick={() => setMenuOpen(false)}>查看资料</Link>
              </div>
              <div style={{ marginBottom: '5px' }}>
                <Link to="/edit-profile" onClick={() => setMenuOpen(false)}>编辑资料</Link>
              </div>
              <div>
                <button onClick={handleLogout}>登出</button>
              </div>
            </div>
          )}
        </div>
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
        <Route path="/register" element={<RegisterPage />} /> {/* ✅ 注册页面 */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/edit-profile" element={<EditProfilePage />} />
        <Route path="/reset-password/:resetToken" element={<ResetPasswordPage />} />

      </Routes>
    </Router>
  );
}

export default App;
