const LANG_KEY = "clock.ui.language";

const translations = {
  "zh-CN": {
    // Page
    "page.title": "Clock 7simul Flip 学习助手",
    "page.h1": "Clock 7simul Flip 学习助手",

    // Settings
    "settings.title": "设置",
    "settings.btn.title": "设置",
    "settings.appearance": "外观",
    "settings.theme.label": "主题模式：",
    "settings.theme.dark": "夜间（深色）",
    "settings.theme.light": "日间（浅色）",
    "settings.theme.system": "跟随系统",
    "settings.iconTheme.label": "桌面图标：",
    "settings.iconTheme.dark": "深色",
    "settings.iconTheme.light": "浅色",
    "settings.clockColors": "Clock 配色",
    "settings.clockColors.front": "正面（深色面）",
    "settings.clockColors.back": "背面（浅色面）",
    "settings.clockColors.face": "大表盘",
    "settings.clockColors.dial": "小表盘",
    "settings.clockColors.hand": "指针",
    "settings.clockColors.pinUp": "Pin ↑",
    "settings.clockColors.pinDown": "Pin ↓",
    "settings.clockColors.reset": "恢复默认配色",
    "settings.learn": "学习模式",
    "settings.learn.resetPins": "结束时将 pins 全部按下",
    "settings.learn.showStrictRestore": "显示 7simul flip 执行过程",
    "settings.learn.hideMemo": "初始隐藏记忆编码",
    "settings.learn.memoRevealKey": "显示记忆编码快捷键：",
    "settings.learn.showMemoDerivation": "显示记忆编码推导",
    "settings.learn.showStrictDetails": "显示每一步状态图",
    "settings.learn.showGhostHands": "显示橙色虚线（上一步指针）",
    "settings.diagram": "状态图",
    "settings.diagram.executeOnBack": "从背面开始记忆与执行（execute-on-back）",
    "settings.diagram.useX2Flip": "预览图使用 x2 翻转（而非 y2）",
    "settings.trainer": "记忆练习",
    "settings.trainer.showPreview": "显示打乱后状态",
    "settings.trainer.confirmKey": "确认键：",
    "settings.language": "语言",
    "settings.language.label": "界面语言：",

    // Tabs
    "tab.trainer": "记忆练习",
    "tab.learn": "学习模式",
    "tab.generator": "打乱生成",

    // Learn mode
    "learn.customPanel": "输入自定义打乱",
    "learn.generate": "生成打乱",
    "learn.generate.title": "生成练习打乱（快捷键 →）",
    "learn.placeholder": "例如：UR1- DR2+ DL0+ UL5- U3+ R2- D1+ L0+ ALL4- y2 U1+ R4- D2+ L3- ALL0+",
    "learn.submit": "渲染此打乱",
    "learn.history": "历史记录",
    "learn.clearHistory": "清空历史",
    "learn.status.loaded": "已从历史记录加载打乱。",
    "learn.status.empty": "请输入一条 Clock 打乱。",
    "learn.status.rendered": "已渲染你输入的打乱。",
    "learn.status.error": "打乱格式有误：",
    "learn.confirm.clearHistory": "确定要清空全部历史记录吗？",

    // Generator
    "gen.countLabel": "生成条数：",
    "gen.submit": "生成",
    "gen.copy.title": "复制全部",
    "gen.status": "已生成 {count} 条魔表打乱。",
    "gen.copied": "已复制所有打乱到剪贴板。",
    "gen.copyFail": "复制失败，请手动选择文本复制。",
    "gen.memoPrefix": "记忆：",

    // Memo block
    "memo.revealHint": "点击此处或按 {key} 显示记忆编码",
    "memo.title": "7simul flip 记忆：",
    "memo.table.step": "步骤",
    "memo.table.formula": "公式",
    "memo.table.terms": "分项差值",
    "memo.table.total": "合计(归一化)",
    "memo.table.code": "编码",

    // Strict restore
    "strict.success": "7simul 逐步执行（闭环成功）",
    "strict.fail": "7simul 逐步执行（闭环失败）",
    "strict.legend.ghost": "橙色虚线指针表示本步操作前的位置（仅标出发生变化的表盘）。",
    "strict.legend.solid": "当前仅显示本步操作后的实线指针。",
    "strict.legend.table": "当前仅显示步骤操作表。",
    "strict.table.step": "步骤",
    "strict.table.desc": "说明",
    "strict.table.ops": "操作",
    "strict.error": "严格 7simul flip 执行失败：",

    // Strict restore trace descriptions (concise)
    "trace.step1": "UL/DR/DL up：memo1，memo2",
    "trace.step2": "UL/DL up：D→R，memo3",
    "trace.step3": "UL up：C→D&R，DR→D&R",
    "trace.step4": "x2 翻面",
    "trace.step5": "UL/DR/DL up：memo4，memo5",
    "trace.step6": "UL/DL up：D→R，memo6",
    "trace.step7": "UL up：四盘→D&R，DR→D&R",
    "trace.step8": "UL/DR up：slash，UR&DL→12",

    // Strict restore verbose table
    "strict.verboseToggle": "查看详细步骤说明",
    "strict.verbose.pins": "Pins ↑",
    "strict.verbose.ul": "UL（左轮）",
    "strict.verbose.ur": "UR（右轮）",
    "trace.step1.pins": "UL/DR/DL",
    "trace.step1.ul": "执行 memo1",
    "trace.step1.ur": "执行 memo2",
    "trace.step2.pins": "UL/DL",
    "trace.step2.ul": "对齐 D→R",
    "trace.step2.ur": "执行 memo3",
    "trace.step3.pins": "UL",
    "trace.step3.ul": "对齐 C→D&R",
    "trace.step3.ur": "对齐 DR→D&R",
    "trace.step4.action": "x2 翻面",
    "trace.step5.pins": "UL/DR/DL",
    "trace.step5.ul": "执行 memo4",
    "trace.step5.ur": "执行 memo5",
    "trace.step6.pins": "UL/DL",
    "trace.step6.ul": "对齐 D→R",
    "trace.step6.ur": "执行 memo6",
    "trace.step7.pins": "UL",
    "trace.step7.ul": "对齐左上四盘→D&R",
    "trace.step7.ur": "对齐 DR→D&R",
    "trace.step8.pins": "UL/DR",
    "trace.step8.ul": "执行 slash",
    "trace.step8.ur": "对齐 UR&DL→12 点",

    // Trainer
    "trainer.hint.idle": "长按空格或触屏 1 秒准备计时",
    "trainer.hint.holding": "继续按住...",
    "trainer.hint.ready": "松开开始！",
    "trainer.hint.submit.space": "输入记忆码后按 空格 提交",
    "trainer.hint.submit.enter": "输入记忆码后按 回车 提交",
    "trainer.hint.next": "按空格或触屏开始下一轮",
    "trainer.input.placeholder": "输入记忆码",
    "trainer.keypad.submit": "提交",
    "trainer.result.correct": "✓ 正确！",
    "trainer.result.wrong": "✗ 错误 — 正确答案：",
    "trainer.stats.count": "次数",
    "trainer.results.title": "成绩记录",
    "trainer.results.clear": "清空全部",
    "trainer.confirm.clear": "确定要清空全部成绩记录吗？",
    "trainer.result.scramble": "打乱：",
    "trainer.result.expected": "正确：",
    "trainer.result.input": "输入：",
    "trainer.result.empty": "(空)",

    // Common
    "backToTop.title": "回到顶部",
    "separator": "，",
  },

  en: {
    // Page
    "page.title": "Clock 7simul Flip Helper",
    "page.h1": "Clock 7simul Flip Helper",

    // Settings
    "settings.title": "Settings",
    "settings.btn.title": "Settings",
    "settings.appearance": "Appearance",
    "settings.theme.label": "Theme: ",
    "settings.theme.dark": "Dark",
    "settings.theme.light": "Light",
    "settings.theme.system": "System",
    "settings.iconTheme.label": "App Icon: ",
    "settings.iconTheme.dark": "Dark",
    "settings.iconTheme.light": "Light",
    "settings.clockColors": "Clock Colors",
    "settings.clockColors.front": "Front (dark side)",
    "settings.clockColors.back": "Back (light side)",
    "settings.clockColors.face": "Face",
    "settings.clockColors.dial": "Dial",
    "settings.clockColors.hand": "Hand",
    "settings.clockColors.pinUp": "Pin ↑",
    "settings.clockColors.pinDown": "Pin ↓",
    "settings.clockColors.reset": "Reset to Default",
    "settings.learn": "Learn Mode",
    "settings.learn.resetPins": "Push all pins down at the end",
    "settings.learn.showStrictRestore": "Show 7simul flip execution steps",
    "settings.learn.hideMemo": "Hide memo initially",
    "settings.learn.memoRevealKey": "Memo reveal shortcut: ",
    "settings.learn.showMemoDerivation": "Show memo derivation",
    "settings.learn.showStrictDetails": "Show state diagram per step",
    "settings.learn.showGhostHands": "Show orange dashed hands (previous step)",
    "settings.diagram": "State Diagram",
    "settings.diagram.executeOnBack": "Memo & execute from back (execute-on-back)",
    "settings.diagram.useX2Flip": "Use x2 flip in previews (instead of y2)",
    "settings.trainer": "Memo Trainer",
    "settings.trainer.showPreview": "Show scrambled state",
    "settings.trainer.confirmKey": "Confirm key: ",
    "settings.language": "Language",
    "settings.language.label": "Language: ",

    // Tabs
    "tab.trainer": "Memo Trainer",
    "tab.learn": "Learn",
    "tab.generator": "Generator",

    // Learn mode
    "learn.customPanel": "Enter custom scramble",
    "learn.generate": "Generate",
    "learn.generate.title": "Generate practice scramble (shortcut →)",
    "learn.placeholder": "e.g. UR1- DR2+ DL0+ UL5- U3+ R2- D1+ L0+ ALL4- y2 U1+ R4- D2+ L3- ALL0+",
    "learn.submit": "Render scramble",
    "learn.history": "History",
    "learn.clearHistory": "Clear History",
    "learn.status.loaded": "Scramble loaded from history.",
    "learn.status.empty": "Please enter a Clock scramble.",
    "learn.status.rendered": "Custom scramble rendered.",
    "learn.status.error": "Invalid scramble: ",
    "learn.confirm.clearHistory": "Clear all history?",

    // Generator
    "gen.countLabel": "Count: ",
    "gen.submit": "Generate",
    "gen.copy.title": "Copy All",
    "gen.status": "Generated {count} scramble(s).",
    "gen.copied": "All scrambles copied to clipboard.",
    "gen.copyFail": "Copy failed. Please select and copy manually.",
    "gen.memoPrefix": "Memo: ",

    // Memo block
    "memo.revealHint": "Click or press {key} to reveal memo",
    "memo.title": "7simul flip memo: ",
    "memo.table.step": "Step",
    "memo.table.formula": "Formula",
    "memo.table.terms": "Terms",
    "memo.table.total": "Total (normalized)",
    "memo.table.code": "Code",

    // Strict restore
    "strict.success": "7simul step-by-step (loop closed)",
    "strict.fail": "7simul step-by-step (loop failed)",
    "strict.legend.ghost": "Orange dashed hands show positions before this step (only changed dials).",
    "strict.legend.solid": "Showing only solid hands after each step.",
    "strict.legend.table": "Showing only the step operation table.",
    "strict.table.step": "Step",
    "strict.table.desc": "Description",
    "strict.table.ops": "Operations",
    "strict.error": "Strict 7simul flip failed: ",

    // Strict restore trace descriptions (concise)
    "trace.step1": "UL/DR/DL up: memo1, memo2",
    "trace.step2": "UL/DL up: D→R, memo3",
    "trace.step3": "UL up: C→D&R, DR→D&R",
    "trace.step4": "x2 flip",
    "trace.step5": "UL/DR/DL up: memo4, memo5",
    "trace.step6": "UL/DL up: D→R, memo6",
    "trace.step7": "UL up: block→D&R, DR→D&R",
    "trace.step8": "UL/DR up: slash, UR&DL→12",

    // Strict restore verbose table
    "strict.verboseToggle": "Show detailed step descriptions",
    "strict.verbose.pins": "Pins ↑",
    "strict.verbose.ul": "UL (left wheel)",
    "strict.verbose.ur": "UR (right wheel)",
    "trace.step1.pins": "UL/DR/DL",
    "trace.step1.ul": "← memo1",
    "trace.step1.ur": "← memo2",
    "trace.step2.pins": "UL/DL",
    "trace.step2.ul": "align D→R",
    "trace.step2.ur": "← memo3",
    "trace.step3.pins": "UL",
    "trace.step3.ul": "align C→D&R",
    "trace.step3.ur": "align DR→D&R",
    "trace.step4.action": "x2 flip",
    "trace.step5.pins": "UL/DR/DL",
    "trace.step5.ul": "← memo4",
    "trace.step5.ur": "← memo5",
    "trace.step6.pins": "UL/DL",
    "trace.step6.ul": "align D→R",
    "trace.step6.ur": "← memo6",
    "trace.step7.pins": "UL",
    "trace.step7.ul": "align UL block→D&R",
    "trace.step7.ur": "align DR→D&R",
    "trace.step8.pins": "UL/DR",
    "trace.step8.ul": "← slash",
    "trace.step8.ur": "align UR&DL→12",

    // Trainer
    "trainer.hint.idle": "Hold Space or touch for 1s to start",
    "trainer.hint.holding": "Keep holding...",
    "trainer.hint.ready": "Release to start!",
    "trainer.hint.submit.space": "Type memo then press Space to submit",
    "trainer.hint.submit.enter": "Type memo then press Enter to submit",
    "trainer.hint.next": "Press Space or touch to start next round",
    "trainer.input.placeholder": "Enter memo",
    "trainer.keypad.submit": "Submit",
    "trainer.result.correct": "✓ Correct!",
    "trainer.result.wrong": "✗ Wrong — answer: ",
    "trainer.stats.count": "Count",
    "trainer.results.title": "Results",
    "trainer.results.clear": "Clear All",
    "trainer.confirm.clear": "Clear all results?",
    "trainer.result.scramble": "Scramble: ",
    "trainer.result.expected": "Expected: ",
    "trainer.result.input": "Input: ",
    "trainer.result.empty": "(empty)",

    // Common
    "backToTop.title": "Back to top",
    "separator": ", ",
  },
};

