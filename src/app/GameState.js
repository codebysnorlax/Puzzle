/**
 * Finite State Machine Enum & State Handler for Puzzle Lifecycle
 */
export const GameStates = Object.freeze({
  IDLE: 'IDLE',       // Home screen / selecting image & mode
  READY: 'READY',     // Puzzle loaded, scattered, timer not started (waiting for move)
  RUNNING: 'RUNNING', // First move executed, timer actively counting
  PAUSED: 'PAUSED',   // Paused
  SOLVED: 'SOLVED',   // Puzzle complete, validation succeeded
  ERROR: 'ERROR'      // Exception or load failure
});

export class GameStateMachine {
  constructor(initialState = GameStates.IDLE) {
    this._state = initialState;
    this._listeners = new Set();
  }

  get state() {
    return this._state;
  }

  /**
   * Transition to new state if valid
   * @param {string} newState 
   */
  transitionTo(newState) {
    if (!GameStates[newState]) {
      console.error(`[GameState] Invalid state: ${newState}`);
      return false;
    }

    if (this._state === newState) return true;

    const oldState = this._state;
    this._state = newState;

    this._listeners.forEach(fn => fn(newState, oldState));
    return true;
  }

  onChange(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }
}
