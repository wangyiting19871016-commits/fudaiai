import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useTaskManager from '../hooks/useTaskManager';
import MissionManager from '../missionManager';
import MissionController from '../MissionController';

const PathPage: React.FC = () => {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const { taskStatus, credit, level, isStepFinished } = useTaskManager();

  // 1. 本地任务 (唯一数据源)
  const [customMissions, setCustomMissions] = useState<any[]>(() => {
    return JSON.parse(localStorage.getItem('custom_missions') || '[]');
  });

  // 2. 数据平铺逻辑：将所有 mission.steps 展开为原子任务
  const allSteps = customMissions.flatMap(m => 
    m.steps?.map((step, index) => ({
      ...step,
      parentMissionId: m.id || '',
      stepIndex: index,
      parentTitle: m.title || '未知任务'
    })) || []
  ).filter(step => step.id || step.parentMissionId); // 过滤掉无效任务

  // 日志锚点 [LOGIC_TRACE]
  console.log(`[LOGIC_TRACE] 原子任务列表已平铺，当前总数: ${allSteps.length}`);

  // 检查是否存在活跃任务
  const [activeMission, setActiveMission] = useState<any>(null);
  // 所有任务列表
  const [missions, setMissions] = useState<any[]>([]);
  
  useEffect(() => {
    // 使用 MissionController 订阅任务队列
    const unsubscribe = MissionController.subscribe((missionQueue) => {
      console.log('🔄 从 MissionController 接收任务队列更新:', missionQueue);
      // 过滤掉缺少必要字段的任务
      const validMissions = (missionQueue.missions || []).filter((mission: any) => 
        mission?.missionId && mission?.title
      );
      setMissions(validMissions);
      
      // 设置活跃任务
      if (missionQueue.currentMissionId) {
        const currentMission = validMissions.find(
          (mission: any) => mission.missionId === missionQueue.currentMissionId
        );
        if (currentMission) {
          setActiveMission(currentMission);
        }
      } else if (validMissions.length > 0) {
        // 如果没有当前任务ID，设置第一个任务为活跃任务
        setActiveMission(validMissions[0]);
      } else {
        setActiveMission(null);
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  // 监听 custom_missions 变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'custom_missions') {
        setCustomMissions(JSON.parse(e.newValue || '[]'));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // 合并动态任务，显示所有真迹任务
  const allTasks = [
    // 动态轨道：所有真迹任务
    ...missions.map((mission) => ({
      id: `mission-${mission.missionId}`,
      title: mission.title || '真迹任务',
      desc: mission.description || 'P4 发布的实时任务，点击开始执行',
      type: 'real-time',
      color: '#8b5cf6',
      parentMissionId: mission.missionId,
      stepIndex: 0,
      parentTitle: '真迹任务',
      missionId: mission.missionId
    })),
    // 动态轨道：自定义任务
    ...allSteps
  ].filter(task => task.id || task.parentMissionId); // 过滤掉无效任务

  // 判断是否为本地任务（现在所有任务都是本地的）
  const isLocalStep = (step: any) => {
    return customMissions.some((mission: any) => mission?.id === step?.parentMissionId);
  };

  // 获取原子任务完成状态
  const isStepCompleted = (step: any) => {
    return localStorage.getItem(`completed_step_${step?.parentMissionId || ''}_${step?.stepIndex || 0}`) === 'true';
  };

  return (
    <div key={credit || 0} style={{ 
      background: '#000', 
      minHeight: '100vh', 
      color: '#fff', 
      display: 'flex',
      overflow: 'hidden'
    }}>
      {/* 隐藏滚动条和动画定义 */}
      <style>{`
        div::-webkit-scrollbar { display: none; }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes terminalTyping {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
      
      {/* 左侧栏：仪表盘 - 保持不变 */}
      <div style={{ 
        width: '300px', 
        background: 'rgba(26, 26, 26, 0.9)', 
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '30px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* 返回按钮 */}
        <button 
          onClick={() => navigate('/')}
          style={{ 
            background: 'transparent', 
            border: '2px solid #fff', 
            color: '#fff', 
            padding: '12px 20px', 
            cursor: 'pointer', 
            fontSize: '14px', 
            fontWeight: 'bold', 
            letterSpacing: '1px', 
            transition: 'all 0.3s ease',
            borderRadius: '25px',
            marginBottom: '20px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = '#06b6d4';
            e.currentTarget.style.color = '#06b6d4';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = '#fff';
            e.currentTarget.style.color = '#fff';
          }}
        >
          ← 返回胶囊列表
        </button>

        {/* 仪表盘核心指标 */}
        <div style={{ 
          background: 'rgba(6, 182, 212, 0.1)', 
          borderRadius: '12px', 
          padding: '20px',
          border: '1px solid rgba(6, 182, 212, 0.3)'
        }}>
          <div style={{ fontSize: '12px', color: '#06b6d4', marginBottom: '10px' }}>原子任务进度</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
            {allSteps.filter(step => 
              localStorage.getItem(`completed_step_${step?.parentMissionId || ''}_${step?.stepIndex || 0}`) === 'true'
            ).length} / {allSteps.length}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>已完成原子任务</div>
        </div>

        <div style={{ 
          background: 'rgba(255, 215, 0, 0.1)', 
          borderRadius: '12px', 
          padding: '20px',
          border: '1px solid rgba(255, 215, 0, 0.3)'
        }}>
          <div style={{ fontSize: '12px', color: '#FFD700', marginBottom: '10px' }}>信用积分</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>{credit || 0}</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>当前等级</div>
        </div>

        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          borderRadius: '12px', 
          padding: '20px',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '10px' }}>任务统计</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
            {customMissions.length} 个任务包
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>包含 {allSteps.length} 个原子任务</div>
        </div>

        {/* 快速操作 */}
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={() => {
              // 【逻辑收口】屏幕2重置进度：只清除任务完成状态，保留任务本身
              if (window.confirm('确定要重置所有任务进度吗？\n\n✅ 任务包将保留\n❌ 完成状态将被清空\n\n用户可以重新开始玩，但不会丢失AI生成的任务。')) {
                Object.keys(localStorage).forEach(key => {
                  if ((key || '').startsWith('completed_step_')) {
                    localStorage.removeItem(key);
                  }
                });
                window.location.reload();
              }
            }}
            style={{
              background: 'transparent',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#ef4444',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              width: '100%',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            🔄 重置进度
          </button>
        </div>
      </div>

      {/* 中间栏：舒展型一屏流 */}
      <div style={{ 
        flex: 1, 
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh', // 严格限制为视口高度
        overflow: 'hidden', // 禁止滚动
        padding: '40px' // 四周足够的呼吸空间
      }}>
        {/* 区域 A: 顶部控制区 (TopControl) */}
        <div style={{
          flex: '0 0 auto', // 不伸缩，高度自适应
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '10px 0',
          gap: '8px',
          background: 'rgba(0, 0, 0, 0.8)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '40px' // 视频与卡片网格之间的间距
        }}>
          {/* 任务总览标题 */}
          <div style={{
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '8px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              任务基地
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#9ca3af',
              lineHeight: '1.4',
              marginBottom: '8px'
            }}>
              共 {allSteps.length} 个原子任务 • {customMissions.length} 个任务包
            </p>
            {/* 显示真迹任务总数 */}
            <p style={{
              fontSize: '16px',
              color: '#8b5cf6',
              fontWeight: 'bold',
              lineHeight: '1.4'
            }}>
              当前任务总数: {missions.length}
            </p>
          </div>

          {/* 快速操作按钮 */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
            width: '100%',
            maxWidth: '500px'
          }}>
            {/* 创建新任务按钮 */}
            <button
              onClick={() => navigate('/editor')}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                border: 'none',
                color: '#000',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '16px' }}>✨</span>
              创建新任务
            </button>

            {/* 刷新任务列表按钮 */}
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 20px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              <span style={{ fontSize: '16px' }}>🔄</span>
              刷新列表
            </button>
          </div>
        </div>

        {/* 区域 B: 舒展型 3列网格容器 */}
        <div style={{
          flex: 1, // 占据剩余所有高度
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(200px, 1fr))', // 固定3列，最小200px
          gap: '40px', // 大间距，舒展型布局
          padding: '40px',
          overflow: 'auto', // 允许滚动
          alignContent: 'start', // 顶部对齐
          justifyContent: 'center', // 水平居中
          maxWidth: '1200px', // 更宽的最大宽度
          margin: '0 auto', // 整体居中
          width: '100%'
        }}>
          {/* 渲染所有任务卡片 */}
          {allTasks.map((step) => {
            // 处理真迹实时任务
            const isRealTimeMission = (step?.id || '') === 'real-time-mission';
            const isNoRealTime = (step?.id || '') === 'no-real-time';
            const isStaticDemo = (step?.id || '').startsWith('demo-');
            
            const isCompleted = isRealTimeMission ? false : isStepCompleted(step);
            const isLocal = isRealTimeMission ? false : isLocalStep(step);
            
            return (
              <div 
                key={isRealTimeMission || isNoRealTime ? (step?.id || Math.random()) : `${step?.parentMissionId || ''}-${step?.stepIndex || 0}`}
                style={{
                  width: '100%',
                  minHeight: '180px', // 适当的高度
                  background: isRealTimeMission ? 
                    'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.3) 100%)' :
                    isNoRealTime ? 
                    'linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, rgba(107, 114, 128, 0.3) 100%)' :
                    isStaticDemo ?
                    'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.3) 100%)' :
                    isCompleted ? 
                    'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.3) 100%)' : 
                    'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.3) 100%)',
                  borderRadius: '16px',
                  border: isRealTimeMission ? 
                    '2px solid rgba(139, 92, 246, 0.5)' :
                    isNoRealTime ? 
                    '2px solid rgba(107, 114, 128, 0.5)' :
                    isStaticDemo ?
                    '2px solid rgba(245, 158, 11, 0.5)' :
                    isCompleted ? 
                    '2px solid rgba(16, 185, 129, 0.5)' : 
                    '2px solid rgba(6, 182, 212, 0.5)',
                  cursor: isNoRealTime ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isRealTimeMission ? 
                    '0 8px 32px rgba(139, 92, 246, 0.2)' :
                    isNoRealTime ? 
                    '0 8px 32px rgba(107, 114, 128, 0.2)' :
                    isStaticDemo ?
                    '0 8px 32px rgba(245, 158, 11, 0.2)' :
                    isCompleted ? 
                    '0 8px 32px rgba(16, 185, 129, 0.2)' : 
                    '0 8px 32px rgba(6, 182, 212, 0.2)'
                }}
                onClick={() => {
                  if (isRealTimeMission && step?.missionId) {
                    // 设置当前任务ID，然后跳转到实验室页面
                    MissionController.setCurrentMissionId(step.missionId);
                    window.location.href = `/lab/${step.missionId}`;
                  } else if (!isNoRealTime && step?.parentMissionId) {
                    navigate(`/lab/${step.parentMissionId}`);
                  }
                }}
                onMouseOver={(e) => {
                  if (!isNoRealTime) {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                    e.currentTarget.style.boxShadow = isRealTimeMission ? 
                      '0 12px 40px rgba(139, 92, 246, 0.3)' :
                      isStaticDemo ?
                      '0 12px 40px rgba(245, 158, 11, 0.3)' :
                      isCompleted ? 
                      '0 12px 40px rgba(16, 185, 129, 0.3)' : 
                      '0 12px 40px rgba(6, 182, 212, 0.3)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isNoRealTime) {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = isRealTimeMission ? 
                      '0 8px 32px rgba(139, 92, 246, 0.2)' :
                      isStaticDemo ?
                      '0 8px 32px rgba(245, 158, 11, 0.2)' :
                      isCompleted ? 
                      '0 8px 32px rgba(16, 185, 129, 0.2)' : 
                      '0 8px 32px rgba(6, 182, 212, 0.2)';
                  }
                }}
              >
                {/* 原子任务步骤标识 */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                  color: '#000',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  zIndex: 2
                }}>
                  步骤 {step?.stepIndex + 1 || 1}
                </div>
                
                {/* 完成状态标识 */}
                {isCompleted && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    zIndex: 2
                  }}>
                    ✓ 完成
                  </div>
                )}
                
                {/* 任务类型标识 */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: isCompleted ? '60px' : '12px',
                  background: step?.color ? 
                    `linear-gradient(135deg, ${step.color} 0%, ${step.color}99 100%)` : 
                    'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  zIndex: 2
                }}>
                  {step?.type || 'unknown'}
                </div>
                
                {/* 卡片内容 */}
                <div style={{
                  padding: '24px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  {/* 原子任务标题 */}
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#fff',
                    marginBottom: '8px',
                    lineHeight: '1.3'
                  }}>
                    {step?.parentTitle || '未知任务'} - {step?.title || '未知步骤'}
                  </div>
                  
                  {/* 原子任务描述 */}
                  <div style={{
                    fontSize: '14px',
                    color: '#d1d5db',
                    lineHeight: '1.4',
                    flex: 1
                  }}>
                    {step?.desc || step?.description || '无描述'}
                  </div>
                  
                  {/* 点击提示 */}
                  <div style={{
                    fontSize: '12px',
                    color: isCompleted ? '#10b981' : '#06b6d4',
                    fontWeight: 'bold',
                    marginTop: '12px',
                    textAlign: 'center',
                    opacity: 0.8
                  }}>
                    {isCompleted ? '点击查看详情' : '点击开始训练'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 右侧栏：发布入口 - 保持不变 */}
      <div style={{ 
        width: '280px', 
        background: 'rgba(26, 26, 26, 0.9)', 
        backdropFilter: 'blur(10px)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '30px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h3 style={{ color: '#FFD700', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>发布者入口</h3>
        
        {/* 发布任务按钮 */}
        <button 
          onClick={() => navigate('/editor')}
          style={{
            background: 'transparent',
            border: '2px solid rgba(255, 215, 0, 0.5)',
            color: '#FFD700',
            padding: '15px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            width: '100%'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
            e.currentTarget.style.borderColor = '#FFD700';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
          }}
        >
          🚀 发布新任务
        </button>

        {/* 任务模板 */}
        <div style={{ 
          background: 'rgba(255, 215, 0, 0.05)', 
          borderRadius: '8px', 
          padding: '15px',
          border: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          <div style={{ fontSize: '12px', color: '#FFD700', marginBottom: '10px' }}>任务模板</div>
          <div style={{ fontSize: '11px', color: '#999', lineHeight: '1.4' }}>
            选择预设模板快速创建新任务
          </div>
        </div>

        {/* 发布统计 */}
        <div style={{ 
          background: 'rgba(6, 182, 212, 0.05)', 
          borderRadius: '88px', 
          padding: '15px',
          border: '1px solid rgba(6, 182, 212, 0.2)'
        }}>
          <div style={{ fontSize: '12px', color: '#06b6d4', marginBottom: '10px' }}>发布统计</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>0</div>
          <div style={{ fontSize: '11px', color: '#666' }}>已发布任务</div>
        </div>

        {/* 快速指南 */}
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.05)', 
          borderRadius: '8px', 
          padding: '15px',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <div style={{ fontSize: '12px', color: '#ef4444', marginBottom: '10px' }}>发布指南</div>
          <div style={{ fontSize: '11px', color: '#999', lineHeight: '1.4' }}>
            • 设置清晰的任务描述<br/>
            • 定义验证标准<br/>
            • 配置奖励积分
          </div>
        </div>
      </div>
    </div>
  );
};

export default PathPage;