import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainStage from '../components/MainStage/MainStage';

const Home: React.FC = () => {
  const navigate = useNavigate();
  
  // 【逻辑收口】屏幕1一键重启：清除所有数据，包括AI任务
  const clearAllData = () => {
    if (window.confirm('⚠️ 确定要清空所有数据吗？\n\n❌ 所有AI生成的任务将被删除\n❌ 所有进度将被重置\n❌ 所有积分将被清空\n\n此操作不可撤销！')) {
      // 清除 custom_missions 和所有其他数据
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleHeroChallenge = () => {
    navigate('/path/mission-001');
  };

  // 👇 修正后的数据：补全了所有缺少的字段
  const mockSteps: Array<{
    id: string;
    title: string;
    desc: string;
    description: string;
    videoUrl: string;
    status: 'active' | 'locked' | 'completed';
    isLocked: boolean;
    thumbnail: string;
    duration: string;
    reward: number;
  }> = [
    {
      id: 'step-01',
      title: 'Visual Blueprint 演示',
      desc: '进入 TapNow 风格的新版视觉蓝图。', // 以前写的是 description，现在补上 desc
      description: '进入 TapNow 风格的新版视觉蓝图。', // 保留这个以防万一
      videoUrl: '', // 👈 补上：哪怕是空字符串，也得有
      status: 'active',
      isLocked: false,
      // 👇 再多补几个常见字段，防止它还报缺胳膊少腿
      thumbnail: '', 
      duration: '5 min',
      reward: 100
    },
    {
      id: 'step-02',
      title: '等待解锁',
      desc: '完成上一步后解锁。',
      description: '完成上一步后解锁。',
      videoUrl: '',
      status: 'locked',
      isLocked: true,
      thumbnail: '',
      duration: '0 min',
      reward: 0
    }
  ];

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* 一键重置系统按钮 - 页面最上方 */}
      <div style={{ position: 'fixed', top: 20, left: 20, zIndex: 9999 }}>
        <button 
          onClick={clearAllData}
          style={{ 
            background: 'red', 
            border: 'none', 
            color: 'white', 
            padding: '8px 16px', 
            cursor: 'pointer', 
            fontSize: '12px', 
            fontWeight: 'bold', 
            letterSpacing: '0.5px', 
            transition: 'all 0.3s ease',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(255, 0, 0, 0.5)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 0, 0, 0.7)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 0, 0, 0.5)';
          }}
        >
          🔄 一键重置系统
        </button>
      </div>
      
      {/* Clear Data Button */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
        <button 
          onClick={clearAllData}
          style={{ 
            background: 'red', 
            border: 'none', 
            color: 'white', 
            padding: '15px 20px', 
            cursor: 'pointer', 
            fontSize: '14px', 
            fontWeight: 'bold', 
            letterSpacing: '1px', 
            transition: 'all 0.3s ease',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(255, 0, 0, 0.5)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 0, 0, 0.7)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 0, 0, 0.5)';
          }}
        >
          点此重置所有脏数据
        </button>
      </div>

      <MainStage 
        steps={mockSteps} 
        onChallengeClick={handleHeroChallenge} 
      />
    </div>
  );
};

export default Home;