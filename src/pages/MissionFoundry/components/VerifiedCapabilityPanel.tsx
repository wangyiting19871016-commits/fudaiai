import React, { useState, useEffect } from 'react';
import { useProtocolContext } from '../../../stores/ActiveProtocolStore';

interface VerifiedCapabilityPanelProps {
  className?: string;
}

const VerifiedCapabilityPanel: React.FC<VerifiedCapabilityPanelProps> = ({ className = '' }) => {
  const { state: protocolState } = useProtocolContext();
  const [isOpen, setIsOpen] = useState(true);

  // 如果没有已验证的协议，不显示面板
  if (!protocolState.activeProtocol || !protocolState.activeProtocol.verified) {
    return null;
  }

  const protocol = protocolState.activeProtocol;

  return (
    <div 
      className={className} 
      style={{
        backgroundColor: '#111',
        border: '1px solid #333',
        borderRadius: 8,
        padding: 20,
        marginBottom: 20,
        maxHeight: '400px',
        overflowY: 'auto'
      }}
    >
      {/* 面板标题 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        cursor: 'pointer'
      }} onClick={() => setIsOpen(!isOpen)}>
        <h3 style={{
          fontSize: 14,
          fontWeight: 'bold',
          color: '#a3a3a3',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          ✅ 已验证能力包
        </h3>
        <span style={{ color: '#666' }}>
          {isOpen ? '▼' : '▶'}
        </span>
      </div>

      {isOpen && (
        <>
          {/* API 基本信息 */}
          <div style={{
            backgroundColor: '#000',
            borderRadius: 8,
            padding: 15,
            marginBottom: 15,
            fontSize: 13,
            lineHeight: 1.6
          }}>
            <div style={{ marginBottom: 10 }}>
              <span style={{ color: '#a3a3a3', fontWeight: 'bold' }}>模型ID:</span> {protocol.model_id}
            </div>
            <div style={{ marginBottom: 10 }}>
              <span style={{ color: '#a3a3a3', fontWeight: 'bold' }}>API端点:</span> {protocol.endpoint}
            </div>
            <div>
              <span style={{ color: '#a3a3a3', fontWeight: 'bold' }}>参数数量:</span> {protocol.params_schema.length}
            </div>
          </div>

          {/* 参数快照 */}
          <div style={{ marginBottom: 15 }}>
            <h4 style={{
              fontSize: 13,
              fontWeight: 'bold',
              color: '#fff',
              margin: '0 0 10px 0'
            }}>
              参数快照
            </h4>
            <div style={{
              backgroundColor: '#000',
              borderRadius: 8,
              padding: 15,
              fontSize: 12,
              lineHeight: 1.6
            }}>
              {protocol.params_schema.map((param, index) => (
                <div key={index} style={{
                  marginBottom: 8,
                  padding: 8,
                  backgroundColor: '#111',
                  borderRadius: 4
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#a3a3a3', fontWeight: 'bold' }}>{param.name}</span>
                    <span style={{ color: '#666' }}>{param.type}</span>
                  </div>
                  <div style={{ color: '#fff' }}>
                    <strong>默认值:</strong> {JSON.stringify(param.defaultValue)}
                  </div>
                  {param.min !== undefined && param.max !== undefined && (
                    <div style={{ color: '#fff', fontSize: 11, marginTop: 2 }}>
                      范围: {param.min} - {param.max} (步长: {param.step || 1})
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 输入参数预览 */}
          <div>
            <h4 style={{
              fontSize: 13,
              fontWeight: 'bold',
              color: '#fff',
              margin: '0 0 10px 0'
            }}>
              输入参数
            </h4>
            <div style={{
              backgroundColor: '#000',
              borderRadius: 8,
              padding: 15,
              fontSize: 12,
              lineHeight: 1.6,
              fontFamily: 'monospace'
            }}>
              <pre style={{ margin: 0, color: '#fff', overflowX: 'auto' }}>
                {JSON.stringify(protocol.input_params, null, 2)}
              </pre>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VerifiedCapabilityPanel;