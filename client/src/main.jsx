// main.jsx
// React entry point: mounts the app into <div id="root">.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './styles.css';

// Apply the saved theme before first paint to avoid a flash.
const savedTheme = localStorage.getItem('linkgraveyard_theme');
if (savedTheme === 'light' || savedTheme === 'dark') {
  document.documentElement.dataset.theme = savedTheme;
}

// This is a single-page app, so we manage scroll position ourselves.
// Without this, the browser may restore the previous page's scroll offset
// after navigation (e.g. landing mid-page on `/` after deleting an account
// from a scrolled-down `/settings`).
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
