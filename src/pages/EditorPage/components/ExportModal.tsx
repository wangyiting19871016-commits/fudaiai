import React from 'react';

interface ExportModalProps {
  show: boolean;
  onClose: () => void;
  draftMission: any;
  onFeedback: (message: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  show,
  onClose,
  draftMission,
  onFeedback
}) => {
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '2px solid #a3a3a3',
        borderRadius: '12px',
        padding: '24px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid #333'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#a3a3a3',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            📋 导出任务蓝图
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
          >
            ✕ 关闭
          </button>
        </div>
        
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#222',
          borderRadius: '8px',
          border: '1px dashed #444'
        }}>
          <h3 style={{ fontSize: '16px', color: '#fff', margin: '0 0 12px 0' }}>🔐 封装配置 (Sign & Release)</h3>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '12px' }}>任务包命名 (Naming)</label>
              <input 
                type="text" 
                defaultValue={draftMission.title || "Untitled_Mission_v1"} 
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  backgroundColor: '#000', 
                  border: '1px solid #333', 
                  borderRadius: '4px',
                  color: '#fff' 
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', color: '#888', marginBottom: '8px', fontSize: '12px' }}>版本号 (Version)</label>
              <input 
                type="text" 
                defaultValue="1.0.0" 
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  backgroundColor: '#000', 
                  border: '1px solid #333', 
                  borderRadius: '4px',
                  color: '#fff' 
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
             <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked />
                <span>🔒 锁定核心参数 (Lock Core Parameters)</span>
             </label>
             <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', marginLeft: '24px' }}>
                勾选后，使用者在 P3 执行时将无法修改已设定的 Prompt 和 Model 配置。
             </div>
          </div>
        </div>

        <div style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#222',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#a3a3a3',
          fontWeight: 'bold'
        }}>
          以下是完整的JSON协议数据，包含所有步骤、参数和配置信息
        </div>
        
        <div style={{
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#0d0d0d',
          borderRadius: '8px',
          border: '1px solid #333',
          overflow: 'auto',
          maxHeight: '400px'
        }}>
          <pre style={{
            margin: 0,
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#fff',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}>
            {JSON.stringify(draftMission, null, 2)}
          </pre>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => {
              // 复制JSON到剪贴板
              const taskJson = JSON.stringify(draftMission, null, 2);
              navigator.clipboard.writeText(taskJson).then(() => {
                onFeedback('✅ JSON已复制到剪贴板');
              }).catch((error) => {
                console.error('复制失败:', error);
                onFeedback('❌ 复制失败，请手动复制');
              });
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#a3a3a3',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
          >
            📋 复制JSON
          </button>
          
          <button
            onClick={() => {
              // 下载JSON文件
              const taskJson = JSON.stringify(draftMission, null, 2);
              const blob = new Blob([taskJson], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `task_blueprint_${new Date().toISOString().slice(0, 10)}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              onFeedback('✅ JSON文件已下载');
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#a3a3a3',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
          >
            💾 下载JSON文件
          </button>
        </div>
      </div>
    </div>
  );
};
