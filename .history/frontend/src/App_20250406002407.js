// src/App.js
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';


import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import RegisterPage from './pages/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

import PointsPage from './pages/PointsPage';
import MyQRCodePage from './pages/MyQRCodePage';
import TransferPage from './pages/TransferPage';
import RedeemPage from './pages/RedeemPage';
import RedeemQRCodePage from './pages/RedeemQRCodePage';
import PromotionsPage from './pages/PromotionsPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import TransactionsPage from './pages/TransactionsPage';

import ProtectedRoute from './components/ProtectedRoute';

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
      <Link to="/redeem" style={{ marginRight: '10px' }} onClick={() => setMenuOpen(false)}>积分兑换</Link>
      <Link to="/redeem-qr" style={{ marginRight: '10px' }} onClick={() => setMenuOpen(false)}>兑换二维码</Link>
      <Link to="/promotions" style={{ marginRight: '10px' }} onClick={() => setMenuOpen(false)}>可用促销</Link>
      <Link to="/events" style={{ marginRight: '10px' }} onClick={() => setMenuOpen(false)}>查看活动</Link>


      {!role && (
        <Link to="/login" style={{ marginRight: '10px' }}>登录</Link>
      )}
  
      {role && (
        <>
          <Link to="/points" style={{ marginRight: '10px' }}>我的积分</Link>
          <Link to="/my-qr" style={{ marginRight: '10px' }}>我的 QR 码</Link>
          <Link to="/transfer" style={{ marginRight: '10px' }}>积分转账</Link>
  
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
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password/:resetToken" element={<ResetPasswordPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/edit-profile" element={<EditProfilePage />} />
        
        {/* regular users */} 
        {/* 下面的allowedRoles={["regular"]}部分之后要加别的role */}
        <Route path="/points" element={<ProtectedRoute allowedRoles={["regular"]}><PointsPage /></ProtectedRoute>} />
        <Route path="/my-qr" element={<ProtectedRoute allowedRoles={["regular"]}><MyQRCodePage /></ProtectedRoute>} />
        <Route path="/transfer" element={<ProtectedRoute allowedRoles={["regular"]}><TransferPage /></ProtectedRoute>} />
        <Route path="/redeem" element={<ProtectedRoute allowedRoles={["regular"]}><RedeemPage /></ProtectedRoute>} />
        <Route path="/redeem-qr" element={<ProtectedRoute allowedRoles={["regular"]}><RedeemQRCodePage /></ProtectedRoute>} />
        <Route path="/promotions" element={<ProtectedRoute allowedRoles={["regular"]}><PromotionsPage /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute allowedRoles={["regular"]}><EventsPage /></ProtectedRoute>} />
        <Route path="/events/:id" element={<ProtectedRoute allowedRoles={["regular"]}><EventDetailPage /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute allowedRoles={["regular"]}><TransactionsPage /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
