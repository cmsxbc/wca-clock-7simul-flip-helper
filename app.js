import {
  applyClockScramble,
  calculateSevenSimulFlipMemo,
  executeSevenSimulFlipRestoreWithTrace,
  generateClockScramble,
  generateClockScrambles,
  renderClockStateSvg,
} from "./clock-scramble.js";

import {
  TimerState,
  createTimerStateMachine,
  validateMemo,
  loadResults,
  saveResult,
  clearResults,
  loadConfirmKey,
  saveConfirmKey,
  computeStats,
  formatTime,
} from "./memo-trainer.js";

// ─── Settings panel ───

const settingsOverlay = document.querySelector("#settings-overlay");
const settingsBtn = document.querySelector("#settings-btn");
const settingsCloseBtn = document.querySelector("#settings-close");

settingsBtn.addEventListener("click", () => {
  settingsOverlay.classList.add("open");
});

settingsCloseBtn.addEventListener("click", () => {
  settingsOverlay.classList.remove("open");
});

settingsOverlay.addEventListener("click", (e) => {
  if (e.target === settingsOverlay) {
    settingsOverlay.classList.remove("open");
  }
});

// ─── Learn mode ───

const form = document.querySelector("#scramble-form");
const countInput = document.querySelector("#count");
const outputList = document.querySelector("#output-list");
const copyButton = document.querySelector("#copy-all");
const statusText = document.querySelector("#status");
const customForm = document.querySelector("#custom-form");
const customInput = document.querySelector("#custom-scramble");
const resetPinsCheckbox = document.querySelector("#reset-pins");
const showStrictRestoreCheckbox = document.querySelector("#show-strict-restore");
const showMemoDerivationCheckbox = document.querySelector("#show-memo-derivation");
const showGhostHandsCheckbox = document.querySelector("#show-ghost-hands");
const showStrictDetailsCheckbox = document.querySelector("#show-strict-details");

const UI_PREF_KEYS = {
  showStrictRestore: "clock.ui.showStrictRestore",
  showMemoDerivation: "clock.ui.showMemoDerivation",
  showStrictDetails: "clock.ui.showStrictDetails",
  showGhostHands: "clock.ui.showGhostHands",
};

function readCheckboxPreference(key, fallback) {
  const stored = localStorage.getItem(key);
  if (stored === "true") {
    return true;
  }
  if (stored === "false") {
    return false;
  }
  return fallback;
}

function saveCheckboxPreference(key, value) {
  localStorage.setItem(key, String(value));
}

function applyOptionDependencies() {
  const strictEnabled = showStrictRestoreCheckbox.checked;
  showStrictDetailsCheckbox.disabled = !strictEnabled;
  showGhostHandsCheckbox.disabled = !strictEnabled || !showStrictDetailsCheckbox.checked;
}

function formatWheelTurns(step) {
  return step.wheelTurns.length === 0
    ? "x2"
    : step.wheelTurns.map((turn) => `${turn.wheel}${Math.abs(turn.amount)}${turn.amount >= 0 ? "+" : "-"}`).join("，");
}

function formatTerm(term) {
  const prefix = `${term.from}(${term.fromValue})→${term.to}(${term.toValue})`;
  const normalized = term.value >= 0 ? `+${term.value}` : `${term.value}`;
  return `${prefix} = ${normalized}`;
}

