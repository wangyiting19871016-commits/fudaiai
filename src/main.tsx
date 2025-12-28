import React from 'react'
import ReactDOM from 'react-dom/client'

// 👇 入口修正：强制归位到标准 App.tsx
import App from './App'

import './index.css'

// 日志锚点 [LOGIC_TRACE]
console.log('[LOGIC_TRACE] 回撤完成。架构已复原。当前版本：MVP_Stable_Base');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)