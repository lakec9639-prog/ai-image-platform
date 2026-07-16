import { Layout, Menu, Dropdown, Button, Space } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserOutlined, LogoutOutlined, MessageOutlined, PictureOutlined,
  SwapOutlined, AppstoreOutlined, TeamOutlined, SparklesOutlined,
} from '@ant-design/icons';

const { Header } = Layout;

const menuItems = [
  { key: '/chat', label: 'AI对话', icon: <MessageOutlined /> },
  { key: '/t2i', label: '文生图', icon: <PictureOutlined /> },
  { key: '/i2i', label: '图生图', icon: <SwapOutlined /> },
  { key: '/works', label: '我的作品', icon: <AppstoreOutlined /> },
];

const adminItem = { key: '/admin/users', label: '账号管理', icon: <TeamOutlined /> };

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const items = user?.role === 'ADMIN' ? [...menuItems, adminItem] : menuItems;

  const logoStyle = {
    display: 'flex', alignItems: 'center', gap: 8,
    color: '#fff', fontSize: 18, fontWeight: 700,
    marginRight: 32, cursor: 'pointer', whiteSpace: 'nowrap',
    background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  };

  return (
    <Header style={{
      display: 'flex', alignItems: 'center',
      background: '#fff',
      borderBottom: '1px solid #f0f0f0',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      height: 64, padding: '0 24px', position: 'sticky', top: 0,
      zIndex: 100,
    }}>
      <div style={logoStyle} onClick={() => navigate('/t2i')}>
        <SparklesOutlined style={{ fontSize: 24, WebkitTextFillColor: '#7c3aed' }} />
        <span>AI 生图平台</span>
      </div>
      <Menu
        theme="light"
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={items}
        onClick={({ key }) => navigate(key)}
        style={{
          flex: 1, minWidth: 0, borderBottom: 'none',
          fontWeight: 500,
        }}
      />
      <Dropdown menu={{
        items: [{
          key: 'logout', icon: <LogoutOutlined />, label: '退出登录',
          onClick: onLogout
        }]
      }}>
        <Button type="text" style={{
          height: 40, borderRadius: 8,
          color: '#374151', fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Space>
            <span style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UserOutlined style={{ color: '#fff', fontSize: 14 }} />
            </span>
            <span>{user?.nickname || '用户'}</span>
          </Space>
        </Button>
      </Dropdown>
    </Header>
  );
}
