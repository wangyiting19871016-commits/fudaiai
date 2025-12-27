import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { missionData } from '../data/missionData';
import useTaskManager from '../hooks/useTaskManager';

const PathPage: React.FC = () => {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const { taskStatus, credit, level, isStepFinished } = useTaskManager();

  // 强制获取当前任务数据
  const currentMission = missionData.find(m => m.id === missionId) || missionData[0];

  // 防崩溃保护：为了防止页面再变灰
  if (!currentMission) return <div style={{color: 'white'}}>加载中或路径错误...</div>;

  return (
    <div key={credit || 0} style={{ padding: '40px', background: '#000', minHeight: '100vh', color: '#fff', overflowY: 'scroll', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {/* 隐藏滚动条 */}
      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
      
      {/* 返回按钮 */}
      <button 
        onClick={() => navigate('/')}
        style={{ 
          background: 'transparent', 
          border: '2px solid #fff', 
          color: '#fff', 
          padding: '10px 20px', 
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

      {/* 信用状态显示 */}
      <div style={{ marginBottom: '20px', padding: '10px', background: '#1a1a1a', borderRadius: '8px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ color: '#06b6d4', fontWeight: 'bold' }}>CREDIT: {credit || 0}</div>
        <div style={{ color: '#06b6d4', fontWeight: 'bold' }}>LEVEL: {level || 0}</div>
      </div>

      <h2>{currentMission.title}</h2>
      
      {currentMission.phases.map((phase, phaseIndex) => (
        <div key={phaseIndex} style={{ marginBottom: '60px', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}>
          <h3 style={{ color: '#06b6d4', marginBottom: '20px', fontWeight: 'bold', fontSize: '24px', position: 'relative', paddingBottom: '10px' }}>
            {phase.name}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '2px', background: '#06b6d4' }}></div>
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', marginBottom: '20px' }}>
            {phase.steps.map((step, stepIndex) => {
              // 修正循环内的判定逻辑：必须使用当前循环的 step.id 作为动态 Key
              const isFinished = 
                localStorage.getItem(`completed_${step.id}`) === 'true' || 
                localStorage.getItem(`completed_step_${step.id}`) === 'true';
              const isPreviousFinished = stepIndex > 0 ? (
                localStorage.getItem(`completed_${phase.steps[stepIndex - 1].id}`) === 'true' || 
                localStorage.getItem(`completed_step_${phase.steps[stepIndex - 1].id}`) === 'true'
              ) : false;
              
              // 增加控制台证据：Debug
              console.log(`[渲染检查] 正在处理卡片: ${step.id}, 判定状态: ${isFinished}`);
              return (
                <div key={step.id} style={{ position: 'relative' }}>
                  {/* 连线 */}
                  {stepIndex > 0 && (
                    <div style={{ position: 'absolute', left: '-20px', top: '50%', width: '20px', height: '2px', background: isPreviousFinished ? '#06b6d4' : '#333' }}></div>
                  )}
                  <div
                    onClick={() => navigate(`/lab/${step.id}?missionId=${currentMission.id}`)}
                    style={{
                      width: '250px',
                      padding: '20px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      // 强制样式覆盖：如果任务已完成，必须强制设置白底黑字
                      ...(isFinished ? { backgroundColor: '#fff', color: '#000' } : { backgroundColor: '#1a1a1a', color: '#666666' }),
                      border: isFinished ? '4px solid #06b6d4' : '1px solid #333',
                      boxShadow: isFinished ? '0 0 30px rgba(6, 182, 212, 0.6)' : 'none',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ width: '100%', height: '200px', background: '#1a1a1a', borderRadius: '8px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>任务卡片</div>
                    <div style={{ fontSize: '12px', marginBottom: '10px' }}>
                      {isFinished ? '✅ 已完成' : '[ 待挑战 ]'}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>{isFinished ? `✅ ${step.title}` : step.title}</div>
                    <div style={{ fontSize: '10px', color: isFinished ? '#666' : '#999' }}>{step.content}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      
      {/* 底部红色的账本调试信息 */}
      <div style={{ background: 'red', padding: '10px', fontSize: '10px', marginTop: '40px', opacity: 0.5 }}>
        账本实录: CREDIT: {credit || 0}, LEVEL: {level || 0}, TaskStatus: {JSON.stringify(taskStatus || {})}
      </div>
    </div>
  );
};

export default PathPage;