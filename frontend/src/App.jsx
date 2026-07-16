import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Layout, theme } from 'antd';
import { useState } from 'react';
import Navbar from './components/Navbar';
import AuthGuard from './components/AuthGuard';
import Login from './pages/Login';
import Chat from './pages/Chat';
import T2I from './pages/T2I';
import I2I from './pages/I2I';
import Works from './pages/Works';
import AdminUsers from './pages/AdminUsers';

const { Content } = Layout;

const customTheme = {
  token: {
    colorPrimary: '#7c3aed',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#6366f1',
    borderRadius: 12,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
  },
  algorithm: theme.defaultAlgorithm,
};

export default function App() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const [user, setUser] = useState(token ? {
    nickname: localStorage.getItem('nickname'),
    role: localStorage.getItem('role'),
  } : null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    window.location.href = '/login';
  };

  const contentStyle = user
    ? { padding: '24px 32px', background: '#f5f3ff', minHeight: 'calc(100vh - 64px)' }
    : { padding: 0, minHeight: '100vh' };

  return (
    <ConfigProvider theme={customTheme}>
      <BrowserRouter>
        <Layout style={{ minHeight: '100vh' }}>
          {user && <Navbar user={user} onLogout={handleLogout} />}
          <Content style={contentStyle}>
            <Routes>
              <Route path="/login" element={
                user ? <Navigate to="/t2i" replace /> : <Login onLogin={handleLogin} />
              } />
              <Route path="/chat" element={
                <AuthGuard><Chat /></AuthGuard>
              } />
              <Route path="/t2i" element={
                <AuthGuard><T2I /></AuthGuard>
              } />
              <Route path="/i2i" element={
                <AuthGuard><I2I /></AuthGuard>
              } />
              <Route path="/works" element={
                <AuthGuard><Works /></AuthGuard>
              } />
              <Route path="/admin/users" element={
                <AuthGuard requireAdmin><AdminUsers /></AuthGuard>
              } />
              <Route path="*" element={<Navigate to="/t2i" replace />} />
            </Routes>
          </Content>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  );
}
