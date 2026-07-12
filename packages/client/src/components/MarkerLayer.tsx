/**
 * MarkerLayer — Renders numbered annotation markers at absolute positions.
 * Based on utility.md: wrapper has pointer-events: none, markers have pointer-events: auto.
 */

import React from 'react';
import { useMarkerPositions, Annotation } from '../hooks/useMarkerPositions';

interface MarkerLayerProps {
  annotations: Annotation[];
  onMarkerClick?: (annotation: Annotation) => void;
  clarificationMessage?: { annotationId: string; message: string } | null;
}

export const MarkerLayer: React.FC<MarkerLayerProps> = ({
  annotations,
  onMarkerClick,
  clarificationMessage,
}) => {
  const positions = useMarkerPositions(annotations);

  if (positions.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2147483646,
      }}
    >
      {positions.map((pos, index) => {
        const annotation = annotations.find((a) => a.id === pos.id);
        const hasClarification =
          clarificationMessage && clarificationMessage.annotationId === pos.id;

        return (
          <React.Fragment key={pos.id}>
            {/* The numbered marker */}
            <div
              className="agentsight-marker"
              style={{
                position: 'absolute',
                top: `${pos.top}px`,
                left: `${pos.left}px`,
              }}
              onClick={() => annotation && onMarkerClick?.(annotation)}
            >
              {index + 1}
            </div>

            {/* Agent clarification tooltip — minimal, quiet, attached to marker */}
            {hasClarification && (
              <div
                className="agentsight-clarification"
                style={{
                  position: 'absolute',
                  top: `${pos.top - 40}px`,
                  left: `${pos.left + 28}px`,
                }}
              >
                <span className="agentsight-clarification-label">Agent</span>
                <span className="agentsight-clarification-text">
                  {clarificationMessage.message}
                </span>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
