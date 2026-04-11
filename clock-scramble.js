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
export const CLOCK_PILLARS = ["UL", "UR", "DL", "DR"];
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

const CORNER_TO_DIAL_INDEX = {
  UL: 0,
  UR: 2,
  DL: 6,
  DR: 8,
};

const CORNER_NEIGHBORHOODS = {
  UL: [0, 1, 3, 4],
  UR: [1, 2, 4, 5],
  DL: [3, 4, 6, 7],
  DR: [4, 5, 7, 8],
};

const FRONT_TO_BACK_CORNER = {
  UL: "UR",
  UR: "UL",
  DL: "DR",
  DR: "DL",
};

const ROTATE_180_FACE_INDEXES = [8, 7, 6, 5, 4, 3, 2, 1, 0];

function pillarIndex(label) {
  return CLOCK_PILLARS.indexOf(label);
}

function unionNeighborhoods(pillars) {
  const union = new Set();
  for (const pillar of pillars) {
    for (const dialIndex of CORNER_NEIGHBORHOODS[pillar]) {
      union.add(dialIndex);
    }
  }
  return [...union];
}

function cornersAsDialSet(pillars) {
  return pillars.map((pillar) => CORNER_TO_DIAL_INDEX[pillar]);
}

function vectorFromDialSets(frontFaceStart, frontDialSet, backDialSet, amount) {
  const backFaceStart = frontFaceStart === 0 ? 9 : 0;
  const vector = new Array(18).fill(0);
  for (const dialIndex of frontDialSet) {
    vector[frontFaceStart + dialIndex] += amount;
  }
  for (const dialIndex of backDialSet) {
    vector[backFaceStart + dialIndex] -= amount;
  }
  return vector;
}

export function buildClockWheelMoveVector({
  pinsFront,
  wheel,
  amount = 1,
  frontFaceStart = 0,
}) {
  if (!Array.isArray(pinsFront) || pinsFront.length !== 4) {
    throw new Error("pinsFront must be a boolean[4] in UL/UR/DL/DR order");
  }
  if (!(wheel in FRONT_TO_BACK_CORNER)) {
    throw new Error(`Invalid wheel: ${wheel}`);
  }
  if (frontFaceStart !== 0 && frontFaceStart !== 9) {
    throw new Error("frontFaceStart must be 0 or 9");
  }

  const upPillars = CLOCK_PILLARS.filter((pillar, index) => pinsFront[index]);
  const downPillars = CLOCK_PILLARS.filter((pillar, index) => !pinsFront[index]);
  const wheelIsUp = pinsFront[pillarIndex(wheel)];
  const rotatingPillars = wheelIsUp ? upPillars : downPillars;

  const frontDialSet = wheelIsUp ? unionNeighborhoods(rotatingPillars) : cornersAsDialSet(rotatingPillars);
  const rotatingBackPillars = rotatingPillars.map((pillar) => FRONT_TO_BACK_CORNER[pillar]);
  const backDialSet = wheelIsUp ? cornersAsDialSet(rotatingBackPillars) : unionNeighborhoods(rotatingBackPillars);
  return vectorFromDialSets(frontFaceStart, frontDialSet, backDialSet, amount);
}

export function applyClockWheelTurn(state, { pinsFront, wheel, amount = 1, frontFaceStart = 0 }) {
  const vector = buildClockWheelMoveVector({ pinsFront, wheel, amount, frontFaceStart });
  return {
    ...state,
    posit: state.posit.map((value, index) => mod12(value + vector[index])),
  };
}

