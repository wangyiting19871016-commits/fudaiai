import styles from './MainStage.module.css';
import React, { useState, useRef } from 'react';

interface Step {
  videoUrl: string;
  title: string;
  desc: string;
}

interface Course {
  id: number;
  title: string;
  difficulty: string;
  duration: string;
  videoUrl: string;
}

interface Task {
  id: number;
  name: string;
  difficulty: string;
  duration: string;
  users: number;
  rewards: number;
  videoUrl: string;
}

interface MainStageProps {
  steps: Step[];
  onChallengeClick: () => void;
  onStepChange?: (index: number) => void;
}

const MainStage: React.FC<MainStageProps> = ({ steps, onChallengeClick, onStepChange }) => {
  // 当前活跃步骤
  const [activeStep, setActiveStep] = useState(0);
  // 当前视频标题和描述
  const [contentTitle, setContentTitle] = useState(steps[0].title);
  const [contentDesc, setContentDesc] = useState(steps[0].desc);
  // 视频元素引用
  const mainVideoRef = React.useRef<HTMLVideoElement>(null);
  
  // 课程数据
  const courses: Course[] = [
    { id: 1, title: "Python基础课程", difficulty: "★★☆", duration: "30min", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
    { id: 2, title: "前端开发课程", difficulty: "★★★", duration: "45min", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
    { id: 3, title: "数据分析课程", difficulty: "★★★☆", duration: "60min", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
    { id: 4, title: "AI基础课程", difficulty: "★★★★", duration: "90min", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
    { id: 5, title: "设计思维课程", difficulty: "★★☆", duration: "30min", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4" },
    { id: 6, title: "写作表达课程", difficulty: "★★", duration: "20min", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4" }
  ];
  
  // 任务数据
  const tasks: Task[] = [
    { id: 1, name: "Python基础赛道", difficulty: "★★☆", duration: "30min", users: 128, rewards: 25, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
    { id: 2, name: "前端开发赛道", difficulty: "★★★", duration: "45min", users: 96, rewards: 35, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
    { id: 3, name: "数据分析赛道", difficulty: "★★★☆", duration: "60min", users: 72, rewards: 45, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
    { id: 4, name: "AI基础赛道", difficulty: "★★★★", duration: "90min", users: 48, rewards: 60, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
    { id: 5, name: "设计思维赛道", difficulty: "★★☆", duration: "30min", users: 84, rewards: 25, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4" },
    { id: 6, name: "写作表达赛道", difficulty: "★★", duration: "20min", users: 156, rewards: 20, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4" },
    { id: 7, name: "项目管理赛道", difficulty: "★★★", duration: "40min", users: 68, rewards: 30, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4" },
    { id: 8, name: "网络安全赛道", difficulty: "★★★★☆", duration: "120min", users: 32, rewards: 80, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4" }
  ];

  // 切换步骤函数
  const switchStep = (index: number) => {
    if (index < 0 || index >= steps.length) return;
    
    setActiveStep(index);
    setContentTitle(steps[index].title);
    setContentDesc(steps[index].desc);
    
    // 通知父组件步骤变化
    if (onStepChange) {
      onStepChange(index);
    }
    
    // 更新视频源
    if (mainVideoRef.current) {
      const videoElement = mainVideoRef.current;
      videoElement.src = steps[index].videoUrl;
      videoElement.load();
      videoElement.play().catch(err => {
        console.log('自动播放失败:', err);
      });
    }
  };

  return (
    <div className={styles.showcasePod}>
      {/* 视频展示区 */}
      <div className={styles.videoStage}>
        <div className={styles.videoContainer}>
          <video className={styles.mainVideo} ref={mainVideoRef} id="mainVideo" autoPlay muted loop>
            <source src={steps[activeStep].videoUrl} type="video/mp4" />
            您的浏览器不支持视频播放
          </video>
        </div>
      </div>
      
      {/* 珍珠导航 */}
      <div className={styles.pearlNav}>
        <div className={styles.pearlLine}></div>
        <div className={styles.pearlContainer} id="pearlContainer">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`${styles.pearl} ${index === activeStep ? styles.active : ''}`}
              data-title={step.title}
              onClick={() => switchStep(index)}
            ></div>
          ))}
        </div>
      </div>
      
      {/* 内容描述 */}
      <div className={styles.contentDesc}>
        <h2 className={styles.contentTitle} id="contentTitle">{contentTitle}</h2>
        <p className={styles.contentText} id="contentDesc">{contentDesc}</p>
        <button className={styles.challengeBtn} id="challengeBtn" onClick={onChallengeClick}>发起同款挑战</button>
      </div>
      
      {/* 中间横向滚动的课程卡片带 */}
      <div className="course-schedule">
        <div className="course-cards">
          {courses.map((course) => (
            <div className="course-card" key={course.id}>
              <div className="course-card-video-container">
                <video className="course-card-video" muted loop>
                  <source src={course.videoUrl} type="video/mp4" />
                  您的浏览器不支持视频播放
                </video>
              </div>
              <div className="course-card-title">{course.title}</div>
              <div className="course-card-info">
                <div>难度：{course.difficulty}</div>
                <div>时长：{course.duration}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="task-fix-bar">接取任务固定栏</div>
      <div className="task-cards">
        {/* 任务卡片流 */}
        {tasks.map((task) => (
          <div className="task-card" key={task.id}>
            <div className="task-card-video-container">
              <video className="task-card-video" muted loop>
                <source src={task.videoUrl} type="video/mp4" />
                您的浏览器不支持视频播放
              </video>
            </div>
            <div className="task-card-name">{task.name}</div>
            <div className="task-card-info">
              <div className="task-card-difficulty">难度：{task.difficulty}</div>
              <div className="task-card-duration">时长：{task.duration}</div>
              <div className="task-card-users">同频：{task.users}人</div>
              <div className="task-card-rewards">+{task.rewards}技能点</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MainStage;