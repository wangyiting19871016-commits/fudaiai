import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { MissionProvider } from './stores/MissionContext';
import { AssetProvider } from './stores/AssetStore';
import { ProtocolProvider } from './stores/ActiveProtocolStore';
import { ConfigProvider } from './stores/ConfigStore';
import { APISlotProvider } from './stores/APISlotStore';
import { VoiceProvider } from './stores/VoiceStore';
import Navigation from './components/Navigation';

// 强制引用 src/pages 下的文件
import Home from './pages/Home';
import PathPage from './pages/PathPage';
import LabPage from './pages/LabPage';
import EditorPage from './pages/EditorPage';
import P4LabPage from './pages/P4LabPage';

// 🧧 春节H5页面（全新独立）
import FestivalLayout from './pages/Festival/Layout';
import HomePageGlass from './pages/Festival/HomePageGlass';
import FestivalLabPage from './pages/Festival/LabPage';
import FestivalResultPage from './pages/Festival/ResultPage';
import FestivalVoicePage from './pages/Festival/VoicePageNew';
import FestivalTextPage from './pages/Festival/TextPage';
import FestivalCategoryPage from './pages/Festival/CategoryPage';
import FestivalVideoPage from './pages/Festival/VideoPage';
import TemplateSelectionPage from './pages/Festival/TemplateSelectionPage';
import FortunePage from './pages/Festival/FortunePage';
import MaterialLibraryPage from './pages/Festival/MaterialLibraryPage';
import FortuneCardPage from './pages/Festival/FortuneCardPage';
import SmartReplyPage from './pages/Festival/SmartReplyPage';
import DigitalHumanPage from './pages/Festival/DigitalHumanPage';

// 布局组件，用于处理路由相关的布局逻辑
const AppLayout: React.FC = () => {
  const location = useLocation();
  
  // 仅在 /p4-lab 路径下显示导航栏
  // 修正：根据用户需求，在P1/P2/P4中彻底留白，只在P4LAB显示
  // 注意：用户输入说的是 /p4lab，但路由配置里是 /p4-lab，这里做兼容
  const showNav = location.pathname === '/p4-lab' || location.pathname === '/p4lab';
  
  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: '#222' }}>
      {/* 动态导航栏：仅在 P4LAB 显示 */}
      {showNav && <Navigation />}
      
      {/* 内容区域：如果有导航栏，则添加 padding-top */}
      <div style={{ paddingTop: showNav ? '70px' : '0' }}>
        <Routes>
          {/* 🎯 默认跳转到春节H5 */}
          <Route path="/" element={<Navigate to="/festival/home" replace />} />

          {/* 现有页面（内部测试，通过具体路径访问） */}
          <Route path="/p1" element={<Home />} />
          <Route path="/path/:taskId" element={<PathPage />} />
          <Route path="/lab/:id" element={<LabPage />} />
          <Route path="/p3-direct" element={<LabPage />} />
          <Route path="/lab/direct-fire" element={<LabPage />} />
          <Route path="/p4" element={<EditorPage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/p4-lab" element={<P4LabPage />} />
          <Route path="/p4lab" element={<P4LabPage />} />
          
          {/* 🧧 春节H5（全新独立） */}
          <Route path="/festival" element={<FestivalLayout />}>
            <Route index element={<HomePageGlass />} />
            <Route path="home" element={<HomePageGlass />} />
            <Route path="category/:categoryId" element={<FestivalCategoryPage />} />
            <Route path="template-select/:featureId" element={<TemplateSelectionPage />} />
            <Route path="lab/:missionId" element={<FestivalLabPage />} />
            <Route path="fortune/:missionId" element={<FortunePage />} />
            <Route path="result/:taskId" element={<FestivalResultPage />} />
            <Route path="voice/:taskId" element={<FestivalVoicePage />} />
            <Route path="voice" element={<FestivalVoicePage />} />
            <Route path="text/:featureId" element={<FestivalTextPage />} />
            <Route path="video/:taskId" element={<FestivalVideoPage />} />
            <Route path="video" element={<FestivalVideoPage />} />
            <Route path="materials" element={<MaterialLibraryPage />} />
            <Route path="fortune-card" element={<FortuneCardPage />} />
            <Route path="smart-reply" element={<SmartReplyPage />} />
            <Route path="digital-human" element={<DigitalHumanPage />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
};

// 这是一个全新的 App 组件
const App: React.FC = () => {
  return (
    <ConfigProvider>
      <APISlotProvider>
        <VoiceProvider>
          <MissionProvider>
            <AssetProvider>
              <ProtocolProvider>
              <Router>
                <AppLayout />
              </Router>
            </ProtocolProvider>
            </AssetProvider>
          </MissionProvider>
        </VoiceProvider>
      </APISlotProvider>
    </ConfigProvider>
  );
};

export default App;