import {
  applyClockScramble,
  calculateSevenSimulFlipMemo,
  executeSevenSimulFlipRestoreWithTrace,
  generateClockScrambles,
  renderClockStateSvg,
} from "./clock-scramble.js";

const form = document.querySelector("#scramble-form");
const countInput = document.querySelector("#count");
const outputList = document.querySelector("#output-list");
const copyButton = document.querySelector("#copy-all");
const statusText = document.querySelector("#status");
const customForm = document.querySelector("#custom-form");
const customInput = document.querySelector("#custom-scramble");
const resetPinsCheckbox = document.querySelector("#reset-pins");
const showStrictRestoreCheckbox = document.querySelector("#show-strict-restore");

function formatTerm(term) {
  const prefix = `${term.from}(${term.fromValue})→${term.to}(${term.toValue})`;
  const normalized = term.value >= 0 ? `+${term.value}` : `${term.value}`;
  return `${prefix} = ${normalized}`;
}

function renderMemoBlock(scramble) {
  const memo = calculateSevenSimulFlipMemo(scramble);
  const wrapper = document.createElement("section");
  wrapper.className = "memo-block";

  const summary = document.createElement("p");
  summary.className = "memo-summary";
  summary.textContent = `7simul flip 记忆：${memo.summary}`;

  const details = document.createElement("details");
  details.className = "memo-details";
  const detailsSummary = document.createElement("summary");
  detailsSummary.textContent = "展开来源计算";
  details.appendChild(detailsSummary);

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
  details.appendChild(tableWrap);

  wrapper.append(summary, details);
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
    title.textContent = solved ? "7simul 逐步执行（闭环成功）" : "7simul 逐步执行（闭环失败）";

    wrapper.append(title);
    const legend = document.createElement("p");
    legend.className = "status";
    legend.textContent = "橙色虚线指针表示本步操作前的位置（仅标出发生变化的表盘）。";
    wrapper.append(legend);

    let previousState = restored.initialState;
    for (const step of restored.trace) {
      const stepBlock = document.createElement("section");
      stepBlock.className = "strict-step";

      const stepText = document.createElement("p");
      stepText.className = "strict-step-title";
      const wheels =
        step.wheelTurns.length === 0
          ? "x2"
          : step.wheelTurns
              .map((turn) => `${turn.wheel}${Math.abs(turn.amount)}${turn.amount >= 0 ? "+" : "-"}`)
              .join("，");
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
        ghostState: previousState,
        ghostMask,
        displayRightSideUp,
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

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const count = getCountValue();
  countInput.value = String(count);
  const scrambles = generateClockScrambles(count);
  renderScrambles(scrambles);
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
  const current = [...outputList.querySelectorAll(".scramble-item")].map((item) => item.dataset.scramble);
  if (current.length > 0) {
    renderScrambles(current);
  }
});

renderScrambles(generateClockScrambles(getCountValue()));
