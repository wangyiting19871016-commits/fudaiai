// @ts-nocheck
import './TruthLayout.css';
// 模拟React模块
const React: any = (window as any).React;
const useState: any = React.useState;

const TruthLayout: any = () => {
  // 跟踪展开的任务卡片ID
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  // 处理任务卡片点击
  const handleTaskCardClick = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index);
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

        {/* 中间核心区 */}
        <section className="center-core">
          {/* 顶部两舱矩阵展示区：双子星闭环阵列 */}
          <div className="video-matrix">
            {/* 第一个展示舱：成果+路径+瞬间记录 */}
            <div className="showcase-pod">
              <div className="pod-content">
                <div className="achievement-main-window">成果主窗</div>
                <div className="path-side-window">路径侧窗</div>
              </div>
              <div className="moment-strip">
                <div className="moment-item">瞬间1</div>
                <div className="moment-item">瞬间2</div>
                <div className="moment-item">瞬间3</div>
                <div className="moment-item">瞬间4</div>
                <div className="moment-item">瞬间5</div>
                <div className="moment-item">瞬间6</div>
              </div>
            </div>
            {/* 第二个展示舱：成果+路径+瞬间记录 */}
            <div className="showcase-pod">
              <div className="pod-content">
                <div className="achievement-main-window">成果主窗</div>
                <div className="path-side-window">路径侧窗</div>
              </div>
              <div className="moment-strip">
                <div className="moment-item">瞬间1</div>
                <div className="moment-item">瞬间2</div>
                <div className="moment-item">瞬间3</div>
                <div className="moment-item">瞬间4</div>
                <div className="moment-item">瞬间5</div>
                <div className="moment-item">瞬间6</div>
              </div>
            </div>
          </div>

          {/* 中间横向滚动的课程卡片带 */}
          <div className="course-schedule">
            <div className="course-cards">
              <div className="course-card">
                <div className="course-card-title">Python基础课程</div>
                <div className="course-card-info">
                  <div>难度：★★☆</div>
                  <div>时长：30min</div>
                </div>
              </div>
              <div className="course-card">
                <div className="course-card-title">前端开发课程</div>
                <div className="course-card-info">
                  <div>难度：★★★</div>
                  <div>时长：45min</div>
                </div>
              </div>
              <div className="course-card">
                <div className="course-card-title">数据分析课程</div>
                <div className="course-card-info">
                  <div>难度：★★★☆</div>
                  <div>时长：60min</div>
                </div>
              </div>
              <div className="course-card">
                <div className="course-card-title">AI基础课程</div>
                <div className="course-card-info">
                  <div>难度：★★★★</div>
                  <div>时长：90min</div>
                </div>
              </div>
              <div className="course-card">
                <div className="course-card-title">设计思维课程</div>
                <div className="course-card-info">
                  <div>难度：★★☆</div>
                  <div>时长：30min</div>
                </div>
              </div>
              <div className="course-card">
                <div className="course-card-title">写作表达课程</div>
                <div className="course-card-info">
                  <div>难度：★★</div>
                  <div>时长：20min</div>
                </div>
              </div>
            </div>
          </div>

          <div className="task-fix-bar">接取任务固定栏</div>
          <div className="task-cards">
            {/* 任务卡片流 */}
            <div className={`task-card ${expandedCard === 0 ? 'expanded' : ''}`} onClick={() => handleTaskCardClick(0)}>
              <div className="task-card-name">Python基础赛道</div>
              <div className="task-card-info">
                <div className="task-card-difficulty">难度：★★☆</div>
                <div className="task-card-duration">时长：30min</div>
                <div className="task-card-users">同频：128人</div>
                <div className="task-card-rewards">+25技能点</div>
              </div>
            </div>
            <div className={`task-card ${expandedCard === 1 ? 'expanded' : ''}`} onClick={() => handleTaskCardClick(1)}>
              <div className="task-card-name">前端开发赛道</div>
              <div className="task-card-info">
                <div className="task-card-difficulty">难度：★★★</div>
                <div className="task-card-duration">时长：45min</div>
                <div className="task-card-users">同频：96人</div>
                <div className="task-card-rewards">+35技能点</div>
              </div>
            </div>
            <div className={`task-card ${expandedCard === 2 ? 'expanded' : ''}`} onClick={() => handleTaskCardClick(2)}>
              <div className="task-card-name">数据分析赛道</div>
              <div className="task-card-info">
                <div className="task-card-difficulty">难度：★★★☆</div>
                <div className="task-card-duration">时长：60min</div>
                <div className="task-card-users">同频：72人</div>
                <div className="task-card-rewards">+45技能点</div>
              </div>
            </div>
            <div className={`task-card ${expandedCard === 3 ? 'expanded' : ''}`} onClick={() => handleTaskCardClick(3)}>
              <div className="task-card-name">AI基础赛道</div>
              <div className="task-card-info">
                <div className="task-card-difficulty">难度：★★★★</div>
                <div className="task-card-duration">时长：90min</div>
                <div className="task-card-users">同频：48人</div>
                <div className="task-card-rewards">+60技能点</div>
              </div>
            </div>
            <div className={`task-card ${expandedCard === 4 ? 'expanded' : ''}`} onClick={() => handleTaskCardClick(4)}>
              <div className="task-card-name">设计思维赛道</div>
              <div className="task-card-info">
                <div className="task-card-difficulty">难度：★★☆</div>
                <div className="task-card-duration">时长：30min</div>
                <div className="task-card-users">同频：84人</div>
                <div className="task-card-rewards">+25技能点</div>
              </div>
            </div>
            <div className={`task-card ${expandedCard === 5 ? 'expanded' : ''}`} onClick={() => handleTaskCardClick(5)}>
              <div className="task-card-name">写作表达赛道</div>
              <div className="task-card-info">
                <div className="task-card-difficulty">难度：★★</div>
                <div className="task-card-duration">时长：20min</div>
                <div className="task-card-users">同频：156人</div>
                <div className="task-card-rewards">+20技能点</div>
              </div>
            </div>
            <div className={`task-card ${expandedCard === 6 ? 'expanded' : ''}`} onClick={() => handleTaskCardClick(6)}>
              <div className="task-card-name">项目管理赛道</div>
              <div className="task-card-info">
                <div className="task-card-difficulty">难度：★★★</div>
                <div className="task-card-duration">时长：40min</div>
                <div className="task-card-users">同频：68人</div>
                <div className="task-card-rewards">+30技能点</div>
              </div>
            </div>
            <div className={`task-card ${expandedCard === 7 ? 'expanded' : ''}`} onClick={() => handleTaskCardClick(7)}>
              <div className="task-card-name">网络安全赛道</div>
              <div className="task-card-info">
                <div className="task-card-difficulty">难度：★★★★☆</div>
                <div className="task-card-duration">时长：120min</div>
                <div className="task-card-users">同频：32人</div>
                <div className="task-card-rewards">+80技能点</div>
              </div>
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
    </div>
  );
};

export default TruthLayout;