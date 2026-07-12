/**
 * HoverTooltip — Small floating tooltip near cursor showing element identifier.
 * Auto-positions to avoid viewport overflow.
 */

import React from 'react';

interface HoverTooltipProps {
  rect: DOMRect | null;
  label: string;
}

export const HoverTooltip: React.FC<HoverTooltipProps> = ({ rect, label }) => {
  if (!rect || !label) return null;

  // Position tooltip below the element, offset by 8px
  let top = rect.bottom + window.scrollY + 8;
  let left = rect.left + window.scrollX;

  // Prevent overflow on right edge
  const tooltipWidth = 240;
  if (left + tooltipWidth > window.innerWidth + window.scrollX) {
    left = window.innerWidth + window.scrollX - tooltipWidth - 8;
  }

  // Prevent overflow on bottom — show above instead
  if (rect.bottom + 40 > window.innerHeight) {
    top = rect.top + window.scrollY - 36;
  }

  return (
    <div
      className="agentsight-hover-tooltip"
      style={{
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 2147483646,
        pointerEvents: 'none',
      }}
    >
      {label}
    </div>
  );
};
