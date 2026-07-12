/**
 * useAreaSelection — Click-and-drag box selection in empty space for layout feedback.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface AreaBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function useAreaSelection(options: { rootId?: string } = {}) {
  const { rootId = 'agentsight-root' } = options;
  const [isActive, setIsActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [bounds, setBounds] = useState<AreaBounds | null>(null);
  const [previewBounds, setPreviewBounds] = useState<AreaBounds | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const activate = useCallback(() => {
    setIsActive(true);
    setBounds(null);
    setPreviewBounds(null);
  }, []);

  const deactivate = useCallback(() => {
    setIsActive(false);
    setIsDragging(false);
    setBounds(null);
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
        x: e.clientX + window.scrollX,
        y: e.clientY + window.scrollY,
      };
      setIsDragging(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !startPos.current) return;

      const currentX = e.clientX + window.scrollX;
      const currentY = e.clientY + window.scrollY;

      setPreviewBounds({
        x: Math.min(startPos.current.x, currentX),
        y: Math.min(startPos.current.y, currentY),
        width: Math.abs(currentX - startPos.current.x),
        height: Math.abs(currentY - startPos.current.y),
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging || !startPos.current) return;

      const endX = e.clientX + window.scrollX;
      const endY = e.clientY + window.scrollY;

      const finalBounds: AreaBounds = {
        x: Math.min(startPos.current.x, endX),
        y: Math.min(startPos.current.y, endY),
        width: Math.abs(endX - startPos.current.x),
        height: Math.abs(endY - startPos.current.y),
      };

      // Only register if the selection area is meaningful (> 10x10px)
      if (finalBounds.width > 10 && finalBounds.height > 10) {
        setBounds(finalBounds);
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
    bounds,
    previewBounds,
    clearBounds: () => setBounds(null),
  };
}
