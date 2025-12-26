import React from 'react'
import ReactDOM from 'react-dom/client'
import Home from './pages/Home'
import PathView from './pages/PathView'
import Workbench from './pages/Workbench'

function AppRouter() {
  const hash = window.location.hash

  if (hash.startsWith('#/workbench')) {
    return <Workbench />
  }

  if (hash.startsWith('#/path')) {
    return <PathView />
  }

  return <Home />
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
)
