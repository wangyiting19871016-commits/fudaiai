import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MissionProvider } from './stores/MissionContext';

// 强制引用 src/pages 下的新文件
import Home from './pages/Home';
import PathPage from './pages/PathPage';
import LabPage from './pages/LabPage';
import EditorPage from './pages/EditorPage';
import LabVisualTest from './pages/LabVisualTest';

// 这是一个全新的 App 组件
const App: React.FC = () => {
  return (
    <MissionProvider>
      <Router>
        <div style={{ width: '100vw', minHeight: '100vh', background: '#222' }}>
          <Routes>
            {/* 首页 */}
            <Route path="/" element={<Home />} />
            
            {/* 战备区：新架构 (PathPage) */}
            <Route path="/path/:taskId" element={<PathPage />} />
            
            {/* 实验室：新架构 (LabPage) */}
            <Route path="/lab/:stepId" element={<LabPage />} />
            
            {/* 编辑页：新架构 (EditorPage) */}
            <Route path="/editor" element={<EditorPage />} />
            
            {/* 视觉测试页：临时测试通道 */}
            <Route path="/test" element={<LabVisualTest />} />
          </Routes>
        </div>
      </Router>
    </MissionProvider>
  );
};

export default App;