import { useState } from 'react';
import { Card, Row, Col, Input, Select, Switch, Button, Image, message,
         Typography, Space, Tag, Tooltip } from 'antd';
import {
  SendOutlined, ClearOutlined, DownloadOutlined,
  BulbOutlined, EyeOutlined,
} from '@ant-design/icons';
import { generateT2I } from '../api/t2i';

const { TextArea } = Input;

const styleOptions = [
  { label: '📷 写实', value: '写实' },
  { label: '🎨 二次元', value: '二次元' },
  { label: '🖌️ 插画', value: '插画' },
  { label: '🎲 3D', value: '3D' },
  { label: '🌆 赛博朋克', value: '赛博朋克' },
];

const sizeOptions = [
  { label: '2048×2048', value: '2K' },
  { label: '3072×3072', value: '3K' },
  { label: '4096×4096', value: '4K' },
];

export default function T2I() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [size, setSize] = useState('2K');
  const [style, setStyle] = useState('写实');
  const [watermark, setWatermark] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      message.warning('请输入正向提示词');
      return;
    }
    setLoading(true);
    setImageUrl(null);

    try {
      const res = await generateT2I({ prompt, negativePrompt, size, style, watermark });
      if (res.code === 200) {
        setImageUrl(res.data.imageUrl);
        message.success('生成成功');
      } else {
        message.error(res.message);
      }
    } catch (e) {
      message.error('生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPrompt('');
    setNegativePrompt('');
    setSize('2K');
    setStyle('写实');
    setWatermark(false);
    setImageUrl(null);
  };

  const handleDownload = () => {
    if (imageUrl) {
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Row gutter={[24, 24]}>
        {/* Left: Config Panel */}
        <Col xs={24} lg={10}>
          <Card style={{
            borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid #f0f0f0',
          }}>
            <Space style={{ marginBottom: 20 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BulbOutlined style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <Typography.Title level={5} style={{ margin: 0 }}>参数配置</Typography.Title>
            </Space>

            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>
                正向提示词 <Tag color="purple" style={{ fontSize: 11 }}>必填</Tag>
              </Typography.Text>
              <TextArea
                rows={3}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="描述你想生成的画面..."
                maxLength={2000}
                showCount
                style={{ borderRadius: 10, resize: 'none' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>
                反向提示词 <Tag style={{ fontSize: 11 }}>可选</Tag>
              </Typography.Text>
              <TextArea
                rows={2}
                value={negativePrompt}
                onChange={e => setNegativePrompt(e.target.value)}
                placeholder="不想出现的元素..."
                style={{ borderRadius: 10, resize: 'none' }}
              />
            </div>

            <Row gutter={12} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Typography.Text style={{ display: 'block', marginBottom: 4, color: '#6b7280', fontSize: 13 }}>
                  尺寸
                </Typography.Text>
                <Select
                  value={size}
                  onChange={setSize}
                  style={{ width: '100%' }}
                  options={sizeOptions}
                  size="large"
                />
              </Col>
              <Col span={12}>
                <Typography.Text style={{ display: 'block', marginBottom: 4, color: '#6b7280', fontSize: 13 }}>
                  画风
                </Typography.Text>
                <Select
                  value={style}
                  onChange={setStyle}
                  style={{ width: '100%' }}
                  options={styleOptions}
                  size="large"
                />
              </Col>
            </Row>

            <div style={{ marginBottom: 20, padding: '12px 16px', background: '#f9fafb', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#374151', fontWeight: 500 }}>添加水印</span>
              <Switch checked={watermark} onChange={setWatermark} />
            </div>

            <Row gutter={12}>
              <Col span={18}>
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<SendOutlined />}
                  onClick={handleGenerate}
                  loading={loading}
                  style={{
                    height: 48, borderRadius: 10, fontSize: 15, fontWeight: 600,
                    background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
                  }}
                >
                  开始生成
                </Button>
              </Col>
              <Col span={6}>
                <Button
                  size="large"
                  block
                  icon={<ClearOutlined />}
                  onClick={handleReset}
                  style={{ height: 48, borderRadius: 10 }}
                >
                  重置
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Right: Preview */}
        <Col xs={24} lg={14}>
          <Card style={{
            borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            minHeight: 500, border: '1px solid #f0f0f0',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Space>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <EyeOutlined style={{ color: '#fff', fontSize: 16 }} />
                </div>
                <Typography.Title level={5} style={{ margin: 0 }}>生成预览</Typography.Title>
              </Space>
              {imageUrl && (
                <Tooltip title="在新标签页打开">
                  <Button icon={<DownloadOutlined />} onClick={handleDownload} type="text" />
                </Tooltip>
              )}
            </div>

            <div style={{
              flex: 1,
              background: imageUrl ? '#fff' : 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minHeight: 400, overflow: 'hidden',
              border: '2px dashed',
              borderColor: imageUrl ? 'transparent' : '#e0d7fc',
            }}>
              {loading && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    border: '3px solid #e0d7fc',
                    borderTopColor: '#7c3aed',
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto 16px',
                  }} />
                  <Typography.Text type="secondary" style={{ fontSize: 15 }}>
                    AI 正在创作中...
                  </Typography.Text>
                </div>
              )}
              {imageUrl && !loading && (
                <Image src={imageUrl} style={{ width: '100%', borderRadius: 8 }} />
              )}
              {!imageUrl && !loading && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 56, marginBottom: 12 }}>✨</div>
                  <Typography.Text type="secondary" style={{ fontSize: 15 }}>
                    配置参数后点击「开始生成」
                  </Typography.Text>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
