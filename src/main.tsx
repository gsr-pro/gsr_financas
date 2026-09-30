import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Elemento root não encontrado no documento.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <SubscriptionProvider>
        <WorkspaceProvider>
          <App />
        </WorkspaceProvider>
      </SubscriptionProvider>
    </ThemeProvider>
  </React.StrictMode>
);
