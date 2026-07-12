import React from 'react';
import { createRoot } from 'react-dom/client';
import { Toolbar } from './components/Toolbar';
import './styles.css';

export function initAgentSight() {
  if (document.getElementById('agentsight-root')) {
    console.warn('AgentSight is already initialized.');
    return;
  }
  
  const rootElement = document.createElement('div');
  rootElement.id = 'agentsight-root';
  document.body.appendChild(rootElement);

  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <Toolbar />
    </React.StrictMode>
  );
}

// Auto-initialize if script is loaded directly in browser for dev
if (typeof window !== 'undefined') {
  (window as any).initAgentSight = initAgentSight;
}
