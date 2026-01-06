import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { MissionProvider } from './stores/MissionContext';

// 强制引用 src/pages 下的新文件
import Home from './pages/Home';
import PathPage from './pages/PathPage';
import LabPage from './pages/LabPage';
import EditorPage from './pages/EditorPage';
import StudioPage from './pages/StudioPage';

// 这是一个全新的 App 组件
const App: React.FC = () => {
  return (
    <MissionProvider>
      <Router>
        <div style={{ width: '100vw', minHeight: '100vh', background: '#222' }}>
          <Routes>
            {/* 首页 */}
            <Route path="/" element={<Home />} />            
            {/* P1 任务工厂 */}
            <Route path="/p1" element={<Home />} />            
            {/* 战备区：新架构 (PathPage) */}
            <Route path="/path/:taskId" element={<PathPage />} />
            
            {/* 实验室：统一路由路径 */}
            <Route path="/lab/:id" element={<LabPage />} />
            {/* 直连实验室：静态路由 */}
            <Route path="/p3-direct" element={<LabPage />} />
            {/* 直连实验室：fire 路由 */}
            <Route path="/lab/direct-fire" element={<LabPage />} />
            
            {/* 编辑页：新架构 (EditorPage) */}
            <Route path="/editor" element={<EditorPage />} />
            
            {/* P4 工业化工作室：新架构 (StudioPage) */}
            <Route path="/studio" element={<StudioPage />} />
            {/* 备用入口：通过/foundry绕过P2逻辑进入P4 */}
            <Route path="/foundry" element={<StudioPage />} />
          </Routes>
        </div>
      </Router>
    </MissionProvider>
  );
};

export default App;