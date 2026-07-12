/**
 * Style Extractor — Captures computed CSS styles for the Forensic output mode.
 */

export interface ExtractedStyles {
  dimensions: {
    width: number;
    height: number;
    top: number;
    left: number;
    right: number;
    bottom: number;
  };
  layout: Record<string, string>;
  typography: Record<string, string>;
  colors: Record<string, string>;
  spacing: Record<string, string>;
  all: Record<string, string>;
}

const LAYOUT_PROPS = [
  'display', 'position', 'flexDirection', 'justifyContent', 'alignItems',
  'gridTemplateColumns', 'gridTemplateRows', 'overflow', 'float', 'clear',
  'zIndex', 'boxSizing',
];

const TYPOGRAPHY_PROPS = [
  'fontSize', 'fontFamily', 'fontWeight', 'lineHeight', 'letterSpacing',
  'textAlign', 'textDecoration', 'textTransform', 'whiteSpace', 'wordBreak',
];

const COLOR_PROPS = [
  'color', 'backgroundColor', 'borderColor', 'outlineColor', 'opacity',
];

const SPACING_PROPS = [
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'gap', 'rowGap', 'columnGap',
  'borderWidth', 'borderRadius',
];

/**
 * Extract computed styles from a DOM element.
 */
export function extractStyles(element: HTMLElement): ExtractedStyles {
  const computed = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  const getProps = (props: string[]): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const prop of props) {
      const value = computed.getPropertyValue(
        prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
      );
      if (value && value !== 'none' && value !== 'normal' && value !== 'auto') {
        result[prop] = value;
      }
    }
    return result;
  };

  // For forensic mode — capture ALL meaningful computed styles
  const all: Record<string, string> = {};
  for (let i = 0; i < computed.length; i++) {
    const prop = computed[i];
    const value = computed.getPropertyValue(prop);
    if (value && value !== '' && value !== 'none') {
      all[prop] = value;
    }
  }

  return {
    dimensions: {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      top: Math.round(rect.top + window.scrollY),
      left: Math.round(rect.left + window.scrollX),
      right: Math.round(rect.right + window.scrollX),
      bottom: Math.round(rect.bottom + window.scrollY),
    },
    layout: getProps(LAYOUT_PROPS),
    typography: getProps(TYPOGRAPHY_PROPS),
    colors: getProps(COLOR_PROPS),
    spacing: getProps(SPACING_PROPS),
    all,
  };
}

/**
 * Get nearby DOM context — parent and sibling elements.
 */
export function getNearbyDOMContext(element: HTMLElement): string {
  const parent = element.parentElement;
  if (!parent) return '';

  const lines: string[] = [];
  const parentTag = parent.tagName.toLowerCase();
  const parentId = parent.id ? `#${parent.id}` : '';
  const parentClass = parent.className && typeof parent.className === 'string'
    ? `.${parent.className.split(/\s+/).filter(c => c)[0] || ''}`
    : '';

  lines.push(`Parent: <${parentTag}${parentId}${parentClass}>`);

  // Sibling context
  const siblings = Array.from(parent.children);
  const selfIndex = siblings.indexOf(element);

  siblings.forEach((sib, i) => {
    const tag = sib.tagName.toLowerCase();
    const marker = i === selfIndex ? ' ← (this element)' : '';
    const text = sib.textContent?.trim().slice(0, 30) || '';
    lines.push(`  [${i}] <${tag}>${text ? ` "${text}"` : ''}${marker}`);
  });

  return lines.join('\n');
}