export function applyClockX2(state) {
  const front = state.posit.slice(0, 9);
  const back = state.posit.slice(9, 18);
  const rotatedFront = ROTATE_180_FACE_INDEXES.map((index) => front[index]);
  const rotatedBack = ROTATE_180_FACE_INDEXES.map((index) => back[index]);
  return {
    ...state,
    posit: [...rotatedBack, ...rotatedFront],
    rightSideUp: !state.rightSideUp,
    pinsFront: [...ALL_PINS_DOWN],
  };
}

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
  if (PIN_PATTERN_BY_TURN[token]) {
    return { type: "pin", pinsFront: [...PIN_PATTERN_BY_TURN[token]] };
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
    if (move.type === "pin") {
      pinsFront = [...move.pinsFront];
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

export function normalizeClockDelta(value) {
  const modded = mod12(value);
  return modded <= 6 ? modded : modded - 12;
}

function encodeMemoValue(value) {
  if (value >= 0) {
    return String(value);
  }
  return String.fromCharCode("A".charCodeAt(0) + Math.abs(value) - 1);
}

function getFaceDialMap(state) {
  // 7simul flip memo reads "front" as the side that is up during scramble.
  const p = state.posit;
  const front = p.slice(9, 18);
  const backRaw = p.slice(0, 9);
  // Back is read after x2 flip while facing it, which corresponds to 180deg rotation.
  const back = [8, 7, 6, 5, 4, 3, 2, 1, 0].map((index) => backRaw[index]);
  return {
    UL: front[0],
    U: front[1],
    UR: front[2],
    L: front[3],
    C: front[4],
    R: front[5],
    DL: front[6],
    D: front[7],
    DR: front[8],
    ul: back[0],
    u: back[1],
    ur: back[2],
    l: back[3],
    c: back[4],
    r: back[5],
    dl: back[6],
    d: back[7],
    dr: back[8],
  };
}

function edgeDelta(map, from, to) {
  const rawDiff = map[to] - map[from];
  return {
    from,
    to,
    fromValue: map[from],
    toValue: map[to],
    rawDiff,
    value: normalizeClockDelta(rawDiff),
  };
}

export function calculateSevenSimulFlipMemo(scramble) {
  const state = applyClockScramble(scramble);
  const dials = getFaceDialMap(state);
  const steps = [
    {
      id: 1,
      description: "(R→D) + (l→ul)",
      terms: [
        edgeDelta(dials, "R", "D"),
        edgeDelta(dials, "l", "ul"),
      ],
    },
    {
      id: 2,
      description: "u→c",
      terms: [edgeDelta(dials, "u", "c")],
    },
    {
      id: 3,
      description: "l→u",
      terms: [edgeDelta(dials, "l", "u")],
    },
    {
      id: 4,
      description: "(r→d) + (L→UL)",
      terms: [
        edgeDelta(dials, "r", "d"),
        edgeDelta(dials, "L", "UL"),
      ],
    },
    {
      id: 5,
      description: "U→C",
      terms: [edgeDelta(dials, "U", "C")],
    },
    {
      id: 6,
      description: "L→U",
      terms: [edgeDelta(dials, "L", "U")],
    },
  ].map((step) => {
    const rawSum = step.terms.reduce((sum, term) => sum + term.value, 0);
    const value = normalizeClockDelta(rawSum);
    return {
      ...step,
      rawSum,
      value,
      encoded: encodeMemoValue(value),
    };
  });

  return {
    summary: steps.map((step) => step.encoded).join(" "),
    steps,
    dials,
  };
}

const DIAL_INDEX = {
  UL: 0,
  U: 1,
  UR: 2,
  L: 3,
  C: 4,
  R: 5,
  DL: 6,
  D: 7,
  DR: 8,
};

function frontDialValue(state, dialIndex) {
  return state.posit[dialIndex];
}

function frontAffectedIndexes(pinsFront, wheel) {
  const vector = buildClockWheelMoveVector({ pinsFront, wheel, amount: 1, frontFaceStart: 0 });
  const affected = [];
  for (let index = 0; index < 9; index += 1) {
    if (vector[index] !== 0) {
      affected.push(index);
    }
  }
  return affected;
}

function amountToMatchTarget(state, { pinsFront, wheel, sources, target }) {
  const affected = new Set(frontAffectedIndexes(pinsFront, wheel));
  const movableSources = sources.filter((source) => affected.has(source));
  const targetIsAffected = affected.has(target);
  const targetValue = frontDialValue(state, target);

  if (movableSources.length === 0) {
    return 0;
  }
  if (targetIsAffected) {
    for (const source of movableSources) {
      if (frontDialValue(state, source) !== targetValue) {
        throw new Error("Cannot align when source and target are in same move component");
      }
    }
    return 0;
  }

  const baseAmount = normalizeClockDelta(targetValue - frontDialValue(state, movableSources[0]));
  for (const source of movableSources.slice(1)) {
    const amount = normalizeClockDelta(targetValue - frontDialValue(state, source));
    if (amount !== baseAmount) {
      throw new Error("Sources do not share a single alignment amount");
    }
  }
  return baseAmount;
}

function amountToValue(state, { pinsFront, wheel, sources, targetValue }) {
  const affected = new Set(frontAffectedIndexes(pinsFront, wheel));
  const movableSources = sources.filter((source) => affected.has(source));
  if (movableSources.length === 0) {
    return 0;
  }
  const baseAmount = normalizeClockDelta(targetValue - frontDialValue(state, movableSources[0]));
  for (const source of movableSources.slice(1)) {
    const amount = normalizeClockDelta(targetValue - frontDialValue(state, source));
    if (amount !== baseAmount) {
      throw new Error("Sources do not share a single target-value amount");
    }
  }
  return baseAmount;
}

function executeWheel(state, pinsFront, wheel, amount) {
  return applyClockWheelTurn(
    { ...state, pinsFront: [...pinsFront] },
    { pinsFront, wheel, amount, frontFaceStart: 0 },
  );
}

function stateInMemoExecutionFrame(scrambleState) {
  // 7simul flip memo reads the side-up-during-scramble as front.
  return {
    posit: [...scrambleState.posit.slice(9, 18), ...scrambleState.posit.slice(0, 9)],
    // Execution starts from the opposite viewing side (execute-on-black).
    rightSideUp: false,
    pinsFront: [...ALL_PINS_DOWN],
  };
}

export function executeSevenSimulFlipRestore(scramble) {
  return executeSevenSimulFlipRestoreWithTrace(scramble).state;
}

function cloneState(state) {
  return {
    posit: [...state.posit],
    rightSideUp: state.rightSideUp,
    pinsFront: [...state.pinsFront],
  };
}

export function executeSevenSimulFlipRestoreWithTrace(scramble) {
  const memoValues = calculateSevenSimulFlipMemo(scramble).steps.map((step) => step.value);
  let state = stateInMemoExecutionFrame(applyClockScramble(scramble));
  const initialState = cloneState(state);
  const trace = [];

  const pinsStepA = [true, false, true, true]; // UL DR DL
  const pinsStepB = [true, false, true, false]; // UL DL
  const pinsStepC = [true, false, false, false]; // UL
  const pinsStepFinal = [true, false, false, true]; // UL DR

  // 1) UL/DR/DL up: UL <- step1, UR <- step2
  state = executeWheel(state, pinsStepA, "UL", memoValues[0]);
  state = executeWheel(state, pinsStepA, "UR", memoValues[1]);
  trace.push({
    step: 1,
    description: "UL/DR/DL up：UL 执行 memo1，UR 执行 memo2",
    wheelTurns: [
      { wheel: "UL", amount: memoValues[0] },
      { wheel: "UR", amount: memoValues[1] },
    ],
    state: cloneState(state),
  });
  // 2) UL/DL up: UL aligns D to R, UR <- step3
  const step2Align = amountToMatchTarget(state, {
    pinsFront: pinsStepB,
    wheel: "UL",
    sources: [DIAL_INDEX.D],
    target: DIAL_INDEX.R,
  });
  state = executeWheel(
    state,
    pinsStepB,
    "UL",
    step2Align,
  );
  state = executeWheel(state, pinsStepB, "UR", memoValues[2]);
  trace.push({
    step: 2,
    description: "UL/DL up：UL 对齐 D→R，UR 执行 memo3",
    wheelTurns: [
      { wheel: "UL", amount: step2Align },
      { wheel: "UR", amount: memoValues[2] },
    ],
    state: cloneState(state),
  });
  // 3) UL up: UL aligns C to D&R, UR aligns DR to D&R
  const step3AlignC = amountToMatchTarget(state, {
    pinsFront: pinsStepC,
    wheel: "UL",
    sources: [DIAL_INDEX.C],
    target: DIAL_INDEX.D,
  });
  state = executeWheel(
    state,
    pinsStepC,
    "UL",
    step3AlignC,
  );
  const step3AlignDr = amountToMatchTarget(state, {
    pinsFront: pinsStepC,
    wheel: "UR",
    sources: [DIAL_INDEX.DR],
    target: DIAL_INDEX.D,
  });
  state = executeWheel(
    state,
    pinsStepC,
    "UR",
    step3AlignDr,
  );
  trace.push({
    step: 3,
    description: "UL up：UL 对齐 C→D&R，UR 对齐 DR→D&R",
    wheelTurns: [
      { wheel: "UL", amount: step3AlignC },
      { wheel: "UR", amount: step3AlignDr },
    ],
    state: cloneState(state),
  });

  // 4) x2
  state = applyClockX2(state);
  trace.push({
    step: 4,
    description: "x2 翻面",
    wheelTurns: [],
    state: cloneState(state),
  });

  // 5) UL/DR/DL up: UL <- step4, UR <- step5
  state = executeWheel(state, pinsStepA, "UL", memoValues[3]);
  state = executeWheel(state, pinsStepA, "UR", memoValues[4]);
  trace.push({
    step: 5,
    description: "UL/DR/DL up：UL 执行 memo4，UR 执行 memo5",
    wheelTurns: [
      { wheel: "UL", amount: memoValues[3] },
      { wheel: "UR", amount: memoValues[4] },
    ],
    state: cloneState(state),
  });
  // 6) UL/DL up: UL aligns D to R, UR <- step6
  const step6Align = amountToMatchTarget(state, {
    pinsFront: pinsStepB,
    wheel: "UL",
    sources: [DIAL_INDEX.D],
    target: DIAL_INDEX.R,
  });
  state = executeWheel(
    state,
    pinsStepB,
    "UL",
    step6Align,
  );
  state = executeWheel(state, pinsStepB, "UR", memoValues[5]);
  trace.push({
    step: 6,
    description: "UL/DL up：UL 对齐 D→R，UR 执行 memo6",
    wheelTurns: [
      { wheel: "UL", amount: step6Align },
      { wheel: "UR", amount: memoValues[5] },
    ],
    state: cloneState(state),
  });
  // 7) UL up: UL aligns UL/U/L/C to D&R, UR aligns DR to D&R
  const step7AlignBlock = amountToMatchTarget(state, {
    pinsFront: pinsStepC,
    wheel: "UL",
    sources: [DIAL_INDEX.UL, DIAL_INDEX.U, DIAL_INDEX.L, DIAL_INDEX.C],
    target: DIAL_INDEX.D,
  });
  state = executeWheel(
    state,
    pinsStepC,
    "UL",
    step7AlignBlock,
  );
  const step7AlignDr = amountToMatchTarget(state, {
    pinsFront: pinsStepC,
    wheel: "UR",
    sources: [DIAL_INDEX.DR],
    target: DIAL_INDEX.D,
  });
  state = executeWheel(
    state,
    pinsStepC,
    "UR",
    step7AlignDr,
  );
  trace.push({
    step: 7,
    description: "UL up：UL 对齐左上四盘→D&R，UR 对齐 DR→D&R",
    wheelTurns: [
      { wheel: "UL", amount: step7AlignBlock },
      { wheel: "UR", amount: step7AlignDr },
    ],
    state: cloneState(state),
  });

  // 8) UL/DR up: UL aligns all except UR/DL to 12, UR aligns UR/DL to 12
  const step8Slash = amountToValue(state, {
    pinsFront: pinsStepFinal,
    wheel: "UL",
    sources: [DIAL_INDEX.UL, DIAL_INDEX.U, DIAL_INDEX.L, DIAL_INDEX.C, DIAL_INDEX.R, DIAL_INDEX.D, DIAL_INDEX.DR],
    targetValue: 0,
  });
  state = executeWheel(
    state,
    pinsStepFinal,
    "UL",
    step8Slash,
  );
  const step8Pair = amountToValue(state, {
    pinsFront: pinsStepFinal,
    wheel: "UR",
    sources: [DIAL_INDEX.UR, DIAL_INDEX.DL],
    targetValue: 0,
  });
  state = executeWheel(
    state,
    pinsStepFinal,
    "UR",
    step8Pair,
  );
  trace.push({
    step: 8,
    description: "UL/DR up：UL 执行 slash，UR 对齐 UR&DL 到 12 点",
    wheelTurns: [
      { wheel: "UL", amount: step8Slash },
      { wheel: "UR", amount: step8Pair },
    ],
    state: cloneState(state),
  });

  return {
    initialState,
    state,
    memoValues,
    trace,
  };
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

function renderFace(posit, faceStartIndex, originX, faceName, rightSideUp, pinsFront, options = {}) {
  const pieces = [];
  const { ghostPosit = null, ghostMask = null, displayRightSideUp = rightSideUp } = options;
  const dialGap = 52;
  const dialRadius = 19;
  const pinRadius = 5;
  const sidePrefix = faceName === "left" ? (displayRightSideUp ? "back" : "front") : displayRightSideUp ? "front" : "back";
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
      const showGhost = Array.isArray(ghostPosit) && Array.isArray(ghostMask) && ghostMask[idx];
      const ghostValue = showGhost ? ghostPosit[idx] : null;
      const ghostEnd = showGhost ? handPoint(cx, cy, ghostValue * 30, 13) : null;
      const ghostLine = showGhost
        ? `<line x1="${cx}" y1="${cy}" x2="${ghostEnd.x}" y2="${ghostEnd.y}" stroke="#f59e0b" stroke-opacity="0.75" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="4 3" />`
        : "";
      pieces.push(
        `<g class="clock-face"><circle cx="${cx}" cy="${cy}" r="${dialRadius}" fill="${dialColor}" stroke="#334155" stroke-width="1.5" />${renderTicks(cx, cy, sidePrefix)}${ghostLine}<line x1="${cx}" y1="${cy}" x2="${end.x}" y2="${end.y}" stroke="${handColor}" stroke-width="3" stroke-linecap="round" /><circle cx="${cx}" cy="${cy}" r="2.4" fill="${handColor}" /></g>`,
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
    // Perspective cue: raised pin appears farther, so render it slightly smaller.
    const radius = up ? pinRadius - 0.6 : pinRadius + 0.9;
    pieces.push(`<circle class="${cls}" cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}" stroke="#0f172a" stroke-width="1" />`);
  }

  return pieces.join("");
}

export function renderClockStateSvg(state, options = {}) {
  const {
    physicalOrientation = false,
    uprightReference = true,
    ghostState = null,
    ghostMask = null,
    displayRightSideUp = state.rightSideUp,
  } = options;
  const renderOptions = {
    ghostPosit: ghostState?.posit ?? null,
    ghostMask: ghostMask ?? null,
    displayRightSideUp,
  };
  const left = renderFace(state.posit, 0, 108, "left", state.rightSideUp, state.pinsFront ?? ALL_PINS_DOWN, renderOptions);
  const right = renderFace(state.posit, 9, 324, "right", state.rightSideUp, state.pinsFront ?? ALL_PINS_DOWN, renderOptions);
  const shouldRotate = physicalOrientation && state.rightSideUp !== uprightReference;
  const body = shouldRotate
    ? `<g transform="rotate(180 216 112)">${left}${right}</g>`
    : `${left}${right}`;

  return `<svg viewBox="0 0 432 224" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Clock scramble state">${body}</svg>`;
}
