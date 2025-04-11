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

import CashierCreateTransactionPage from './pages/CashierCreateTransactionPage';
import CashierProcessRedemptionPage from './pages/CashierProcessRedemptionPage';

import ManagerUserListPage from './pages/ManagerUserListPage';
import ManagerUserEditPage from './pages/ManagerUserEditPage';
import ManagerTransactionListPage from './pages/ManagerTransactionListPage';
import ManagerTransactionDetailPage from './pages/ManagerTransactionDetailPage';
import ManagerCreatePromotionPage from './pages/ManagerCreatePromotionPage';
import ManagerPromotionListPage from './pages/ManagerPromotionListPage';
import ManagerPromotionDetailPage from './pages/ManagerPromotionDetailPage';
import ManagerCreateEventPage from './pages/ManagerCreateEventPage';
import ManagerEventListPage from './pages/ManagerEventListPage';
import ManagerEventDetailPage from './pages/ManagerEventDetailPage';
import ManagerEventParticipantsPage from './pages/ManagerEventParticipantsPage';

import MyOrganizedEventListPage from './pages/MyOrganizedEventListPage';
import MyOrganizedEventDetailPage from './pages/MyOrganizedEventDetailPage';
import MyOrganizedEventParticipantsPage from './pages/MyOrganizedEventParticipantsPage';
import MyOrganizedEventAwardPage from './pages/MyOrganizedEventAwardPage';

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

      {["cashier", "manager", "superuser"].includes(role) && (
        <>
          <Link to="/cashier/create-transaction" style={{ marginRight: '10px' }}>创建交易</Link>
          <Link to="/cashier/process-redemption" style={{ marginRight: '10px' }}>处理兑换</Link>
        </>
      )}

      {["manager", "superuser"].includes(role) && (
        <>
          <Link to="/manager/users" style={{ marginRight: '10px' }}>用户管理</Link>
          <Link to="/manager/transactions" style={{ marginRight: '10px' }}>交易管理</Link>
          <Link to="/manager/promotions" style={{ marginRight: '10px' }}>促销管理</Link>
          <Link to="/manager/promotions/create" style={{ marginRight: '10px' }}>创建促销</Link>
          <Link to="/manager/events" style={{ marginRight: '10px' }}>活动管理</Link>
          <Link to="/manager/events/create" style={{ marginRight: '10px' }}>创建活动</Link>
        </>
      )}

      {role && (
        <>
          <Link to="/redeem" style={{ marginRight: '10px' }} onClick={() => setMenuOpen(false)}>积分兑换</Link>
          <Link to="/redeem-qr" style={{ marginRight: '10px' }} onClick={() => setMenuOpen(false)}>兑换二维码</Link>
          <Link to="/promotions" style={{ marginRight: '10px' }} onClick={() => setMenuOpen(false)}>可用促销</Link>
          <Link to="/events" style={{ marginRight: '10px' }} onClick={() => setMenuOpen(false)}>查看活动</Link>
          {/* <Link to="/events/:id" style={{ marginRight: '10px' }} onClick={() => setMenuOpen(false)}>查看活动详情</Link> */}
          <Link to="/transactions" style={{ marginRight: '10px' }} onClick={() => setMenuOpen(false)}>交易记录</Link>
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
        
        {/* Regular */} 
        <Route path="/points" element={<ProtectedRoute allowedRoles={["regular","cashier", "manager", "superuser"]}><PointsPage /></ProtectedRoute>} />
        <Route path="/my-qr" element={<ProtectedRoute allowedRoles={["regular","cashier", "manager", "superuser"]}><MyQRCodePage /></ProtectedRoute>} />
        <Route path="/transfer" element={<ProtectedRoute allowedRoles={["regular","cashier", "manager", "superuser"]}><TransferPage /></ProtectedRoute>} />
        <Route path="/redeem" element={<ProtectedRoute allowedRoles={["regular","cashier", "manager", "superuser"]}><RedeemPage /></ProtectedRoute>} />
        <Route path="/redeem-qr" element={<ProtectedRoute allowedRoles={["regular","cashier", "manager", "superuser"]}><RedeemQRCodePage /></ProtectedRoute>} />
        <Route path="/promotions" element={<ProtectedRoute allowedRoles={["regular","cashier", "manager", "superuser"]}><PromotionsPage /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute allowedRoles={["regular","cashier", "manager", "superuser"]}><EventsPage /></ProtectedRoute>} />
        <Route path="/events/:id" element={<ProtectedRoute allowedRoles={["regular","cashier", "manager", "superuser"]}><EventDetailPage /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute allowedRoles={["regular","cashier", "manager", "superuser"]}><TransactionsPage /></ProtectedRoute>} />
        {/* Cashier */}
        <Route path="/cashier/create-transaction" element={<ProtectedRoute allowedRoles={["cashier", "manager", "superuser"]}><CashierCreateTransactionPage /></ProtectedRoute>} />
        <Route path="/cashier/process-redemption" element={<ProtectedRoute allowedRoles={["cashier", "manager", "superuser"]}><CashierProcessRedemptionPage /></ProtectedRoute>} />
        {/* Manager */}
        <Route path="/manager/users" element={<ProtectedRoute allowedRoles={["manager", "superuser"]}><ManagerUserListPage /></ProtectedRoute>} />
        <Route path="/manager/users/:id" element={<ProtectedRoute allowedRoles={["manager", "superuser"]}><ManagerUserEditPage /></ProtectedRoute>} />
        <Route path="/manager/transactions" element={<ProtectedRoute allowedRoles={["manager", "superuser"]}><ManagerTransactionListPage /></ProtectedRoute>} />
        <Route path="/manager/transactions/:id" element={<ProtectedRoute allowedRoles={["manager", "superuser"]}><ManagerTransactionDetailPage /></ProtectedRoute>} />
        <Route path="/manager/promotions/create" element={<ProtectedRoute allowedRoles={["manager", "superuser"]}><ManagerCreatePromotionPage /></ProtectedRoute>} />
        <Route path="/manager/promotions" element={<ProtectedRoute allowedRoles={["manager", "superuser"]}><ManagerPromotionListPage /></ProtectedRoute>} />
        <Route path="/manager/promotions/:id" element={<ProtectedRoute allowedRoles={["manager", "superuser"]}><ManagerPromotionDetailPage /></ProtectedRoute>} />
        <Route path="/manager/events/create" element={<ProtectedRoute allowedRoles={["manager", "superuser"]}><ManagerCreateEventPage /></ProtectedRoute>} />
        <Route path="/manager/events" element={<ProtectedRoute allowedRoles={["manager", "superuser"]}><ManagerEventListPage /></ProtectedRoute>} />
        <Route path="/manager/events/:id" element={<ProtectedRoute allowedRoles={["manager", "superuser"]}><ManagerEventDetailPage /></ProtectedRoute>} />
        <Route path="/manager/events/:id/participants" element={<ProtectedRoute allowedRoles={["manager", "superuser"]}><ManagerEventParticipantsPage /></ProtectedRoute>} />
        {/*Event Organizer (and all Managers) */}
        <Route path="/my-events" element={<ProtectedRoute allowedRoles={["organizer", "manager", "superuser"]}><MyOrganizedEventListPage /></ProtectedRoute>} />
        <Route path="/my-events/:id" element={<ProtectedRoute allowedRoles={["organizer", "manager", "superuser"]}><MyOrganizedEventDetailPage /></ProtectedRoute>} />
        <Route path="/my-events/:id/participants" element={<ProtectedRoute allowedRoles={["organizer", "manager", "superuser"]}><MyOrganizedEventParticipantsPage /></ProtectedRoute>} />
        <Route path="/my-events/:id/award" element={<ProtectedRoute allowedRoles={["organizer", "manager", "superuser"]}><MyOrganizedEventAwardPage /></ProtectedRoute>} />

      </Routes>
    </Router>
  );
}

export default App;
