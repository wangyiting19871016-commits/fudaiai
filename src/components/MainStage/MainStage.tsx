import React, { useState, useEffect } from 'react';
import HeroStage from './HeroStage/HeroStage';
import TaskSection from './TaskSection/TaskSection';
import CourseSection from './CourseSection/CourseSection';
import MainStageWidgets from './MainStageWidgets';
import CreditTree from '../Widgets/CreditTree';
import LiveWitness from '../LiveWitness/LiveWitness';
import EvidenceCardFlow from './EvidenceCardFlow/EvidenceCardFlow';
import EvidenceCanvas from './EvidenceCanvas/EvidenceCanvas';
import BattleZone from '../Widgets/BattleZone';
// SidePanel 已集成到 EvidenceCanvas 中，移除冗余导入
import { useCreditSystem } from '../../hooks/useCreditSystem';
import { useTaskSystem } from '../../hooks/useTaskSystem';
import { Step, Course, ViewMode } from '../../types/index';

interface MainStageProps {
  steps: Step[];
  onChallengeClick: () => void;
  onStepChange?: (index: number) => void;
}

const MainStage: React.FC<MainStageProps> = ({ steps, onChallengeClick, onStepChange }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [contentTitle, setContentTitle] = useState(steps[0].title);
  const [contentDesc, setContentDesc] = useState(steps[0].desc);
  const [viewMode, setViewMode] = useState<ViewMode>('FEED');
  const { credit, level, addCredit, recentCreditChange } = useCreditSystem();
  const { tasks } = useTaskSystem();
  
  // 跟踪是否显示信用提示
  const [showCreditPrompt, setShowCreditPrompt] = useState(false);
  
  // 当信用分变化时显示提示
  useEffect(() => {
    if (recentCreditChange > 0) {
      setShowCreditPrompt(true);
      const timer = setTimeout(() => {
        setShowCreditPrompt(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [recentCreditChange]);
  
  // 1. 模拟数据：教学区
  const courses: Course[] = [
    { id: 1, title: "Python核心编程入门", difficulty: "★★☆", duration: "30min", videoUrl: "https://picsum.photos/seed/course1/800/450" },
    { id: 2, title: "React前端框架实战", difficulty: "★★★", duration: "45min", videoUrl: "https://picsum.photos/seed/course2/800/450" },
    { id: 3, title: "数据可视化与分析", difficulty: "★★★☆", duration: "60min", videoUrl: "https://picsum.photos/seed/course3/800/450" },
    { id: 4, title: "机器学习基础应用", difficulty: "★★★★", duration: "90min", videoUrl: "https://picsum.photos/seed/course4/800/450" },
    { id: 5, title: "产品设计思维训练", difficulty: "★★☆", duration: "30min", videoUrl: "https://picsum.photos/seed/course5/800/450" },
    { id: 6, title: "高效沟通表达技巧", difficulty: "★★", duration: "20min", videoUrl: "https://picsum.photos/seed/course6/800/450" }
  ];

  const handleStepChange = (index: number) => {
    if (index < 0 || index >= steps.length) return;
    setActiveStep(index);
    setContentTitle(steps[index].title);
    setContentDesc(steps[index].desc);
    if (onStepChange) onStepChange(index);
  };

  // 根据viewMode决定渲染内容
  if (viewMode === 'EVIDENCE') {
    // EVIDENCE模式下只渲染EvidenceCanvas，完全隔离其他UI元素
    return (
      <EvidenceCanvas viewMode={viewMode} setViewMode={setViewMode} />
    );
  }

  // 其他模式渲染完整布局
  return (
    <div style={{ 
      position: 'relative', 
      minHeight: '100vh', 
      width: '100vw', 
      overflowX: 'hidden',
      backgroundColor: '#ffffff'
    }}>
      
      {/* 外部固定挂件 */}
      <MainStageWidgets />
      
      {/* 主 Flex 容器，强制拉回并显示大屏 */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        alignItems: 'flex-start', 
        justifyContent: 'flex-start', 
        gap: '32px', 
        width: '100%', 
        paddingLeft: '4vw', 
        backgroundColor: '#ffffff',
        paddingTop: '20px'
      }}>
        
        {/* 第一列 (宽度 65%)：依次放置 HeroStage、TaskSection、CourseSection */}
        <div style={{ 
          width: '65%',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <HeroStage
            steps={steps}
            activeStep={activeStep}
            contentTitle={contentTitle}
            contentDesc={contentDesc}
            onStepChange={handleStepChange}
            onChallengeClick={() => {
              addCredit(100);
              console.log('Credit Added');
            }}
            onVideoCardClick={() => setViewMode('EVIDENCE')}
            onBattleZoneClick={() => setViewMode('BATTLE_ZONE')}
          />
          
          {/* 任务列表与教学区紧随大屏之后 */}
          {viewMode === 'FEED' && (
            <>
              <TaskSection />
              <CourseSection courses={courses} />
            </>
          )}
          
          {viewMode === 'CREATION_LAB' && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '300px', 
              color: '#333', 
              fontSize: '24px'
            }}>
              创作实验室（待实现）
            </div>
          )}
          
          {viewMode === 'BATTLE_ZONE' && (
            <BattleZone 
              onVerify={(taskId, content) => {
                console.log('战备区验证:', { taskId, content });
                // 这里可以添加验证逻辑和信用分奖励
                addCredit(50);
              }}
            />
          )}
        </div>
        
        {/* 第二列 (宽度 15%)：放置 CreditTree */}
        <div style={{ width: '15%' }}>
          <CreditTree credit={credit} addCredit={addCredit} />
        </div>
        
        {/* 第三列 (宽度 15%)：放置 LiveWitness */}
        <div style={{ width: '15%' }}>
          <LiveWitness />
          
          {/* 信用提示动画 */}
          {showCreditPrompt && (
            <div 
              style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                color: '#a3a3a3',
                fontWeight: 'bold',
                fontSize: '24px',
                animation: 'creditFloat 1s ease-out forwards',
                zIndex: 1000
              }}
            >
              +{recentCreditChange}
            </div>
          )}
          
          {/* 同频者文字 */}
          <div style={{
            marginTop: '20px',
            padding: '15px',
            textAlign: 'center',
            backgroundColor: 'rgba(163, 163, 163, 0.1)',
            borderRadius: '8px',
            color: '#a3a3a3',
            fontSize: '14px',
            fontWeight: 'bold',
            border: '1px solid rgba(163, 163, 163, 0.2)',
            boxShadow: '0 0 10px rgba(163, 163, 163, 0.1)'
          }}>
            同频者
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainStage;