export const TNOODLE_CLOCK_PREFIX_TURNS = [
  "UR",
  "DR",
  "DL",
  "UL",
  "U",
  "R",
  "D",
  "L",
  "ALL",
];

export const TNOODLE_CLOCK_SUFFIX_TURNS = ["U", "R", "D", "L", "ALL"];
const TURN_SEQUENCE = [...TNOODLE_CLOCK_PREFIX_TURNS];
const TURN_TO_INDEX = Object.fromEntries(TURN_SEQUENCE.map((name, index) => [name, index]));
const ALL_PINS_DOWN = [false, false, false, false];
const PIN_PATTERN_BY_TURN = {
  UL: [true, false, false, false],
  UR: [false, true, false, false],
  DL: [false, false, true, false],
  DR: [false, false, false, true],
  U: [true, true, false, false],
  R: [false, true, false, true],
  D: [false, false, true, true],
  L: [true, false, true, false],
  ALL: [true, true, true, true],
};

// From tnoodle ClockPuzzle.java moves matrix.
const MOVES = [
  [0, 1, 1, 0, 1, 1, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0], // UR
  [0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, -1, 0, 0], // DR
  [0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1], // DL
  [1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0], // UL
  [1, 1, 1, 1, 1, 1, 0, 0, 0, -1, 0, -1, 0, 0, 0, 0, 0, 0], // U
  [0, 1, 1, 0, 1, 1, 0, 1, 1, -1, 0, 0, 0, 0, 0, -1, 0, 0], // R
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, -1, 0, -1], // D
  [1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, -1, 0, 0, 0, 0, 0, -1], // L
  [1, 1, 1, 1, 1, 1, 1, 1, 1, -1, 0, -1, 0, 0, 0, -1, 0, -1], // ALL
];

function randomTurnValue() {
  return Math.floor(Math.random() * 12) - 5;
}

function formatTurn(label, value) {
  const clockwise = value >= 0;
  const amount = Math.abs(value);
  return `${label}${amount}${clockwise ? "+" : "-"}`;
}

export function generateClockScramble() {
  const tokens = [];

  for (const label of TNOODLE_CLOCK_PREFIX_TURNS) {
    tokens.push(formatTurn(label, randomTurnValue()));
  }

  tokens.push("y2");

  for (const label of TNOODLE_CLOCK_SUFFIX_TURNS) {
    tokens.push(formatTurn(label, randomTurnValue()));
  }

  return tokens.join(" ");
}

export function generateClockScrambles(count) {
  const safeCount = Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 1;
  return Array.from({ length: safeCount }, () => generateClockScramble());
}

export function parseClockScramble(scramble) {
  const trimmed = scramble.trim();
  if (!trimmed) {
    return [];
  }
  return trimmed.split(/\s+/);
}

function mod12(value) {
  return ((value % 12) + 12) % 12;
}

function parseTurnToken(token) {
  if (token === "y2") {
    return { type: "flip" };
  }
  const match = token.match(/^(UR|DR|DL|UL|ALL|U|R|D|L)(\d)([+-])$/);
  if (!match) {
    throw new Error(`Invalid clock token: ${token}`);
  }
  const [, label, rawAmount, sign] = match;
  const amount = Number.parseInt(rawAmount, 10);
  const signedAmount = sign === "+" ? amount : -amount;
  return { type: "turn", label, amount: signedAmount };
}

export function applyClockScramble(scramble, options = {}) {
  const { resetPinsDownAtEnd = false } = options;
  const tokens = parseClockScramble(scramble);
  let posit = new Array(18).fill(0);
  let rightSideUp = true;
  let pinsFront = [...ALL_PINS_DOWN];

  for (const token of tokens) {
    const move = parseTurnToken(token);
    if (move.type === "flip") {
      posit = [...posit.slice(9), ...posit.slice(0, 9)];
      rightSideUp = !rightSideUp;
      pinsFront = [...ALL_PINS_DOWN];
      continue;
    }

    pinsFront = [...PIN_PATTERN_BY_TURN[move.label]];
    const moveIndex = TURN_TO_INDEX[move.label];
    const row = MOVES[moveIndex];
    posit = posit.map((value, index) => mod12(value + move.amount * row[index]));
  }

  if (resetPinsDownAtEnd) {
    pinsFront = [...ALL_PINS_DOWN];
  }

  return { posit, rightSideUp, pinsFront };
}

