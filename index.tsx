import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');
const loadingElement = document.getElementById('root-loading');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Hide the static loading screen once JS starts executing
if (loadingElement) {
    loadingElement.style.display = 'none';
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);