import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './ErrorBoundary';

console.log('[App] Starting application initialization...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[App] Fatal error: Could not find root element to mount to');
  throw new Error("Could not find root element to mount to");
}

console.log('[App] Root element found, mounting React app...');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);