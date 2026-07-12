/**
 * useTextSelection — Captures text selections for typo/content feedback.
 */

import { useState, useEffect, useCallback } from 'react';

export interface TextSelectionResult {
  text: string;
  element: HTMLElement;
  range: Range;
}

export function useTextSelection(options: { rootId?: string } = {}) {
  const { rootId = 'agentsight-root' } = options;
  const [isActive, setIsActive] = useState(false);
  const [selection, setSelection] = useState<TextSelectionResult | null>(null);

  const activate = useCallback(() => {
    setIsActive(true);
    setSelection(null);
  }, []);

  const deactivate = useCallback(() => {
    setIsActive(false);
    setSelection(null);
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const handleMouseUp = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return;

      const text = sel.toString().trim();
      if (!text) return;

      const range = sel.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const element = container.nodeType === Node.ELEMENT_NODE
        ? container as HTMLElement
        : container.parentElement;

      if (!element || element.closest(`#${rootId}`)) return;

      setSelection({ text, element, range: range.cloneRange() });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') deactivate();
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, rootId, deactivate]);

  return {
    isActive,
    activate,
    deactivate,
    selection,
    clearSelection: () => setSelection(null),
  };
}
