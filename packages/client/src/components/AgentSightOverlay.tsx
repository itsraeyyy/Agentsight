import React, { useState, useCallback, useEffect } from 'react';
import { useElementPicker } from '../hooks/useElementPicker';
import { useMultiSelect } from '../hooks/useMultiSelect';
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

  const handlePick = useCallback((el: HTMLElement) => {
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

  const { activate: activatePicker, deactivate: deactivatePicker, hoverState } = useElementPicker({ onPick: handlePick });
  const { activate: activateMulti, deactivate: deactivateMulti, previewBounds: multiPreview, selectedElements, clearSelection } = useMultiSelect();

  useEffect(() => {
    if (selectedElements.length > 0 && !pendingAnnotation) {
      const physicalLCA = getDOMLCA(selectedElements);
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
      clearSelection();
    }
  }, [selectedElements, pendingAnnotation, clearSelection]);

  useEffect(() => {
    activatePicker();
    activateMulti();
    return () => {
      deactivatePicker();
      deactivateMulti();
    };
  }, [activatePicker, activateMulti]);

  const handleSubmit = (note: string) => {
    if (!pendingAnnotation) return;

    const finalAnn: Annotation = { ...pendingAnnotation, note } as Annotation;
    setAnnotations(prev => [...prev, finalAnn]);
    
    const payload = compileMarkdown([finalAnn], 'standard');
    navigator.clipboard.writeText(payload).catch(() => {});

    // Send payload to the AgentSight MCP bridge
    fetch('http://localhost:3010/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdownPayload: payload })
    }).catch(err => console.warn('[AgentSight] MCP POST failed', err));

    setPendingAnnotation(null);
  };

  const handleCancel = () => {
    setPendingAnnotation(null);
  };

  const pendingRect = pendingAnnotation?.element
    ? pendingAnnotation.element.getBoundingClientRect()
    : null;

  return (
    <div id="agentsight-root">
      {/* Border overlay indicating annotation mode is active */}
      <div style={{
        position: 'fixed',
        inset: 0,
        border: '4px solid #E57B2A',
        pointerEvents: 'none',
        zIndex: 2147483645,
      }} />

      {hoverState?.rect && !pendingAnnotation && (
        <HoverTooltip rect={hoverState.rect} label={hoverState.label} />
      )}
      
      {multiPreview && !pendingAnnotation && (
        <div 
          className="agentsight-area-preview"
          style={{
            position: 'absolute',
            top: multiPreview.y,
            left: multiPreview.x,
            width: multiPreview.width,
            height: multiPreview.height,
            pointerEvents: 'none',
            zIndex: 2147483646
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
