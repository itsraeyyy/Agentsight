import { useState, useEffect, useCallback, useRef } from 'react';

export interface AreaBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HoverState {
  rect: DOMRect | null;
  label: string;
}

export interface CursorState {
  x: number;
  y: number;
  isDragging: boolean;
}

interface UseAgentCursorOptions {
  rootId?: string;
  onPickSingle?: (element: HTMLElement) => void;
  onPickMultiple?: (elements: Element[]) => void;
}

export function useAgentCursor(options: UseAgentCursorOptions = {}) {
  const { rootId = 'agentsight-root', onPickSingle, onPickMultiple } = options;
  const [isActive, setIsActive] = useState(false);
  
  const [cursor, setCursor] = useState<CursorState>({ x: -100, y: -100, isDragging: false });
  const [hoverState, setHoverState] = useState<HoverState>({ rect: null, label: '' });
  const [dragBounds, setDragBounds] = useState<AreaBounds | null>(null);

  const hoverRef = useRef<HTMLElement | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const activate = useCallback(() => {
    setIsActive(true);
  }, []);

  const deactivate = useCallback(() => {
    setIsActive(false);
    setCursor({ x: -100, y: -100, isDragging: false });
    setHoverState({ rect: null, label: '' });
    setDragBounds(null);
    hoverRef.current = null;
    startPos.current = null;
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Always track raw cursor position for the custom dot
      setCursor(prev => ({ ...prev, x: e.clientX, y: e.clientY }));

      const target = e.target as HTMLElement;
      const isOverRoot = target.closest(`#${rootId}`);

      if (startPos.current) {
        // We are dragging
        const currentX = e.clientX;
        const currentY = e.clientY;
        
        setDragBounds({
          x: Math.min(startPos.current.x, currentX) + window.scrollX,
          y: Math.min(startPos.current.y, currentY) + window.scrollY,
          width: Math.abs(currentX - startPos.current.x),
          height: Math.abs(currentY - startPos.current.y),
        });
        
        // Hide hover box while dragging
        if (hoverRef.current) {
           hoverRef.current = null;
           setHoverState({ rect: null, label: '' });
        }
        return;
      }

      // Not dragging -> Hovering single element
      if (isOverRoot) {
        if (hoverRef.current) {
           hoverRef.current = null;
           setHoverState({ rect: null, label: '' });
        }
        return;
      }

      if (hoverRef.current === target) return;
      hoverRef.current = target;

      const rect = target.getBoundingClientRect();
      const tag = target.tagName.toLowerCase();

      let label = `<${tag}>`;
      if (target.id) label = `#${target.id}`;
      else if (target.className && typeof target.className === 'string') {
        const cls = target.className.split(/\s+/).filter(c => c)[0];
        if (cls) label = `${tag}.${cls}`;
      }

      setHoverState({ rect, label });
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(`#${rootId}`)) return;

      e.preventDefault();
      startPos.current = { x: e.clientX, y: e.clientY };
      setCursor(prev => ({ ...prev, isDragging: true }));
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!startPos.current) return;

      const endX = e.clientX;
      const endY = e.clientY;

      const width = Math.abs(endX - startPos.current.x);
      const height = Math.abs(endY - startPos.current.y);

      if (width < 10 && height < 10) {
        // Treated as a click (single select)
        const target = e.target as HTMLElement;
        if (!target.closest(`#${rootId}`)) {
          onPickSingle?.(target);
          deactivate();
        }
      } else {
        // Treated as a drag (multi select)
        const rect = {
          left: Math.min(startPos.current.x, endX),
          top: Math.min(startPos.current.y, endY),
          right: Math.max(startPos.current.x, endX),
          bottom: Math.max(startPos.current.y, endY),
        };

        const elements = Array.from(document.body.querySelectorAll('*')).filter((el) => {
          if (el.closest(`#${rootId}`)) return false;
          const bounds = el.getBoundingClientRect();
          const isIntersecting = !(
            bounds.right < rect.left || 
            bounds.left > rect.right || 
            bounds.bottom < rect.top || 
            bounds.top > rect.bottom
          );
          return isIntersecting && bounds.width > 0 && bounds.height > 0 && bounds.width < window.innerWidth * 0.9;
        }) as Element[];

        if (elements.length > 0) {
          onPickMultiple?.(elements);
          deactivate();
        }
      }

      startPos.current = null;
      setCursor(prev => ({ ...prev, isDragging: false }));
      setDragBounds(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') deactivate();
    };

    const interceptClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`#${rootId}`)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Use capturing phase to override other click handlers on the page
    document.addEventListener('mousemove', handleMouseMove, { capture: true });
    document.addEventListener('mousedown', handleMouseDown, { capture: true });
    document.addEventListener('mouseup', handleMouseUp, { capture: true });
    document.addEventListener('click', interceptClick, { capture: true });
    document.addEventListener('keydown', handleKeyDown);

    // Hide the native cursor globally during active mode
    const oldCursor = document.body.style.cursor;
    document.body.style.cursor = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, { capture: true });
      document.removeEventListener('mousedown', handleMouseDown, { capture: true });
      document.removeEventListener('mouseup', handleMouseUp, { capture: true });
      document.removeEventListener('click', interceptClick, { capture: true });
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.cursor = oldCursor;
    };
  }, [isActive, rootId, onPickSingle, onPickMultiple, deactivate]);

  return {
    isActive,
    activate,
    deactivate,
    cursor,
    hoverState,
    dragBounds
  };
}
