const STORAGE_KEY_RESULTS = "clock.memoTrainer.results";
const STORAGE_KEY_CONFIRM = "clock.memoTrainer.confirmKey";

export const TimerState = {
  IDLE: "IDLE",
  HOLDING: "HOLDING",
  READY: "READY",
  RUNNING: "RUNNING",
  INPUT: "INPUT",
  FINISHED: "FINISHED",
};

const HOLD_THRESHOLD_MS = 1000;

export function createTimerStateMachine(onStateChange) {
  let state = TimerState.IDLE;
  let holdStartTime = null;
  let holdCheckTimer = null;
  let timerStartTime = null;
  let timerElapsed = 0;
  let animFrameId = null;

  function transition(newState) {
    state = newState;
    onStateChange(state, { elapsed: timerElapsed, holdStart: holdStartTime });
  }

  function startTimerLoop(onTick) {
    timerStartTime = performance.now();
    timerElapsed = 0;
    function tick() {
      timerElapsed = performance.now() - timerStartTime;
      onTick(timerElapsed);
      animFrameId = requestAnimationFrame(tick);
    }
    animFrameId = requestAnimationFrame(tick);
  }

  function stopTimerLoop() {
    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if (timerStartTime !== null) {
      timerElapsed = performance.now() - timerStartTime;
    }
  }

  return {
    getState() {
      return state;
    },
    getElapsed() {
      return timerElapsed;
    },

    handleKeyDown() {
      if (state === TimerState.IDLE) {
        holdStartTime = Date.now();
        transition(TimerState.HOLDING);
        holdCheckTimer = setTimeout(() => {
          if (state === TimerState.HOLDING) {
            transition(TimerState.READY);
          }
        }, HOLD_THRESHOLD_MS);
      }
    },

    handleKeyUp(onTick) {
      if (state === TimerState.HOLDING) {
        clearTimeout(holdCheckTimer);
        holdCheckTimer = null;
        holdStartTime = null;
        transition(TimerState.IDLE);
      } else if (state === TimerState.READY) {
        clearTimeout(holdCheckTimer);
        holdCheckTimer = null;
        startTimerLoop(onTick);
        transition(TimerState.RUNNING);
      }
    },

    beginInput() {
      if (state === TimerState.RUNNING) {
        transition(TimerState.INPUT);
      }
    },

    confirm() {
      if (state === TimerState.RUNNING || state === TimerState.INPUT) {
        stopTimerLoop();
        transition(TimerState.FINISHED);
        return timerElapsed;
      }
      return null;
    },

    reset() {
      stopTimerLoop();
      clearTimeout(holdCheckTimer);
      holdCheckTimer = null;
      holdStartTime = null;
      timerStartTime = null;
      timerElapsed = 0;
      transition(TimerState.IDLE);
    },

    destroy() {
      stopTimerLoop();
      clearTimeout(holdCheckTimer);
    },
  };
}

export function validateMemo(input, expected) {
  const normalize = (str) =>
    str
      .replace(/\s+/g, "")
      .toUpperCase()
      .split("");
  const inputChars = normalize(input);
  const expectedChars = normalize(expected);
  if (inputChars.length !== expectedChars.length) return false;
  return inputChars.every((ch, i) => ch === expectedChars[i]);
}

export function loadResults() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RESULTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveResult(record) {
  const results = loadResults();
  results.push(record);
  localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(results));
  return results;
}

export function clearResults() {
  localStorage.removeItem(STORAGE_KEY_RESULTS);
}

export function loadConfirmKey() {
  return localStorage.getItem(STORAGE_KEY_CONFIRM) || "Enter";
}

export function saveConfirmKey(key) {
  localStorage.setItem(STORAGE_KEY_CONFIRM, key);
}

function validTimes(results) {
  return results.filter((r) => r.valid).map((r) => r.time);
}

function average(arr) {
  if (arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function trimmedAverage(arr, trim) {
  if (arr.length < trim * 2 + 1) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const trimmed = sorted.slice(trim, sorted.length - trim);
  return average(trimmed);
}

export function computeStats(results) {
  const times = validTimes(results);
  const recent5 = times.slice(-5);
  const recent12 = times.slice(-12);
  const recent3 = times.slice(-3);

  return {
    total: results.length,
    valid: times.length,
    dnf: results.length - times.length,
    best: times.length > 0 ? Math.min(...times) : null,
    mean: average(times),
    mo3: recent3.length >= 3 ? average(recent3) : null,
    ao5: recent5.length >= 5 ? trimmedAverage(recent5, 1) : null,
    ao12: recent12.length >= 12 ? trimmedAverage(recent12, 1) : null,
  };
}

export function formatTime(ms) {
  if (ms === null || ms === undefined) return "-";
  const totalSeconds = ms / 1000;
  if (totalSeconds < 60) {
    return totalSeconds.toFixed(3);
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(3).padStart(6, "0");
  return `${minutes}:${seconds}`;
}
