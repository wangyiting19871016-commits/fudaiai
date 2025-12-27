import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import HallPage from './pages/Home';
import PathPage from './pages/PathPage';
import LabPage from './pages/LabPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HallPage />} />
        {/* 注意：这里的路径必须包含参数，且命名要统一 */}
        <Route path="/path/:missionId" element={<PathPage />} />
        <Route path="/lab/:slotId" element={<LabPage />} />
      </Routes>
    </Router>
  );
}

export default App;