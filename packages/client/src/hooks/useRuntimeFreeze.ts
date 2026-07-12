import { useState, useEffect, useCallback } from 'react';
import { toggleCSSFreeze } from '../utils/cssFreeze';
import { toggleJSFreeze } from '../utils/jsFreeze';

export function useRuntimeFreeze() {
  const [isFrozen, setIsFrozen] = useState(false);

  const toggleFreeze = useCallback(() => {
    setIsFrozen((prev) => !prev);
  }, []);

  useEffect(() => {
    let observer: MutationObserver | null = null;

    if (isFrozen) {
      toggleCSSFreeze(true);
      toggleJSFreeze(true);

      // Mutation Guard: Force new nodes to freeze immediately
      observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              // Ignore our own injection styles
              if (el.id !== 'agentsight-freeze-styles') {
                el.style.setProperty('animation-play-state', 'paused', 'important');
                el.style.setProperty('transition', 'none', 'important');
              }
            }
          });
        }
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      toggleCSSFreeze(false);
      toggleJSFreeze(false);
    }

    return () => {
      toggleCSSFreeze(false);
      toggleJSFreeze(false);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [isFrozen]);

  return { isFrozen, toggleFreeze };
}
