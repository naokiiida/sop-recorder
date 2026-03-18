import type { RecordingState } from '../core/types.js';

export type StateChangeCallback = (
  newState: RecordingState,
  previousState: RecordingState,
) => void;

/**
 * Valid transitions map: from-state -> { action -> to-state }
 */
const TRANSITIONS: Record<
  RecordingState,
  Partial<Record<string, RecordingState>>
> = {
  idle: { start: 'recording' },
  recording: { pause: 'paused', stop: 'idle' },
  paused: { resume: 'recording', stop: 'idle' },
};

export class RecordingStateMachine {
  private state: RecordingState = 'idle';
  private observers = new Set<StateChangeCallback>();

  getState(): RecordingState {
    return this.state;
  }

  start(): void {
    this.transition('start');
  }

  stop(): void {
    this.transition('stop');
  }

  pause(): void {
    this.transition('pause');
  }

  resume(): void {
    this.transition('resume');
  }

  /**
   * Restore state after service worker restart.
   * Does NOT notify observers -- recovery is silent re-hydration.
   */
  recover(state: RecordingState): void {
    this.state = state;
  }

  /**
   * Register an observer that is called on every state change.
   * Returns an unsubscribe function.
   */
  onStateChange(callback: StateChangeCallback): () => void {
    this.observers.add(callback);
    return () => {
      this.observers.delete(callback);
    };
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private transition(action: string): void {
    const nextState = TRANSITIONS[this.state]?.[action];
    if (nextState === undefined) {
      throw new Error(
        `Invalid transition: cannot "${action}" from "${this.state}"`,
      );
    }
    const previous = this.state;
    this.state = nextState;
    this.notifyObservers(nextState, previous);
  }

  private notifyObservers(
    newState: RecordingState,
    previousState: RecordingState,
  ): void {
    for (const cb of this.observers) {
      cb(newState, previousState);
    }
  }
}
