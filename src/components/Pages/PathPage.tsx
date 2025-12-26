import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface BattleZoneProps {
}

const PathPage: React.FC<BattleZoneProps> = () => {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();

  const handleBackToHome = () => {
    navigate('/');
  };

  // 处理跳转到实验室
  const handleStartReplication = (taskId: string) => {
    navigate(`/lab/${taskId}-step1`);
  };

  return (
    <div className="battle-zone-container">
      {/* 战备区头部导航 */}
      <div className="battle-zone-header">
        <button 
          className="back-to-home-button"
          onClick={handleBackToHome}
        >
          ← 返回主页
        </button>
        <div className="battle-zone-title">
          <h1>战备区</h1>
          <span className="task-id">任务ID: {taskId || '101'}</span>
        </div>
      </div>

      {/* BattleZone 全屏任务流 - 第一视觉中心 */}
      <div className="battle-zone-content">
        {/* 垂直珍珠轴 - 强制置顶 */}
        <div className="battle-zone-pearl-axis">
          <div className="pearl-line"></div>
          <div className="pearl-container">
            <div className="pearl active" data-title="任务 1: 项目初始化"></div>
            <div className="pearl" data-title="任务 2: 布局设计"></div>
            <div className="pearl" data-title="任务 3: 功能实现"></div>
            <div className="pearl" data-title="任务 4: 测试优化"></div>
            <div className="pearl" data-title="任务 5: 部署上线"></div>
          </div>
        </div>

        {/* 任务卡片流 - 强制置顶 */}
        <div className="battle-zone-tasks">
          <div className="task-cards-container">
            {/* 任务卡片 1 */}
            <div className="task-card-item" onClick={() => handleStartReplication('101')}>
              <div className="task-card-header">
                <span className="task-number">01</span>
                <h3 className="task-title">项目初始化</h3>
                <span className="task-status">待执行</span>
              </div>
              <div className="task-description">
                创建项目基础架构，配置开发环境和依赖项
              </div>
              <div className="task-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: '0%'}}></div>
                </div>
                <span className="progress-text">0%</span>
              </div>
            </div>

            {/* 任务卡片 2 */}
            <div className="task-card-item" onClick={() => handleStartReplication('102')}>
              <div className="task-card-header">
                <span className="task-number">02</span>
                <h3 className="task-title">布局设计</h3>
                <span className="task-status">待执行</span>
              </div>
              <div className="task-description">
                设计页面整体布局和用户界面结构
              </div>
              <div className="task-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: '0%'}}></div>
                </div>
                <span className="progress-text">0%</span>
              </div>
            </div>

            {/* 任务卡片 3 */}
            <div className="task-card-item" onClick={() => handleStartReplication('103')}>
              <div className="task-card-header">
                <span className="task-number">03</span>
                <h3 className="task-title">功能实现</h3>
                <span className="task-status">待执行</span>
              </div>
              <div className="task-description">
                实现核心功能和交互逻辑
              </div>
              <div className="task-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: '0%'}}></div>
                </div>
                <span className="progress-text">0%</span>
              </div>
            </div>

            {/* 任务卡片 4 */}
            <div className="task-card-item" onClick={() => handleStartReplication('104')}>
              <div className="task-card-header">
                <span className="task-number">04</span>
                <h3 className="task-title">测试优化</h3>
                <span className="task-status">待执行</span>
              </div>
              <div className="task-description">
                进行功能测试和性能优化
              </div>
              <div className="task-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: '0%'}}></div>
                </div>
                <span className="progress-text">0%</span>
              </div>
            </div>

            {/* 任务卡片 5 */}
            <div className="task-card-item" onClick={() => handleStartReplication('105')}>
              <div className="task-card-header">
                <span className="task-number">05</span>
                <h3 className="task-title">部署上线</h3>
                <span className="task-status">待执行</span>
              </div>
              <div className="task-description">
                部署应用到生产环境并上线
              </div>
              <div className="task-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: '0%'}}></div>
                </div>
                <span className="progress-text">0%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PathPage;