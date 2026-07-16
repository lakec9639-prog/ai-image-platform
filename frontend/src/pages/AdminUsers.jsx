import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Input, Space, Tag, message, Typography } from 'antd';
import { PlusOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons';
import { listUsers, createUser, toggleUserStatus } from '../api/admin';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listUsers({ page, size: 20, keyword });
      if (res.code === 200) {
        setUsers(res.data.content);
        setTotal(res.data.totalElements);
      }
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleCreate = async () => {
    if (!newUsername || !newPassword) {
      message.warning('请填写完整信息');
      return;
    }
    const res = await createUser({ username: newUsername, password: newPassword });
    if (res.code === 200) {
      message.success('创建成功');
      setModalOpen(false);
      setNewUsername('');
      setNewPassword('');
      fetchData();
    } else {
      message.error(res.message);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ENABLED' ? 'DISABLED' : 'ENABLED';
    const res = await toggleUserStatus(id, newStatus);
    if (res.code === 200) {
      message.success('状态已更新');
      fetchData();
    } else {
      message.error(res.message);
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '用户名', dataIndex: 'username' },
    { title: '昵称', dataIndex: 'nickname' },
    {
      title: '角色', dataIndex: 'role',
      render: r => <Tag color={r === 'ADMIN' ? 'red' : 'purple'}>{r}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status',
      render: s => (
        <Tag color={s === 'ENABLED' ? 'green' : 'red'}>
          {s === 'ENABLED' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'createdAt' },
    {
      title: '操作',
      render: (_, record) => (
        <Button
          type="link"
          danger={record.status === 'ENABLED'}
          onClick={() => handleToggleStatus(record.id, record.status)}
          style={{ fontWeight: 500 }}
        >
          {record.status === 'ENABLED' ? '禁用' : '启用'}
        </Button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card style={{
        borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        border: '1px solid #f0f0f0',
      }}>
        <Space style={{ marginBottom: 20 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TeamOutlined style={{ color: '#fff', fontSize: 18 }} />
          </div>
          <Typography.Title level={4} style={{ margin: 0 }}>账号管理</Typography.Title>
        </Space>

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          marginBottom: 16, flexWrap: 'wrap', gap: 12,
        }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            placeholder="搜索用户名"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onPressEnter={() => { setPage(0); fetchData(); }}
            style={{ width: 260, borderRadius: 8 }}
            size="large"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
            size="large"
            style={{
              borderRadius: 8,
              background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
            }}
          >
            新增用户
          </Button>
        </div>

        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page + 1,
            total,
            pageSize: 20,
            onChange: p => setPage(p - 1),
            showSizeChanger: false,
          }}
          style={{ borderRadius: 8 }}
        />
      </Card>

      <Modal
        title={<Space><PlusOutlined /> 新增用户</Space>}
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => setModalOpen(false)}
        okText="创建"
        cancelText="取消"
        okButtonProps={{
          style: {
            background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
            border: 'none',
          }
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div>
            <Typography.Text style={{ display: 'block', marginBottom: 4, color: '#6b7280' }}>
              用户名
            </Typography.Text>
            <Input
              placeholder="输入用户名"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              size="large"
              style={{ borderRadius: 8 }}
            />
          </div>
          <div>
            <Typography.Text style={{ display: 'block', marginBottom: 4, color: '#6b7280' }}>
              初始密码
            </Typography.Text>
            <Input.Password
              placeholder="输入初始密码"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              size="large"
              style={{ borderRadius: 8 }}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
}
