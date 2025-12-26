import React, { useState } from 'react';

interface TextAnnouncerProps {
  onTextComplete: (text: string) => void;
  onClose: () => void;
}

const TextAnnouncer: React.FC<TextAnnouncerProps> = ({ onTextComplete, onClose }) => {
  const [announcementText, setAnnouncementText] = useState('');

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnnouncementText(e.target.value);
  };

  const handleSubmit = () => {
    if (announcementText.trim()) {
      onTextComplete(announcementText.trim());

    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <h3 style={{ marginBottom: '40px', color: '#333', fontSize: '24px' }}>
        文字宣言存证
      </h3>

      {/* 大字号输入框 */}
      <div style={{ marginBottom: '40px' }}>
        <input
          type="text"
          value={announcementText}
          onChange={handleTextChange}
          placeholder="请输入您的宣言..."
          style={{
            width: '100%',
            maxWidth: '600px',
            padding: '20px',
            fontSize: '28px',
            fontWeight: 'bold',
            textAlign: 'center',
            border: '2px solid #007bff',
            borderRadius: '12px',
            outline: 'none',
            transition: 'border-color 0.3s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = '#0056b3'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#007bff'}
          maxLength={100}
        />
        <div style={{
          fontSize: '14px',
          color: '#666',
          marginTop: '10px'
        }}>
          最多输入100个字符
        </div>
      </div>

      {/* 控制按钮 */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handleSubmit}
          disabled={!announcementText.trim()}
          style={{
            padding: '15px 40px',
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: announcementText.trim() ? '#007bff' : '#ccc',
            border: 'none',
            borderRadius: '8px',
            cursor: announcementText.trim() ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={(e) => {
            if (announcementText.trim()) {
              e.currentTarget.style.backgroundColor = '#0056b3';
            }
          }}
          onMouseLeave={(e) => {
            if (announcementText.trim()) {
              e.currentTarget.style.backgroundColor = '#007bff';
            }
          }}
        >
          提交宣言
        </button>

        <button
          onClick={onClose}
          style={{
            padding: '15px 40px',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#6c757d',
            backgroundColor: 'white',
            border: '2px solid #6c757d',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#6c757d';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.color = '#6c757d';
          }}
        >
          取消
        </button>
      </div>
    </div>
  );
};

export default TextAnnouncer;