import { useEffect } from 'react';

export function useAgentHotkeys(
  onToggleAnnotation: () => void,
  onToggleFreeze: () => void,
  onClear: () => void
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      
      // 1. Identify if the user is currently typing in a form field
      const isTyping = target ? (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' || 
        target.isContentEditable
      ) : false;

      // 2. Escape: Universal Cancel
      // We process this even if they are typing, so they can cancel writing a note midway.
      if (event.key === 'Escape') {
        event.preventDefault();
        onClear();
        return;
      }

      // If they are typing, ignore all other hotkeys so normal data entry isn't hijacked
      if (isTyping) return;

      // 3. Cmd+Shift+A (Mac) or Ctrl+Shift+A (Windows): Toggle Annotation Mode
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        onToggleAnnotation();
      }
      
      // 4. Spacebar: Toggle Freeze
      else if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault(); // Prevents the browser from natively scrolling down the page
        onToggleFreeze();
      }
    };

    // Use { capture: true } so we hear the event BEFORE any local components can run e.stopPropagation()
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [onToggleAnnotation, onToggleFreeze, onClear]);
}
