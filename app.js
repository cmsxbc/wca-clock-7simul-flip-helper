import {
  applyClockScramble,
  calculateSevenSimulFlipMemo,
  DEFAULT_CLOCK_COLORS,
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

import {
  t,
  loadLanguage,
  setLanguage,
  getLanguage,
  applyTranslations,
} from "./i18n.js";

// ─── Back to top ───

const backToTopBtn = document.querySelector("#back-to-top");

window.addEventListener("scroll", () => {
  backToTopBtn.classList.toggle("visible", window.scrollY > 400);
}, { passive: true });

backToTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

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

// ─── Theme management ───

const THEME_KEY = "clock.ui.theme";
const themeSelect = document.querySelector("#theme-select");
const systemDarkQuery = window.matchMedia("(prefers-color-scheme: dark)");

function getResolvedTheme(pref) {
  if (pref === "system") {
    return systemDarkQuery.matches ? "dark" : "light";
  }
  return pref;
}

function applyTheme(pref) {
  document.documentElement.setAttribute("data-theme", getResolvedTheme(pref));
}

function loadTheme() {
  return localStorage.getItem(THEME_KEY) || "dark";
}

themeSelect.value = loadTheme();
applyTheme(loadTheme());

themeSelect.addEventListener("change", () => {
  localStorage.setItem(THEME_KEY, themeSelect.value);
  applyTheme(themeSelect.value);
});

systemDarkQuery.addEventListener("change", () => {
  if (loadTheme() === "system") {
    applyTheme("system");
  }
});

// ─── Icon theme management ───

const ICON_THEME_KEY = "clock.ui.iconTheme";
const iconThemeSelect = document.querySelector("#icon-theme-select");
const iconPreviewDark = document.querySelector("#icon-preview-dark");
const iconPreviewLight = document.querySelector("#icon-preview-light");

const ICON_ASSETS = {
  dark: {
    svg: "./icon.svg",
    png192: "./icon-192.png",
    appleTouch: "./apple-touch-icon.png",
    manifest: "./manifest.json",
    themeColor: "#0f172a",
  },
  light: {
    svg: "./icon-light.svg",
    png192: "./icon-light-192.png",
    appleTouch: "./apple-touch-icon-light.png",
    manifest: "./manifest-light.json",
    themeColor: "#f8fafc",
  },
};

function loadIconTheme() {
  return localStorage.getItem(ICON_THEME_KEY) || "dark";
}

function applyIconTheme(variant) {
  const assets = ICON_ASSETS[variant] || ICON_ASSETS.dark;
  document.querySelector("#link-manifest").href = assets.manifest;
  document.querySelector("#link-icon-svg").href = assets.svg;
  document.querySelector("#link-icon-png").href = assets.png192;
  document.querySelector("#link-apple-touch").href = assets.appleTouch;
  document.querySelector('meta[name="theme-color"]').content = assets.themeColor;

  const activeBorder = "2px solid var(--accent)";
  const inactiveBorder = "2px solid var(--border-primary)";
  iconPreviewDark.style.border = variant === "dark" ? activeBorder : inactiveBorder;
  iconPreviewLight.style.border = variant === "light" ? activeBorder : inactiveBorder;
}

iconThemeSelect.value = loadIconTheme();
applyIconTheme(loadIconTheme());

iconThemeSelect.addEventListener("change", () => {
  localStorage.setItem(ICON_THEME_KEY, iconThemeSelect.value);
  applyIconTheme(iconThemeSelect.value);
});

iconPreviewDark.addEventListener("click", () => {
  iconThemeSelect.value = "dark";
  localStorage.setItem(ICON_THEME_KEY, "dark");
  applyIconTheme("dark");
});

iconPreviewLight.addEventListener("click", () => {
  iconThemeSelect.value = "light";
  localStorage.setItem(ICON_THEME_KEY, "light");
  applyIconTheme("light");
});

// ─── Language management ───

loadLanguage();
applyTranslations();

const langSelect = document.querySelector("#lang-select");
langSelect.value = getLanguage();

langSelect.addEventListener("change", () => {
  setLanguage(langSelect.value);
  refreshAllDynamicText();
});

function refreshAllDynamicText() {
  const learnScrambles = [...outputList.querySelectorAll(".scramble-item")].map((item) => item.dataset.scramble);
  if (learnScrambles.length > 0) {
    renderScrambles(learnScrambles);
  }
  if (trainerActive) {
    renderStats();
    renderResultsList();
    handleTimerStateChange(timer.getState());
  }
}

// ─── Clock color management ───

const CLOCK_COLORS_KEY = "clock.ui.clockColors";

const COLOR_IDS = {
  "color-front-face": ["front", "face"],
  "color-front-dial": ["front", "dial"],
  "color-front-hand": ["front", "hand"],
  "color-front-pin-up": ["front", "pinUp"],
  "color-front-pin-down": ["front", "pinDown"],
  "color-back-face": ["back", "face"],
  "color-back-dial": ["back", "dial"],
  "color-back-hand": ["back", "hand"],
  "color-back-pin-up": ["back", "pinUp"],
  "color-back-pin-down": ["back", "pinDown"],
};

function loadClockColors() {
  try {
    const raw = localStorage.getItem(CLOCK_COLORS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveClockColors(colors) {
  localStorage.setItem(CLOCK_COLORS_KEY, JSON.stringify(colors));
}

function getClockColors() {
  const saved = loadClockColors();
  if (!saved) return DEFAULT_CLOCK_COLORS;
  return {
    front: { ...DEFAULT_CLOCK_COLORS.front, ...saved.front },
    back: { ...DEFAULT_CLOCK_COLORS.back, ...saved.back },
  };
}

function syncColorInputs() {
  const colors = getClockColors();
  for (const [id, [side, prop]] of Object.entries(COLOR_IDS)) {
    const input = document.getElementById(id);
    if (input) input.value = colors[side][prop];
  }
}

function onColorChange() {
  const colors = { front: {}, back: {} };
  for (const [id, [side, prop]] of Object.entries(COLOR_IDS)) {
    const input = document.getElementById(id);
    if (input) colors[side][prop] = input.value;
  }
  saveClockColors(colors);
  refreshAllPreviews();
}

for (const id of Object.keys(COLOR_IDS)) {
  const input = document.getElementById(id);
  if (input) input.addEventListener("input", onColorChange);
}

document.querySelector("#reset-clock-colors").addEventListener("click", () => {
  localStorage.removeItem(CLOCK_COLORS_KEY);
  syncColorInputs();
  refreshAllPreviews();
});

syncColorInputs();

// ─── Learn mode ───

const learnGenerateBtn = document.querySelector("#learn-generate");
const outputList = document.querySelector("#output-list");
const statusText = document.querySelector("#status");
const customForm = document.querySelector("#custom-form");
const customInput = document.querySelector("#custom-scramble");
const resetPinsCheckbox = document.querySelector("#reset-pins");
const showStrictRestoreCheckbox = document.querySelector("#show-strict-restore");
const hideMemoCheckbox = document.querySelector("#hide-memo-initially");
const memoRevealKeySelect = document.querySelector("#memo-reveal-key-select");
const showMemoDerivationCheckbox = document.querySelector("#show-memo-derivation");
const showGhostHandsCheckbox = document.querySelector("#show-ghost-hands");
const showStrictDetailsCheckbox = document.querySelector("#show-strict-details");

const UI_PREF_KEYS = {
  showStrictRestore: "clock.ui.showStrictRestore",
  showMemoDerivation: "clock.ui.showMemoDerivation",
  showStrictDetails: "clock.ui.showStrictDetails",
  showGhostHands: "clock.ui.showGhostHands",
  hideMemo: "clock.ui.hideMemo",
  memoRevealKey: "clock.ui.memoRevealKey",
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
  memoRevealKeySelect.disabled = !hideMemoCheckbox.checked;
}

function formatWheelTurns(step) {
  return step.wheelTurns.length === 0
    ? "x2"
    : step.wheelTurns.map((turn) => `${turn.wheel}${Math.abs(turn.amount)}${turn.amount >= 0 ? "+" : "-"}`).join(t("separator"));
}

function formatTerm(term) {
  const prefix = `${term.from}(${term.fromValue})→${term.to}(${term.toValue})`;
  const normalized = term.value >= 0 ? `+${term.value}` : `${term.value}`;
  return `${prefix} = ${normalized}`;
}

function revealMemo(block) {
  block.classList.remove("memo-concealed");
}

function revealAllMemos() {
  for (const block of outputList.querySelectorAll(".memo-concealed")) {
    revealMemo(block);
  }
}

function renderMemoBlock(scramble) {
  const memo = calculateSevenSimulFlipMemo(scramble);
  const showMemoDerivation = showMemoDerivationCheckbox.checked;
  const concealed = hideMemoCheckbox.checked;
  const wrapper = document.createElement("section");
  wrapper.className = "memo-block";

  const summary = document.createElement("p");
  summary.className = "memo-summary";
  summary.textContent = `${t("memo.title")}${memo.summary}`;
  wrapper.append(summary);

  if (showMemoDerivation) {
    const tableWrap = document.createElement("div");
    tableWrap.className = "memo-table-wrap";
    const table = document.createElement("table");
    table.className = "memo-table";

    const thead = document.createElement("thead");
    thead.innerHTML =
      `<tr><th>${t("memo.table.step")}</th><th>${t("memo.table.formula")}</th><th>${t("memo.table.terms")}</th><th>${t("memo.table.total")}</th><th>${t("memo.table.code")}</th></tr>`;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    for (const step of memo.steps) {
      const row = document.createElement("tr");
      const terms = step.terms.map(formatTerm).join(t("separator"));
      const normalized = step.value >= 0 ? `+${step.value}` : `${step.value}`;
      const rawPart = step.rawSum === step.value ? `${normalized}` : `${step.rawSum} -> ${normalized}`;
      row.innerHTML = `<td>${step.id}</td><td>${step.description}</td><td>${terms}</td><td>${rawPart}</td><td>${step.encoded}</td>`;
      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    wrapper.append(tableWrap);
  }

  if (concealed) {
    wrapper.classList.add("memo-concealed");
    const hint = document.createElement("p");
    hint.className = "memo-reveal-hint";
    hint.textContent = t("memo.revealHint", { key: memoRevealKeySelect.value });
    wrapper.append(hint);
    wrapper.addEventListener("click", () => revealMemo(wrapper));
  }

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
    title.textContent = solved ? t("strict.success") : t("strict.fail");

    wrapper.append(title);
    const legend = document.createElement("p");
    legend.className = "status";
    legend.textContent = showStrictDetails
      ? showGhostHands
        ? t("strict.legend.ghost")
        : t("strict.legend.solid")
      : t("strict.legend.table");
    wrapper.append(legend);

    const verboseDetails = document.createElement("details");
    verboseDetails.className = "strict-verbose-details";
    const verboseSummary = document.createElement("summary");
    verboseSummary.textContent = t("strict.verboseToggle");
    verboseDetails.append(verboseSummary);
    const verboseWrap = document.createElement("div");
    verboseWrap.className = "memo-table-wrap";
    const verboseTable = document.createElement("table");
    verboseTable.className = "memo-table strict-verbose-table";
    verboseTable.innerHTML = `<thead><tr><th>${t("strict.table.step")}</th><th>${t("strict.verbose.pins")}</th><th>${t("strict.verbose.ul")}</th><th>${t("strict.verbose.ur")}</th></tr></thead>`;
    const verboseBody = document.createElement("tbody");
    for (let i = 1; i <= 8; i++) {
      const row = document.createElement("tr");
      if (i === 4) {
        row.innerHTML = `<td>${i}</td><td colspan="3" class="text-center">${t("trace.step4.action")}</td>`;
      } else {
        row.innerHTML = `<td>${i}</td><td>${t(`trace.step${i}.pins`)}</td><td>${t(`trace.step${i}.ul`)}</td><td>${t(`trace.step${i}.ur`)}</td>`;
      }
      verboseBody.append(row);
    }
    verboseTable.append(verboseBody);
    verboseWrap.append(verboseTable);
    verboseDetails.append(verboseWrap);
    wrapper.append(verboseDetails);

    if (!showStrictDetails) {
      const tableWrap = document.createElement("div");
      tableWrap.className = "memo-table-wrap";
      const table = document.createElement("table");
      table.className = "memo-table";
      table.innerHTML = `<thead><tr><th>${t("strict.table.step")}</th><th>${t("strict.table.desc")}</th><th>${t("strict.table.ops")}</th></tr></thead>`;
      const tbody = document.createElement("tbody");
      for (const step of restored.trace) {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${step.step}</td><td>${t(`trace.step${step.step}`)}</td><td>${formatWheelTurns(step)}</td>`;
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
      stepText.textContent = `${step.step}. ${t(`trace.step${step.step}`)}`;
      const stepOps = document.createElement("p");
      stepOps.className = "strict-step-ops";
      stepOps.textContent = formatWheelTurns(step);

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
        colors: getClockColors(),
      });
      stepBlock.append(stepText, stepOps, stepPreview);
      wrapper.append(stepBlock);
      previousState = step.state;
    }
  } catch (error) {
    title.textContent = `${t("strict.error")}${error.message}`;
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
    text.textContent = scrambles.length === 1 ? scramble : `${index + 1}. ${scramble}`;

    const preview = document.createElement("div");
    preview.className = "scramble-preview";
    preview.innerHTML = renderClockStateSvg(applyClockScramble(scramble, { resetPinsDownAtEnd }), { colors: getClockColors() });

    const memoBlock = renderMemoBlock(scramble);
    const strictRestoreBlock = showStrictRestore ? renderStrictRestoreBlock(scramble) : null;

    item.append(text, preview, memoBlock);
    if (strictRestoreBlock) {
      item.append(strictRestoreBlock);
    }
    outputList.appendChild(item);
  }
}

function refreshAllPreviews() {
  const learnScrambles = [...outputList.querySelectorAll(".scramble-item")].map((item) => item.dataset.scramble);
  if (learnScrambles.length > 0) {
    renderScrambles(learnScrambles);
  }
  updateScramblePreview();
}

// ─── Learn mode history ───

const HISTORY_KEY = "clock.learnHistory.scrambles";
const historyList = document.querySelector("#history-list");
const historyPanel = document.querySelector("#history-panel");
const clearHistoryBtn = document.querySelector("#clear-history");

const wideScreenQuery = window.matchMedia("(min-width: 1024px)");
function syncHistoryPanelOpen(mq) {
  if (mq.matches) historyPanel.open = true;
}
syncHistoryPanelOpen(wideScreenQuery);
wideScreenQuery.addEventListener("change", syncHistoryPanelOpen);

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
      statusText.textContent = t("learn.status.loaded");
    });
    historyList.appendChild(li);
  }
}

clearHistoryBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (!confirm(t("learn.confirm.clearHistory"))) return;
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
});

function learnGenerate() {
  const scrambles = generateClockScrambles(1);
  pushHistory(scrambles);
  renderScrambles(scrambles);
  renderHistory();
}

learnGenerateBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  learnGenerate();
});

customForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const raw = customInput.value.trim();
  if (!raw) {
    statusText.textContent = t("learn.status.empty");
    return;
  }

  try {
    renderScrambles([raw]);
    pushHistory([raw]);
    renderHistory();
    statusText.textContent = t("learn.status.rendered");
  } catch (error) {
    statusText.textContent = `${t("learn.status.error")}${error.message}`;
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

hideMemoCheckbox.addEventListener("change", () => {
  saveCheckboxPreference(UI_PREF_KEYS.hideMemo, hideMemoCheckbox.checked);
  applyOptionDependencies();
  const current = [...outputList.querySelectorAll(".scramble-item")].map((item) => item.dataset.scramble);
  if (current.length > 0) {
    renderScrambles(current);
  }
});

memoRevealKeySelect.addEventListener("change", () => {
  localStorage.setItem(UI_PREF_KEYS.memoRevealKey, memoRevealKeySelect.value);
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
hideMemoCheckbox.checked = readCheckboxPreference(UI_PREF_KEYS.hideMemo, false);
memoRevealKeySelect.value = localStorage.getItem(UI_PREF_KEYS.memoRevealKey) || "Space";
showMemoDerivationCheckbox.checked = readCheckboxPreference(UI_PREF_KEYS.showMemoDerivation, false);
showStrictDetailsCheckbox.checked = readCheckboxPreference(UI_PREF_KEYS.showStrictDetails, true);
showGhostHandsCheckbox.checked = readCheckboxPreference(UI_PREF_KEYS.showGhostHands, false);
applyOptionDependencies();

renderScrambles(generateClockScrambles(1));
renderHistory();

// ─── Mode switching ───

const tabButtons = document.querySelectorAll(".tab-btn");
const modeLearn = document.querySelector("#mode-learn");
const modeGenerator = document.querySelector("#mode-generator");
const modeTrainer = document.querySelector("#mode-trainer");
const MODE_KEY = "clock.ui.mode";

function switchMode(mode) {
  for (const btn of tabButtons) {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  }
  modeLearn.classList.toggle("visible", mode === "learn");
  modeGenerator.classList.toggle("visible", mode === "generator");
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

// ─── Learn mode: keyboard shortcuts ───

document.addEventListener("keydown", (e) => {
  const activeTag = document.activeElement?.tagName;
  if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") return;
  if (!modeLearn.classList.contains("visible")) return;

  if (e.code === "ArrowRight") {
    e.preventDefault();
    learnGenerate();
    return;
  }

  if (hideMemoCheckbox.checked && e.code === memoRevealKeySelect.value) {
    e.preventDefault();
    revealAllMemos();
  }
});

// ─── Generator mode ───

const genForm = document.querySelector("#gen-form");
const genCountInput = document.querySelector("#gen-count");
const genCopyBtn = document.querySelector("#gen-copy-all");
const genOutputList = document.querySelector("#gen-output-list");
const genStatusText = document.querySelector("#gen-status");

const GEN_COUNT_KEY = "clock.generator.count";

function loadGenCount() {
  const stored = localStorage.getItem(GEN_COUNT_KEY);
  const parsed = Number.parseInt(stored, 10);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.min(parsed, 200) : 5;
}

function saveGenCount(value) {
  localStorage.setItem(GEN_COUNT_KEY, String(value));
}

genCountInput.value = String(loadGenCount());

function getGenCountValue() {
  const parsed = Number.parseInt(genCountInput.value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 5;
  return Math.min(parsed, 200);
}

function renderGenScrambles(scrambles) {
  genOutputList.innerHTML = "";
  for (const [index, scramble] of scrambles.entries()) {
    const item = document.createElement("li");
    item.className = "scramble-item";
    item.dataset.scramble = scramble;

    const text = document.createElement("p");
    text.className = "scramble-text";
    text.textContent = `${index + 1}. ${scramble}`;

    const memo = calculateSevenSimulFlipMemo(scramble);
    const memoEl = document.createElement("p");
    memoEl.className = "memo-summary";
    memoEl.style.marginTop = "4px";
    memoEl.textContent = `${t("gen.memoPrefix")}${memo.summary}`;

    item.append(text, memoEl);
    genOutputList.appendChild(item);
  }
  genCopyBtn.disabled = scrambles.length === 0;
  genStatusText.textContent = t("gen.status", { count: scrambles.length });
}

genForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const count = getGenCountValue();
  genCountInput.value = String(count);
  saveGenCount(count);
  renderGenScrambles(generateClockScrambles(count));
});

genCopyBtn.addEventListener("click", async () => {
  const lines = [...genOutputList.querySelectorAll(".scramble-item")].map((item) => item.dataset.scramble);
  const payload = lines.join("\n");
  try {
    await navigator.clipboard.writeText(payload);
    genStatusText.textContent = t("gen.copied");
  } catch {
    genStatusText.textContent = t("gen.copyFail");
  }
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
    trainerPreviewEl.innerHTML = renderClockStateSvg(state, { colors: getClockColors() });
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
    { label: t("trainer.stats.count"), value: `${stats.valid}/${stats.total}` },
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
    detail.innerHTML = `<p>${t("trainer.result.scramble")}${r.scramble}</p><p>${t("trainer.result.expected")}${r.expected}</p><p>${t("trainer.result.input")}${r.input || t("trainer.result.empty")}</p>`;

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
      trainerHintEl.textContent = t("trainer.hint.idle");
      trainerInputArea.classList.remove("visible");
      trainerResultEl.textContent = "";
      trainerInput.value = "";
      trainerTouchZone.classList.remove("zone-holding", "zone-ready");
      break;
    case TimerState.HOLDING:
      setTimerColor("color-holding");
      trainerHintEl.textContent = t("trainer.hint.holding");
      trainerTouchZone.classList.add("zone-holding");
      trainerTouchZone.classList.remove("zone-ready");
      break;
    case TimerState.READY:
      setTimerColor("color-ready");
      trainerHintEl.textContent = t("trainer.hint.ready");
      trainerTouchZone.classList.remove("zone-holding");
      trainerTouchZone.classList.add("zone-ready");
      break;
    case TimerState.RUNNING:
      setTimerColor("color-running");
      trainerHintEl.textContent = confirmKey === "Space" ? t("trainer.hint.submit.space") : t("trainer.hint.submit.enter");
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
    trainerResultEl.textContent = t("trainer.result.correct");
    trainerResultEl.style.color = "#4ade80";
  } else {
    setTimerColor("color-dnf");
    trainerResultEl.textContent = `${t("trainer.result.wrong")}${currentExpected}`;
    trainerResultEl.style.color = "#f87171";
  }

  trainerHintEl.textContent = t("trainer.hint.next");
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
  if (!confirm(t("trainer.confirm.clear"))) return;
  clearResults();
  renderStats();
  renderResultsList();
});

// Restore saved mode
const savedMode = localStorage.getItem(MODE_KEY) || "learn";
switchMode(savedMode);
