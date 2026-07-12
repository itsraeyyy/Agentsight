let originalRaf: typeof window.requestAnimationFrame | null = null;
let originalCancelRaf: typeof window.cancelAnimationFrame | null = null;
let rafQueue: FrameRequestCallback[] = [];
let isHijacked = false;

export function toggleJSFreeze(isFrozen: boolean) {
  if (typeof window === 'undefined') return;

  if (isFrozen && !isHijacked) {
    originalRaf = window.requestAnimationFrame;
    originalCancelRaf = window.cancelAnimationFrame;
    isHijacked = true;

    // Override the native function to trap animation calls
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      rafQueue.push(callback);
      return rafQueue.length; // Return a mock ID
    };

    window.cancelAnimationFrame = (id: number) => {
      // Basic mock cleanup to prevent memory leaks during long freezes
      if (rafQueue[id - 1]) {
        delete rafQueue[id - 1]; 
      }
    };
    
    // Optional: Pause all <video> elements on the page
    document.querySelectorAll('video').forEach(video => video.pause());

  } else if (!isFrozen && isHijacked) {
    // Restore native APIs
    if (originalRaf) window.requestAnimationFrame = originalRaf;
    if (originalCancelRaf) window.cancelAnimationFrame = originalCancelRaf;
    isHijacked = false;

    // Flush the queue to resume animations exactly where they left off
    rafQueue.forEach((callback) => {
      if (callback && originalRaf) originalRaf(callback);
    });
    rafQueue = [];
  }
}
