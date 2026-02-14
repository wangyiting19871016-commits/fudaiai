/**
 * 联系客服 / 用户反馈页
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { getVisitorId } from '../../utils/visitorId';

const FeedbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) {
      message.error('请输入反馈内容');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          contact: contact.trim(),
          visitorId: getVisitorId()
        })
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        message.success('反馈已提交，感谢您的建议！');
      } else {
        message.error(data.error || '提交失败');
      }
    } catch {
      message.error('网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
      }}>
        <div style={{
          background: '#fff', borderRadius: '20px', padding: '40px', maxWidth: '400px',
          width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ margin: '0 0 12px', fontSize: '20px', color: '#333' }}>反馈已收到</h2>
          <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>
            感谢您的宝贵意见！我们会尽快查看并处理。
            {contact && '如需回复，我们会通过您留下的联系方式与您联系。'}
          </p>
          <button
            onClick={() => navigate('/festival/home')}
            style={{
              padding: '12px 32px', background: '#667eea', color: '#fff',
              border: 'none', borderRadius: '25px', fontSize: '15px', cursor: 'pointer'
            }}
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: '#fff', borderRadius: '20px', padding: '32px', maxWidth: '440px',
        width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>💬</div>
          <h2 style={{ margin: '0 0 6px', fontSize: '20px', color: '#333' }}>联系我们</h2>
          <p style={{ color: '#999', fontSize: '13px', margin: 0 }}>
            有问题或建议？随时告诉我们
          </p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', color: '#555', marginBottom: '6px', fontWeight: 500 }}>
            您的问题或建议 <span style={{ color: '#e74c3c' }}>*</span>
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="请描述您遇到的问题或想法..."
            maxLength={2000}
            style={{
              width: '100%', minHeight: '120px', padding: '12px', border: '1px solid #ddd',
              borderRadius: '12px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box',
              lineHeight: '1.6', fontFamily: 'inherit'
            }}
          />
          <div style={{ textAlign: 'right', fontSize: '12px', color: '#bbb', marginTop: '4px' }}>
            {text.length}/2000
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', color: '#555', marginBottom: '6px', fontWeight: 500 }}>
            联系方式（选填，强烈建议填写）
          </label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="微信号 / QQ / 手机号 / 邮箱"
            maxLength={200}
            style={{
              width: '100%', padding: '12px', border: '1px solid #ddd',
              borderRadius: '12px', fontSize: '14px', boxSizing: 'border-box'
            }}
          />
          <p style={{ fontSize: '12px', color: '#f39c12', margin: '6px 0 0', lineHeight: '1.5' }}>
            ⚠️ 不填联系方式我们将无法回复您，建议留下以便沟通
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !text.trim()}
          style={{
            width: '100%', padding: '14px', background: submitting ? '#aaa' : '#667eea',
            color: '#fff', border: 'none', borderRadius: '25px', fontSize: '16px',
            cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 600
          }}
        >
          {submitting ? '提交中...' : '提交反馈'}
        </button>

        <button
          onClick={() => navigate(-1)}
          style={{
            width: '100%', padding: '12px', background: 'transparent', color: '#999',
            border: 'none', fontSize: '14px', cursor: 'pointer', marginTop: '12px'
          }}
        >
          返回上一页
        </button>
      </div>
    </div>
  );
};

export default FeedbackPage;
