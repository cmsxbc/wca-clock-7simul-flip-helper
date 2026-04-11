import test from "node:test";
import assert from "node:assert/strict";
import {
  TNOODLE_CLOCK_PREFIX_TURNS,
  TNOODLE_CLOCK_SUFFIX_TURNS,
  applyClockScramble,
  generateClockScramble,
  parseClockScramble,
  renderClockStateSvg,
} from "./clock-scramble.js";

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
