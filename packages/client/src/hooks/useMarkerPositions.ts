/**
 * useMarkerPositions — Tracks absolute positions of annotated elements.
 * Based on utility.md positioning math: rect.top + window.scrollY
 * Uses scroll, resize, and ResizeObserver to keep markers locked.
 */

import { useState, useEffect } from 'react';

export interface Annotation {
  id: string;
  element: HTMLElement;
  note: string;
  selectedText?: string;
  areaBounds?: { x: number; y: number; width: number; height: number };
  selector?: string;
  reactComponent?: string;
  styles?: Record<string, string>;
  html?: string;
}

export interface MarkerPosition {
  id: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

export function useMarkerPositions(annotations: Annotation[]): MarkerPosition[] {
  const [positions, setPositions] = useState<MarkerPosition[]>([]);

  useEffect(() => {
    const updatePositions = () => {
      const newPositions = annotations.map((ann) => {
        const rect = ann.element.getBoundingClientRect();

        return {
          id: ann.id,
          // Absolute position on the document, offset to center the 24px marker
          top: rect.top + window.scrollY - 12,
          left: rect.left + window.scrollX - 12,
          width: rect.width,
          height: rect.height,
        };
      });
      setPositions(newPositions);
    };

    updatePositions();

    window.addEventListener('scroll', updatePositions, { passive: true });
    window.addEventListener('resize', updatePositions);

    // ResizeObserver catches inner-DOM shifts that don't trigger window resize
    const resizeObserver = new ResizeObserver(updatePositions);
    annotations.forEach((ann) => {
      try {
        resizeObserver.observe(ann.element);
      } catch {
        // Element may have been removed from DOM
      }
    });

    return () => {
      window.removeEventListener('scroll', updatePositions);
      window.removeEventListener('resize', updatePositions);
      resizeObserver.disconnect();
    };
  }, [annotations]);

  return positions;
}
