/**
 * Markdown Compiler — Formats collected annotations into AI-optimized Markdown.
 * Supports 4 output modes: Compact, Standard (default), Detailed, Forensic.
 */

import { getUniqueSelector } from './selectorBuilder';
import { walkReactFiber } from './reactFiberWalker';
import { extractStyles, getNearbyDOMContext } from './styleExtractor';

export type OutputMode = 'compact' | 'standard' | 'detailed' | 'forensic';

export interface AnnotationData {
  id: string;
  element: HTMLElement;
  note: string;
  selectedText?: string;
  areaBounds?: { x: number; y: number; width: number; height: number };
}

/**
 * Compile a single annotation into Markdown based on the output mode.
 */
function compileAnnotation(annotation: AnnotationData, index: number, mode: OutputMode): string {
  const { element, note, selectedText, areaBounds } = annotation;
  const selector = getUniqueSelector(element);
  const fiber = walkReactFiber(element);
  const rect = element.getBoundingClientRect();

  const lines: string[] = [];

  lines.push(`### Annotation #${index + 1}`);
  lines.push('');
  lines.push(`**Developer Note:** ${note || 'Visual bug identified here.'}`);
  lines.push('');

  // --- Compact: selector + note only ---
  lines.push(`**Selector:** \`${selector}\``);

  if (mode === 'compact') return lines.join('\n');

  // --- Standard: + DOM position, selected text, React component ---
  lines.push(`**React Component:** \`${fiber.componentTree.join(' → ') || 'Unknown'}\``);
  
  if (fiber.filePath) {
    lines.push(`**File Path:** \`${fiber.filePath}\``);
  }

  lines.push(`**Position:** top: ${Math.round(rect.top + window.scrollY)}px, left: ${Math.round(rect.left + window.scrollX)}px`);

  if (selectedText) {
    lines.push('');
    lines.push(`**Selected Text:** "${selectedText}"`);
  }

  if (areaBounds) {
    lines.push('');
    lines.push(`**Area Selection:** ${areaBounds.width}×${areaBounds.height}px at (${areaBounds.x}, ${areaBounds.y})`);
  }

  if (mode === 'standard') return lines.join('\n');

  // --- Detailed: + bounding box, nearby DOM tree ---
  const styles = extractStyles(element);
  
  lines.push('');
  lines.push(`**Bounding Box:** ${styles.dimensions.width}×${styles.dimensions.height}px`);

  const htmlSnippet = element.outerHTML.length > 500
    ? element.outerHTML.substring(0, 500) + '...'
    : element.outerHTML;
  
  lines.push('');
  lines.push('**HTML Snippet:**');
  lines.push('```html');
  lines.push(htmlSnippet);
  lines.push('```');

  lines.push('');
  lines.push('**Nearby DOM Context:**');
  lines.push('```');
  lines.push(getNearbyDOMContext(element));
  lines.push('```');

  if (mode === 'detailed') return lines.join('\n');

  // --- Forensic: + all computed CSS styles ---
  lines.push('');
  lines.push('**Layout:**');
  lines.push('```');
  for (const [key, value] of Object.entries(styles.layout)) {
    lines.push(`  ${key}: ${value}`);
  }
  lines.push('```');

  lines.push('');
  lines.push('**Typography:**');
  lines.push('```');
  for (const [key, value] of Object.entries(styles.typography)) {
    lines.push(`  ${key}: ${value}`);
  }
  lines.push('```');

  lines.push('');
  lines.push('**Colors:**');
  lines.push('```');
  for (const [key, value] of Object.entries(styles.colors)) {
    lines.push(`  ${key}: ${value}`);
  }
  lines.push('```');

  lines.push('');
  lines.push('**Spacing:**');
  lines.push('```');
  for (const [key, value] of Object.entries(styles.spacing)) {
    lines.push(`  ${key}: ${value}`);
  }
  lines.push('```');

  return lines.join('\n');
}

/**
 * Compile all annotations into a single Markdown document.
 */
export function compileMarkdown(annotations: AnnotationData[], mode: OutputMode = 'standard'): string {
  if (annotations.length === 0) return '';

  const header = `# AgentSight Visual Feedback Report
**URL:** ${window.location.href}
**Timestamp:** ${new Date().toISOString()}
**Output Mode:** ${mode}
**Annotations:** ${annotations.length}

---
`;

  const body = annotations
    .map((ann, i) => compileAnnotation(ann, i, mode))
    .join('\n\n---\n\n');

  return header + body;
}
