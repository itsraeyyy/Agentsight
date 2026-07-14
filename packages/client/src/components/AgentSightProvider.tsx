'use client';

import React, { useState } from 'react';
import { useAgentHotkeys } from '../hooks/useAgentHotkeys';
import { useRuntimeFreeze } from '../hooks/useRuntimeFreeze';
import { AgentSightOverlay } from './AgentSightOverlay';

interface AgentSightProviderProps {
  children: React.ReactNode;
}

export const AgentSightProvider: React.FC<AgentSightProviderProps> = ({ children }) => {
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
        <AgentSightOverlay
          isFrozen={isFrozen}
          onClose={() => setIsAnnotating(false)}
        />
      )}
    </>
  );
};
