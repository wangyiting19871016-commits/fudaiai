import React, { Suspense, lazy, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useCreditStore } from './stores/creditStore';
import { MissionProvider } from './stores/MissionContext';
import { AssetProvider } from './stores/AssetStore';
import { ProtocolProvider } from './stores/ActiveProtocolStore';
import { ConfigProvider } from './stores/ConfigStore';
import { APISlotProvider } from './stores/APISlotStore';
import { VoiceProvider } from './stores/VoiceStore';
import Navigation from './components/Navigation';
import { initAnalyticsInterceptor } from './utils/analyticsInterceptor';

// 强制引用 src/pages 下的文件
const Home = lazy(() => import('./pages/Home'));
const PathPage = lazy(() => import('./pages/PathPage'));
const LabPage = lazy(() => import('./pages/LabPage'));
const EditorPage = lazy(() => import('./pages/EditorPage'));
const P4LabPage = lazy(() => import('./pages/P4LabPage'));

// 🧧 春节H5 — Layout/HomePageGlass 必须直接import（不能lazy）
//    原因：lazy会导致festival-home-glass.css和festival-design-system.css被拆到单独chunk
//    首屏依赖这些CSS变量和样式，拆分后会白屏
import FestivalLayout from './pages/Festival/Layout';
import HomePageGlass from './pages/Festival/HomePageGlass';
const FestivalLabPage = lazy(() => import('./pages/Festival/LabPage'));
const FestivalResultPage = lazy(() => import('./pages/Festival/ResultPage'));
const FestivalVoicePage = lazy(() => import('./pages/Festival/VoicePageNew'));
const FestivalTextPage = lazy(() => import('./pages/Festival/TextPage'));
const FestivalCategoryPage = lazy(() => import('./pages/Festival/CategoryPage'));
const FestivalVideoPage = lazy(() => import('./pages/Festival/VideoPage'));
const VideoResultPage = lazy(() => import('./pages/Festival/VideoResultPage'));
const VideoCategoryPage = lazy(() => import('./pages/Festival/VideoCategoryPage'));
const CreativeVideoPage = lazy(() => import('./pages/Festival/CreativeVideoPage'));
const TemplateSelectionPage = lazy(() => import('./pages/Festival/TemplateSelectionPage'));
const FortunePage = lazy(() => import('./pages/Festival/FortunePage'));
const MaterialLibraryPage = lazy(() => import('./pages/Festival/MaterialLibraryPage'));
const FortuneCardPage = lazy(() => import('./pages/Festival/FortuneCardPage'));
const SmartReplyPage = lazy(() => import('./pages/Festival/SmartReplyPage'));
const RechargePage = lazy(() => import('./pages/Festival/RechargePage'));
const PaymentSuccessPage = lazy(() => import('./pages/Festival/PaymentSuccessPage'));
const M2TemplateSelectionPage = lazy(() => import('./pages/Festival/M2TemplateSelectionPage'));
const M3TemplateSelectionPage = lazy(() => import('./pages/Festival/M3TemplateSelectionPage'));
const CompanionUploadPage = lazy(() => import('./pages/Festival/CompanionUploadPage'));
const CompanionGeneratingPage = lazy(() => import('./pages/Festival/CompanionGeneratingPage'));
const CompanionResultPage = lazy(() => import('./pages/Festival/CompanionResultPage'));

// 管理后台页面
const AdminLoginPage = lazy(() => import('./pages/Admin/LoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/Admin/DashboardPage'));
const AdminUsersPage = lazy(() => import('./pages/Admin/UsersPage'));
const AdminAPILogsPage = lazy(() => import('./pages/Admin/APILogsPage'));
const AdminCreditsPage = lazy(() => import('./pages/Admin/CreditsPage'));
const AdminQRCodePage = lazy(() => import('./pages/Admin/QRCodePage'));
const AdminFeedbackPage = lazy(() => import('./pages/Admin/FeedbackPage'));
const FeedbackPage = lazy(() => import('./pages/Festival/FeedbackPage'));

// ⚠️ 已废弃页面（已移除）
// - DigitalHumanPage.tsx → 合并到VideoPage.tsx (2026-02-06)
// - KlingEffectsPage.tsx → 功能下线 (2026-02-08)
// - VideoPageNew.tsx → 重命名为VideoPageMultiMode.tsx.backup备份 (2026-02-08)

