/**
 * Content Recorder — captures DOM events and sends CapturedEvent to background.
 *
 * Dynamically imported by content.ts on START_CAPTURE message.
 * Integrates: event-filter, selector-generator (via element-info), overlay, navigation-detector.
 */

import type { CapturedEvent, StepAction } from '../core/types.js';
import { createEventFilter, isDragEvent } from '../core/event-filter.js';
import {
  extractElementMetadata,
  getClickCoordinates,
  getScrollPosition,
  getViewport,
} from './element-info.js';
import { injectOverlay, removeOverlay as removeOverlayImpl } from './overlay.js';
import { createNavigationDetector } from './navigation-detector.js';

// ── State ───────────────────────────────────────────────────────────────────

let isCapturing = false;
let isPaused = false;
let sequenceCounter = 0;
let listenersAttached = false;

const eventFilter = createEventFilter();
const navigationDetector = createNavigationDetector();

// Track mouse position for drag detection
let mouseDownX = 0;
let mouseDownY = 0;

// ── Event Handlers ──────────────────────────────────────────────────────────

function handleMouseDown(event: MouseEvent): void {
  mouseDownX = event.clientX;
  mouseDownY = event.clientY;
}

function handleClick(event: MouseEvent): void {
  if (!isCapturing || isPaused) return;

  const target = event.target;
  if (!(target instanceof Element)) return;

  // Filter drag events (>50px displacement)
  if (isDragEvent(mouseDownX, mouseDownY, event.clientX, event.clientY)) return;

  // Build a target ID for the event filter
  const targetId = getTargetId(target);

  if (!eventFilter.shouldCapture({ isTrusted: event.isTrusted, type: 'click', targetId, timestamp: event.timeStamp })) return;

  const metadata = extractElementMetadata(target);
  const capturedEvent = buildCapturedEvent('click', metadata, event);

  // Apply overlay highlight for screenshot
  injectOverlay(target);

  sendEvent(capturedEvent);
}

function handleDblClick(event: MouseEvent): void {
  if (!isCapturing || isPaused) return;

  const target = event.target;
  if (!(target instanceof Element)) return;

  const targetId = getTargetId(target);
  if (!eventFilter.shouldCapture({ isTrusted: event.isTrusted, type: 'dblclick', targetId, timestamp: event.timeStamp })) return;

  const metadata = extractElementMetadata(target);
  const capturedEvent = buildCapturedEvent('dblclick', metadata, event);

  injectOverlay(target);
  sendEvent(capturedEvent);
}

function handleInput(event: Event): void {
  if (!isCapturing || isPaused) return;

  const target = event.target;
  if (!(target instanceof Element)) return;

  const targetId = getTargetId(target);
  if (!eventFilter.shouldCapture({ isTrusted: event.isTrusted, type: 'input', targetId, timestamp: event.timeStamp })) return;

  const metadata = extractElementMetadata(target);
  const capturedEvent = buildCapturedEvent('input', metadata);

  sendEvent(capturedEvent);
}

function handleChange(event: Event): void {
  if (!isCapturing || isPaused) return;

  const target = event.target;
  if (!(target instanceof Element)) return;

  // Determine the specific action type
  let actionType: StepAction = 'select';
  if (target instanceof HTMLInputElement && (target.type === 'checkbox' || target.type === 'radio')) {
    actionType = 'check';
  }

  const metadata = extractElementMetadata(target);
  const capturedEvent = buildCapturedEvent(actionType, metadata);

  sendEvent(capturedEvent);
}

function handleSubmit(event: Event): void {
  if (!isCapturing || isPaused) return;

  const target = event.target;
  if (!(target instanceof Element)) return;

  if (!event.isTrusted) return;

  const metadata = extractElementMetadata(target);
  const capturedEvent = buildCapturedEvent('submit', metadata);

  sendEvent(capturedEvent);
}

