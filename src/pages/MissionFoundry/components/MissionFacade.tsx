import React from 'react';

// 定义 MissionFacadeProps 类型
interface MissionFacadeProps {
  difficulty: number;
  creditScore: number;
  title?: string;
  onDifficultyChange: (difficulty: number) => void;
  onCreditScoreChange: (score: number) => void;
  onTitleChange?: (title: string) => void;
  coverUrl?: string;
  onCoverUpload?: (file: File) => void;
}

const MissionFacade: React.FC<MissionFacadeProps> = ({
  difficulty,
  creditScore,
  title = '',
  onDifficultyChange,
  onCreditScoreChange,
  onTitleChange,
  coverUrl,
  onCoverUpload
}) => {
  return (
    <div style={{
      marginBottom: '20px',
      padding: '20px',
      backgroundColor: '#111',
      border: '1px solid #222',
      borderRadius: '8px'
    }}>
      <h2 style={{
        fontSize: 18,
        fontWeight: 'bold',
        color: '#06b6d4',
        marginBottom: '20px'
      }}>📋 任务门面配置</h2>
      
      {/* 任务标题和封面上传 - 并排显示 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '20px',
        marginBottom: '20px',
        alignItems: 'center'
      }}>
        {/* 任务标题 */}
        <div style={{
          flex: 1
        }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '10px'
          }}>📝 任务标题</h3>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange?.(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#222',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              fontSize: 16,
              fontWeight: 'bold'
            }}
            placeholder="输入任务标题"
          />
        </div>
        
        {/* 封面上传 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#fff',
            whiteSpace: 'nowrap'
          }}>🖼️ 封面</h3>
          
          {/* 封面预览（Cover Thumbnail） */}
          <div style={{
            width: '120px',
            height: '68px',
            background: coverUrl ? 'transparent' : '#1a1a1a',
            borderRadius: '4px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #333',
            position: 'relative',
            cursor: onCoverUpload ? 'pointer' : 'default'
          }}>
            {coverUrl ? (
              <img 
                src={coverUrl} 
                alt="Cover" 
                style={{ 
                  width: '100%', 
                  height: '100%',
                  objectFit: 'cover' 
                }} 
              />
            ) : (
              <span style={{ 
                color: '#666',
                fontSize: 32
              }}>📷</span>
            )}
            {onCoverUpload && (
              <label style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s'
              }}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onCoverUpload?.(file);
                    }
                  }}
                />
              </label>
            )}
          </div>
          
          {/* 上传按钮 */}
          {onCoverUpload && (
            <label style={{
              padding: '10px 20px',
              backgroundColor: '#06b6d4',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 14
            }}>
              上传
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onCoverUpload?.(file);
                  }
                }}
              />
            </label>
          )}
        </div>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px'
      }}>
        {/* 任务难度（星级）配置 */}
        <div>
          <h3 style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '15px'
          }}>⭐ 任务难度（星级）</h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={difficulty}
              onChange={(e) => onDifficultyChange(parseInt(e.target.value))}
              style={{
                flex: 1,
                height: '4px',
                appearance: 'none',
                backgroundColor: '#333',
                borderRadius: '2px',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
            <span style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#f59e0b'
            }}>
              {difficulty} ★
            </span>
          </div>
        </div>
        
        {/* 信用分配置 */}
        <div>
          <h3 style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '15px'
          }}>💰 信用分奖励</h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <input
              type="number"
              min="0"
              max="1000"
              step="10"
              value={creditScore}
              onChange={(e) => onCreditScoreChange(parseInt(e.target.value))}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#222',
                border: '1px solid #444',
                borderRadius: '4px',
                color: '#fff',
                fontSize: 16,
                fontWeight: 'bold'
              }}
            />
            <span style={{
              fontSize: 16,
              color: '#10b981',
              fontWeight: 'bold'
            }}>
              信用分
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionFacade;