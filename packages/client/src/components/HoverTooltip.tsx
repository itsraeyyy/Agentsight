/**
 * HoverTooltip — Smooth highlight box with a floating tooltip.
 * Auto-positions the tooltip to avoid viewport overflow.
 */

import React from 'react';

interface HoverTooltipProps {
  rect: DOMRect | null;
  label: string;
}

export const HoverTooltip: React.FC<HoverTooltipProps> = ({ rect, label }) => {
  if (!rect || !label) return null;

  // Tooltip positioning
  let top = rect.bottom + window.scrollY + 8;
  let left = rect.left + window.scrollX;

  const tooltipWidth = 240;
  if (left + tooltipWidth > window.innerWidth + window.scrollX) {
    left = window.innerWidth + window.scrollX - tooltipWidth - 8;
  }

  if (rect.bottom + 40 > window.innerHeight) {
    top = rect.top + window.scrollY - 36;
  }

  return (
    <>
      {/* The Highlight Box */}
      <div
        className="agentsight-highlight-overlay"
        style={{
          position: 'absolute',
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
          zIndex: 2147483645,
          pointerEvents: 'none',
        }}
      />
      {/* The Label */}
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
    </>
  );
};