let currentLanguage = "zh-CN";

export function getLanguage() {
  return currentLanguage;
}

export function getSupportedLanguages() {
  return Object.keys(translations);
}

export function setLanguage(lang) {
  if (!translations[lang]) return;
  currentLanguage = lang;
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang === "zh-CN" ? "zh-CN" : "en";
  document.title = t("page.title");
  applyTranslations();
}

export function loadLanguage() {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved && translations[saved]) {
    currentLanguage = saved;
  }
  document.documentElement.lang = currentLanguage === "zh-CN" ? "zh-CN" : "en";
  document.title = t("page.title");
}

export function t(key, params) {
  const dict = translations[currentLanguage] || translations["zh-CN"];
  let value = dict[key];
  if (value === undefined) {
    const fallback = translations["zh-CN"];
    value = fallback[key];
  }
  if (value === undefined) return key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(`{${k}}`, v);
    }
  }
  return value;
}

export function applyTranslations() {
  for (const el of document.querySelectorAll("[data-i18n]")) {
    el.textContent = t(el.dataset.i18n);
  }
  for (const el of document.querySelectorAll("[data-i18n-placeholder]")) {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  }
  for (const el of document.querySelectorAll("[data-i18n-title]")) {
    el.title = t(el.dataset.i18nTitle);
  }
}
