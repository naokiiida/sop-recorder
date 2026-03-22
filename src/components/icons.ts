/**
 * Lucide icon helper for Lit light DOM components.
 * Icons use stroke="currentColor" — they inherit CSS color.
 *
 * Usage: html`<button>${icon(Trash2)}</button>`
 */
import { svg, type SVGTemplateResult } from 'lit';
import type { IconNode } from 'lucide';
import {
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Play,
  Pause,
  Square,
  Download,
  ImageOff,
} from 'lucide';

export { Trash2, ChevronUp, ChevronDown, ArrowLeft, Play, Pause, Square, Download, ImageOff };

/**
 * Render a Lucide icon as inline SVG.
 */
export function icon(nodes: IconNode, size = 16): SVGTemplateResult {
  return svg`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;flex-shrink:0;">${nodes.map(([tag, attrs]) => renderElement(tag, attrs))}</svg>`;
}

function renderElement(
  tag: string,
  attrs: Record<string, string | number | undefined>,
): SVGTemplateResult {
  const d = String(attrs['d'] ?? '');
  switch (tag) {
    case 'path':
      return svg`<path d=${d} />`;
    case 'circle':
      return svg`<circle cx=${String(attrs['cx'] ?? '')} cy=${String(attrs['cy'] ?? '')} r=${String(attrs['r'] ?? '')} />`;
    case 'rect':
      return svg`<rect x=${String(attrs['x'] ?? '')} y=${String(attrs['y'] ?? '')} width=${String(attrs['width'] ?? '')} height=${String(attrs['height'] ?? '')} rx=${String(attrs['rx'] ?? '')} ry=${String(attrs['ry'] ?? '')} />`;
    case 'line':
      return svg`<line x1=${String(attrs['x1'] ?? '')} y1=${String(attrs['y1'] ?? '')} x2=${String(attrs['x2'] ?? '')} y2=${String(attrs['y2'] ?? '')} />`;
    case 'polyline':
      return svg`<polyline points=${String(attrs['points'] ?? '')} />`;
    case 'polygon':
      return svg`<polygon points=${String(attrs['points'] ?? '')} />`;
    default:
      return svg`<path d=${d} />`;
  }
}