// 🦴 Suspense骨架屏（与festival风格一致，避免白屏/闪烁）
const FestivalSkeleton: React.FC = () => (
  <div style={{ minHeight: '100vh', background: '#FDFBF7' }}>
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '60px 20px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#D32F2F', letterSpacing: 2 }}>福袋AI</div>
      </div>
      {[120, 70].map((h, i) => (
        <div key={i} style={{
          background: 'rgba(255,255,255,0.85)', borderRadius: 16,
          padding: 20, marginBottom: 14,
          border: '1px solid rgba(0,0,0,0.06)'
        }}>
          <div style={{
            height: 14, width: i === 0 ? '40%' : '55%',
            background: '#eee', borderRadius: 7
          }} />
          <div style={{
            height: h, marginTop: 14,
            background: '#eee', borderRadius: 12
          }} />
        </div>
      ))}
    </div>
  </div>
);

// 布局组件，用于处理路由相关的布局逻辑
const AppLayout: React.FC = () => {
  const location = useLocation();
  
  // 仅在 /p4-lab 路径下显示导航栏
  // 修正：根据用户需求，在P1/P2/P4中彻底留白，只在P4LAB显示
  // 注意：用户输入说的是 /p4lab，但路由配置里是 /p4-lab，这里做兼容
  const showNav = location.pathname === '/p4-lab' || location.pathname === '/p4lab';
  
  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#222' }}>
      {/* 动态导航栏：仅在 P4LAB 显示 */}
      {showNav && <Navigation />}

      {/* 内容区域：如果有导航栏，则添加 padding-top */}
      <div style={{ paddingTop: showNav ? '70px' : '0' }}>
        <Suspense fallback={<FestivalSkeleton />}>
          <Routes>
          {/* 🎯 默认跳转到春节H5 */}
          <Route path="/" element={<Navigate to="/festival/home" replace />} />

          {/* 🔐 管理后台 */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/api-logs" element={<AdminAPILogsPage />} />
          <Route path="/admin/credits" element={<AdminCreditsPage />} />
          <Route path="/admin/qrcode" element={<AdminQRCodePage />} />
          <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

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
            <Route path="category/video" element={<VideoCategoryPage />} />
            <Route path="video-category" element={<VideoCategoryPage />} />
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
            <Route path="video-result/:filename" element={<VideoResultPage />} />
            <Route path="creative-video" element={<CreativeVideoPage />} />
            <Route path="materials" element={<MaterialLibraryPage />} />
            <Route path="fortune-card" element={<FortuneCardPage />} />
            <Route path="smart-reply" element={<SmartReplyPage />} />

            {/* 已废弃路由 - 重定向到主要功能 */}
            <Route path="digital-human" element={<Navigate to="/festival/video" replace />} />
            <Route path="kling-effects" element={<Navigate to="/festival/category/video" replace />} />
            <Route path="recharge" element={<RechargePage />} />
            <Route path="payment-success" element={<PaymentSuccessPage />} />
            <Route path="m2-template-select" element={<M2TemplateSelectionPage />} />
            <Route path="m3-template-select" element={<M3TemplateSelectionPage />} />
            <Route path="companion/test-v2" element={<Navigate to="/festival/companion" replace />} />
            <Route path="contact" element={<FeedbackPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="companion" element={<CompanionUploadPage />} />
            <Route path="companion/generating" element={<CompanionGeneratingPage />} />
            <Route path="companion/result" element={<CompanionResultPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/festival/home" replace />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
};

// 这是一个全新的 App 组件
const App: React.FC = () => {
  const initVisitor = useCreditStore((state) => state.initVisitor);
  const creditData = useCreditStore((state) => state.creditData);

  // 初始化访客ID和积分，同步服务端（并行化，不阻塞渲染）
  useEffect(() => {
    initVisitor();
    initAnalyticsInterceptor();
    // 先迁移本地积分到服务端，再同步余额（必须串行，否则积分数据不一致）
    import('./stores/creditStore').then(({ migrateLocalCreditsToServer, syncCreditsFromServer }) => {
      migrateLocalCreditsToServer().then(() => syncCreditsFromServer()).catch(() => {});
    });
    // 🚀 预加载次要路由chunk（主包加载完毕后开始，不等用户点击）
    const preload = () => {
      import('./pages/Festival/CategoryPage');
      import('./pages/Festival/VideoPage');
    };
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(preload, { timeout: 3000 });
    } else {
      setTimeout(preload, 2000);
    }
  }, [initVisitor]);

  // 新用户欢迎提示（仅首次）
  useEffect(() => {
    // 检查是否是新用户（有赠送积分的交易记录）
    const hasWelcomeGift = creditData.transactions.some(
      t => t.type === 'gift' && t.description.includes('新春礼包')
    );

    // 如果有赠送记录且是首次访问（总消耗为0），显示欢迎提示
    if (hasWelcomeGift && creditData.totalConsumed === 0 && creditData.totalRecharged === 0) {
      const hasShownWelcome = sessionStorage.getItem('festival_welcome_shown');
      if (!hasShownWelcome) {
        setTimeout(() => {
          sessionStorage.setItem('festival_welcome_shown', 'true');
        }, 1000);
      }
    }
  }, [creditData]);

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
