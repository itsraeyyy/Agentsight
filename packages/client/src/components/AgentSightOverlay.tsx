import React, { useState, useCallback, useEffect } from 'react';
import { useAgentCursor } from '../hooks/useAgentCursor';
import { Annotation } from '../hooks/useMarkerPositions';
import { MarkerLayer } from './MarkerLayer';
import { HoverTooltip } from './HoverTooltip';
import { FeedbackPopover } from './FeedbackPopover';
import { compileMarkdown } from '../utils/markdownCompiler';
import { getUniqueSelector } from '../utils/selectorBuilder';
import { getReactComponentName } from '../utils/reactFiberWalker';
import { extractStyles } from '../utils/styleExtractor';
import { getDOMLCA, getNamedReactAncestor } from '../utils/lcaTraversal';

interface AgentSightOverlayProps {
  isFrozen: boolean;
  onClose: () => void;
}

export const AgentSightOverlay: React.FC<AgentSightOverlayProps> = ({ isFrozen, onClose }) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [pendingAnnotation, setPendingAnnotation] = useState<Partial<Annotation> | null>(null);

  const handlePickSingle = useCallback((el: HTMLElement) => {
    if (pendingAnnotation) return;

    const selector = getUniqueSelector(el);
    const newAnn: Partial<Annotation> = {
      id: `ann-${Date.now()}`,
      element: el,
      selector,
      reactComponent: getReactComponentName(el) || undefined,
      styles: extractStyles(el) as unknown as Annotation['styles'],
      html: el.outerHTML,
    };
    setPendingAnnotation(newAnn);
  }, [pendingAnnotation]);

  const handlePickMultiple = useCallback((elements: Element[]) => {
    if (pendingAnnotation) return;

    const physicalLCA = getDOMLCA(elements);
    const reactContext = getNamedReactAncestor(physicalLCA);

    if (reactContext) {
      const { componentName, containerNode } = reactContext;
      const selector = getUniqueSelector(containerNode as HTMLElement);

      const newAnn: Partial<Annotation> = {
        id: `ann-${Date.now()}`,
        element: containerNode as HTMLElement,
        selector,
        reactComponent: componentName,
        html: containerNode.outerHTML,
      };
      setPendingAnnotation(newAnn);
    }
  }, [pendingAnnotation]);

  const { activate, deactivate, cursor, hoverState, dragBounds, isActive } = useAgentCursor({
    onPickSingle: handlePickSingle,
    onPickMultiple: handlePickMultiple
  });

  useEffect(() => {
    activate();
    return () => deactivate();
  }, [activate, deactivate]);

  const handleSubmit = (note: string) => {
    if (!pendingAnnotation) return;

    const finalAnn: Annotation = { ...pendingAnnotation, note } as Annotation;
    
    setAnnotations(prev => {
      const updatedAnnotations = [...prev, finalAnn];
      
      const payload = compileMarkdown(updatedAnnotations, 'standard');
      navigator.clipboard.writeText(payload).catch(() => {});

      // Send payload to the AgentSight MCP bridge
      fetch('http://localhost:3010/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdownPayload: payload })
      }).catch(err => console.warn('[AgentSight] MCP POST failed', err));

      return updatedAnnotations;
    });

    setPendingAnnotation(null);
    activate(); // Reactivate the cursor tool after submitting
  };

  const handleCancel = () => {
    setPendingAnnotation(null);
    activate();
  };

  const pendingRect = pendingAnnotation?.element
    ? pendingAnnotation.element.getBoundingClientRect()
    : null;

  return (
    <div id="agentsight-root">
      {/* Border overlay indicating annotation mode is active */}
      {isActive && !pendingAnnotation && (
        <div style={{
          position: 'fixed',
          inset: 0,
          border: '4px solid #E57B2A',
          pointerEvents: 'none',
          zIndex: 2147483645,
        }} />
      )}

      {/* Smooth Highlight Overlay */}
      {isActive && hoverState?.rect && !pendingAnnotation && (
        <HoverTooltip rect={hoverState.rect} label={hoverState.label} />
      )}
      
      {/* Smooth Drag Area Selection Overlay */}
      {isActive && dragBounds && !pendingAnnotation && (
        <div 
          className="agentsight-area-preview"
          style={{
            position: 'absolute',
            top: dragBounds.y,
            left: dragBounds.x,
            width: dragBounds.width,
            height: dragBounds.height,
            pointerEvents: 'none',
            zIndex: 2147483646
          }}
        />
      )}

      {/* Custom Pointer/Cursor */}
      {isActive && !pendingAnnotation && cursor.x !== -100 && (
        <div
          className="agentsight-custom-cursor"
          style={{
            position: 'fixed',
            left: cursor.x,
            top: cursor.y,
            transform: `translate(-50%, -50%) scale(${cursor.isDragging ? 0.8 : 1})`,
            pointerEvents: 'none',
            zIndex: 2147483650
          }}
        />
      )}

      <MarkerLayer annotations={annotations} />

      {pendingAnnotation && pendingRect && (
        <FeedbackPopover
          targetRect={pendingRect}
          reactComponent={pendingAnnotation.reactComponent}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};
