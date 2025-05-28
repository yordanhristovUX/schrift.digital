import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './i18n';
import './styles/tokens.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <React.Suspense fallback={<div>Loading...</div>}>
        <App />
      </React.Suspense>
    </HelmetProvider>
  </React.StrictMode>
);