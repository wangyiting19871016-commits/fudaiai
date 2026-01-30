import React, { useState } from 'react';
import { useCapabilityStore } from '../../../stores/CapabilityStore';
import { CapabilityManifest } from '../../../types/Protocol';

interface ValidatedCapabilitiesPanelProps {
  className?: string;
  onCapabilitySelect?: (capability: CapabilityManifest) => void;
}

const ValidatedCapabilitiesPanel: React.FC<ValidatedCapabilitiesPanelProps> = ({ 
  className = '', 
  onCapabilitySelect 
}) => {
  const { capabilities, deleteCapability } = useCapabilityStore();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div 
      className={className} 
      style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '8px',
        marginBottom: '20px',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      {/* 面板标题栏 */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: '#222',
          cursor: 'pointer',
          borderBottom: isOpen ? '1px solid #333' : 'none'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#a3a3a3',
          fontWeight: 'bold',
          fontSize: '16px'
        }}>
          🏭 能力库 (Capability Library)
        </div>
        <div style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
          color: '#666'
        }}>
          ▼
        </div>
      </div>

      {/* 面板内容 */}
      {isOpen && (
        <div style={{ padding: '16px' }}>
          {capabilities.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {capabilities.map((capability) => (
                <div 
                  key={capability.meta.id}
                  style={{
                    backgroundColor: '#222',
                    borderRadius: '6px',
                    border: '1px solid #333',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onClick={() => onCapabilitySelect && onCapabilitySelect(capability)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#a3a3a3';
                    e.currentTarget.style.backgroundColor = '#2a2a2a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#333';
                    e.currentTarget.style.backgroundColor = '#222';
                  }}
                >
                  {/* Capability Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>
                      {capability.meta.name}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: '#666',
                      backgroundColor: '#111',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      v{capability.meta.version}
                    </div>
                  </div>

                  {/* Protocol & Engine Info */}
                  <div style={{
                    fontSize: '12px',
                    color: '#aaa',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ color: '#a3a3a3' }}>⚡</span>
                    {capability.routing.model_id}
                  </div>

                  {/* Description */}
                  {capability.meta.description && (
                    <div style={{
                      fontSize: '12px',
                      color: '#666',
                      fontStyle: 'italic',
                      marginBottom: '8px'
                    }}>
                      {capability.meta.description}
                    </div>
                  )}

                  {/* Tags Preview */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px'
                  }}>
                    {(capability.meta.tags || []).map(tag => (
                      <span key={tag} style={{
                        fontSize: '10px',
                        color: '#888',
                        backgroundColor: '#1a1a1a',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid #333'
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('❓ 确认要移除这个能力包吗？\n\n注意：这将无法撤销。')) {
                        deleteCapability(capability.meta.id);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'none',
                      border: 'none',
                      color: '#666',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '4px',
                      lineHeight: 1,
                      zIndex: 10
                    }}
                    title="移除能力包"
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              color: '#666',
              fontSize: '14px',
              padding: '20px 0',
              border: '1px dashed #333',
              borderRadius: '6px'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📭</div>
              暂无已验证能力
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#444' }}>
                请前往 P4LAB (实验室) <br/> 导出能力包
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ValidatedCapabilitiesPanel;
