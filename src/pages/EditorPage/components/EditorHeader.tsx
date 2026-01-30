import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EditorHeaderProps {
  draftMission: any;
  setShowP2Preview: (show: boolean) => void;
  setShowExportModal: (show: boolean) => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({ 
  draftMission, 
  setShowP2Preview, 
  setShowExportModal 
}) => {
  const navigate = useNavigate();

  return (
    <>
      {/* 返回按钮 */}
      <button 
        onClick={() => navigate(-1)} 
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 100,
          background: '#222',
          border: '1px solid #333',
          borderRadius: '50%',
          padding: 10,
          color: '#fff',
          cursor: 'pointer'
        }}
      >
        <ArrowLeft size={20} />
      </button>

      {/* 顶部操作栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', backgroundColor: '#1a1a1a', borderBottom: '1px solid #333', gap: '12px' }}>
        {/* 返回P1项目列表按钮 */}
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 24px',
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
          🏠 返回 P1 项目列表
        </button>
        <button
          onClick={() => setShowP2Preview(true)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#8b5cf6',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'all 0.3s ease'
          }}
        >
          📱 生成P2预览
        </button>
        <button
          onClick={() => navigate('/p4-lab')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#f59e0b',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'all 0.3s ease'
          }}
        >
          🧪 进入 P4LAB
        </button>
        <button
          onClick={() => {
            // 只打印当前 MissionContext 的完整 JSON 到控制台
            console.log(JSON.stringify(draftMission, null, 2));
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
          📡 投射至P3验证
        </button>
        <button
          onClick={() => setShowExportModal(true)}
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
          💾 导出配置
        </button>
      </div>
    </>
  );
};
