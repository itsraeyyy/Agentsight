import React, { useState } from 'react';
import { useAgentHotkeys } from '../hooks/useAgentHotkeys';
import { useRuntimeFreeze } from '../hooks/useRuntimeFreeze';
import { AgentationOverlay } from './AgentationOverlay';

interface AgentationProviderProps {
  children: React.ReactNode;
}

export const AgentationProvider: React.FC<AgentationProviderProps> = ({ children }) => {
  const [isAnnotating, setIsAnnotating] = useState(false);
  const { isFrozen, toggleFreeze } = useRuntimeFreeze();

  useAgentHotkeys(
    () => setIsAnnotating((prev) => !prev),
    toggleFreeze,
    () => {
      setIsAnnotating(false);
    }
  );

  return (
    <>
      {children}
      {isAnnotating && (
        <AgentationOverlay
          isFrozen={isFrozen}
          onClose={() => setIsAnnotating(false)}
        />
      )}
    </>
  );
};
