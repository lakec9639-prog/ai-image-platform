import { useState, useRef, useEffect } from 'react';
import { Input, Button, Upload, message, Typography, Space, Card } from 'antd';
import {
  SendOutlined, PictureOutlined, RobotOutlined,
  UserOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import { streamChat } from '../api/chat';

const { TextArea } = Input;

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageBase64, setImageBase64] = useState(null);
  const abortRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() && !imageBase64) return;

    const userMsg = { role: 'user', content: input, image: imageBase64 };
    const aiMsg = { role: 'assistant', content: '' };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInput('');
    setImageBase64(null);
    setLoading(true);

    const cancel = streamChat(
      input,
      imageBase64,
      (token) => {
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].content += token;
          return newMsgs;
        });
      },
      () => setLoading(false),
      () => {
        message.error('对话出错');
        setLoading(false);
      }
    );

    abortRef.current = cancel;
  };

  const handleImageUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => setImageBase64(e.target.result);
    reader.readAsDataURL(file);
    return false;
  };

  return (
    <Card style={{
      maxWidth: 860, margin: '0 auto',
      borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      border: '1px solid #f0f0f0',
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 112px)',
      padding: 0, overflow: 'hidden',
    }} bodyStyle={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #f0f0f0',
        background: '#fff',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
        }}>
          <RobotOutlined style={{ color: '#fff', fontSize: 20 }} />
        </div>
        <div>
          <Typography.Title level={5} style={{ margin: 0 }}>AI 对话</Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            由豆包 Seed 2.0 Pro 驱动
          </Typography.Text>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '24px',
        background: 'linear-gradient(180deg, #fafafe 0%, #f5f3ff 100%)',
      }}>
        {messages.length === 0 && (
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: 20,
              background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}>
              <RobotOutlined style={{ fontSize: 36, color: '#7c3aed' }} />
            </div>
            <Typography.Title level={4} style={{ color: '#374151', margin: 0 }}>
              开始对话
            </Typography.Title>
            <Typography.Text type="secondary" style={{ marginTop: 8 }}>
              输入消息或上传图片，与我交流
            </Typography.Text>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            marginBottom: 20,
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-end',
              gap: 10,
              maxWidth: '75%',
            }}>
              {/* Avatar */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #a78bfa, #7c3aed)'
                  : 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
                color: msg.role === 'user' ? '#fff' : '#374151',
                fontSize: 14,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}>
                {msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
              </div>

              {/* Message Bubble */}
              <div style={{
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
                  : '#fff',
                color: msg.role === 'user' ? '#fff' : '#374151',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.6,
              }}>
                {/* User image if any */}
                {msg.image && msg.role === 'user' && (
                  <img
                    src={msg.image}
                    alt="upload"
                    style={{
                      maxWidth: 200, maxHeight: 160, borderRadius: 8,
                      marginBottom: 8, display: 'block',
                    }}
                  />
                )}
                {msg.content || (msg.role === 'assistant' ? (
                  <span style={{ color: msg.role === 'user' ? 'rgba(255,255,255,0.8)' : '#9ca3af', fontStyle: 'italic' }}>
                    {loading ? '正在输入...' : ''}
                  </span>
                ) : '')}
                {msg.role === 'assistant' && msg.content === '' && loading && (
                  <span className="typing-dots">
                    <span>.</span><span>.</span><span>.</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid #f0f0f0',
        background: '#fff',
      }}>
        {imageBase64 && (
          <div style={{
            position: 'relative', display: 'inline-block', marginBottom: 8,
          }}>
            <img
              src={imageBase64}
              alt="preview"
              style={{ height: 60, borderRadius: 8, border: '1px solid #e0d7fc' }}
            />
            <Button
              type="text"
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => setImageBase64(null)}
              style={{
                position: 'absolute', top: -6, right: -6,
                color: '#ef4444', background: '#fff', borderRadius: '50%',
                minWidth: 20, height: 20,
              }}
            />
          </div>
        )}
        <Space.Compact style={{ width: '100%' }}>
          <Upload
            beforeUpload={handleImageUpload}
            showUploadList={false}
            accept="image/*"
          >
            <Button
              icon={<PictureOutlined />}
              style={{
                height: 48, width: 48,
                borderTopLeftRadius: 10,
                borderBottomLeftRadius: 10,
              }}
            />
          </Upload>
          <TextArea
            value={input}
            onChange={e => setInput(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="输入消息，按 Enter 发送，Shift+Enter 换行..."
            rows={1}
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{
              flex: 1, borderRadius: 0, resize: 'none',
              padding: '12px 16px', fontSize: 14,
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={loading}
            style={{
              height: 48, width: 56,
              borderTopRightRadius: 10,
              borderBottomRightRadius: 10,
              background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
              border: 'none',
            }}
          />
        </Space.Compact>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }
        .typing-dots span {
          animation: blink 1.4s infinite both;
          font-size: 20px;
          font-weight: 700;
          line-height: 1;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
      `}</style>
    </Card>
  );
}
