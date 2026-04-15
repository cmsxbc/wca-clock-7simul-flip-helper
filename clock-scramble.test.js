import test from "node:test";
import assert from "node:assert/strict";
import {
  CLOCK_PILLARS,
  TNOODLE_CLOCK_PREFIX_TURNS,
  TNOODLE_CLOCK_SUFFIX_TURNS,
  applyClockWheelTurn,
  applyClockX2,
  applyClockScramble,
  buildClockWheelMoveVector,
  calculateSevenSimulFlipMemo,
  executeSevenSimulFlipRestore,
  executeSevenSimulFlipRestoreWithTrace,
  generateClockScramble,
  parseClockScramble,
  renderClockStateSvg,
} from "./clock-scramble.js";

function invertClockToken(token) {
  if (token === "y2") {
    return "y2";
  }
  const match = token.match(/^(UR|DR|DL|UL|ALL|U|R|D|L)(\d)([+-])$/);
  if (!match) {
    return null;
  }
  const [, label, amount, sign] = match;
  const inverseSign = sign === "+" ? "-" : "+";
  return `${label}${amount}${inverseSign}`;
}

function buildInverseScramble(scramble) {
  const inverseTokens = parseClockScramble(scramble)
    .slice()
    .reverse()
    .map(invertClockToken)
    .filter(Boolean);
  return inverseTokens.join(" ");
}

test("generateClockScramble creates 15-token WCA clock scramble", () => {
  const scramble = generateClockScramble();
  const tokens = parseClockScramble(scramble);

  assert.equal(tokens.length, 15);
  assert.equal(tokens[9], "y2");
});

test("generateClockScramble uses expected turn labels by segment", () => {
  const scramble = generateClockScramble();
  const tokens = parseClockScramble(scramble);

  for (let i = 0; i < TNOODLE_CLOCK_PREFIX_TURNS.length; i += 1) {
    assert.match(tokens[i], new RegExp(`^${TNOODLE_CLOCK_PREFIX_TURNS[i]}\\d[+-]$`));
  }

  for (let i = 0; i < TNOODLE_CLOCK_SUFFIX_TURNS.length; i += 1) {
    const tokenIndex = i + 10;
    assert.match(tokens[tokenIndex], new RegExp(`^${TNOODLE_CLOCK_SUFFIX_TURNS[i]}\\d[+-]$`));
  }
});

test("applyClockScramble applies y2 by swapping both sides", () => {
  const state = applyClockScramble("y2");
  assert.equal(state.rightSideUp, false);
  assert.deepEqual(state.posit, new Array(18).fill(0));
  assert.deepEqual(state.pinsFront, [false, false, false, false]);
});

test("applyClockScramble changes positions for a dial turn", () => {
  const state = applyClockScramble("ALL1+");
  assert.equal(state.posit[0], 1);
  assert.equal(state.posit[4], 1);
  assert.equal(state.posit[9], 11);
  assert.deepEqual(state.pinsFront, [true, true, true, true]);
});

test("renderClockStateSvg returns svg markup", () => {
  const state = applyClockScramble("UR1+ y2 U2-");
  const svg = renderClockStateSvg(state);
  assert.match(svg, /^<svg[\s\S]*<\/svg>$/);
  assert.match(svg, /class="clock-face"/);
  assert.match(svg, /tick-top/);
  assert.match(svg, /pin-up/);
  assert.match(svg, /cx="82" cy="86"/);
  assert.match(svg, /cx="134" cy="138"/);
});

test("applyClockScramble supports optional final pin reset", () => {
  const state = applyClockScramble("UR1+ ALL2+", { resetPinsDownAtEnd: true });
  assert.deepEqual(state.pinsFront, [false, false, false, false]);
});

test("calculateSevenSimulFlipMemo matches published 7simul example", () => {
  const scramble = "UR3- DR4- DL1- UL2- U1+ R4+ D2- L3- ALL1+ y2 U3- R1- D4- L4+ ALL1+ DR DL UL";
  const memo = calculateSevenSimulFlipMemo(scramble);

  assert.deepEqual(
    memo.steps.map((step) => step.value),
    [6, -3, -5, -3, 5, 4],
  );
  assert.deepEqual(
    memo.steps.map((step) => step.encoded),
    ["6", "C", "E", "C", "5", "4"],
  );
  assert.equal(memo.summary, "6 C E C 5 4");
});

test("7simul memo path is closed-loop with scramble then restore", () => {
  const scramble = "UR3- DR4- DL1- UL2- U1+ R4+ D2- L3- ALL1+ y2 U3- R1- D4- L4+ ALL1+ DR DL UL";
  const restore = buildInverseScramble(scramble);

  const scrambledMemo = calculateSevenSimulFlipMemo(scramble);
  assert.equal(scrambledMemo.summary, "6 C E C 5 4");

  const restoredState = applyClockScramble(`${scramble} ${restore}`, { resetPinsDownAtEnd: true });
  assert.equal(restoredState.rightSideUp, true);
  assert.deepEqual(restoredState.posit, new Array(18).fill(0));
  assert.deepEqual(restoredState.pinsFront, [false, false, false, false]);

  const restoredMemo = calculateSevenSimulFlipMemo(`${scramble} ${restore}`);
  assert.deepEqual(
    restoredMemo.steps.map((step) => step.value),
    [0, 0, 0, 0, 0, 0],
  );
  assert.equal(restoredMemo.summary, "0 0 0 0 0 0");
});

