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

const Home = lazy(() => import('./pages/Home'));
const PathPage = lazy(() => import('./pages/PathPage'));
const LabPage = lazy(() => import('./pages/LabPage'));
const EditorPage = lazy(() => import('./pages/EditorPage'));
const P4LabPage = lazy(() => import('./pages/P4LabPage'));

const FestivalLayout = lazy(() => import('./pages/Festival/Layout'));
const HomePageGlass = lazy(() => import('./pages/Festival/HomePageGlass'));
const FestivalLabPage = lazy(() => import('./pages/Festival/LabPage'));
const FestivalResultPage = lazy(() => import('./pages/Festival/ResultPage'));
const FestivalVoicePage = lazy(() => import('./pages/Festival/VoicePageNew'));
const FestivalTextPage = lazy(() => import('./pages/Festival/TextPage'));
const FestivalCategoryPage = lazy(() => import('./pages/Festival/CategoryPage'));
const FestivalVideoPage = lazy(() => import('./pages/Festival/VideoPage'));
const VideoCategoryPage = lazy(() => import('./pages/Festival/VideoCategoryPage'));
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

const AdminLoginPage = lazy(() => import('./pages/Admin/LoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/Admin/DashboardPage'));
const AdminUsersPage = lazy(() => import('./pages/Admin/UsersPage'));
const AdminAPILogsPage = lazy(() => import('./pages/Admin/APILogsPage'));

const AppLayout: React.FC = () => {
  const location = useLocation();
  const showNav = location.pathname === '/p4-lab' || location.pathname === '/p4lab';

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: '#222' }}>
      {showNav && <Navigation />}

      <div style={{ paddingTop: showNav ? '70px' : '0' }}>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Navigate to="/festival/home" replace />} />

            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/api-logs" element={<AdminAPILogsPage />} />
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

            <Route path="/p1" element={<Home />} />
            <Route path="/path/:taskId" element={<PathPage />} />
            <Route path="/lab/:id" element={<LabPage />} />
            <Route path="/p3-direct" element={<LabPage />} />
            <Route path="/lab/direct-fire" element={<LabPage />} />
            <Route path="/p4" element={<EditorPage />} />
            <Route path="/editor" element={<EditorPage />} />
            <Route path="/p4-lab" element={<P4LabPage />} />
            <Route path="/p4lab" element={<P4LabPage />} />

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
              <Route path="materials" element={<MaterialLibraryPage />} />
              <Route path="fortune-card" element={<FortuneCardPage />} />
              <Route path="smart-reply" element={<SmartReplyPage />} />

              <Route path="digital-human" element={<Navigate to="/festival/video" replace />} />
              <Route path="kling-effects" element={<Navigate to="/festival/category/video" replace />} />
              <Route path="recharge" element={<RechargePage />} />
              <Route path="payment-success" element={<PaymentSuccessPage />} />
              <Route path="m2-template-select" element={<M2TemplateSelectionPage />} />
              <Route path="m3-template-select" element={<M3TemplateSelectionPage />} />
              <Route path="companion" element={<CompanionUploadPage />} />
              <Route path="companion/generating" element={<CompanionGeneratingPage />} />
              <Route path="companion/result" element={<CompanionResultPage />} />
            </Route>
          </Routes>
        </Suspense>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const initVisitor = useCreditStore((state) => state.initVisitor);
  const creditData = useCreditStore((state) => state.creditData);

  useEffect(() => {
    initVisitor();
    initAnalyticsInterceptor();
  }, [initVisitor]);

  useEffect(() => {
    const hasWelcomeGift = creditData.transactions.some(
      (t) => t.type === 'gift' && t.description.includes('新春礼包')
    );

    if (hasWelcomeGift && creditData.totalConsumed === 0 && creditData.totalRecharged === 0) {
      const hasShownWelcome = sessionStorage.getItem('festival_welcome_shown');
      if (!hasShownWelcome) {
        setTimeout(() => {
          console.log('🎁 新春礼包：赠送100积分体验');
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
