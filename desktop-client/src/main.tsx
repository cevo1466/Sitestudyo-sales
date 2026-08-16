import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/app.css';
import { initTheme } from './services/theme';

// React cizmeden ONCE: koyu tema secili kullanicida bir anlik beyaz
// ekran parlamasi olmasin.
initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