test("derived wheel model reproduces existing abstract turns", () => {
  const modeled = {
    UR: buildClockWheelMoveVector({ pinsFront: [false, true, false, false], wheel: "UR" }),
    DR: buildClockWheelMoveVector({ pinsFront: [false, false, false, true], wheel: "DR" }),
    DL: buildClockWheelMoveVector({ pinsFront: [false, false, true, false], wheel: "DL" }),
    UL: buildClockWheelMoveVector({ pinsFront: [true, false, false, false], wheel: "UL" }),
    U: buildClockWheelMoveVector({ pinsFront: [true, true, false, false], wheel: "UR" }),
    R: buildClockWheelMoveVector({ pinsFront: [false, true, false, true], wheel: "UR" }),
    D: buildClockWheelMoveVector({ pinsFront: [false, false, true, true], wheel: "DR" }),
    L: buildClockWheelMoveVector({ pinsFront: [true, false, true, false], wheel: "UL" }),
    ALL: buildClockWheelMoveVector({ pinsFront: [true, true, true, true], wheel: "UR" }),
  };

  for (const [label, vector] of Object.entries(modeled)) {
    const fromAbstract = applyClockScramble(`${label}1+`).posit;
    const fromModel = vector.map((value) => ((value % 12) + 12) % 12);
    assert.deepEqual(fromModel, fromAbstract, label);
  }
});

test("three-up and non-up wheel are now modeled explicitly", () => {
  // Step-1 style pin state in 7simul flip: UL/DR/DL up, then turn UR wheel.
  const state = { posit: new Array(18).fill(0), rightSideUp: true, pinsFront: [false, false, false, false] };
  const next = applyClockWheelTurn(state, {
    pinsFront: [true, false, true, true],
    wheel: "UR",
    amount: 1,
  });

  // Front UR pin is down => only UR dial moves on front.
  assert.equal(next.posit[2], 1);
  // Back opposite pillar is up => a 4-dial linked block moves on back.
  const movedBack = next.posit.slice(9).filter((value) => value !== 0).length;
  assert.equal(movedBack, 4);
});

test("x2 flips sides with 180-degree face rotation", () => {
  const base = {
    posit: Array.from({ length: 18 }, (_, i) => i),
    rightSideUp: true,
    pinsFront: [...CLOCK_PILLARS].map(() => true),
  };
  const once = applyClockX2(base);
  const twice = applyClockX2(once);

  assert.equal(once.rightSideUp, false);
  assert.deepEqual(once.pinsFront, [false, false, false, false]);
  assert.deepEqual(twice.posit, base.posit);
  assert.equal(twice.rightSideUp, true);
});

test("strict 7simul flip execution restores published example", () => {
  const scramble = "UR3- DR4- DL1- UL2- U1+ R4+ D2- L3- ALL1+ y2 U3- R1- D4- L4+ ALL1+ DR DL UL";
  const restored = executeSevenSimulFlipRestore(scramble);

  assert.deepEqual(restored.posit, new Array(18).fill(0));
  assert.equal(restored.rightSideUp, true);
  assert.deepEqual(restored.pinsFront, [true, false, false, true]);
});

test("strict 7simul flip execution forms closed loop on random scrambles", () => {
  for (let i = 0; i < 20; i += 1) {
    const scramble = generateClockScramble();
    const restored = executeSevenSimulFlipRestore(scramble);
    assert.deepEqual(restored.posit, new Array(18).fill(0), scramble);
  }
});

test("strict 7simul flip trace contains eight step snapshots", () => {
  const scramble = "UR3- DR4- DL1- UL2- U1+ R4+ D2- L3- ALL1+ y2 U3- R1- D4- L4+ ALL1+ DR DL UL";
  const traced = executeSevenSimulFlipRestoreWithTrace(scramble);

  assert.equal(traced.trace.length, 8);
  assert.deepEqual(traced.trace.map((step) => step.step), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(traced.state.posit, new Array(18).fill(0));
});

test("execute-on-front memo differs from execute-on-back for same scramble", () => {
  const scramble = "UR3- DR4- DL1- UL2- U1+ R4+ D2- L3- ALL1+ y2 U3- R1- D4- L4+ ALL1+ DR DL UL";
  const memoBack = calculateSevenSimulFlipMemo(scramble, { executeOnBack: true });
  const memoFront = calculateSevenSimulFlipMemo(scramble, { executeOnBack: false });

  // Both produce 6 steps, but values differ because they read different faces
  assert.equal(memoBack.steps.length, 6);
  assert.equal(memoFront.steps.length, 6);
  assert.notDeepEqual(
    memoBack.steps.map((s) => s.value),
    memoFront.steps.map((s) => s.value),
  );
});

test("execute-on-front restores published example to solved", () => {
  const scramble = "UR3- DR4- DL1- UL2- U1+ R4+ D2- L3- ALL1+ y2 U3- R1- D4- L4+ ALL1+ DR DL UL";
  const restored = executeSevenSimulFlipRestore(scramble, { executeOnBack: false });
  assert.deepEqual(restored.posit, new Array(18).fill(0));
});

test("execute-on-front forms closed loop on random scrambles", () => {
  for (let i = 0; i < 20; i += 1) {
    const scramble = generateClockScramble();
    const restored = executeSevenSimulFlipRestore(scramble, { executeOnBack: false });
    assert.deepEqual(restored.posit, new Array(18).fill(0), scramble);
  }
});

test("execute-on-front trace contains eight step snapshots", () => {
  const scramble = "UR3- DR4- DL1- UL2- U1+ R4+ D2- L3- ALL1+ y2 U3- R1- D4- L4+ ALL1+ DR DL UL";
  const traced = executeSevenSimulFlipRestoreWithTrace(scramble, { executeOnBack: false });

  assert.equal(traced.trace.length, 8);
  assert.deepEqual(traced.trace.map((step) => step.step), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(traced.state.posit, new Array(18).fill(0));
});
