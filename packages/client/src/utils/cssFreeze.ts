export function toggleCSSFreeze(isFrozen: boolean) {
  const styleId = 'agentsight-freeze-styles';
  let styleEl = document.getElementById(styleId);

  if (isFrozen) {
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      // The * selector targets everything, including pseudo-elements
      styleEl.innerHTML = `
        *, *::before, *::after {
          animation-play-state: paused !important;
          transition: none !important;
        }
      `;
      document.head.appendChild(styleEl);
    }
  } else {
    if (styleEl) {
      styleEl.remove();
    }
  }
}
