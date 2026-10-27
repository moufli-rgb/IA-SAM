import { createRoot } from 'react-dom/client';
import App from './App';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/instrument-sans/wght-italic.css';
import '@fontsource-variable/literata';
import '@fontsource-variable/literata/opsz-italic.css';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Rend SAM installable sur l'écran d'accueil (PWA).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
