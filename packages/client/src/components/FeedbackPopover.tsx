/**
 * FeedbackPopover — Input popup for writing developer feedback on an annotation.
 * Matte, editorial aesthetic. Auto-focuses and submits on Enter.
 */

import React, { useState, useRef, useEffect } from 'react';

interface FeedbackPopoverProps {
  targetRect: DOMRect | null;
  reactComponent?: string;
  onSubmit: (note: string) => void;
  onCancel: () => void;
  defaultNote?: string;
}

export const FeedbackPopover: React.FC<FeedbackPopoverProps> = ({
  targetRect,
  reactComponent,
  onSubmit,
  onCancel,
  defaultNote = '',
}) => {
  const [note, setNote] = useState(defaultNote);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-focus the textarea immediately
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onCancel();
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      onSubmit(note);
    }
  };

  if (!targetRect) return null;

  // Position below the element
  let top = targetRect.bottom + window.scrollY + 8;
  let left = targetRect.left + window.scrollX;

  // Prevent right overflow
  const popoverWidth = 320;
  if (left + popoverWidth > window.innerWidth + window.scrollX) {
    left = window.innerWidth + window.scrollX - popoverWidth - 16;
  }

  // Prevent bottom overflow — show above instead
  if (targetRect.bottom + 180 > window.innerHeight) {
    top = targetRect.top + window.scrollY - 180;
  }

  return (
    <div
      className="agentsight-popover"
      style={{
        top: `${top}px`,
        left: `${left}px`,
      }}
    >
      <div className="agentsight-popover-header">
        <span className="agentsight-popover-title">AgentSight Note</span>
        {reactComponent && (
          <span className="agentsight-popover-component">
            &lt;{reactComponent}/&gt;
          </span>
        )}
      </div>

      <textarea
        ref={textareaRef}
        className="agentsight-popover-input"
        placeholder="Tell the AI what needs fixing..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
      />

      <div className="agentsight-popover-footer">
        <span className="agentsight-dock-btn" style={{ fontSize: '9px', padding: '0', border: 'none' }}>
          Enter to submit (auto-copies payload)
        </span>
      </div>
    </div>
  );
};
