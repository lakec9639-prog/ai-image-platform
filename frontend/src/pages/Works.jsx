import { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Image, Button, Pagination, message,
         Empty, Space, Tag, Typography, Modal } from 'antd';
import {
  DeleteOutlined, PictureOutlined, SwapOutlined,
  CalendarOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { listWorks, deleteWork } from '../api/works';

const { confirm } = Modal;

export default function Works() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [type, setType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listWorks({ page, size: 12, type });
      if (res.code === 200) {
        setRecords(res.data.content);
        setTotal(res.data.totalElements);
      }
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, type]);

  const handleDelete = (id) => {
    confirm({
      title: '确认删除',
      icon: '🗑️',
      content: '删除后无法恢复，确定要删除该作品吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        const res = await deleteWork(id);
        if (res.code === 200) {
          message.success('删除成功');
          fetchData();
        } else {
          message.error(res.message);
        }
      },
    });
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Space>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PictureOutlined style={{ color: '#fff', fontSize: 18 }} />
          </div>
          <Typography.Title level={4} style={{ margin: 0 }}>我的作品</Typography.Title>
        </Space>
        <Select
          placeholder="全部类型"
          allowClear
          style={{ width: 140 }}
          onChange={v => { setType(v || null); setPage(0); }}
          value={type}
          options={[
            { label: '全部类型', value: '' },
            { label: '文生图', value: 'TEXT_TO_IMAGE' },
            { label: '图生图', value: 'IMAGE_TO_IMAGE' },
          ]}
          size="large"
        />
      </div>

      {/* Grid */}
      {records.length === 0 && !loading && (
        <Card style={{
          borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Empty
            image={<div style={{ fontSize: 64, marginBottom: 8 }}>🎨</div>}
            description={<span style={{ fontSize: 15 }}>暂无作品</span>}
          >
            <Typography.Text type="secondary">去文生图或图生图页面创作吧</Typography.Text>
          </Empty>
        </Card>
      )}

      <Row gutter={[20, 20]}>
        {records.map(r => (
          <Col key={r.recordId} xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              style={{
                borderRadius: 14, overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '1px solid #f0f0f0',
              }}
              bodyStyle={{ padding: 12 }}
              cover={
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                  <Image
                    src={r.imageUrl}
                    preview={{ src: r.imageUrl }}
                    style={{ height: 200, objectFit: 'cover' }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                  />
                </div>
              }
              actions={[
                <Button
                  key="preview"
                  type="text"
                  icon={<PictureOutlined />}
                  onClick={() => setPreviewUrl(r.imageUrl)}
                  style={{ color: '#7c3aed' }}
                >
                  预览
                </Button>,
                <Button
                  key="delete"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(r.recordId)}
                >
                  删除
                </Button>,
              ]}
            >
              <div style={{ marginBottom: 8 }}>
                <Tag
                  color={r.generateType === 'TEXT_TO_IMAGE' ? 'purple' : 'orange'}
                  icon={r.generateType === 'TEXT_TO_IMAGE' ? <PictureOutlined /> : <SwapOutlined />}
                >
                  {r.generateType === 'TEXT_TO_IMAGE' ? '文生图' : '图生图'}
                </Tag>
              </div>
              {r.prompt && (
                <Typography.Text
                  ellipsis
                  style={{ fontSize: 13, color: '#6b7280', display: 'block', marginBottom: 6 }}
                >
                  {r.prompt}
                </Typography.Text>
              )}
              <Space size={12}>
                <Space size={4}>
                  <CalendarOutlined style={{ fontSize: 12, color: '#9ca3af' }} />
                  <Typography.Text style={{ fontSize: 12, color: '#9ca3af' }}>
                    {r.createdAt?.substring(0, 10)}
                  </Typography.Text>
                </Space>
                <Space size={4}>
                  <ClockCircleOutlined style={{ fontSize: 12, color: '#9ca3af' }} />
                  <Typography.Text style={{ fontSize: 12, color: '#9ca3af' }}>
                    {r.createdAt?.substring(11, 16)}
                  </Typography.Text>
                </Space>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {total > 12 && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Pagination
            current={page + 1}
            total={total}
            pageSize={12}
            onChange={p => setPage(p - 1)}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
}
