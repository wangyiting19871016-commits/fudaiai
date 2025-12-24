// @ts-nocheck
import React, { useState, useRef } from 'react';
import './TruthLayout.css';

const TruthLayout: any = () => {
  // 跟踪展开的任务卡片ID
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  
  // 定义Step接口
  interface Step {
    videoUrl: string;
    title: string;
    desc: string;
  }
  
  // 视频数据源
  const steps: Step[] = [
    { videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', title: '步骤1: 基础介绍', desc: '这是第一步的详细说明内容' },
    { videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', title: '步骤2: 核心概念', desc: '这是第二步的详细说明内容' },
    { videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', title: '步骤3: 实际应用', desc: '这是第三步的详细说明内容' },
    { videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', title: '步骤4: 高级技巧', desc: '这是第四步的详细说明内容' },
    { videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', title: '步骤5: 总结回顾', desc: '这是第五步的详细说明内容' }
  ];
  
  // 状态管理
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(false);
  
  // 引用
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const studioVideoRef = useRef<HTMLVideoElement>(null);
  
  // 课程卡片数据源
  const courseData = [
    {
      id: 0,
      title: 'Python基础课程',
      difficulty: '★★☆',
      duration: '30min',
      achievementTitle: '引路者成果展示：Python基础入门 10分钟快速上手',
      backgroundImage: 'https://picsum.photos/id/1025/600/400'
    },
    {
      id: 1,
      title: '前端开发课程',
      difficulty: '★★★',
      duration: '45min',
      achievementTitle: '引路者成果展示：HTML/CSS 30秒完美布局',
      backgroundImage: 'https://picsum.photos/id/1040/600/400'
    },
    {
      id: 2,
      title: '数据分析课程',
      difficulty: '★★★☆',
      duration: '60min',
      achievementTitle: '引路者成果展示：Excel数据分析 5分钟搞定报表',
      backgroundImage: 'https://picsum.photos/id/1059/600/400'
    },
    {
      id: 3,
      title: 'AI基础课程',
      difficulty: '★★★★',
      duration: '90min',
      achievementTitle: '引路者成果展示：AI图像识别 10分钟实现',
      backgroundImage: 'https://picsum.photos/id/1081/600/400'
    },
    {
      id: 4,
      title: '设计思维课程',
      difficulty: '★★☆',
      duration: '30min',
      achievementTitle: '引路者成果展示：设计思维 5步解决问题',
      backgroundImage: 'https://picsum.photos/id/117/600/400'
    },
    {
      id: 5,
      title: '写作表达课程',
      difficulty: '★★',
      duration: '20min',
      achievementTitle: '引路者成果展示：商务写作 30秒完美邮件',
      backgroundImage: 'https://picsum.photos/id/133/600/400'
    }
  ];
  
  // 成果主窗状态管理
  const [currentCourse, setCurrentCourse] = useState(courseData[0]);
  
  // 瞬间小方块状态管理
  const [activeMoments, setActiveMoments] = useState([0]); // 默认激活瞬间1

  // 处理任务卡片点击
  const handleTaskCardClick = (index) => {
    setExpandedCard(expandedCard === index ? null : index);
  };
  
  // 处理瞬间小方块点击
  const handleMomentClick = (momentIndex) => {
    setActiveMoments(prev => {
      if (prev.includes(momentIndex)) {
        return prev.filter(index => index !== momentIndex);
      } else {
        return [...prev, momentIndex];
      }
    });
  };

  // 切换步骤函数
  const switchStep = (n: number) => {
    setActiveStep(n);
    
    // 更新主视频
    if (mainVideoRef.current) {
      mainVideoRef.current.src = steps[n].videoUrl;
      mainVideoRef.current.play();
    }
    
    // 如果副屏打开，也更新副屏视频
    if (isStudioOpen && studioVideoRef.current) {
      studioVideoRef.current.src = steps[n].videoUrl;
      studioVideoRef.current.play();
    }
  };

  // 切换工作室（副屏）
  const toggleStudio = () => {
    setIsStudioOpen(!isStudioOpen);
    
    // 如果打开副屏，同步视频
    if (!isStudioOpen && studioVideoRef.current) {
      studioVideoRef.current.src = steps[activeStep].videoUrl;
      studioVideoRef.current.play();
    }
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
        <aside className="sidebar-power">
          <div className="main-menus">
            <div className="menu-item">
              <div className="menu-item-text">首页</div>
            </div>
            <div className="menu-item">
              <div className="menu-item-text">任务</div>
            </div>
            <div className="menu-item">
              <div className="menu-item-text">社区</div>
            </div>
            <div className="menu-item">
              <div className="menu-item-text">学习</div>
            </div>
            <div className="menu-item">
              <div className="menu-item-text">设置</div>
            </div>
          </div>
          <div className="friend-avatars">
            {/* 好友头像流占位 */}
            <div className="avatar-placeholder"></div>
            <div className="avatar-placeholder"></div>
            <div className="avatar-placeholder"></div>
            <div className="avatar-placeholder"></div>
            <div className="avatar-placeholder"></div>
          </div>
          <div className="buffer-zone">预留缓冲区A</div>
        </aside>

        {/* 中间核心区 - Trinity Mirror */}
        <section className="center-core">
          {/* Trinity Mirror 主容器 */}
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto', 
            backgroundColor: 'white', 
            border: '1px solid black', 
            padding: '20px', 
            position: 'relative' 
          }}>
            {/* 视频展示区 */}
            <div style={{ 
              width: '100%', 
              height: '500px', 
              backgroundColor: 'black', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <video 
                ref={mainVideoRef}
                src={steps[activeStep].videoUrl} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain' 
                }} 
                autoPlay 
                muted 
                loop 
              ></video>
            </div>
            
            {/* 珍珠导航 */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              margin: '20px 0' 
            }}>
              {steps.map((step, index) => (
                <div 
                  key={index}
                  onClick={() => switchStep(index)}
                  style={{
                    width: activeStep === index ? '14px' : '12px',
                    height: activeStep === index ? '14px' : '12px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    border: `1px solid ${activeStep === index ? 'black' : '#ccc'}`,
                    margin: '0 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: activeStep === index ? 'pulse 1.5s infinite' : 'none'
                  }}
                >
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#002FA7'
                  }}></div>
                </div>
              ))}
            </div>
            
            {/* 视频信息区 */}
            <div style={{ padding: '20px', textAlign: 'left' }}>
              <h2>{steps[activeStep].title}</h2>
              <p>{steps[activeStep].desc}</p>
            </div>
            
            {/* 操作按钮 */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
              <button 
                onClick={toggleStudio}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#002FA7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                发起同款挑战
              </button>
            </div>
          </div>
        </section>

        {/* 右侧展示区 */}
        <aside className="right-witness">
          <div className="live-stream">
            <div className="live-scroll-container">
              {/* LIVE见证流占位 */}
              <div className="live-item">
                <div className="live-indicator">
                  <div className="live-dot"></div>
                  <div className="live-sync">同频 87%</div>
                </div>
                <div className="live-observer"></div>
              </div>
              <div className="live-item">
                <div className="live-indicator">
                  <div className="live-dot"></div>
                  <div className="live-sync">同频 64%</div>
                </div>
                <div className="live-observer"></div>
              </div>
              <div className="live-item">
                <div className="live-indicator">
                  <div className="live-dot"></div>
                  <div className="live-sync">同频 92%</div>
                </div>
                <div className="live-observer"></div>
              </div>
              <div className="live-item">
                <div className="live-indicator">
                  <div className="live-dot"></div>
                  <div className="live-sync">同频 78%</div>
                </div>
                <div className="live-observer"></div>
              </div>
              <div className="live-item">
                <div className="live-indicator">
                  <div className="live-dot"></div>
                  <div className="live-sync">同频 53%</div>
                </div>
                <div className="live-observer"></div>
              </div>
              <div className="live-item">
                <div className="live-indicator">
                  <div className="live-dot"></div>
                  <div className="live-sync">同频 96%</div>
                </div>
                <div className="live-observer"></div>
              </div>
              <div className="live-item">
                <div className="live-indicator">
                  <div className="live-dot"></div>
                  <div className="live-sync">同频 71%</div>
                </div>
                <div className="live-observer"></div>
              </div>
              <div className="live-item">
                <div className="live-indicator">
                  <div className="live-dot"></div>
                  <div className="live-sync">同频 83%</div>
                </div>
                <div className="live-observer"></div>
              </div>
              {/* 复制一遍以实现无缝滚动效果 */}
              <div className="live-item">
                <div className="live-indicator">
                  <div className="live-dot"></div>
                  <div className="live-sync">同频 87%</div>
                </div>
                <div className="live-observer"></div>
              </div>
              <div className="live-item">
                <div className="live-indicator">
                  <div className="live-dot"></div>
                  <div className="live-sync">同频 64%</div>
                </div>
                <div className="live-observer"></div>
              </div>
              <div className="live-item">
                <div className="live-indicator">
                  <div className="live-dot"></div>
                  <div className="live-sync">同频 92%</div>
                </div>
                <div className="live-observer"></div>
              </div>
              <div className="live-item">
                <div className="live-indicator">
                  <div className="live-dot"></div>
                  <div className="live-sync">同频 78%</div>
                </div>
                <div className="live-observer"></div>
              </div>
              <div className="live-item">
                <div className="live-indicator">
                  <div className="live-dot"></div>
                  <div className="live-sync">同频 53%</div>
                </div>
                <div className="live-observer"></div>
              </div>
              <div className="live-item">
                <div className="live-indicator">
                  <div className="live-dot"></div>
                  <div className="live-sync">同频 96%</div>
                </div>
                <div className="live-observer"></div>
              </div>
              <div className="live-item">
                <div className="live-indicator">
                  <div className="live-dot"></div>
                  <div className="live-sync">同频 71%</div>
                </div>
                <div className="live-observer"></div>
              </div>
              <div className="live-item">
                <div className="live-indicator">
                  <div className="live-dot"></div>
                  <div className="live-sync">同频 83%</div>
                </div>
                <div className="live-observer"></div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* 底部页脚 */}
      <footer className="footer-foundation">
      </footer>
      
      {/* Studio Overlay 副屏遮罩层 */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'white',
          zIndex: 10000,
          display: isStudioOpen ? 'flex' : 'none',
          flexDirection: 'column',
          padding: '20px'
        }}
      >
        {/* 双窗口布局 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          height: 'calc(100% - 120px)',
          marginBottom: '20px' 
        }}>
          {/* 左侧参考区 */}
          <div style={{ 
            width: '35%', 
            border: '1px solid black', 
            backgroundColor: 'black',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <video 
              ref={studioVideoRef}
              src={steps[activeStep].videoUrl} 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain' 
              }} 
              autoPlay 
              muted 
              loop 
            ></video>
          </div>
          
          {/* 右侧实操区 */}
          <div style={{ 
            width: '60%', 
            backgroundColor: '#333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px'
          }}>
            我的实时画面预览
          </div>
        </div>
        
        {/* 控制台 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          height: '80px',
          borderTop: '1px solid black'
        }}>
          {/* 左侧录制按钮 */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'black',
              cursor: 'pointer',
              marginRight: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: 'red'
              }}></div>
            </div>
            <div>录制中</div>
          </div>
          
          {/* 中间珍珠导航 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center' 
          }}>
            {steps.map((step, index) => (
              <div 
                key={index}
                onClick={() => switchStep(index)}
                style={{
                  width: activeStep === index ? '14px' : '12px',
                  height: activeStep === index ? '14px' : '12px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  border: `1px solid ${activeStep === index ? 'black' : '#ccc'}`,
                  margin: '0 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#002FA7'
                }}></div>
              </div>
            ))}
          </div>
          
          {/* 右侧退出按钮 */}
          <div>
            <button 
              onClick={toggleStudio}
              style={{
                padding: '10px 20px',
                backgroundColor: '#002FA7',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              退出实验室
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 导出组件
export default TruthLayout;

