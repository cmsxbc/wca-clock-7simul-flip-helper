import { applyClockScramble, calculateSevenSimulFlipMemo, generateClockScrambles, renderClockStateSvg } from "./clock-scramble.js";

const form = document.querySelector("#scramble-form");
const countInput = document.querySelector("#count");
const outputList = document.querySelector("#output-list");
const copyButton = document.querySelector("#copy-all");
const statusText = document.querySelector("#status");
const customForm = document.querySelector("#custom-form");
const customInput = document.querySelector("#custom-scramble");
const resetPinsCheckbox = document.querySelector("#reset-pins");

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

function renderScrambles(scrambles) {
  outputList.innerHTML = "";
  const resetPinsDownAtEnd = resetPinsCheckbox.checked;

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

    item.append(text, preview, memoBlock);
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

renderScrambles(generateClockScrambles(getCountValue()));
