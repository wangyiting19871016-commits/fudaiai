import React from 'react';
import { useAssetStore } from '../../../stores/AssetStore';

interface P2PreviewModalProps {
  show: boolean;
  onClose: () => void;
  draftMission: any;
  instruction: string;
}

export const P2PreviewModal: React.FC<P2PreviewModalProps> = ({
  show,
  onClose,
  draftMission,
  instruction
}) => {
  const { getAsset } = useAssetStore();

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '2px solid #8b5cf6',
        borderRadius: '16px',
        padding: '32px',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 0 40px rgba(139, 92, 246, 0.3)'
      }}>
        {/* 模态框头部 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid #333'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#8b5cf6',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            📱 P2预览 - 用户视角
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '12px',
              backgroundColor: '#330000',
              border: '1px solid #660000',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>
        
        {/* 任务基本信息 */}
        <div style={{
          marginBottom: '24px',
          padding: '20px',
          backgroundColor: '#222',
          borderRadius: '12px',
          border: '1px solid #333'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '12px'
          }}>
            {draftMission.title || '未命名任务'}
          </h3>
          <p style={{
            fontSize: '16px',
            color: '#aaa',
            margin: 0
          }}>
            {instruction || '无导向语'}
          </p>
        </div>
        
        {/* 步骤卡片流 - 模拟P2视角 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {draftMission.steps.map((step: any, index: number) => (
            <div key={index} style={{
              backgroundColor: '#222',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #333',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}>
              {/* 步骤头部 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#fff'
                }}>
                  {index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#fff',
                    margin: 0
                  }}>
                    {step.title || `步骤 ${index + 1}`}
                  </h4>
                  {index === 0 && (
                    <span style={{
                      fontSize: '12px',
                      color: '#f59e0b',
                      backgroundColor: 'rgba(245, 158, 11, 0.2)',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      marginLeft: '8px'
                    }}>
                      🏠 P1_Facade_GIF
                    </span>
                  )}
                </div>
              </div>
              
              {/* 步骤素材展示 */}
              {step.mediaAssets && step.mediaAssets.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  {step.mediaAssets.map((assetId: string, assetIndex: number) => {
                    const asset = getAsset(assetId);
                    if (!asset) return null;
                    return (
                      <div key={assetId} style={{
                        width: '100%',
                        aspectRatio: '1/1',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#0a0a0a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <img
                          src={asset.url}
                          alt={`素材 ${assetIndex + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* 步骤指导语 */}
              <div style={{
                backgroundColor: '#333',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: '#ddd',
                  margin: 0,
                  lineHeight: '1.6'
                }}>
                  {step.instruction || step.action_instruction || step.desc || '无具体指导'}
                </p>
              </div>
              
              {/* 步骤类型和状态 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                color: '#666'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>类型：{step.actionType || 'Preset'}</span>
                  {step.aestheticParams && (
                    <span>参数：{Object.keys(step.aestheticParams).length}个</span>
                  )}
                </div>
                <span style={{
                  color: step.isCompleted ? '#a3a3a3' : '#f59e0b',
                  fontWeight: 'bold'
                }}>
                  {step.isCompleted ? '✅ 已完成' : '⏳ 进行中'}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {/* 模态框底部 */}
        <div style={{
          marginTop: '32px',
          display: 'flex',
          justifyContent: 'center',
          gap: '16px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '14px 32px',
              backgroundColor: '#444',
              color: '#fff',
              border: '1px solid #666',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
              transition: 'all 0.3s ease'
            }}
          >
            关闭预览
          </button>
        </div>
      </div>
    </div>
  );
};
