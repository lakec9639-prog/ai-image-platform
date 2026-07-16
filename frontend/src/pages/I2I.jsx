import { useState } from 'react';
import { Card, Row, Col, Upload, Input, Slider, Button, Image, message,
         Select, Typography, Space, Tag } from 'antd';
import {
  InboxOutlined, SendOutlined, SwapOutlined, ClearOutlined,
  BulbOutlined, PictureOutlined,
} from '@ant-design/icons';
import { uploadSourceImage, generateI2I } from '../api/i2i';

const { Dragger } = Upload;
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

export default function I2I() {
  const [sourceImageUrl, setSourceImageUrl] = useState(null);
  const [sourceImagePath, setSourceImagePath] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [strength, setStrength] = useState(0.7);
  const [size, setSize] = useState('2K');
  const [style, setStyle] = useState('写实');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);

  const handleUpload = async (file) => {
    try {
      const res = await uploadSourceImage(file);
      if (res.code === 200) {
        setSourceImageUrl(res.data.imageUrl);
        setSourceImagePath(res.data.sourceImagePath);
        message.success('上传成功');
      } else {
        message.error(res.message);
      }
    } catch {
      message.error('上传失败');
    }
    return false;
  };

  const handleGenerate = async () => {
    if (!sourceImagePath) { message.warning('请先上传底图'); return; }
    if (!prompt.trim()) { message.warning('请输入提示词'); return; }

    setLoading(true);
    setResultUrl(null);
    try {
      const res = await generateI2I({ sourceImagePath, prompt, strength, size, style });
      if (res.code === 200) {
        setResultUrl(res.data.imageUrl);
        message.success('生成成功');
      } else {
        message.error(res.message);
      }
    } catch {
      message.error('生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSourceImageUrl(null);
    setSourceImagePath(null);
    setPrompt('');
    setStrength(0.7);
    setSize('2K');
    setStyle('写实');
    setResultUrl(null);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Row gutter={[24, 24]}>
        {/* Left: Upload + Config */}
        <Col xs={24} lg={10}>
          {/* Upload Section */}
          <Card style={{
            borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid #f0f0f0', marginBottom: 24,
          }}>
            <Space style={{ marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <PictureOutlined style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <Typography.Title level={5} style={{ margin: 0 }}>上传底图</Typography.Title>
            </Space>

            <Dragger
              beforeUpload={handleUpload}
              showUploadList={false}
              accept=".jpg,.jpeg,.png,.webp"
              style={{ borderRadius: 12, background: '#fafafe' }}
            >
              <p style={{ fontSize: 48, margin: 0 }}>📤</p>
              <p style={{ color: '#374151', fontWeight: 500, margin: '8px 0 4px' }}>
                拖拽或点击上传底图
              </p>
              <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>
                支持 jpg/png/webp，最大 10MB
              </p>
            </Dragger>

            {sourceImageUrl && (
              <div style={{ marginTop: 12, borderRadius: 10, overflow: 'hidden' }}>
                <Image src={sourceImageUrl} style={{ width: '100%' }} />
              </div>
            )}
          </Card>

          {/* Config Section */}
          <Card style={{
            borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid #f0f0f0',
          }}>
            <Space style={{ marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BulbOutlined style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <Typography.Title level={5} style={{ margin: 0 }}>提示词与参数</Typography.Title>
            </Space>

            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>
                目标画面描述 <Tag color="orange" style={{ fontSize: 11 }}>必填</Tag>
              </Typography.Text>
              <TextArea
                rows={3}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="描述你想要生成的画面..."
                style={{ borderRadius: 10, resize: 'none' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography.Text strong>重绘强度</Typography.Text>
                <Tag color="purple">{strength.toFixed(1)}</Tag>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={strength}
                onChange={setStrength}
                trackStyle={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}
              />
            </div>

            <Row gutter={12} style={{ marginBottom: 20 }}>
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

        {/* Right: Result */}
        <Col xs={24} lg={14}>
          <Card style={{
            borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            minHeight: 500, border: '1px solid #f0f0f0',
          }}>
            <Space style={{ marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <SwapOutlined style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <Typography.Title level={5} style={{ margin: 0 }}>生成结果</Typography.Title>
            </Space>

            {!resultUrl && !loading && (
              <div style={{
                flex: 1, minHeight: 400,
                background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                border: '2px dashed #e0d7fc',
              }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>🎨</div>
                <Typography.Text type="secondary" style={{ fontSize: 15 }}>
                  上传底图并配置参数后开始生成
                </Typography.Text>
              </div>
            )}

            {loading && (
              <div style={{
                flex: 1, minHeight: 400,
                background: '#fafafe', borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
              }}>
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

            {resultUrl && !loading && (
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{
                    borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0',
                  }}>
                    <div style={{
                      background: '#f9fafb', padding: '8px 12px', fontWeight: 500, fontSize: 13, color: '#374151',
                    }}>
                      原图
                    </div>
                    <Image src={sourceImageUrl} style={{ width: '100%' }} />
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{
                    borderRadius: 12, overflow: 'hidden', border: '1px solid #f0f0f0',
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                      padding: '8px 12px', fontWeight: 500, fontSize: 13, color: '#7c3aed',
                    }}>
                      新图
                    </div>
                    <Image src={resultUrl} style={{ width: '100%' }} />
                  </div>
                </Col>
              </Row>
            )}
          </Card>
        </Col>
      </Row>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
