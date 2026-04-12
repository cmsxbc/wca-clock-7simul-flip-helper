import test from "node:test";
import assert from "node:assert/strict";
import {
  validateMemo,
  computeStats,
  formatTime,
} from "./memo-trainer.js";

test("validateMemo matches exact input", () => {
  assert.ok(validateMemo("3 A 2 0 1 B", "3 A 2 0 1 B"));
});

test("validateMemo ignores case", () => {
  assert.ok(validateMemo("3a201b", "3 A 2 0 1 B"));
});

test("validateMemo ignores spaces", () => {
  assert.ok(validateMemo("3 a 2 0 1 b", "3 A 2 0 1 B"));
});

test("validateMemo rejects wrong input", () => {
  assert.ok(!validateMemo("3A201C", "3 A 2 0 1 B"));
});

test("validateMemo rejects different length", () => {
  assert.ok(!validateMemo("3A201", "3 A 2 0 1 B"));
});

test("computeStats returns null for empty results", () => {
  const stats = computeStats([]);
  assert.equal(stats.best, null);
  assert.equal(stats.ao5, null);
  assert.equal(stats.ao12, null);
  assert.equal(stats.mo3, null);
  assert.equal(stats.mean, null);
  assert.equal(stats.total, 0);
});

test("computeStats calculates best from valid results", () => {
  const results = [
    { time: 5000, valid: true },
    { time: 3000, valid: true },
    { time: 7000, valid: true },
    { time: 2000, valid: false },
  ];
  const stats = computeStats(results);
  assert.equal(stats.best, 3000);
  assert.equal(stats.valid, 3);
  assert.equal(stats.dnf, 1);
  assert.equal(stats.total, 4);
});

test("computeStats calculates mo3", () => {
  const results = [
    { time: 3000, valid: true },
    { time: 4000, valid: true },
    { time: 5000, valid: true },
  ];
  const stats = computeStats(results);
  assert.equal(stats.mo3, 4000);
});

test("computeStats calculates ao5 trimmed average", () => {
  const results = [
    { time: 1000, valid: true },
    { time: 3000, valid: true },
    { time: 5000, valid: true },
    { time: 4000, valid: true },
    { time: 2000, valid: true },
  ];
  const stats = computeStats(results);
  assert.equal(stats.ao5, 3000);
});

test("computeStats returns null ao5 with fewer than 5 valid", () => {
  const results = [
    { time: 1000, valid: true },
    { time: 3000, valid: true },
    { time: 5000, valid: true },
    { time: 4000, valid: true },
  ];
  const stats = computeStats(results);
  assert.equal(stats.ao5, null);
});

test("formatTime formats milliseconds under 60s", () => {
  assert.equal(formatTime(4523), "4.523");
  assert.equal(formatTime(0), "0.000");
});

test("formatTime formats milliseconds over 60s", () => {
  assert.equal(formatTime(65000), "1:05.000");
});

test("formatTime handles null", () => {
  assert.equal(formatTime(null), "-");
});
