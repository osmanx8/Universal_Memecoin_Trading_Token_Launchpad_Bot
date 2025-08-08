import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@fontsource/orbitron/700.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 