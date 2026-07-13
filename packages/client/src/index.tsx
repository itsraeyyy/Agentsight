import React from 'react';
import { createRoot } from 'react-dom/client';
import { AgentSightProvider } from './components/AgentSightProvider';
import './styles.css';

/**
 * Imperatively initialize AgentSight by mounting the provider overlay
 * into a new root element appended to document.body.
 * Useful when you can't wrap your app with <AgentSightProvider>.
 */
export function initAgentSight() {
  if (document.getElementById('agentsight-root')) {
    console.warn('[AgentSight] Already initialized.');
    return;
  }
  
  const rootElement = document.createElement('div');
  rootElement.id = 'agentsight-root';
  document.body.appendChild(rootElement);

  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <AgentSightProvider>
        <></>
      </AgentSightProvider>
    </React.StrictMode>
  );
}

// Auto-expose on window for direct browser script usage
if (typeof window !== 'undefined') {
  (window as any).initAgentSight = initAgentSight;
}
