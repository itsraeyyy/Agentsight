/**
 * useElementPicker — DOM element picking with overlay-based highlighting.
 * Uses pointer-events: none overlay instead of class injection to avoid DOM mutation.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface PickedElement {
  element: HTMLElement;
  selector: string;
}

interface UseElementPickerOptions {
  rootId?: string;
  onPick?: (element: HTMLElement) => void;
}

interface HoverState {
  rect: DOMRect | null;
  label: string;
}

export function useElementPicker(options: UseElementPickerOptions = {}) {
  const { rootId = 'agentsight-root', onPick } = options;
  const [isActive, setIsActive] = useState(false);
  const [hoverState, setHoverState] = useState<HoverState>({ rect: null, label: '' });
  const hoverRef = useRef<HTMLElement | null>(null);

  const activate = useCallback(() => setIsActive(true), []);
  const deactivate = useCallback(() => {
    setIsActive(false);
    setHoverState({ rect: null, label: '' });
    hoverRef.current = null;
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(`#${rootId}`)) {
        setHoverState({ rect: null, label: '' });
        return;
      }

      if (hoverRef.current === target) return;
      hoverRef.current = target;

      const rect = target.getBoundingClientRect();
      const tag = target.tagName.toLowerCase();

      // Build a quick identifying label
      let label = `<${tag}>`;
      if (target.id) {
        label = `#${target.id}`;
      } else if (target.textContent?.trim()) {
        const text = target.textContent.trim().slice(0, 30);
        label = `<${tag}> "${text}"`;
      } else if (target.className && typeof target.className === 'string') {
        const cls = target.className.split(/\s+/).filter(c => c)[0];
        if (cls) label = `${tag}.${cls}`;
      }

      setHoverState({ rect, label });
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const target = e.target as HTMLElement;
      if (target.closest(`#${rootId}`)) return;

      onPick?.(target);
      deactivate();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        deactivate();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, { capture: true });
    document.addEventListener('keydown', handleKeyDown);

    // Set cursor to crosshair mode
    document.body.style.cursor = 'crosshair';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, { capture: true });
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.cursor = '';
    };
  }, [isActive, rootId, onPick, deactivate]);

  return {
    isActive,
    activate,
    deactivate,
    hoverState,
  };
}