function handPoint(cx, cy, angleDeg, length) {
  const angle = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + Math.cos(angle) * length,
    y: cy + Math.sin(angle) * length,
  };
}

function renderTicks(cx, cy, sidePrefix) {
  const ticks = [];
  const radius = 16;
  for (let i = 0; i < 12; i += 1) {
    const p = handPoint(cx, cy, i * 30, radius);
    const topClass = i === 0 ? " tick-top" : "";
    const fill = sidePrefix === "front" ? (i === 0 ? "#fbbf24" : "#94a3b8") : i === 0 ? "#fb923c" : "#64748b";
    const r = i === 0 ? 1.9 : 1.1;
    ticks.push(`<circle class="tick-mark${topClass}" cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" />`);
  }
  return ticks.join("");
}

function renderFace(posit, faceStartIndex, originX, faceName, rightSideUp, pinsFront) {
  const pieces = [];
  const dialGap = 52;
  const dialRadius = 19;
  const pinRadius = 5;
  const sidePrefix = faceName === "left" ? (rightSideUp ? "back" : "front") : rightSideUp ? "front" : "back";
  const faceColor = sidePrefix === "front" ? "#1e293b" : "#e2e8f0";
  const dialColor = sidePrefix === "front" ? "#cbd5e1" : "#1e293b";
  const handColor = sidePrefix === "front" ? "#1e293b" : "#f8fafc";
  const pinUpColor = sidePrefix === "front" ? "#38bdf8" : "#2563eb";
  const pinDownColor = sidePrefix === "front" ? "#0ea5e9" : "#1d4ed8";

  pieces.push(`<circle cx="${originX}" cy="112" r="84" fill="${faceColor}" stroke="#0f172a" stroke-width="2" />`);

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const idx = faceStartIndex + row * 3 + col;
      const value = posit[idx];
      const cx = originX + (col - 1) * dialGap;
      const cy = 112 + (row - 1) * dialGap;
      const end = handPoint(cx, cy, value * 30, 13);
      pieces.push(
        `<g class="clock-face"><circle cx="${cx}" cy="${cy}" r="${dialRadius}" fill="${dialColor}" stroke="#334155" stroke-width="1.5" />${renderTicks(cx, cy, sidePrefix)}<line x1="${cx}" y1="${cy}" x2="${end.x}" y2="${end.y}" stroke="${handColor}" stroke-width="3" stroke-linecap="round" /><circle cx="${cx}" cy="${cy}" r="2.4" fill="${handColor}" /></g>`,
      );
    }
  }

  const pinsForFace = sidePrefix === "front" ? pinsFront : pinsFront.map((value) => !value);
  // Pin sits at intersection of 4 neighboring dials, halfway between dial centers.
  const pinOffset = dialGap / 2;
  const pinPositions = [
    [originX - pinOffset, 112 - pinOffset], // UL
    [originX + pinOffset, 112 - pinOffset], // UR
    [originX - pinOffset, 112 + pinOffset], // DL
    [originX + pinOffset, 112 + pinOffset], // DR
  ];

  for (const [index, [cx, cy]] of pinPositions.entries()) {
    const up = pinsForFace[index];
    const cls = up ? "pin pin-up" : "pin pin-down";
    const fill = up ? pinUpColor : pinDownColor;
    const radius = up ? pinRadius + 0.9 : pinRadius - 0.6;
    pieces.push(`<circle class="${cls}" cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}" stroke="#0f172a" stroke-width="1" />`);
  }

  return pieces.join("");
}

export function renderClockStateSvg(state) {
  const left = renderFace(state.posit, 0, 108, "left", state.rightSideUp, state.pinsFront ?? ALL_PINS_DOWN);
  const right = renderFace(state.posit, 9, 324, "right", state.rightSideUp, state.pinsFront ?? ALL_PINS_DOWN);

  return `<svg viewBox="0 0 432 224" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Clock scramble state">${left}${right}</svg>`;
}
