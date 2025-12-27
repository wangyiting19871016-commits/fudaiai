import React from 'react'
import ReactDOM from 'react-dom/client'

// 👇 关键修改：我们要引入刚才新建的那个 NEW 文件！
// 以前是 import App from './App'
import App_NEW from './App_NEW' 

import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {/* 👇 渲染新组件 */}
    <App_NEW />
  </React.StrictMode>,
)