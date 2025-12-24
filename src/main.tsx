import React from 'react';
import ReactDOM from 'react-dom/client';
import '../TruthLayout.css';
import TruthLayout from '../TruthLayout';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <TruthLayout />
  </React.StrictMode>
);