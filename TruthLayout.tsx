// @ts-nocheck
import './TruthLayout.css';
import React, { useState } from 'react';
import MainStage from './src/components/MainStage/MainStage';
import Sidebar from './src/components/Sidebar/Sidebar';
import LiveWitness from './src/components/LiveWitness/LiveWitness';

const TruthLayout: any = () => {
  // 跟踪展开的任务卡片ID
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  // 视频步骤数据
  const steps = [
    {
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      title: "步骤 1: 项目初始化",
      desc: "在这一步中，我们将创建项目的基本结构，包括HTML、CSS和JavaScript文件的初始化设置。"
    },
    {
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      title: "步骤 2: 布局设计",
      desc: "我们将设计页面的整体布局，包括视频展示区、导航栏和内容描述区域的安排。"
    },
    {
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      title: "步骤 3: 视频功能实现",
      desc: "这一步将实现视频的加载、播放和切换功能，确保视频能够正常显示和控制。"
    },
    {
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      title: "步骤 4: 交互效果添加",
      desc: "我们将为珍珠导航添加交互效果，实现点击切换视频和状态变化的功能。"
    },
    {
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      title: "步骤 5: 最终优化",
      desc: "最后一步将对页面进行整体优化，包括性能提升、样式调整和功能完善。"
    }
  ];
  // 当前活跃步骤（用于实验室视图）
  const [activeStep, setActiveStep] = useState(0);

  // 处理任务卡片点击
  const handleTaskCardClick = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  // 实验室视图状态
  const [isLabView, setIsLabView] = useState(false);

  // 切换步骤函数（用于实验室视图）
  const switchStep = (index: number) => {
    if (index < 0 || index >= steps.length) return;
    setActiveStep(index);
  };

  // 处理发起挑战按钮点击
  const handleChallengeClick = () => {
    setIsLabView(true);
  };

  // 处理退出实验室按钮点击
  const handleExitLab = () => {
    setIsLabView(false);
  };

  return (
    <div className="app-container">
      {/* 顶部Header */}
      <header className="header-axis">
        <div className="logo">Logo</div>
        <div className="user-info">UserID/角色</div>
      </header>

      {/* 核心三战区布局 */}
      <main className="main-layout">
        {/* 左侧侧边栏 */}
        <Sidebar />

        {/* 中间核心区 */}
        <section className="center-core">
          {/* 顶部两舱矩阵展示区：双子星闭环阵列 */}
          <div className="video-matrix">
            {/* 第一个展示舱：成果+路径+瞬间记录 */}
            <MainStage steps={steps} onChallengeClick={handleChallengeClick} onStepChange={setActiveStep} />
          </div>
        </section>

        {/* 右侧展示区 */}
        <LiveWitness />
      </main>

      {/* 底部页脚 */}
      <footer className="footer-foundation">
      </footer>
    
    {/* 实验室视图 */}
    <div className={`tm-studio-overlay ${isLabView ? 'active' : ''}`}>
      {/* 双窗布局 */}
      <div className="tm-studio-screens">
        {/* 左窗 - 参考区 */}
        <div className="tm-reference-window">
          <video className="tm-reference-video" autoPlay muted loop>
            <source src={steps[activeStep].videoUrl} type="video/mp4" />
            您的浏览器不支持视频播放
          </video>
        </div>
        
        {/* 右窗 - 实操区 */}
        <div className="tm-practice-window">
          <div>我的实时画面预览</div>
        </div>
      </div>
      
      {/* 副屏珍珠导航 */}
      <div className="tm-studio-pearl-nav">
        <div className="tm-studio-pearl-line">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`tm-studio-pearl ${index === activeStep ? 'active' : ''}`}
              data-title={step.title}
              onClick={() => switchStep(index)}
            ></div>
          ))}
        </div>
      </div>
      
      {/* 副屏控制台 */}
      <div className="tm-studio-console">
        <button className="tm-record-btn"></button>
        <div className="tm-failure-count">
          失败次数：<span id="failureCount">0</span>
        </div>
        <button className="tm-exit-btn" onClick={handleExitLab}>退出实验室</button>
      </div>
    </div>
  </div>
  );
};

export default TruthLayout;