/**
 * Unique CSS Selector Builder.
 * Generates the shortest, most unique CSS selector path for an element.
 * Prioritizes: id → classes → nth-of-type. Truncates to last 3 nodes for AI readability.
 */

export function getUniqueSelector(element: Element | null): string {
  if (!element) return '';
  if (element.id) return `#${element.id}`;

  const path: string[] = [];
  let current: Element | null = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.tagName.toLowerCase();

    // 1. If it has an ID, we can stop — IDs are unique
    if (current.id) {
      selector = `#${current.id}`;
      path.unshift(selector);
      break;
    }

    // 2. Add meaningful classes (filter out framework-injected noise)
    if (current.className && typeof current.className === 'string') {
      const classes = current.className
        .split(/\s+/)
        .filter((c) => {
          const trimmed = c.trim();
          if (trimmed.length === 0) return false;
          // Filter out dynamic/state classes from common frameworks
          if (trimmed.startsWith('agentsight')) return false;
          if (trimmed.startsWith('__')) return false;
          return true;
        })
        .map((c) => `.${CSS.escape(c)}`)
        .join('');
      selector += classes;
    }

    // 3. Resolve sibling collisions with :nth-of-type
    let sibling = current.previousElementSibling;
    let index = 1;
    while (sibling) {
      if (sibling.tagName.toLowerCase() === current.tagName.toLowerCase()) {
        index++;
      }
      sibling = sibling.previousElementSibling;
    }

    if (index > 1) {
      selector += `:nth-of-type(${index})`;
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  // Truncate to last 3 nodes for AI readability
  return path.slice(-3).join(' > ');
}

/**
 * Get a human-readable identifying label for an element.
 * Used for the hover tooltip display.
 */
export function getElementLabel(element: HTMLElement): string {
  const tag = element.tagName.toLowerCase();

  // Prefer text content for buttons, links, headings
  if (['button', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label'].includes(tag)) {
    const text = element.textContent?.trim().slice(0, 40);
    if (text) return `<${tag}> "${text}"`;
  }

  // Alt text for images
  if (tag === 'img') {
    const alt = element.getAttribute('alt');
    if (alt) return `<img alt="${alt.slice(0, 30)}">`;
    const src = element.getAttribute('src');
    if (src) {
      const filename = src.split('/').pop()?.split('?')[0] || '';
      return `<img ${filename}>`;
    }
  }

  // ID
  if (element.id) return `#${element.id}`;

  // Primary class
  const classes = element.className;
  if (classes && typeof classes === 'string') {
    const firstClass = classes.split(/\s+/).filter(c => c.trim())[0];
    if (firstClass) return `${tag}.${firstClass}`;
  }

  return `<${tag}>`;
}
