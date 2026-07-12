// utils/lcaTraversal.ts

/**
 * Step 1: Finds the standard DOM Lowest Common Ancestor for an array of elements.
 */
export function getDOMLCA(elements: Element[]): Element | null {
  if (elements.length === 0) return null;
  if (elements.length === 1) return elements[0];

  let lca = elements[0];

  for (let i = 1; i < elements.length; i++) {
    // While the current LCA does NOT contain the next element, move up the DOM tree
    while (lca && !lca.contains(elements[i])) {
      lca = lca.parentElement as Element;
    }
    if (!lca) return null; // Should only happen if elements are in detached trees
  }

  return lca;
}

/**
 * Step 2: Ascends the React Fiber tree from a given DOM node to find the nearest named component.
 */
export function getNamedReactAncestor(domNode: Element | null): { componentName: string, containerNode: Element } | null {
  if (!domNode) return null;

  let currentDOM = domNode;

  // We loop through the DOM tree as a fallback, but primary traversal is via Fiber
  while (currentDOM) {
    const fiberKey = Object.keys(currentDOM).find(key => key.startsWith('__reactFiber$'));

    if (fiberKey) {
      // @ts-ignore - Accessing internal React property dynamically
      let fiberNode = (currentDOM as any)[fiberKey];

      // Climb the React Fiber tree
      while (fiberNode) {
        if (typeof fiberNode.type === 'function') {
          const name = fiberNode.type.displayName || fiberNode.type.name;
          
          // Filter out minified/anonymous wrappers or HOCs that don't add context
          if (name && name !== 'AnonymousComponent' && name !== 'ForwardRef' && name !== 'Context.Provider') {
            return {
              componentName: name,
              containerNode: currentDOM // The closest DOM node tied to this component branch
            };
          }
        }
        // Move up to the logical React parent, bypassing standard DOM hierarchy
        fiberNode = fiberNode.return;
      }
    }
    
    // Fallback: If no React component was found in this Fiber branch, move up the DOM
    currentDOM = currentDOM.parentElement as Element;
  }

  return null;
}
