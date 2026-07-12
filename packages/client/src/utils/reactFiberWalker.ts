/**
 * React Fiber Walker — Extracts component names and file paths from React internals.
 * Uses the __reactFiber$ property attached to DOM elements by React.
 */

export interface FiberResult {
  componentName: string | null;
  componentTree: string[];
  filePath: string | null;
}

/**
 * Get the nearest React component name for a DOM element.
 */
export function getReactComponentName(element: HTMLElement | null): string | null {
  if (!element) return null;

  const fiberKey = Object.keys(element).find((key) =>
    key.startsWith('__reactFiber$')
  );

  if (!fiberKey) return null;

  // @ts-ignore — Accessing internal React property dynamically
  let fiberNode = (element as any)[fiberKey];

  while (fiberNode) {
    if (typeof fiberNode.type === 'function') {
      return fiberNode.type.name || fiberNode.type.displayName || 'AnonymousComponent';
    }
    fiberNode = fiberNode.return;
  }

  return null;
}

/**
 * Walk the entire React Fiber tree upwards from a DOM element.
 * Returns the component chain, nearest file path, and immediate component name.
 */
export function walkReactFiber(element: HTMLElement | null): FiberResult {
  const result: FiberResult = {
    componentName: null,
    componentTree: [],
    filePath: null,
  };

  if (!element) return result;

  const fiberKey = Object.keys(element).find((key) =>
    key.startsWith('__reactFiber$')
  );

  if (!fiberKey) return result;

  // @ts-ignore
  let fiber = (element as any)[fiberKey];

  // Internal React component names to filter out
  const internalComponents = new Set([
    'Suspense', 'Fragment', 'StrictMode', 'Profiler',
    'Provider', 'Consumer', 'ForwardRef', 'Memo',
  ]);

  while (fiber) {
    if (typeof fiber.type === 'function') {
      const name = fiber.type.name || fiber.type.displayName || null;

      if (name && !internalComponents.has(name)) {
        result.componentTree.push(`<${name}>`);

        // First user component we find is the "nearest" component
        if (!result.componentName) {
          result.componentName = name;
        }
      }
    }

    // Extract file path from _debugSource (available in dev mode)
    if (fiber._debugSource && !result.filePath) {
      result.filePath = `${fiber._debugSource.fileName}:${fiber._debugSource.lineNumber}`;
    }

    fiber = fiber.return;
  }

  // Reverse so the tree reads top-down: App → Layout → Component
  result.componentTree.reverse();

  return result;
}
