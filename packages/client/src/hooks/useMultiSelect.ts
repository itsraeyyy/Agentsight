import { useState, useEffect, useCallback, useRef } from 'react';

export interface AreaBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function useMultiSelect(options: { rootId?: string } = {}) {
  const { rootId = 'agentsight-root' } = options;
  const [isActive, setIsActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedElements, setSelectedElements] = useState<Element[]>([]);
  const [previewBounds, setPreviewBounds] = useState<AreaBounds | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const activate = useCallback(() => {
    setIsActive(true);
    setSelectedElements([]);
    setPreviewBounds(null);
  }, []);

  const deactivate = useCallback(() => {
    setIsActive(false);
    setIsDragging(false);
    setSelectedElements([]);
    setPreviewBounds(null);
    startPos.current = null;
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(`#${rootId}`)) return;

      e.preventDefault();
      startPos.current = {
        x: e.clientX,
        y: e.clientY,
      };
      setIsDragging(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !startPos.current) return;

      const currentX = e.clientX;
      const currentY = e.clientY;

      setPreviewBounds({
        x: Math.min(startPos.current.x, currentX) + window.scrollX,
        y: Math.min(startPos.current.y, currentY) + window.scrollY,
        width: Math.abs(currentX - startPos.current.x),
        height: Math.abs(currentY - startPos.current.y),
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging || !startPos.current) return;

      const endX = e.clientX;
      const endY = e.clientY;

      const rect = {
        left: Math.min(startPos.current.x, endX),
        top: Math.min(startPos.current.y, endY),
        right: Math.max(startPos.current.x, endX),
        bottom: Math.max(startPos.current.y, endY),
      };

      // Only process if selection area is meaningful
      if (rect.right - rect.left > 10 && rect.bottom - rect.top > 10) {
        // Find all intersecting elements
        const elements = Array.from(document.body.querySelectorAll('*')).filter((el) => {
          if (el.closest(`#${rootId}`)) return false; // Ignore toolbar
          const bounds = el.getBoundingClientRect();
          // Check if element is completely inside or significantly intersecting
          const isIntersecting = !(
            bounds.right < rect.left || 
            bounds.left > rect.right || 
            bounds.bottom < rect.top || 
            bounds.top > rect.bottom
          );
          // Only grab actual visible leaf-ish nodes, ignore html/body or massive wrappers
          return isIntersecting && bounds.width > 0 && bounds.height > 0 && bounds.width < window.innerWidth * 0.9;
        }) as Element[];

        if (elements.length > 0) {
          setSelectedElements(elements);
        }
      }

      setIsDragging(false);
      setPreviewBounds(null);
      startPos.current = null;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') deactivate();
    };

    document.addEventListener('mousedown', handleMouseDown, { capture: true });
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    document.body.style.cursor = 'crosshair';

    return () => {
      document.removeEventListener('mousedown', handleMouseDown, { capture: true });
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.cursor = '';
    };
  }, [isActive, isDragging, rootId, deactivate]);

  return {
    isActive,
    isDragging,
    activate,
    deactivate,
    selectedElements,
    previewBounds,
    clearSelection: () => setSelectedElements([]),
  };
}