function handleKeydown(event: KeyboardEvent): void {
  if (!isCapturing || isPaused) return;
  if (!event.isTrusted) return;

  // Only capture specific key presses (Enter, Escape, Tab)
  const captureKeys = ['Enter', 'Escape', 'Tab'];
  if (!captureKeys.includes(event.key)) return;

  const target = event.target;
  if (!(target instanceof Element)) return;

  const metadata = extractElementMetadata(target);
  const capturedEvent: CapturedEvent = {
    sequenceNumber: ++sequenceCounter,
    timestamp: Date.now(),
    type: 'keypress',
    inputValue: event.key,
    selectors: metadata.selectors,
    tagName: metadata.tagName,
    elementType: metadata.elementType,
    elementRole: metadata.elementRole,
    accessibleName: metadata.accessibleName,
    boundingBox: metadata.boundingBox,
    pageUrl: location.href,
    pageTitle: document.title,
    viewport: getViewport(),
    scrollPosition: getScrollPosition(),
  };

  sendEvent(capturedEvent);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getTargetId(element: Element): string {
  return element.id || element.getAttribute('data-testid') || `${element.tagName}:${element.className}`;
}

interface ElementMeta {
  selectors: CapturedEvent['selectors'];
  tagName: string;
  elementType: string | undefined;
  elementRole: string | undefined;
  accessibleName: string;
  boundingBox: CapturedEvent['boundingBox'];
  inputValue: string | undefined;
}

function buildCapturedEvent(
  type: StepAction,
  metadata: ElementMeta,
  mouseEvent?: MouseEvent,
): CapturedEvent {
  return {
    sequenceNumber: ++sequenceCounter,
    timestamp: Date.now(),
    type,
    inputValue: metadata.inputValue,
    selectors: metadata.selectors,
    tagName: metadata.tagName,
    elementType: metadata.elementType,
    elementRole: metadata.elementRole,
    accessibleName: metadata.accessibleName,
    boundingBox: metadata.boundingBox,
    clickCoordinates: mouseEvent ? getClickCoordinates(mouseEvent) : undefined,
    pageUrl: location.href,
    pageTitle: document.title,
    viewport: getViewport(),
    scrollPosition: getScrollPosition(),
  };
}

function sendEvent(event: CapturedEvent): void {
  browser.runtime.sendMessage({ type: 'STEP_CAPTURED', payload: event }).catch((err: unknown) => {
    console.error('[SOP Recorder] Failed to send event:', err);
  });
}

// ── Listener Management ─────────────────────────────────────────────────────

function attachListeners(): void {
  if (listenersAttached) return;

  document.addEventListener('mousedown', handleMouseDown, true);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('dblclick', handleDblClick, true);
  document.addEventListener('input', handleInput, true);
  document.addEventListener('change', handleChange, true);
  document.addEventListener('submit', handleSubmit, true);
  document.addEventListener('keydown', handleKeydown, true);

  listenersAttached = true;
}

function detachListeners(): void {
  if (!listenersAttached) return;

  document.removeEventListener('mousedown', handleMouseDown, true);
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('dblclick', handleDblClick, true);
  document.removeEventListener('input', handleInput, true);
  document.removeEventListener('change', handleChange, true);
  document.removeEventListener('submit', handleSubmit, true);
  document.removeEventListener('keydown', handleKeydown, true);

  listenersAttached = false;
}

// ── Public API (called from content.ts bootstrap) ───────────────────────────

export function startCapture(): void {
  isCapturing = true;
  isPaused = false;
  sequenceCounter = 0;

  attachListeners();

  // Start navigation detection
  navigationDetector.start((url, title) => {
    if (!isCapturing || isPaused) return;

    const capturedEvent: CapturedEvent = {
      sequenceNumber: ++sequenceCounter,
      timestamp: Date.now(),
      type: 'navigate',
      selectors: { css: '', xpath: '' },
      tagName: 'DOCUMENT',
      accessibleName: title,
      boundingBox: { x: 0, y: 0, width: 0, height: 0 },
      pageUrl: url,
      pageTitle: title,
      viewport: getViewport(),
      scrollPosition: getScrollPosition(),
    };

    sendEvent(capturedEvent);
  });
}

export function stopCapture(): void {
  isCapturing = false;
  isPaused = false;
  detachListeners();
  navigationDetector.stop();
  removeOverlayImpl();
}

export function pauseCapture(): void {
  isPaused = true;
}

export function resumeCapture(): void {
  isPaused = false;
}

export function showOverlay(): void {
  // Overlay is managed per-event in click handler
  // This is called by background when it needs explicit overlay
}

export { removeOverlayImpl as removeOverlay };