function renderMemoBlock(scramble) {
  const memo = calculateSevenSimulFlipMemo(scramble);
  const showMemoDerivation = showMemoDerivationCheckbox.checked;
  const wrapper = document.createElement("section");
  wrapper.className = "memo-block";

  const summary = document.createElement("p");
  summary.className = "memo-summary";
  summary.textContent = `7simul flip 记忆：${memo.summary}`;
  wrapper.append(summary);
  if (!showMemoDerivation) {
    return wrapper;
  }

  const tableWrap = document.createElement("div");
  tableWrap.className = "memo-table-wrap";
  const table = document.createElement("table");
  table.className = "memo-table";

  const thead = document.createElement("thead");
  thead.innerHTML =
    "<tr><th>步骤</th><th>公式</th><th>分项差值</th><th>合计(归一化)</th><th>编码</th></tr>";
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  for (const step of memo.steps) {
    const row = document.createElement("tr");
    const terms = step.terms.map(formatTerm).join("，");
    const normalized = step.value >= 0 ? `+${step.value}` : `${step.value}`;
    const rawPart = step.rawSum === step.value ? `${normalized}` : `${step.rawSum} -> ${normalized}`;
    row.innerHTML = `<td>${step.id}</td><td>${step.description}</td><td>${terms}</td><td>${rawPart}</td><td>${step.encoded}</td>`;
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  tableWrap.appendChild(table);

  wrapper.append(tableWrap);
  return wrapper;
}

function renderStrictRestoreBlock(scramble) {
  const wrapper = document.createElement("section");
  wrapper.className = "strict-restore-block";

  const title = document.createElement("p");
  title.className = "strict-restore-title";

  try {
    const restored = executeSevenSimulFlipRestoreWithTrace(scramble);
    const finalState = restored.state;
    const solved = finalState.posit.every((value) => value === 0);
    const showStrictDetails = showStrictDetailsCheckbox.checked;
    const showGhostHands = showStrictDetails && showGhostHandsCheckbox.checked;
    title.textContent = solved ? "7simul 逐步执行（闭环成功）" : "7simul 逐步执行（闭环失败）";

    wrapper.append(title);
    const legend = document.createElement("p");
    legend.className = "status";
    legend.textContent = showStrictDetails
      ? showGhostHands
        ? "橙色虚线指针表示本步操作前的位置（仅标出发生变化的表盘）。"
        : "当前仅显示本步操作后的实线指针。"
      : "当前仅显示步骤操作表。";
    wrapper.append(legend);

    if (!showStrictDetails) {
      const tableWrap = document.createElement("div");
      tableWrap.className = "memo-table-wrap";
      const table = document.createElement("table");
      table.className = "memo-table";
      table.innerHTML = "<thead><tr><th>步骤</th><th>说明</th><th>操作</th></tr></thead>";
      const tbody = document.createElement("tbody");
      for (const step of restored.trace) {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${step.step}</td><td>${step.description}</td><td>${formatWheelTurns(step)}</td>`;
        tbody.appendChild(row);
      }
      table.appendChild(tbody);
      tableWrap.appendChild(table);
      wrapper.append(tableWrap);
      return wrapper;
    }

    let previousState = restored.initialState;
    for (const step of restored.trace) {
      const stepBlock = document.createElement("section");
      stepBlock.className = "strict-step";

      const stepText = document.createElement("p");
      stepText.className = "strict-step-title";
      const wheels = formatWheelTurns(step);
      stepText.textContent = `${step.step}. ${step.description}（${wheels}）`;

      const ghostMask =
        previousState && previousState.rightSideUp === step.state.rightSideUp
          ? step.state.posit.map((value, index) => value !== previousState.posit[index])
          : new Array(18).fill(false);
      // execute-on-back color mapping:
      // before x2 => left light / right dark
      // after x2  => left dark / right light
      const displayRightSideUp = !step.state.rightSideUp;
      const stepPreview = document.createElement("div");
      stepPreview.className = "scramble-preview";
      stepPreview.innerHTML = renderClockStateSvg(step.state, {
        ghostState: showGhostHands ? previousState : null,
        ghostMask: showGhostHands ? ghostMask : null,
        displayRightSideUp,
        twelveDown: step.step >= 4,
        handOffsetTurns: step.step >= 4 ? 6 : 0,
      });
      stepBlock.append(stepText, stepPreview);
      wrapper.append(stepBlock);
      previousState = step.state;
    }
  } catch (error) {
    title.textContent = `严格 7simul flip 执行失败：${error.message}`;
    wrapper.append(title);
  }

  return wrapper;
}

function renderScrambles(scrambles) {
  outputList.innerHTML = "";
  const resetPinsDownAtEnd = resetPinsCheckbox.checked;
  const showStrictRestore = showStrictRestoreCheckbox.checked;

  for (const [index, scramble] of scrambles.entries()) {
    const item = document.createElement("li");
    item.className = "scramble-item";
    item.dataset.scramble = scramble;

    const text = document.createElement("p");
    text.className = "scramble-text";
    text.textContent = `${index + 1}. ${scramble}`;

    const preview = document.createElement("div");
    preview.className = "scramble-preview";
    preview.innerHTML = renderClockStateSvg(applyClockScramble(scramble, { resetPinsDownAtEnd }));

    const memoBlock = renderMemoBlock(scramble);
    const strictRestoreBlock = showStrictRestore ? renderStrictRestoreBlock(scramble) : null;

    item.append(text, preview, memoBlock);
    if (strictRestoreBlock) {
      item.append(strictRestoreBlock);
    }
    outputList.appendChild(item);
  }

  copyButton.disabled = scrambles.length === 0;
  statusText.textContent = `已生成 ${scrambles.length} 条魔表打乱。`;
}

function getCountValue() {
  const parsed = Number.parseInt(countInput.value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return Math.min(parsed, 200);
}

// ─── Learn mode history ───

const HISTORY_KEY = "clock.learnHistory.scrambles";
const historyList = document.querySelector("#history-list");
const clearHistoryBtn = document.querySelector("#clear-history");

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function pushHistory(scrambles) {
  const history = loadHistory();
  const now = new Date().toISOString();
  for (const scramble of scrambles) {
    history.push({ scramble, date: now });
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function formatHistoryDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderHistory() {
  const history = loadHistory();
  historyList.innerHTML = "";
  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];
    const li = document.createElement("li");
    li.className = "history-item";

    const scrambleSpan = document.createElement("span");
    scrambleSpan.className = "history-scramble";
    scrambleSpan.textContent = entry.scramble;

    const dateSpan = document.createElement("span");
    dateSpan.className = "history-date";
    dateSpan.textContent = formatHistoryDate(entry.date);

    li.append(dateSpan, scrambleSpan);
    li.addEventListener("click", () => {
      renderScrambles([entry.scramble]);
      statusText.textContent = "已从历史记录加载打乱。";
    });
    historyList.appendChild(li);
  }
}

clearHistoryBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!confirm("确定要清空全部历史记录吗？")) return;
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const count = getCountValue();
  countInput.value = String(count);
  const scrambles = generateClockScrambles(count);
  pushHistory(scrambles);
  renderScrambles(scrambles);
  renderHistory();
});

customForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const raw = customInput.value.trim();
  if (!raw) {
    statusText.textContent = "请输入一条 Clock 打乱。";
    return;
  }

  try {
    renderScrambles([raw]);
    pushHistory([raw]);
    renderHistory();
    statusText.textContent = "已渲染你输入的打乱。";
  } catch (error) {
    statusText.textContent = `打乱格式有误：${error.message}`;
  }
});

copyButton.addEventListener("click", async () => {
  const lines = [...outputList.querySelectorAll(".scramble-item")].map((item) => item.dataset.scramble);
  const payload = lines.join("\n");

  try {
    await navigator.clipboard.writeText(payload);
    statusText.textContent = "已复制所有打乱到剪贴板。";
  } catch {
    statusText.textContent = "复制失败，请手动选择文本复制。";
  }
});

resetPinsCheckbox.addEventListener("change", () => {
  const current = [...outputList.querySelectorAll(".scramble-item")].map((item) => item.dataset.scramble);
  if (current.length > 0) {
    renderScrambles(current);
  }
});

showStrictRestoreCheckbox.addEventListener("change", () => {
  saveCheckboxPreference(UI_PREF_KEYS.showStrictRestore, showStrictRestoreCheckbox.checked);
  applyOptionDependencies();
  const current = [...outputList.querySelectorAll(".scramble-item")].map((item) => item.dataset.scramble);
  if (current.length > 0) {
    renderScrambles(current);
  }
});

showMemoDerivationCheckbox.addEventListener("change", () => {
  saveCheckboxPreference(UI_PREF_KEYS.showMemoDerivation, showMemoDerivationCheckbox.checked);
  const current = [...outputList.querySelectorAll(".scramble-item")].map((item) => item.dataset.scramble);
  if (current.length > 0) {
    renderScrambles(current);
  }
});

showGhostHandsCheckbox.addEventListener("change", () => {
  saveCheckboxPreference(UI_PREF_KEYS.showGhostHands, showGhostHandsCheckbox.checked);
  const current = [...outputList.querySelectorAll(".scramble-item")].map((item) => item.dataset.scramble);
  if (current.length > 0) {
    renderScrambles(current);
  }
});

showStrictDetailsCheckbox.addEventListener("change", () => {
  saveCheckboxPreference(UI_PREF_KEYS.showStrictDetails, showStrictDetailsCheckbox.checked);
  applyOptionDependencies();
  const current = [...outputList.querySelectorAll(".scramble-item")].map((item) => item.dataset.scramble);
  if (current.length > 0) {
    renderScrambles(current);
  }
});

showStrictRestoreCheckbox.checked = readCheckboxPreference(UI_PREF_KEYS.showStrictRestore, false);
showMemoDerivationCheckbox.checked = readCheckboxPreference(UI_PREF_KEYS.showMemoDerivation, false);
showStrictDetailsCheckbox.checked = readCheckboxPreference(UI_PREF_KEYS.showStrictDetails, true);
showGhostHandsCheckbox.checked = readCheckboxPreference(UI_PREF_KEYS.showGhostHands, false);
applyOptionDependencies();

renderScrambles(generateClockScrambles(getCountValue()));
renderHistory();

// ─── Mode switching ───

const tabButtons = document.querySelectorAll(".tab-btn");
const modeLearn = document.querySelector("#mode-learn");
const modeTrainer = document.querySelector("#mode-trainer");
const MODE_KEY = "clock.ui.mode";

function switchMode(mode) {
  for (const btn of tabButtons) {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  }
  modeLearn.classList.toggle("visible", mode === "learn");
  modeTrainer.classList.toggle("visible", mode === "trainer");
  localStorage.setItem(MODE_KEY, mode);

  if (mode === "trainer") {
    initTrainer();
  } else {
    teardownTrainer();
  }
}

for (const btn of tabButtons) {
  btn.addEventListener("click", () => switchMode(btn.dataset.mode));
}

// ─── Learn mode: ArrowRight shortcut ───

document.addEventListener("keydown", (e) => {
  if (e.code !== "ArrowRight") return;
  const activeTag = document.activeElement?.tagName;
  if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") return;
  if (!modeLearn.classList.contains("visible")) return;

  e.preventDefault();
  countInput.value = "1";
  const scrambles = generateClockScrambles(1);
  pushHistory(scrambles);
  renderScrambles(scrambles);
  renderHistory();
});

// ─── Memo Trainer ───

const trainerTouchZone = document.querySelector("#trainer-touch-zone");
const trainerScrambleEl = document.querySelector("#trainer-scramble");
const trainerTimerEl = document.querySelector("#trainer-timer");
const trainerHintEl = document.querySelector("#trainer-hint");
const trainerResultEl = document.querySelector("#trainer-result");
const trainerInputArea = document.querySelector("#trainer-input-area");
const trainerInput = document.querySelector("#trainer-input");
const trainerPreviewEl = document.querySelector("#trainer-preview");
const virtualKeypad = document.querySelector("#virtual-keypad");
const keypadSubmitBtn = document.querySelector("#keypad-submit");
const showScramblePreviewCheckbox = document.querySelector("#show-scramble-preview");
const confirmKeySelect = document.querySelector("#confirm-key-select");
const trainerStatsEl = document.querySelector("#trainer-stats");
const trainerResultsList = document.querySelector("#trainer-results-list");
const clearResultsBtn = document.querySelector("#clear-results");

let currentScramble = "";
let currentExpected = "";
let confirmKey = loadConfirmKey();
let timer = null;
let trainerKeydownHandler = null;
let trainerKeyupHandler = null;
let trainerActive = false;

confirmKeySelect.value = confirmKey;
confirmKeySelect.addEventListener("change", () => {
  confirmKey = confirmKeySelect.value;
  saveConfirmKey(confirmKey);
});

const SHOW_PREVIEW_KEY = "clock.memoTrainer.showPreview";
showScramblePreviewCheckbox.checked = readCheckboxPreference(SHOW_PREVIEW_KEY, false);
showScramblePreviewCheckbox.addEventListener("change", () => {
  saveCheckboxPreference(SHOW_PREVIEW_KEY, showScramblePreviewCheckbox.checked);
  updateScramblePreview();
});

function updateScramblePreview() {
  if (showScramblePreviewCheckbox.checked && currentScramble) {
    const state = applyClockScramble(currentScramble, { resetPinsDownAtEnd: true });
    trainerPreviewEl.innerHTML = renderClockStateSvg(state);
  } else {
    trainerPreviewEl.innerHTML = "";
  }
}

function generateNextScramble() {
  currentScramble = generateClockScramble();
  const memo = calculateSevenSimulFlipMemo(currentScramble);
  currentExpected = memo.summary;
  trainerScrambleEl.textContent = currentScramble;
  updateScramblePreview();
}

function setTimerColor(cls) {
  trainerTimerEl.className = "trainer-timer " + cls;
}

function renderStats() {
  const results = loadResults();
  const stats = computeStats(results);
  const items = [
    { label: "Best", value: formatTime(stats.best) },
    { label: "Mo3", value: formatTime(stats.mo3) },
    { label: "Ao5", value: formatTime(stats.ao5) },
    { label: "Ao12", value: formatTime(stats.ao12) },
    { label: "Mean", value: formatTime(stats.mean) },
    { label: "次数", value: `${stats.valid}/${stats.total}` },
  ];
  trainerStatsEl.innerHTML = items
    .map(
      (item) =>
        `<div class="stat-card"><div class="stat-label">${item.label}</div><div class="stat-value">${item.value}</div></div>`,
    )
    .join("");
}

function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderResultsList() {
  const results = loadResults();
  trainerResultsList.innerHTML = "";
  for (let i = results.length - 1; i >= 0; i--) {
    const r = results[i];
    const li = document.createElement("li");

    const row = document.createElement("div");
    row.className = "result-item";

    const indexSpan = document.createElement("span");
    indexSpan.className = "result-index";
    indexSpan.textContent = `${i + 1}.`;

    const timeSpan = document.createElement("span");
    timeSpan.className = r.valid ? "result-time" : "result-time dnf";
    timeSpan.textContent = r.valid ? formatTime(r.time) : `DNF (${formatTime(r.time)})`;

    const dateSpan = document.createElement("span");
    dateSpan.className = "result-date";
    dateSpan.textContent = formatDate(r.date);

    row.append(indexSpan, timeSpan, dateSpan);

    const detail = document.createElement("div");
    detail.className = "result-detail";
    detail.innerHTML = `<p>打乱：${r.scramble}</p><p>正确：${r.expected}</p><p>输入：${r.input || "(空)"}</p>`;

    row.addEventListener("click", () => {
      detail.classList.toggle("visible");
    });

    li.append(row, detail);
    trainerResultsList.appendChild(li);
  }
}

function handleTimerStateChange(state) {
  switch (state) {
    case TimerState.IDLE:
      setTimerColor("color-idle");
      trainerTimerEl.textContent = "0.000";
      trainerHintEl.textContent = "长按空格或触屏 1 秒准备计时";
      trainerInputArea.classList.remove("visible");
      trainerResultEl.textContent = "";
      trainerInput.value = "";
      trainerTouchZone.classList.remove("zone-holding", "zone-ready");
      break;
    case TimerState.HOLDING:
      setTimerColor("color-holding");
      trainerHintEl.textContent = "继续按住...";
      trainerTouchZone.classList.add("zone-holding");
      trainerTouchZone.classList.remove("zone-ready");
      break;
    case TimerState.READY:
      setTimerColor("color-ready");
      trainerHintEl.textContent = "松开开始！";
      trainerTouchZone.classList.remove("zone-holding");
      trainerTouchZone.classList.add("zone-ready");
      break;
    case TimerState.RUNNING:
      setTimerColor("color-running");
      trainerHintEl.textContent = "输入记忆码后按 " + (confirmKey === "Space" ? "空格" : "回车") + " 提交";
      trainerInputArea.classList.add("visible");
      trainerInput.value = "";
      trainerInput.focus();
      trainerTouchZone.classList.remove("zone-holding", "zone-ready");
      break;
    case TimerState.INPUT:
      break;
    case TimerState.FINISHED:
      break;
  }
}

function finishRound() {
  const elapsed = timer.getElapsed();
  const userInput = trainerInput.value.trim();
  const valid = validateMemo(userInput, currentExpected);

  if (valid) {
    setTimerColor("color-valid");
    trainerResultEl.textContent = `✓ 正确！`;
    trainerResultEl.style.color = "#4ade80";
  } else {
    setTimerColor("color-dnf");
    trainerResultEl.textContent = `✗ 错误 — 正确答案：${currentExpected}`;
    trainerResultEl.style.color = "#f87171";
  }

  trainerHintEl.textContent = "按空格或触屏开始下一轮";
  trainerInputArea.classList.remove("visible");

  const record = {
    id: Date.now(),
    scramble: currentScramble,
    expected: currentExpected,
    input: userInput,
    time: Math.round(elapsed),
    valid,
    date: new Date().toISOString(),
  };
  saveResult(record);
  renderStats();
  renderResultsList();

  generateNextScramble();
}

function onTrainerKeydown(e) {
  if (!trainerActive) return;
  const state = timer.getState();

  if (e.code === "Space" && state === TimerState.IDLE && document.activeElement !== trainerInput) {
    e.preventDefault();
    timer.handleKeyDown();
    return;
  }

  if (state === TimerState.HOLDING || state === TimerState.READY) {
    if (e.code === "Space") {
      e.preventDefault();
    }
    return;
  }

  if (e.code === "Space" && state === TimerState.FINISHED && document.activeElement !== trainerInput) {
    e.preventDefault();
    timer.reset();
    return;
  }
}

function onTrainerKeyup(e) {
  if (!trainerActive) return;
  const state = timer.getState();

  if (e.code === "Space" && (state === TimerState.HOLDING || state === TimerState.READY)) {
    e.preventDefault();
    timer.handleKeyUp((ms) => {
      trainerTimerEl.textContent = formatTime(ms);
    });
    return;
  }
}

function onTrainerInputKeydown(e) {
  const state = timer.getState();
  if (state !== TimerState.RUNNING && state !== TimerState.INPUT) return;

  if (state === TimerState.RUNNING) {
    timer.beginInput();
  }

  const isConfirm =
    (confirmKey === "Enter" && e.code === "Enter") ||
    (confirmKey === "Space" && e.code === "Space");

  if (isConfirm) {
    e.preventDefault();
    timer.confirm();
    finishRound();
  }
}

// ─── Virtual keypad ───

function isInsideInputOrKeypad(el) {
  return trainerInputArea.contains(el);
}

virtualKeypad.addEventListener("click", (e) => {
  const btn = e.target.closest(".keypad-key");
  if (!btn) return;
  e.stopPropagation();

  const state = timer?.getState();
  if (state !== TimerState.RUNNING && state !== TimerState.INPUT) return;

  if (state === TimerState.RUNNING) {
    timer.beginInput();
  }

  const key = btn.dataset.key;
  if (key === "DEL") {
    trainerInput.value = trainerInput.value.slice(0, -1);
  } else {
    trainerInput.value += key;
  }
  trainerInput.focus();
});

keypadSubmitBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const state = timer?.getState();
  if (state === TimerState.RUNNING || state === TimerState.INPUT) {
    timer.confirm();
    finishRound();
  }
});

// ─── Touch-based timer start/stop ───

function onTouchZoneStart(e) {
  if (!trainerActive || !timer) return;
  const state = timer.getState();

  if (state === TimerState.IDLE) {
    e.preventDefault();
    timer.handleKeyDown();
    return;
  }

  if (state === TimerState.FINISHED) {
    e.preventDefault();
    timer.reset();
    return;
  }
}

function onTouchZoneEnd(e) {
  if (!trainerActive || !timer) return;
  const state = timer.getState();

  if (state === TimerState.HOLDING || state === TimerState.READY) {
    e.preventDefault();
    timer.handleKeyUp((ms) => {
      trainerTimerEl.textContent = formatTime(ms);
    });
  }
}

function onTrainerTouchStop(e) {
  if (!trainerActive || !timer) return;
  const state = timer.getState();
  if (state !== TimerState.RUNNING && state !== TimerState.INPUT) return;
  if (isInsideInputOrKeypad(e.target)) return;

  e.preventDefault();
  timer.confirm();
  finishRound();
}

function initTrainer() {
  if (trainerActive) return;
  trainerActive = true;

  timer = createTimerStateMachine(handleTimerStateChange);
  generateNextScramble();
  renderStats();
  renderResultsList();
  handleTimerStateChange(TimerState.IDLE);

  trainerKeydownHandler = onTrainerKeydown;
  trainerKeyupHandler = onTrainerKeyup;
  document.addEventListener("keydown", trainerKeydownHandler);
  document.addEventListener("keyup", trainerKeyupHandler);
  trainerInput.addEventListener("keydown", onTrainerInputKeydown);
  trainerTouchZone.addEventListener("touchstart", onTouchZoneStart, { passive: false });
  trainerTouchZone.addEventListener("touchend", onTouchZoneEnd, { passive: false });
  modeTrainer.addEventListener("touchstart", onTrainerTouchStop, { passive: false });
}

function teardownTrainer() {
  if (!trainerActive) return;
  trainerActive = false;

  if (timer) {
    timer.destroy();
    timer = null;
  }
  document.removeEventListener("keydown", trainerKeydownHandler);
  document.removeEventListener("keyup", trainerKeyupHandler);
  trainerInput.removeEventListener("keydown", onTrainerInputKeydown);
  trainerTouchZone.removeEventListener("touchstart", onTouchZoneStart);
  trainerTouchZone.removeEventListener("touchend", onTouchZoneEnd);
  modeTrainer.removeEventListener("touchstart", onTrainerTouchStop);
}

clearResultsBtn.addEventListener("click", () => {
  if (!confirm("确定要清空全部成绩记录吗？")) return;
  clearResults();
  renderStats();
  renderResultsList();
});

// Restore saved mode
const savedMode = localStorage.getItem(MODE_KEY) || "learn";
switchMode(savedMode);
