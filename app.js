const state = {
  raw: "",
  lines: [],
  originalLines: [],
  activePreset: "warmup",
  peekedLineIds: [],
  characters: [],
  currentCharacter: "",
  mode: "full",
  training: "scene",
  trigger: "tap",
  sourceView: "clean",
  cleanText: "",
  previousView: null,
  searchQuery: "",
  activePanel: "role",
  slashMode: false,
  editMode: false,
  focusIndex: 0,
  monologueUnit: "sentence",
  readRoles: {},
  mutedLineIds: [],
  ghostDecayTimer: null,
  chaos: false,
  masteredStep: 1,
  ladderStepPeeks: 0,
  ladderComplete: false,
  currentTurnStartedAt: 0,
  resetArmed: false,
  beats: [],
  selectedBeat: "all",
  stats: { peeks: 0, practiced: 0, lineStats: {} },
  xp: 0,
  streak: 0,
  bestStreak: 0,
  tapWords: [],
  tapIndex: 0,
  scrolling: false,
  scrollTimer: null,
  partnerActive: false,
  partnerIndex: 0,
  waitingResolver: null,
  recognition: null,
  audioContext: null,
  mediaRecorder: null,
  recordedChunks: [],
  rehearsalAudioUrl: "",
  chaosSource: null,
  voices: []
};

const sampleScript = `INT. EMPTY THEATER - NIGHT

MAYA
You were late.

ELI
I know. I came anyway.

MAYA
That is not the same thing.

ELI
No. But it has to count for something.

MAYA
It counts for the walk from the door to that chair.

ELI
Then let me start there.

MAYA
You always want to start after the damage.

ELI
I am trying to learn the line before that one.`;

const els = {
  setupPanel: document.getElementById("setupPanel"),
  workPanel: document.getElementById("workPanel"),
  statusIndicator: document.getElementById("statusIndicator"),
  uploadStatus: document.getElementById("uploadStatus"),
  scriptInput: document.getElementById("scriptInput"),
  fileInput: document.getElementById("fileInput"),
  parseBtn: document.getElementById("parseBtn"),
  pasteModeBtn: document.getElementById("pasteModeBtn"),
  sampleBtn: document.getElementById("sampleBtn"),
  flowSteps: document.getElementById("flowSteps"),
  flowGuide: document.getElementById("flowGuide"),
  nextActionBtn: document.getElementById("nextActionBtn"),
  searchInput: document.getElementById("searchInput"),
  characterSelect: document.getElementById("characterSelect"),
  readRoleList: document.getElementById("readRoleList"),
  beatSelect: document.getElementById("beatSelect"),
  beatTabs: document.getElementById("beatTabs"),
  ladderBackBtn: document.getElementById("ladderBackBtn"),
  ladderFirstBtn: document.getElementById("ladderFirstBtn"),
  trainingSelect: document.getElementById("trainingSelect"),
  monologueUnitSelect: document.getElementById("monologueUnitSelect"),
  triggerSelect: document.getElementById("triggerSelect"),
  voiceSelect: document.getElementById("voiceSelect"),
  refreshVoicesBtn: document.getElementById("refreshVoicesBtn"),
  emotionSelect: document.getElementById("emotionSelect"),
  blankRange: document.getElementById("blankRange"),
  promptSeconds: document.getElementById("promptSeconds"),
  scriptDisplay: document.getElementById("scriptDisplay"),
  sourceDisplay: document.getElementById("sourceDisplay"),
  sceneMeta: document.getElementById("sceneMeta"),
  modeTitle: document.getElementById("modeTitle"),
  modeHelp: document.getElementById("modeHelp"),
  coachNote: document.getElementById("coachNote"),
  runProgress: document.getElementById("runProgress"),
  xpScore: document.getElementById("xpScore"),
  streakCount: document.getElementById("streakCount"),
  challengeLabel: document.getElementById("challengeLabel"),
  visibilityRange: document.getElementById("visibilityRange"),
  decayBtn: document.getElementById("decayBtn"),
  sizeRange: document.getElementById("sizeRange"),
  speedRange: document.getElementById("speedRange"),
  scrollBtn: document.getElementById("scrollBtn"),
  speakBtn: document.getElementById("speakBtn"),
  listenBtn: document.getElementById("listenBtn"),
  recordBtn: document.getElementById("recordBtn"),
  playbackBtn: document.getElementById("playbackBtn"),
  analyticsBtn: document.getElementById("analyticsBtn"),
  masteredBtn: document.getElementById("masteredBtn"),
  chaosBtn: document.getElementById("chaosBtn"),
  drillBtn: document.getElementById("drillBtn"),
  backFromTroubleBtn: document.getElementById("backFromTroubleBtn"),
  addBeatBtn: document.getElementById("addBeatBtn"),
  clearBeatsBtn: document.getElementById("clearBeatsBtn"),
  restartRunBtn: document.getElementById("restartRunBtn"),
  slashModeBtn: document.getElementById("slashModeBtn"),
  editModeBtn: document.getElementById("editModeBtn"),
  prevLineBtn: document.getElementById("prevLineBtn"),
  nextLineBtn: document.getElementById("nextLineBtn"),
  sourceToggleBtn: document.getElementById("sourceToggleBtn"),
  tapPane: document.getElementById("tapPane"),
  tapWord: document.getElementById("tapWord"),
  tapNextBtn: document.getElementById("tapNextBtn"),
  partnerBar: document.getElementById("partnerBar"),
  partnerStatus: document.getElementById("partnerStatus"),
  continueBtn: document.getElementById("continueBtn"),
  analyticsPanel: document.getElementById("analyticsPanel"),
  closeAnalyticsBtn: document.getElementById("closeAnalyticsBtn"),
  dashboardDrillBtn: document.getElementById("dashboardDrillBtn"),
  dashboardResetBtn: document.getElementById("dashboardResetBtn"),
  peekCount: document.getElementById("peekCount"),
  practiceCount: document.getElementById("practiceCount"),
  readinessScore: document.getElementById("readinessScore"),
  troubleCount: document.getElementById("troubleCount"),
  troubleList: document.getElementById("troubleList"),
  saveBtn: document.getElementById("saveBtn"),
  loadBtn: document.getElementById("loadBtn"),
  resetBtn: document.getElementById("resetBtn"),
  fullscreenBtn: document.getElementById("fullscreenBtn"),
  exportBtn: document.getElementById("exportBtn"),
  toast: document.getElementById("toast")
};

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").then(reg => reg.update()).catch(() => {});
}

function setStatus(text, good = false) {
  els.statusIndicator.textContent = text;
  els.statusIndicator.classList.toggle("ready", good);
}

function notify(message, good = true) {
  els.toast.textContent = message;
  els.toast.classList.remove("hidden", "bad");
  els.toast.classList.toggle("bad", !good);
  setStatus(message, good);
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => els.toast.classList.add("hidden"), 2800);
}

function tactile(type = "click") {
  if (navigator.vibrate) navigator.vibrate(type === "crunch" ? [25, 35, 45] : type === "thud" ? 35 : 18);
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    state.audioContext = state.audioContext || new AudioContext();
    const osc = state.audioContext.createOscillator();
    const gain = state.audioContext.createGain();
    const now = state.audioContext.currentTime;
    const frequency = type === "crunch" ? 92 : type === "thud" ? 58 : 660;
    osc.frequency.setValueAtTime(frequency, now);
    osc.type = type === "click" ? "square" : "sine";
    gain.gain.setValueAtTime(type === "click" ? 0.025 : 0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (type === "click" ? 0.045 : 0.18));
    osc.connect(gain).connect(state.audioContext.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch (_error) {}
}

function readinessScore() {
  const mine = state.originalLines.filter(line => line.character === state.currentCharacter);
  if (!mine.length) return 0;
  const score = mine.reduce((sum, line) => {
    const stat = state.stats.lineStats[line.id];
    if (!stat) return sum;
    const avg = averageLatency(stat);
    const peekPenalty = Math.min(50, (stat.peeks || 0) * 18);
    const latencyPenalty = avg ? Math.min(35, Math.max(0, (avg - 2500) / 150)) : 20;
    const practicedBonus = stat.latencies?.length ? 100 : 25;
    return sum + Math.max(0, practicedBonus - peekPenalty - latencyPenalty);
  }, 0);
  return Math.round(score / mine.length);
}

function openScriptDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("linelock-db", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("scripts", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function cacheScriptRecord(record) {
  try {
    const db = await openScriptDb();
    const tx = db.transaction("scripts", "readwrite");
    tx.objectStore("scripts").put({ id: "current", updatedAt: Date.now(), ...record });
  } catch (_error) {}
}

async function clearScriptCache() {
  try {
    const db = await openScriptDb();
    const tx = db.transaction("scripts", "readwrite");
    tx.objectStore("scripts").delete("current");
  } catch (_error) {}
}

function normalizeText(text) {
  return text
    .replace(/\r/g, "")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+$/gm, "")
    .trim();
}

function isNoise(line) {
  const trimmed = line.trim();
  return !trimmed ||
    /^[-\u2013]?\s*\d+\.?\s*[-\u2013]?$/.test(trimmed) ||
    /^(\w+\s+)?revised\s+\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/i.test(trimmed) ||
    /^(int|ext|est|i\/e)\./i.test(trimmed) ||
    /^(fade in|fade out|cut to|dissolve to|smash cut to):?$/i.test(trimmed) ||
    /^(act|scene)\s+[a-z0-9]+$/i.test(trimmed) ||
    /^page\s+\d+/i.test(trimmed) ||
    /^continued:?$/i.test(trimmed);
}

function bridgeDialogueRows(rows) {
  const bridged = [];
  rows.forEach(row => {
    const trimmed = row.trim();
    const previous = bridged[bridged.length - 1] || "";
    const shouldBridge = previous &&
      !looksLikeCharacter(previous.trim()) &&
      !looksLikeCharacter(trimmed) &&
      !/[.!?;:)"']$/.test(previous.trim()) &&
      /^[a-z]/.test(trimmed);
    if (shouldBridge) {
      bridged[bridged.length - 1] = `${previous} ${trimmed}`;
    } else {
      bridged.push(row);
    }
  });
  return bridged;
}

function cleanCharacterName(name) {
  return name
    .replace(/\([^)]*\)/g, "")
    .replace(/:/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function looksLikeCharacter(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 34 || /[.!?]$/.test(trimmed)) return false;
  if (/^[A-Z][A-Za-z .#'/-]{1,30}:$/.test(trimmed)) return true;
  if (/^(THE END|END OF|ACT|SCENE|INT|EXT|CUT TO|FADE)/i.test(trimmed)) return false;
  return trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
}

function isLikelyActionLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (/^\([^)]*\)$|^\[[^\]]*\]$/.test(trimmed)) return true;
  if (/^(beat|pause|silence|a moment|then|later|meanwhile)\.?$/i.test(trimmed)) return true;
  if (/^(he|she|they|it|the|a|an)\s+/i.test(trimmed) && /(\bwalks?\b|\blooks?\b|\bturns?\b|\bstands?\b|\bsits?\b|\bcrosses?\b|\bopens?\b|\bcloses?\b|\benters?\b|\bexits?\b|\bholds?\b|\btakes?\b|\bputs?\b|\bstarts?\b|\bstops?\b|\bsmiles?\b|\blaughs?\b|\bcries?\b|\bstares?\b|\bpoints?\b|\bmoves?\b|\breaches?\b|\bpicks?\b|\bgoes?\b|\bwaits?\b|\bnods?\b|\bshakes?\b)/i.test(trimmed)) return true;
  if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+)?\s+/.test(trimmed) && !/^(Then|When|Where|Why|How|What|But|And|Because)\b/.test(trimmed) && /(\bwalks?\b|\blooks?\b|\bturns?\b|\bstands?\b|\bsits?\b|\bcrosses?\b|\bopens?\b|\bcloses?\b|\benters?\b|\bexits?\b|\bholds?\b|\btakes?\b|\bputs?\b|\bstarts?\b|\bstops?\b|\bsmiles?\b|\blaughs?\b|\bcries?\b|\bstares?\b|\bpoints?\b|\bmoves?\b|\breaches?\b|\bpicks?\b|\bgoes?\b|\bwaits?\b|\bnods?\b|\bshakes?\b)/i.test(trimmed)) return true;
  if (/^(camera|angle|music|sound|sfx|vfx|insert|close on|wide on|back to)\b/i.test(trimmed)) return true;
  if (!/[.!?]$/.test(trimmed) && /\b(to|from|into|across|toward|through|behind|beside)\b/i.test(trimmed) && trimmed.split(/\s+/).length <= 12) return true;
  return false;
}

function stripStageDirection(text) {
  return text
    .replace(/^\([^)]*\)\s*/, "")
    .replace(/^\[[^\]]*\]\s*/, "")
    .replace(/\s+\([^)]*\)\s*/g, " ")
    .replace(/\s+\[[^\]]*\]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseScript(text) {
  const rows = bridgeDialogueRows(normalizeText(text).split("\n"));
  const parsed = [];
  let active = "";
  let sawCharacterBlock = false;

  rows.forEach(row => {
    const trimmed = row.trim();
    if (isNoise(trimmed)) return;

    const colonMatch = trimmed.match(/^([A-Z][A-Za-z .#'/-]{1,30}):\s*(.+)$/);
    if (colonMatch) {
      active = cleanCharacterName(colonMatch[1]);
      sawCharacterBlock = true;
      const dialogue = stripStageDirection(colonMatch[2]);
      if (dialogue) parsed.push({ character: active, text: dialogue });
      return;
    }

    if (looksLikeCharacter(trimmed)) {
      active = cleanCharacterName(trimmed);
      sawCharacterBlock = true;
      return;
    }

    if (!active || isLikelyActionLine(trimmed)) return;
    const dialogue = stripStageDirection(trimmed);
    if (!dialogue || isLikelyActionLine(dialogue)) return;
    const last = parsed[parsed.length - 1];
    if (last && last.character === active) {
      last.text += ` ${dialogue}`;
    } else {
      parsed.push({ character: active, text: dialogue });
    }
  });

  if (!parsed.length && !sawCharacterBlock) {
    return parseMonologue(text);
  }

  return normalizeParsedLines(parsed);
}

function parseMonologue(text) {
  const cleaned = bridgeDialogueRows(normalizeText(text).split("\n"))
    .map(row => row.trim())
    .filter(row => !isNoise(row) && !looksLikeCharacter(row))
    .map(stripStageDirection)
    .filter(Boolean);
  const joined = cleaned.join(" ");
  const sentences = splitSentences(joined).filter(sentence => !isLikelyActionLine(sentence));
  const lines = sentences.length ? sentences : cleaned;
  return normalizeParsedLines(lines.map(text => ({ character: "MONOLOGUE", text })));
}

function normalizeParsedLines(lines) {
  return lines
    .map(line => ({ character: cleanCharacterName(line.character || "MONOLOGUE"), text: line.text.replace(/\s+/g, " ").trim() }))
    .filter(line => line.text && !isLikelyActionLine(line.text))
    .map((line, index) => ({ ...line, id: index }));
}

function splitSentences(text) {
  return text.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g)?.map(item => item.trim()).filter(Boolean) || [];
}

async function extractPdfText(file) {
  if (!window.pdfjsLib) {
    throw new Error("PDF parser did not load. Check internet access, or paste the script text.");
  }
  const typed = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data: typed }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    els.uploadStatus.textContent = `Reading PDF page ${pageNumber} of ${pdf.numPages}...`;
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const rows = content.items
      .map(item => ({ text: item.str, x: item.transform[4], y: Math.round(item.transform[5]) }))
      .reduce((groups, item) => {
        const key = item.y;
        groups[key] = groups[key] || [];
        groups[key].push(item);
        return groups;
      }, {});
    const pageText = Object.keys(rows)
      .sort((a, b) => Number(b) - Number(a))
      .map(key => rows[key].sort((a, b) => a.x - b.x).map(item => item.text).join(" "))
      .join("\n");
    pages.push(pageText);
  }
  return pages.join("\n\n");
}

function refreshCharacters() {
  state.characters = [...new Set(state.lines.map(line => line.character))];
  if (!state.currentCharacter || !state.characters.includes(state.currentCharacter)) {
    state.currentCharacter = state.characters[0] || "";
  }
  state.characters.forEach(name => {
    if (state.readRoles[name] === undefined) state.readRoles[name] = name !== state.currentCharacter;
  });
  if (state.currentCharacter) state.readRoles[state.currentCharacter] = false;
  els.characterSelect.innerHTML = state.characters
    .map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
    .join("");
  els.characterSelect.value = state.currentCharacter;
  renderReadRoles();
}

function renderReadRoles() {
  els.readRoleList.innerHTML = state.characters.map(name => {
    const disabled = name === state.currentCharacter;
    const checked = disabled ? false : state.readRoles[name] !== false;
    return `<label class="check-item ${disabled ? "disabled" : ""}">
      <input type="checkbox" data-read-role="${escapeHtml(name)}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}>
      <span>${disabled ? "Your role" : "Read"}: ${escapeHtml(name)}</span>
    </label>`;
  }).join("");
}

function shouldPartnerRead(line) {
  if (line.character === state.currentCharacter) return false;
  if (state.readRoles[line.character] === false) return false;
  return !state.mutedLineIds.includes(line.id);
}

function refreshBeats() {
  const options = [{ id: "all", label: "Whole script", start: 0 }, ...state.beats];
  els.beatSelect.innerHTML = options
    .map(beat => `<option value="${escapeHtml(String(beat.id))}">${escapeHtml(beat.label)}</option>`)
    .join("");
  els.beatSelect.value = state.selectedBeat;
  els.beatTabs.innerHTML = options.map(beat =>
    `<button class="beat-tab ${String(beat.id) === String(state.selectedBeat) ? "active" : ""}" data-beat="${escapeHtml(String(beat.id))}">${escapeHtml(beat.label)}</button>`
  ).join("");
}

function baseLinesForBeat() {
  const source = state.originalLines.length ? state.originalLines : state.lines;
  const filteredSource = applySearch(source);
  if (state.selectedBeat === "all") return filteredSource;
  const beatIndex = state.beats.findIndex(beat => String(beat.id) === String(state.selectedBeat));
  if (beatIndex < 0) return filteredSource;
  const start = state.beats[beatIndex].start;
  const end = state.beats[beatIndex + 1]?.start ?? source.length;
  return source.slice(start, end).filter(line => filteredSource.includes(line));
}

function applySearch(lines) {
  const query = state.searchQuery.trim().toLowerCase();
  if (!query) return lines;
  return lines.filter(line =>
    line.character.toLowerCase().includes(query) ||
    line.text.toLowerCase().includes(query)
  );
}

function linesForCurrentView() {
  const base = baseLinesForBeat();
  if (state.training === "reverse") return [...base].reverse();
  if (state.training === "ladder") {
    const mineSeen = [];
    const result = [];
    for (const line of base) {
      result.push(line);
      if (line.character === state.currentCharacter) mineSeen.push(line.id);
      if (mineSeen.length >= Math.max(1, state.masteredStep)) break;
    }
    return result;
  }
  if (state.training === "trouble") {
    const troubleIds = troubleLineIds();
    if (!troubleIds.length) return base;
    const expanded = new Set();
    troubleIds.forEach(id => {
      expanded.add(Math.max(0, id - 1));
      expanded.add(id);
    });
    return base.filter(line => expanded.has(line.id));
  }
  return base;
}

function render() {
  refreshBeats();
  renderReadRoles();
  const visibleLines = linesForCurrentView();
  updateBodyFlowClasses();
  els.scriptDisplay.style.fontSize = `${els.sizeRange.value}px`;
  els.sceneMeta.textContent = `${visibleLines.length} lines, ${state.characters.length} roles`;
  els.modeTitle.textContent = modeTitle();
  els.modeHelp.textContent = modeHelp();
  updateCoachNote(visibleLines);
  updateRunProgress(visibleLines);
  updateGameStrip(visibleLines);
  els.sourceToggleBtn.textContent = state.sourceView === "script" ? "Rehearsal" : state.sourceView === "clean" ? "Parsed Script" : "Original";
  els.sourceDisplay.textContent = state.sourceView === "source" ? state.raw : state.cleanText;
  els.sourceDisplay.classList.toggle("hidden", state.sourceView === "script");
  els.scriptDisplay.classList.toggle("hidden", state.sourceView !== "script" || state.mode === "tap");
  els.tapPane.classList.toggle("hidden", state.mode !== "tap");
  els.partnerBar.classList.toggle("hidden", !state.partnerActive);
  els.continueBtn.classList.toggle("hidden", !(state.partnerActive && state.trigger === "tap"));
  els.backFromTroubleBtn.classList.toggle("hidden", state.training !== "trouble");
  if (state.mode === "tap") prepareTapMode();
  updateFlow(visibleLines);

  if (state.mode === "tap") {
    return;
  }

  els.prevLineBtn.disabled = !visibleLines.length || state.focusIndex <= 0;
  els.nextLineBtn.disabled = !visibleLines.length || state.focusIndex >= visibleLines.length - 1;
  els.monologueUnitSelect.disabled = !isMonologue();

  els.scriptDisplay.innerHTML = visibleLines.map((line, localIndex) => {
    const absoluteIndex = state.originalLines.findIndex(item => item.id === line.id);
    const beat = state.beats.find(item => item.start === absoluteIndex);
    const isMine = line.character === state.currentCharacter;
    const isActive = localIndex === state.focusIndex || (state.partnerActive && localIndex === state.partnerIndex);
    const content = renderLineText(line, isMine);
    const peek = isMine ? `<button class="peek" data-peek="${line.id}" title="Peek at the full line">Peek</button>` : "";
    const readControl = !isMine ? `<label class="read-line"><input type="checkbox" data-read-line="${line.id}" ${state.mutedLineIds.includes(line.id) ? "" : "checked"}> Read</label>` : "";
    const beatTag = beat ? `<div class="beat-tag">${escapeHtml(beat.label)}</div>` : "";
    const boundary = `<button class="beat-boundary ${state.slashMode ? "armed" : ""}" data-boundary="${absoluteIndex}" title="Add beat before this line">Cut beat here</button>`;
    const editContent = state.editMode ? renderEditableLine(line) : `
      <div class="character">${escapeHtml(line.character)}</div>
      <div class="dialogue">${content}</div>
      <div class="line-tools">${peek}${readControl}</div>`;
    return `${boundary}<article class="line ${isMine ? "mine" : "cue-line"} ${lineRisk(line.id)} ${isActive ? "active-line" : ""} ${state.editMode ? "editing" : ""}" data-line="${line.id}" data-local="${localIndex}">
      ${beatTag}
      ${editContent}
    </article>`;
  }).join("");
  const lastLine = visibleLines[visibleLines.length - 1];
  if (lastLine) {
    const endIndex = state.originalLines.findIndex(item => item.id === lastLine.id) + 1;
    els.scriptDisplay.insertAdjacentHTML("beforeend", `<button class="beat-boundary ${state.slashMode ? "armed" : ""}" data-boundary="${endIndex}" title="Add beat after this line">Cut beat here</button>`);
  }
}

function renderEditableLine(line) {
  return `<div class="edit-line-grid">
    <input class="edit-character" data-edit-character="${line.id}" value="${escapeHtml(line.character)}" aria-label="Character">
    <textarea class="edit-dialogue" data-edit-text="${line.id}" aria-label="Dialogue">${escapeHtml(line.text)}</textarea>
    <button class="secondary danger" data-delete-line="${line.id}">Remove</button>
  </div>`;
}

function updateRunProgress(visibleLines) {
  const totalMine = visibleLines.filter(line => line.character === state.currentCharacter).length || 1;
  const practicedMine = visibleLines.filter(line =>
    line.character === state.currentCharacter && state.stats.lineStats[line.id]?.latencies?.length
  ).length;
  const percent = Math.min(100, Math.round((practicedMine / totalMine) * 100));
  els.runProgress.style.width = `${percent}%`;
}

function updateGameStrip(visibleLines) {
  els.xpScore.textContent = state.xp;
  els.streakCount.textContent = state.streak;
  const challenge = nextChallenge(visibleLines);
  els.challengeLabel.textContent = `Challenge: ${challenge}`;
}

function nextChallenge(visibleLines) {
  if (!state.originalLines.length) return "build a rehearsal";
  if (state.editMode) return "clean the script, then close Edit";
  if (state.training === "ladder") return state.ladderComplete ? "run the full ladder" : `master ladder step ${Math.max(1, state.masteredStep)}`;
  if (isMonologue() && state.mode !== "tap") return "try Tap with sentence units";
  if (state.mode === "full") return "choose a harder memory view";
  if (!state.stats.practiced) return "run one clean turn";
  if (troubleLineIds().length) return "drill weak lines";
  if (readinessScore() < 85) return "earn a green run";
  return visibleLines.length ? "run Chaos for proof" : "clear filters and rehearse";
}

function updateCoachNote(visibleLines) {
  if (!state.originalLines.length) {
    els.coachNote.textContent = "Feed a script to begin.";
    return;
  }
  const trouble = troubleLineIds().length;
  const peeks = state.stats.peeks;
  if (state.searchQuery) {
    els.coachNote.textContent = `${visibleLines.length} matches. Clear search for the full run.`;
  } else if (state.training === "trouble") {
    els.coachNote.textContent = "Weak-lines drill active. Run the red lines, then return.";
  } else if (trouble) {
    els.coachNote.textContent = `${trouble} weak lines detected. Drill them before the next full run.`;
  } else if (readinessScore() >= 85) {
    els.coachNote.textContent = "Green signal. Run Chaos for proof under pressure.";
  } else if (peeks === 0 && state.stats.practiced > 0) {
    els.coachNote.textContent = "Clean run. Increase difficulty.";
  } else {
    els.coachNote.textContent = "Start readable, then move to 1ST LTR, Ghost, Blanks, and Chaos.";
  }
}

function updateFlow(visibleLines = linesForCurrentView()) {
  const hasScript = state.originalLines.length > 0;
  const steps = [
    { label: "Ingest", done: hasScript },
    { label: "Encode", done: state.mode !== "full" },
    { label: "Partner", done: state.stats.practiced > 0 || state.partnerActive },
    { label: "Chunk", done: state.beats.length > 1 || state.training === "ladder" || state.training === "reverse" },
    { label: "Prove", done: state.training === "trouble" || readinessScore() >= 85 }
  ];
  els.flowSteps.innerHTML = steps.map(step => `<span class="${step.done ? "done" : ""}">${step.label}</span>`).join("");
  els.flowGuide.textContent = flowGuideText();
  if (!hasScript) {
    els.nextActionBtn.textContent = "Next: Build Rehearsal";
  } else if (state.training === "trouble") {
    els.nextActionBtn.textContent = "Next: Back to Full Scene";
  } else if (state.training === "ladder" && !state.partnerActive) {
    const totalSteps = totalTargetLines();
    if (state.ladderComplete) {
      els.nextActionBtn.textContent = "Next: Run Full Ladder";
    } else if (state.masteredStep >= totalSteps) {
      els.nextActionBtn.textContent = "Next: Complete Ladder";
    } else {
      els.nextActionBtn.textContent = `Next: Reveal Step ${Math.min(totalSteps, state.masteredStep + 1)}`;
    }
  } else if (state.mode === "tap" && !state.partnerActive) {
    els.nextActionBtn.textContent = els.tapNextBtn.textContent || "Next Unit";
  } else if (state.partnerActive && state.trigger === "tap") {
    els.nextActionBtn.textContent = "Next: Continue";
  } else if (state.partnerActive) {
    els.nextActionBtn.textContent = "Next: Stop Partner";
  } else if (troubleLineIds().length) {
    els.nextActionBtn.textContent = "Next: Drill Weak Lines";
  } else {
    els.nextActionBtn.textContent = "Next: Start Partner";
  }
  updateCommandButtons(visibleLines);
}

function updateCommandButtons(visibleLines) {
  const hasLines = visibleLines.length > 0;
  const hideLineNav = !hasLines || state.partnerActive || state.mode === "tap" || state.sourceView !== "script";
  els.nextActionBtn.parentElement.classList.toggle("single-command", hideLineNav);
  els.prevLineBtn.classList.toggle("hidden", hideLineNav);
  els.nextLineBtn.classList.toggle("hidden", hideLineNav);
  els.prevLineBtn.textContent = "Prev Line";
  els.nextLineBtn.textContent = "Next Line";
  els.prevLineBtn.disabled = !hasLines || state.focusIndex <= 0;
  els.nextLineBtn.disabled = !hasLines || state.focusIndex >= visibleLines.length - 1;
  if (state.training === "ladder" && !state.partnerActive && state.mode !== "tap") {
    els.prevLineBtn.textContent = "Prev Step";
    els.nextLineBtn.textContent = "Next Cue";
  }
  if (state.training === "reverse" && !state.partnerActive && state.mode !== "tap") {
    els.prevLineBtn.textContent = "Earlier";
    els.nextLineBtn.textContent = "Next";
  }
}

function updateBodyFlowClasses() {
  document.body.classList.toggle("mode-ghost", state.mode === "ghost");
  document.body.classList.toggle("mode-blanks", state.mode === "blanks");
  document.body.classList.toggle("mode-tap", state.mode === "tap");
  document.body.classList.toggle("mode-ladder", state.training === "ladder");
  document.body.classList.toggle("mode-partner", state.partnerActive || state.trigger === "voice" || state.trigger === "tap");
  document.body.classList.toggle("mode-monologue", isMonologue());
}

function setActivePanel(panel) {
  state.activePanel = panel;
  document.querySelectorAll("[data-open-panel]").forEach(button => {
    button.classList.toggle("active", button.dataset.openPanel === panel);
  });
  document.querySelectorAll(".control-section[data-panel]").forEach(section => {
    section.classList.toggle("active-panel", section.dataset.panel === panel);
  });
}

function flowGuideText() {
  if (!state.originalLines.length) return "1. Feed script  2. Pick role  3. Run scene";
  if (state.editMode) return "Edit: clean bad lines, then return to rehearsal.";
  if (state.training === "ladder") {
    return state.ladderComplete
      ? "Ladder complete: run the full build with Partner or add Chaos."
      : `Ladder: run what is visible with zero peeks, then reveal the next step. Step ${Math.max(1, state.masteredStep)} of ${Math.max(1, totalTargetLines())}.`;
  }
  if (state.mode === "tap") return isMonologue() ? "Tap Drill: choose word, sentence, line, or beat units, then advance one unit at a time." : "Tap Drill: advance your role one word at a time.";
  if (state.partnerActive) return "Partner: reader speaks cue lines only, then listens for your line.";
  if (state.training === "trouble") return "Weak Lines: only red lines and setup cues are active.";
  return "Choose a memory view, run the scene, then drill weak lines.";
}

function totalTargetLines() {
  return baseLinesForBeat().filter(line => line.character === state.currentCharacter).length || 1;
}

function lineRisk(id) {
  const stat = state.stats.lineStats[id];
  if (!stat) return "";
  const avgLatency = stat.latencies?.length ? stat.latencies.reduce((a, b) => a + b, 0) / stat.latencies.length : 0;
  if (stat.peeks > 1 || avgLatency > 6500) return "risk-red";
  if (stat.peeks === 0 && stat.latencies?.length && avgLatency < 3500) return "risk-green";
  if (avgLatency > 4500 || stat.peeks === 1) return "risk-yellow";
  return "";
}

function modeTitle() {
  const labels = {
    full: "Script",
    letters: "First-Letter View",
    ghost: "Ghost View",
    blanks: "Fill-in-the-Blanks",
    tap: "Tap Drill",
    punctuation: "Punctuation Eraser"
  };
  return labels[state.mode] || "Script";
}

function modeHelp() {
  const help = {
    full: "Read normally. Your lines are highlighted and cues stay visible.",
    letters: "Your lines become first letters while punctuation and word rhythm stay intact.",
    ghost: "Use the visibility slider to fade your lines from readable to nearly gone.",
    blanks: "Key words disappear for precision recall.",
    tap: "Advance your words one unit at a time.",
    punctuation: "Punctuation disappears so you can find your own rhythm."
  };
  return help[state.mode] || "";
}

function isMonologue() {
  return state.characters.length === 1 || state.currentCharacter === "MONOLOGUE";
}

function renderLineText(line, isMine) {
  if (!isMine) return escapeHtml(line.text);

  const opacity = Number(els.visibilityRange.value) / 100;
  const wasPeeked = state.peekedLineIds.includes(line.id);

  if (wasPeeked) {
    return `<span style="opacity:1" class="ghost-text">${escapeHtml(line.text)}</span>`;
  }

  if (state.mode === "letters") {
    return `<span style="opacity:${Math.max(opacity, 0.35)}" class="ghost-text">${escapeHtml(firstLetters(line.text))}</span>`;
  }

  if (state.mode === "ghost") {
    return `<span style="opacity:${opacity}" class="ghost-text">${escapeHtml(line.text)}</span>`;
  }

  if (state.mode === "blanks") {
    return `<span style="opacity:${Math.max(opacity, 0.25)}" class="ghost-text">${blankWords(line.text)}</span>`;
  }

  if (state.mode === "punctuation") {
    return `<span style="opacity:${Math.max(opacity, 0.2)}" class="ghost-text">${escapeHtml(line.text.replace(/[.,!?;:\u2014-]/g, ""))}</span>`;
  }

  return `<span style="opacity:${opacity}" class="ghost-text">${escapeHtml(line.text)}</span>`;
}

function firstLetters(text) {
  return text.split(/(\s+)/).map(part => {
    if (/^\s+$/.test(part)) return part;
    return part.replace(/([A-Za-z0-9'])([A-Za-z0-9']*)/g, "$1").replace(/([.,!?;:\u2014-]+)$/g, "$1");
  }).join("");
}

function blankWords(text) {
  let wordIndex = 0;
  const level = Number(els.blankRange.value);
  return escapeHtml(text).replace(/\b([A-Za-z']{4,})\b/g, (_match, word) => {
    wordIndex += 1;
    const shouldHide = level === 1
      ? /ing$|ed$|tion$|ment$|ness$|ity$|^[A-Z]/.test(word) || wordIndex % 3 === 0
      : level === 2
        ? wordIndex % 2 === 0
        : wordIndex % 5 !== 0;
    return shouldHide ? `<span class="blank">${word}</span>` : word;
  });
}

function startGhostDecay() {
  setMode("ghost");
  clearInterval(state.ghostDecayTimer);
  const started = Date.now();
  els.visibilityRange.value = 100;
  state.ghostDecayTimer = setInterval(() => {
    const elapsed = Date.now() - started;
    const remaining = Math.max(0, 100 - (elapsed / 10000) * 100);
    els.visibilityRange.value = String(Math.round(remaining));
    render();
    if (remaining <= 0) clearInterval(state.ghostDecayTimer);
  }, 250);
}

function prepareTapMode() {
  const visibleLines = linesForCurrentView();
  const mine = visibleLines.filter(line => line.character === state.currentCharacter);
  if (isMonologue() && state.monologueUnit === "sentence") {
    state.tapWords = mine.flatMap(line => splitSentences(line.text));
    els.tapNextBtn.textContent = "Next Sentence";
  } else if (isMonologue() && state.monologueUnit === "line") {
    state.tapWords = mine.map(line => line.text);
    els.tapNextBtn.textContent = "Next Line";
  } else if (isMonologue() && state.monologueUnit === "beat") {
    state.tapWords = [mine.map(line => line.text).join(" ")].filter(Boolean);
    els.tapNextBtn.textContent = "Next Beat";
  } else {
    state.tapWords = mine.flatMap(line => line.text.split(/\s+/).filter(Boolean));
    els.tapNextBtn.textContent = "Next Word";
  }
  state.tapIndex = Math.min(state.tapIndex, state.tapWords.length - 1);
  els.tapWord.textContent = state.tapWords[state.tapIndex] || "No words for this role";
}

function nextTapWord() {
  if (!state.tapWords.length) prepareTapMode();
  state.tapIndex = (state.tapIndex + 1) % Math.max(state.tapWords.length, 1);
  els.tapWord.textContent = state.tapWords[state.tapIndex] || "No words for this role";
  awardPractice({ clean: true, latency: 0 });
  updateGameStrip(linesForCurrentView());
}

function processScript() {
  const raw = els.scriptInput.value;
  const lines = parseScript(raw);
  if (!lines.length) {
    notify("No character dialogue found. Try CHARACTER then dialogue, or CHARACTER: dialogue.", false);
    return;
  }
  state.raw = raw;
  state.lines = lines;
  state.originalLines = [...lines];
  state.cleanText = lines.map(line => `${line.character}\n${line.text}`).join("\n\n");
  state.sourceView = "script";
  state.beats = [{ id: Date.now(), label: "Beat 1", start: 0 }];
  state.selectedBeat = "all";
  state.training = "scene";
  state.trigger = "tap";
  state.monologueUnit = "sentence";
  state.focusIndex = 0;
  state.readRoles = {};
  state.mutedLineIds = [];
  state.editMode = false;
  state.slashMode = false;
  state.masteredStep = 1;
  state.ladderStepPeeks = 0;
  state.ladderComplete = false;
  state.xp = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.stats = { peeks: 0, practiced: 0, lineStats: {} };
  refreshCharacters();
  els.triggerSelect.value = state.trigger;
  els.monologueUnitSelect.value = state.monologueUnit;
  els.setupPanel.classList.add("hidden");
  els.workPanel.classList.remove("hidden");
  document.body.classList.add("rehearsal-ready");
  setStatus(`${lines.length} lines loaded`, true);
  document.body.classList.add("machine-fed");
  setTimeout(() => document.body.classList.remove("machine-fed"), 650);
  tactile("crunch");
  notify(`${lines.length} lines locked. Your role is glowing.`);
  cacheScriptRecord({ raw: state.raw, cleanText: state.cleanText, lines: state.originalLines });
  setActivePanel("role");
  render();
  updateFlow();
}

function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll(".mode").forEach(btn => btn.classList.toggle("active", btn.dataset.mode === mode));
  state.tapIndex = 0;
  setActivePanel("memory");
  render();
}

function peekLine(id) {
  const line = state.originalLines.find(item => String(item.id) === String(id));
  if (!line) return;
  state.stats.peeks += 1;
  if (state.training === "ladder" && linesForCurrentView().some(item => String(item.id) === String(id))) {
    state.ladderStepPeeks += 1;
  }
  state.streak = 0;
  state.stats.lineStats[id] = state.stats.lineStats[id] || { peeks: 0, latencies: [], text: line.text, character: line.character };
  state.stats.lineStats[id].peeks += 1;
  state.stats.lineStats[id].lastPeek = Date.now();
  state.peekedLineIds = [...new Set([...state.peekedLineIds, Number(id)])];

setTimeout(() => {
  state.peekedLineIds = state.peekedLineIds.filter(lineId => lineId !== Number(id));
  render();
}, 2500);
  tactile("click");
  notify(`${line.character}: ${line.text}`, false);
  render();
}

function toggleScroll() {
  state.scrolling = !state.scrolling;
  els.scrollBtn.textContent = state.scrolling ? "Stop Auto-Scroll" : "Auto-Scroll";
  if (!state.scrolling) {
    clearInterval(state.scrollTimer);
    return;
  }
  if (state.mode !== "full") {
    setMode("full");
    setActivePanel("display");
    notify("Auto-Scroll uses Script view. Choose another Memory View after starting if you want it.");
  }
  const scroller = document.querySelector(".stage");
  state.scrollTimer = setInterval(() => {
    (scroller || window).scrollBy({ top: Number(els.speedRange.value) * 2, behavior: "smooth" });
  }, 120);
}

function loadVoices() {
  state.voices = "speechSynthesis" in window ? speechSynthesis.getVoices() : [];
  els.voiceSelect.innerHTML = state.voices.length
    ? state.voices.map(voice => `<option value="${escapeHtml(voice.name)}">${escapeHtml(voice.name)} (${escapeHtml(voice.lang)})</option>`).join("")
    : `<option value="">Browser default voice</option>`;
  return state.voices.length;
}

function refreshVoicesWithHandshake() {
  if (!("speechSynthesis" in window)) {
    notify("This browser has no speech voice support.", false);
    return;
  }
  loadVoices();
  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    const count = loadVoices();
    if (count || attempts >= 10) {
      clearInterval(timer);
      notify(count ? `${count} cue voices available.` : "No browser voices reported yet.", !!count);
    }
  }, 250);
  speechSynthesis.cancel();
}

async function toggleRecording() {
  if (state.mediaRecorder?.state === "recording") {
    state.mediaRecorder.stop();
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    notify("Recording is not available in this browser.", false);
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.recordedChunks = [];
    state.mediaRecorder = new MediaRecorder(stream);
    state.mediaRecorder.ondataavailable = event => {
      if (event.data.size) state.recordedChunks.push(event.data);
    };
    state.mediaRecorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      if (state.rehearsalAudioUrl) URL.revokeObjectURL(state.rehearsalAudioUrl);
      const blob = new Blob(state.recordedChunks, { type: state.mediaRecorder.mimeType || "audio/webm" });
      state.rehearsalAudioUrl = URL.createObjectURL(blob);
      els.recordBtn.textContent = "Record Run";
      els.playbackBtn.disabled = false;
      els.partnerBar.classList.remove("hidden");
      els.partnerStatus.textContent = "Run captured. Play it back and line-check yourself.";
      notify("Run recorded. Play it back when ready.");
    };
    state.mediaRecorder.start();
    els.recordBtn.textContent = "Stop Recording";
    els.playbackBtn.disabled = true;
    els.partnerBar.classList.remove("hidden");
    els.partnerStatus.textContent = "Recording your rehearsal run.";
    notify("Recording. Say it out loud.");
  } catch (_error) {
    notify("Recording needs microphone permission.", false);
  }
}

function playBackRecording() {
  if (!state.rehearsalAudioUrl) {
    notify("Record a run first.", false);
    return;
  }
  const audio = new Audio(state.rehearsalAudioUrl);
  audio.onplay = () => {
    els.partnerBar.classList.remove("hidden");
    els.partnerStatus.textContent = "Playing back your last run.";
  };
  audio.onended = () => {
    els.partnerStatus.textContent = "Playback complete. Mark weak lines or run again.";
  };
  audio.play().catch(() => notify("Playback could not start.", false));
}

function selectedVoice() {
  return state.voices.find(voice => voice.name === els.voiceSelect.value) || null;
}

function voiceConfig() {
  const configs = {
    neutral: { rate: 0.92, pitch: 1, volume: 1 },
    aggressive: { rate: 1.3, pitch: 0.8, volume: 1 },
    vulnerable: { rate: 0.7, pitch: 1.2, volume: 0.5 },
    warm: { rate: 0.88, pitch: 1.12, volume: 1 },
    urgent: { rate: 1.08, pitch: 1.02, volume: 1 },
    low: { rate: 0.82, pitch: 0.72, volume: 0.75 }
  };
  return configs[els.emotionSelect.value] || configs.neutral;
}

function speakLine(line) {
  return new Promise(resolve => {
    if (!("speechSynthesis" in window)) {
      resolve();
      return;
    }
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(fallback);
      resolve();
    };
    const fallback = setTimeout(done, Math.max(2500, line.text.split(/\s+/).length * 650));
    const config = voiceConfig();
    const utterance = new SpeechSynthesisUtterance(line.text);
    utterance.voice = selectedVoice();
    utterance.rate = config.rate;
    utterance.pitch = config.pitch;
    utterance.volume = config.volume;
    utterance.onend = done;
    utterance.onerror = done;
    speechSynthesis.speak(utterance);
  });
}

async function togglePartner() {
  if (state.partnerActive) {
    stopPartner();
    return;
  }
  if (!("speechSynthesis" in window)) {
    notify("This browser does not support cue reading.", false);
    return;
  }
  state.partnerActive = true;
  document.body.classList.add("partner-active");
  state.partnerIndex = 0;
  els.speakBtn.textContent = "Stop Partner";
  els.partnerStatus.textContent = "Partner rehearsal running";
  setActivePanel("partner");
  render();
  await partnerLoop();
}

function stopPartner() {
  state.partnerActive = false;
  document.body.classList.remove("partner-active");
  els.speakBtn.textContent = "Start Partner";
  els.partnerStatus.textContent = "Partner stopped";
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  stopRecognition();
  if (state.waitingResolver) state.waitingResolver();
  state.waitingResolver = null;
  render();
}

async function partnerLoop() {
  const lines = linesForCurrentView();
  for (let i = state.partnerIndex; i < lines.length; i += 1) {
    if (!state.partnerActive) break;
    state.partnerIndex = i;
    state.focusIndex = i;
    render();
    scrollFocusedLine();
    const line = lines[i];
    if (shouldPartnerRead(line)) {
      els.partnerStatus.textContent = `Reading ${line.character}`;
      await speakLine(line);
    } else if (line.character === state.currentCharacter) {
      state.currentTurnStartedAt = performance.now();
      markPracticed(line.id);
      await waitForActorLine(line);
      recordLatency(line.id, performance.now() - state.currentTurnStartedAt);
    } else {
      els.partnerStatus.textContent = `Skipped ${line.character}`;
    }
  }
  stopPartner();
}

function waitForActorLine(line) {
  els.partnerStatus.textContent = waitLabel(line);
  if (state.trigger === "tap") {
    els.continueBtn.classList.remove("hidden");
    return new Promise(resolve => { state.waitingResolver = resolve; });
  }
  if (state.trigger === "time") {
    const duration = Math.max(2200, Math.min(9000, line.text.split(/\s+/).length * 430));
    return new Promise(resolve => setTimeout(resolve, duration));
  }
  return waitForVoiceLine(line);
}

function waitLabel(line) {
  if (state.trigger === "tap") return `Your line: tap Continue after "${line.text.slice(0, 42)}"`;
  if (state.trigger === "time") return `Your line: timed gap for "${line.text.slice(0, 42)}"`;
  return `Speak the line, or say "next" or "go": "${line.text.slice(0, 42)}"`;
}

function waitForVoiceLine(line) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    els.partnerStatus.textContent = "Voice recognition unavailable; using timed gap";
    return new Promise(resolve => setTimeout(resolve, Math.max(2600, line.text.split(/\s+/).length * 430)));
  }
  return new Promise(resolve => {
    stopRecognition();
    const whisperTimer = setTimeout(() => whisperPrompt(line), Number(els.promptSeconds.value) * 1000);
    const expected = normalizeSpeech(line.text);
    const expectedWords = expected.split(/\s+/).filter(Boolean);
    let bestScore = 0;
    let quietTimer = setTimeout(() => {
      clearTimeout(whisperTimer);
      resolve();
    }, Math.max(9000, Number(els.promptSeconds.value) * 1000 + 3500));
    state.recognition = new SpeechRecognition();
    state.recognition.continuous = true;
    state.recognition.interimResults = true;
    state.recognition.onresult = event => {
      const transcript = Array.from(event.results).map(result => result[0].transcript).join(" ");
      const spoken = normalizeSpeech(transcript);
      const progress = speechProgress(expectedWords, spoken);
      bestScore = Math.max(bestScore, progress.score);
      els.partnerStatus.textContent = `Listening... ${Math.round(bestScore * 100)}% match`;
      if (/\b(next|go|done|continue)\b/.test(spoken) || progress.complete) {
        clearTimeout(quietTimer);
        clearTimeout(whisperTimer);
        stopRecognition();
        resolve();
      }
    };
    state.recognition.onerror = () => {
      clearTimeout(quietTimer);
      clearTimeout(whisperTimer);
      resolve();
    };
    state.recognition.onend = () => {};
    state.recognition.start();
  });
}

function normalizeSpeech(text) {
  const filler = new Set(["um", "uh", "erm", "ah", "like", "you", "know", "okay", "ok", "so", "well", "just"]);
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .map(collapseElongatedWord)
    .filter(word => word && !filler.has(word))
    .join(" ");
}

function collapseElongatedWord(word) {
  return word
    .replace(/([a-z])\1{2,}/g, "$1")
    .replace(/\bhe+y+\b/g, "hey")
    .replace(/\bo+h+\b/g, "oh")
    .replace(/\bno+\b/g, "no")
    .replace(/\bye+s+\b/g, "yes");
}

function wordsApproximatelyEqual(a, b) {
  if (a === b) return true;
  if (a.length <= 3 || b.length <= 3) return false;
  if (a.startsWith(b) || b.startsWith(a)) return true;
  return levenshtein(a, b) <= Math.max(1, Math.floor(Math.max(a.length, b.length) * 0.22));
}

function speechProgress(expectedWords, spoken) {
  const spokenWords = spoken.split(/\s+/).filter(Boolean);
  if (!expectedWords.length || !spokenWords.length) return { score: 0, complete: false };
  let matched = 0;
  let cursor = 0;
  for (const expected of expectedWords) {
    let found = false;
    for (let i = cursor; i < spokenWords.length; i += 1) {
      if (wordsApproximatelyEqual(expected, spokenWords[i])) {
        matched += 1;
        cursor = i + 1;
        found = true;
        break;
      }
    }
    if (!found && matched / expectedWords.length < 0.55) break;
  }
  const score = matched / expectedWords.length;
  const enoughWords = spokenWords.length >= Math.max(2, Math.ceil(expectedWords.length * 0.65));
  const complete = score >= 0.82 && enoughWords;
  return { score, complete };
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}

function whisperPrompt(line) {
  if (!state.partnerActive || !("speechSynthesis" in window)) return;
  const words = line.text.split(/\s+/).slice(0, 3).join(" ");
  const utterance = new SpeechSynthesisUtterance(words);
  utterance.volume = 0.3;
  utterance.rate = 0.82;
  utterance.pitch = 0.9;
  utterance.voice = selectedVoice();
  speechSynthesis.speak(utterance);
  els.partnerStatus.textContent = `Whispered prompt: ${words}`;
}

function stopRecognition() {
  if (state.recognition) {
    try { state.recognition.stop(); } catch (_error) {}
    state.recognition = null;
  }
}

function markPracticed(id) {
  state.stats.lineStats[id] = state.stats.lineStats[id] || {
    peeks: 0,
    latencies: [],
    text: state.originalLines.find(line => line.id === id)?.text || "",
    character: state.currentCharacter
  };
}

function recordLatency(id, ms) {
  markPracticed(id);
  state.stats.lineStats[id].latencies.push(Math.round(ms));
  awardPractice({ clean: (state.stats.lineStats[id].peeks || 0) === 0, latency: ms });
}

function awardPractice({ clean, latency }) {
  state.stats.practiced += 1;
  const quick = latency && latency < 3500;
  const points = clean ? (quick ? 18 : 12) : 4;
  state.xp += points;
  state.streak = clean ? state.streak + 1 : 0;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  if (clean && state.streak && state.streak % 5 === 0) {
    notify(`${state.streak}-turn streak. Pressure is losing.`, true);
  }
}

function addBeat() {
  const visibleLines = linesForCurrentView();
  const line = visibleLines[Math.max(0, Math.min(state.focusIndex, visibleLines.length - 1))];
  const start = line ? state.originalLines.findIndex(item => item.id === line.id) : 0;
  addBeatAt(start);
}

function addBeatAt(start) {
  const normalizedStart = Math.max(0, Math.min(Number(start) || 0, state.originalLines.length));
  if (state.beats.some(beat => beat.start === normalizedStart)) {
    notify("There is already a beat cut at that boundary.", false);
    return;
  }
  const name = `Beat ${state.beats.length + 1}`;
  state.beats.push({ id: Date.now(), label: name, start: normalizedStart });
  state.beats.sort((a, b) => a.start - b.start);
  tactile("thud");
  notify(`${name} cut. Mini-script ready.`);
  render();
}

function toggleSlashMode() {
  state.slashMode = !state.slashMode;
  els.slashModeBtn.classList.toggle("active", state.slashMode);
  notify(state.slashMode ? "Slash Mode armed. Tap a line boundary to cut a beat." : "Slash Mode off.");
}

function clearBeats() {
  state.beats = [{ id: Date.now(), label: "Beat 1", start: 0 }];
  state.selectedBeat = "all";
  render();
}

function moveFocus(delta) {
  const visibleLines = linesForCurrentView();
  if (!visibleLines.length) return;
  state.focusIndex = Math.max(0, Math.min(visibleLines.length - 1, state.focusIndex + delta));
  state.partnerIndex = state.focusIndex;
  render();
  scrollFocusedLine();
}

function scrollFocusedLine() {
  document.querySelector(`.line[data-local="${state.focusIndex}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
}

function syncCleanText() {
  state.cleanText = state.originalLines.map(line => `${line.character}\n${line.text}`).join("\n\n");
  state.lines = state.originalLines;
}

function updateLine(id, patch) {
  const line = state.originalLines.find(item => String(item.id) === String(id));
  if (!line) return;
  if (patch.character !== undefined) line.character = cleanCharacterName(patch.character) || line.character;
  if (patch.text !== undefined) line.text = patch.text.replace(/\s+/g, " ").trim();
  syncCleanText();
  refreshCharacters();
  render();
}

function deleteLine(id) {
  state.originalLines = state.originalLines.filter(line => String(line.id) !== String(id));
  state.originalLines = state.originalLines.map((line, index) => ({ ...line, id: index }));
  if (!state.originalLines.length) {
    state.beats = [];
  } else {
    state.beats = state.beats
      .map(beat => ({ ...beat, start: Math.max(0, Math.min(beat.start, state.originalLines.length - 1)) }))
      .filter((beat, index, arr) => index === arr.findIndex(item => item.start === beat.start));
  }
  if (!state.beats.length) state.beats = [{ id: Date.now(), label: "Beat 1", start: 0 }];
  state.mutedLineIds = state.mutedLineIds.filter(lineId => state.originalLines.some(line => line.id === lineId));
  syncCleanText();
  refreshCharacters();
  notify("Line removed from the rehearsal script.");
  render();
}

function troubleLineIds() {
  return Object.entries(state.stats.lineStats)
    .filter(([, item]) => item.peeks > 1 || averageLatency(item) > 6500)
    .map(([id]) => Number(id));
}

function averageLatency(item) {
  if (!item?.latencies?.length) return 0;
  return item.latencies.reduce((a, b) => a + b, 0) / item.latencies.length;
}

function showAnalytics() {
  setActivePanel("proof");
  const trouble = Object.entries(state.stats.lineStats)
    .filter(([, item]) => item.peeks > 1 || averageLatency(item) > 6500)
    .sort((a, b) => (b[1].peeks + averageLatency(b[1]) / 1000) - (a[1].peeks + averageLatency(a[1]) / 1000));
  els.peekCount.textContent = state.stats.peeks;
  els.readinessScore.textContent = `${readinessScore()}%`;
  els.practiceCount.textContent = state.stats.practiced;
  els.troubleCount.textContent = trouble.length;
  els.troubleList.innerHTML = trouble.length ? trouble.map(([, item]) => `
    <div class="trouble-item">
      <strong>${escapeHtml(item.character)} - ${item.peeks} peeks</strong>
      <p>${escapeHtml(item.text)}</p>
      <small>${item.latencies?.length ? `Average recall: ${(averageLatency(item) / 1000).toFixed(1)}s` : "No latency yet"}</small>
    </div>
  `).join("") : `<div class="trouble-item"><strong>No trouble spots yet</strong><p>Use Peek while drilling and this will fill itself in.</p></div>`;
  els.analyticsPanel.classList.remove("hidden");
}

function practiceTrouble() {
  if (!troubleLineIds().length) {
    notify("No weak lines yet. Peek twice or create high-latency lines first.", false);
    return;
  }
  state.previousView = {
    training: state.training,
    selectedBeat: state.selectedBeat,
    mode: state.mode,
    partnerIndex: state.partnerIndex
  };
  state.training = "trouble";
  els.trainingSelect.value = "trouble";
  setMode("letters");
  setActivePanel("proof");
  notify("Weak-lines drill active. Use Back to Full Scene when done.");
}

function applyPreset(name) {
  if (!state.originalLines.length) {
    notify("Build a rehearsal first, then choose a coach preset.", false);
    return;
  }
  stopPartner();
  state.searchQuery = "";
  els.searchInput.value = "";
  const presets = {
  warmup: { mode: "full", training: "scene", trigger: "tap", blanks: 1, visibility: 100, chaos: false },
  memorize: { mode: "letters", training: "ladder", trigger: "tap", blanks: 1, visibility: 75, chaos: false },
  offbook: { mode: "blanks", training: "scene", trigger: "voice", blanks: 3, visibility: 25, chaos: false },
  stress: { mode: "punctuation", training: "reverse", trigger: "voice", blanks: 3, visibility: 10, chaos: true }
};
  const preset = presets[name];
  if (!preset) return;
  state.activePreset = name;
  state.peekedLineIds = [];
  state.training = preset.training;
  state.trigger = preset.trigger;
  els.trainingSelect.value = preset.training;
  els.triggerSelect.value = preset.trigger;
  els.blankRange.value = preset.blanks;
  els.visibilityRange.value = preset.visibility;
  if (state.chaos !== preset.chaos) toggleChaos();
  setMode(preset.mode);
  setActivePanel(preset.training === "scene" ? "memory" : "chunk");
  notify(`${name[0].toUpperCase()}${name.slice(1)} preset ready.`);
}

function restartRun() {
  stopPartner();
  state.partnerIndex = 0;
  state.focusIndex = 0;
  state.tapIndex = 0;
  if (state.training === "ladder") state.ladderStepPeeks = 0;
  window.scrollTo({ top: 0, behavior: "smooth" });
  render();
  notify("Run restarted from the top.");
}

function advanceCurrentFlow() {
  if (!state.originalLines.length) {
    processScript();
    return;
  }
  if (state.training === "trouble") {
    backFromTrouble();
    return;
  }
  if (state.partnerActive && state.trigger === "tap") {
    if (state.waitingResolver) state.waitingResolver();
    state.waitingResolver = null;
    return;
  }
  if (state.partnerActive) {
    stopPartner();
    return;
  }
  if (state.training === "ladder") {
    if (state.ladderComplete) {
      togglePartner();
    } else {
      markMastered();
    }
    return;
  }
  if (state.mode === "tap") {
    nextTapWord();
    return;
  }
  if (troubleLineIds().length) {
    practiceTrouble();
    return;
  }
  togglePartner();
}

function exportReport() {
  if (!state.originalLines.length) {
    notify("Nothing to export yet.", false);
    return;
  }
  const lines = state.originalLines.map(line => {
    const stat = state.stats.lineStats[line.id] || { peeks: 0, latencies: [] };
    return {
      character: line.character,
      text: line.text,
      peeks: stat.peeks || 0,
      averageRecallSeconds: stat.latencies?.length ? Number((averageLatency(stat) / 1000).toFixed(1)) : null,
      risk: lineRisk(line.id).replace("risk-", "") || "neutral"
    };
  });
  const report = {
    exportedAt: new Date().toISOString(),
    role: state.currentCharacter,
    mode: state.mode,
    training: state.training,
    trigger: state.trigger,
    totalLines: state.originalLines.length,
    peeks: state.stats.peeks,
    practicedTurns: state.stats.practiced,
    troubleLines: troubleLineIds().length,
    lines
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "linelock-practice-report.json";
  link.click();
  URL.revokeObjectURL(url);
  notify("Practice report exported.");
}

function backFromTrouble() {
  const previous = state.previousView || { training: "scene", selectedBeat: "all", mode: "full", partnerIndex: 0 };
  state.training = previous.training;
  state.selectedBeat = previous.selectedBeat;
  state.partnerIndex = previous.partnerIndex;
  els.trainingSelect.value = state.training;
  setMode(previous.mode);
  state.previousView = null;
  notify("Back to the full rehearsal.");
}

function markMastered() {
  if (state.training !== "ladder") {
    state.training = "ladder";
    els.trainingSelect.value = "ladder";
    state.ladderStepPeeks = 0;
    state.ladderComplete = false;
  }
  const currentLines = linesForCurrentView().filter(line => line.character === state.currentCharacter);
  if (!currentLines.length) return;
  if (state.ladderStepPeeks > 0) {
    els.partnerBar.classList.remove("hidden");
    els.partnerStatus.textContent = "Ladder step had a peek. Restart this step and run it clean.";
    notify("Run this ladder step again with zero peeks before revealing the next line.", false);
    setActivePanel("chunk");
    render();
    return;
  }
  const totalSteps = totalTargetLines();
  const isFinalVisibleStep = state.masteredStep >= totalSteps;
  state.masteredStep = isFinalVisibleStep ? totalSteps : Math.min(totalSteps, state.masteredStep + 1);
  state.ladderComplete = isFinalVisibleStep;
  state.partnerIndex = 0;
  state.focusIndex = 0;
  state.ladderStepPeeks = 0;
  state.xp += 25;
  state.streak += 1;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  els.partnerBar.classList.remove("hidden");
  els.partnerStatus.textContent = state.ladderComplete
    ? "Ladder complete. Run it off-book or add Chaos."
    : `Ladder advanced. Step ${state.masteredStep} is now visible.`;
  notify(state.ladderComplete ? "Ladder complete." : `Step ${state.masteredStep} revealed.`);
  render();
}

function ladderBackStep() {
  if (state.training !== "ladder") {
    state.training = "ladder";
    els.trainingSelect.value = "ladder";
  }
  state.masteredStep = Math.max(1, state.masteredStep - 1);
  state.partnerIndex = 0;
  state.focusIndex = 0;
  state.ladderStepPeeks = 0;
  state.ladderComplete = false;
  setActivePanel("chunk");
  notify(`Back to ladder step ${state.masteredStep}.`);
  render();
}

function ladderFirstStep() {
  if (state.training !== "ladder") {
    state.training = "ladder";
    els.trainingSelect.value = "ladder";
  }
  state.masteredStep = 1;
  state.partnerIndex = 0;
  state.focusIndex = 0;
  state.ladderStepPeeks = 0;
  state.ladderComplete = false;
  setActivePanel("chunk");
  notify("Back to ladder step 1.");
  render();
}

function toggleChaos() {
  state.chaos = !state.chaos;
  els.chaosBtn.classList.toggle("active", state.chaos);
  document.body.classList.toggle("chaos-on", state.chaos);
  if (state.chaos) startChaosNoise(); else stopChaosNoise();
  els.partnerBar.classList.remove("hidden");
  els.partnerStatus.textContent = state.chaos ? "Boss level armed. Hold the line." : "Chaos stress test off";
  notify(state.chaos ? "Boss level armed." : "Chaos disarmed.", !state.chaos);
}

function startChaosNoise() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext || state.chaosSource) return;
    state.audioContext = state.audioContext || new AudioContext();
    const bufferSize = state.audioContext.sampleRate * 2;
    const buffer = state.audioContext.createBuffer(1, bufferSize, state.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) data[i] = (Math.random() * 2 - 1) * 0.05;
    const source = state.audioContext.createBufferSource();
    const gain = state.audioContext.createGain();
    gain.gain.value = 0.25;
    source.buffer = buffer;
    source.loop = true;
    source.connect(gain).connect(state.audioContext.destination);
    source.start();
    state.chaosSource = source;
  } catch (_error) {}
}

function stopChaosNoise() {
  try {
    if (state.chaosSource) state.chaosSource.stop();
  } catch (_error) {}
  state.chaosSource = null;
}

function saveState() {
  if (!state.originalLines.length && !els.scriptInput.value.trim()) {
    notify("Nothing to save yet. Add a script first.", false);
    return;
  }
  localStorage.setItem("linelock-state", JSON.stringify({
    raw: state.raw || els.scriptInput.value,
    lines: state.originalLines.length ? state.originalLines : state.lines,
    cleanText: state.cleanText,
    currentCharacter: state.currentCharacter,
    mode: state.mode,
    training: state.training,
    trigger: state.trigger,
    beats: state.beats,
    selectedBeat: state.selectedBeat,
    monologueUnit: state.monologueUnit,
    readRoles: state.readRoles,
    mutedLineIds: state.mutedLineIds,
    masteredStep: state.masteredStep,
    ladderStepPeeks: state.ladderStepPeeks,
    ladderComplete: state.ladderComplete,
    xp: state.xp,
    streak: state.streak,
    bestStreak: state.bestStreak,
    stats: state.stats
  }));
  cacheScriptRecord({ raw: state.raw || els.scriptInput.value, cleanText: state.cleanText, lines: state.originalLines });
  notify("Saved on this device.");
}

async function loadState() {
  const saved = localStorage.getItem("linelock-state");
  let data = saved ? JSON.parse(saved) : null;
  if (!data) {
    try {
      const db = await openScriptDb();
      const tx = db.transaction("scripts", "readonly");
      const request = tx.objectStore("scripts").get("current");
      data = await new Promise(resolve => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      });
    } catch (_error) {}
  }
  if (!data) {
    notify("No saved rehearsal found on this device.", false);
    return;
  }
  Object.assign(state, {
    raw: data.raw || "",
    lines: data.lines || [],
    originalLines: data.lines || [],
    cleanText: data.cleanText || "",
    currentCharacter: data.currentCharacter || "",
    mode: data.mode || "full",
    training: data.training || "scene",
    trigger: data.trigger || "tap",
    beats: data.beats || [],
    selectedBeat: data.selectedBeat || "all",
    monologueUnit: data.monologueUnit || "sentence",
    readRoles: data.readRoles || {},
    mutedLineIds: data.mutedLineIds || [],
    masteredStep: data.masteredStep || 1,
    ladderStepPeeks: data.ladderStepPeeks || 0,
    ladderComplete: data.ladderComplete || false,
    xp: data.xp || 0,
    streak: data.streak || 0,
    bestStreak: data.bestStreak || 0,
    focusIndex: 0,
    editMode: false,
    slashMode: false,
    stats: data.stats || state.stats || { peeks: 0, practiced: 0, lineStats: {} }
  });
  els.scriptInput.value = state.raw;
  els.trainingSelect.value = state.training;
  els.triggerSelect.value = state.trigger;
  els.monologueUnitSelect.value = state.monologueUnit;
  refreshCharacters();
  els.setupPanel.classList.add("hidden");
  els.workPanel.classList.remove("hidden");
  document.body.classList.add("rehearsal-ready");
  setStatus(`${state.lines.length} lines loaded`, true);
  setMode(state.mode);
  setActivePanel("role");
  notify("Saved rehearsal loaded.");
}

async function resetAll() {
  if (!state.resetArmed) {
    state.resetArmed = true;
    els.resetBtn.textContent = "Confirm Reset";
    notify("Tap Confirm Reset to clear this rehearsal.", false);
    setTimeout(() => {
      state.resetArmed = false;
      els.resetBtn.textContent = "Reset";
    }, 4000);
    return;
  }
  stopPartner();
  stopChaosNoise();
  if (state.rehearsalAudioUrl) URL.revokeObjectURL(state.rehearsalAudioUrl);
  localStorage.removeItem("linelock-state");
  await clearScriptCache();
  location.href = `${location.pathname}?v=reset-${Date.now()}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

els.sampleBtn.addEventListener("click", () => {
  els.scriptInput.value = sampleScript;
  notify("Sample scene loaded. Build rehearsal when ready.");
});
els.pasteModeBtn.addEventListener("click", () => {
  els.scriptInput.focus();
  notify("Paste Mode armed. Drop raw sides into the text bay.");
});
els.parseBtn.addEventListener("click", processScript);
els.fileInput.addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    els.uploadStatus.textContent = `Reading ${file.name}...`;
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      els.scriptInput.value = await extractPdfText(file);
    } else {
      els.scriptInput.value = await file.text();
    }
    els.uploadStatus.textContent = `${file.name} loaded. Build rehearsal when ready.`;
    setStatus("Script text loaded", true);
  } catch (error) {
    els.uploadStatus.textContent = error.message;
    notify(error.message, false);
  }
});
const fileDrop = document.querySelector(".file-drop");
fileDrop.addEventListener("dragover", event => {
  event.preventDefault();
  fileDrop.classList.add("armed");
});
fileDrop.addEventListener("dragleave", () => fileDrop.classList.remove("armed"));
fileDrop.addEventListener("drop", async event => {
  event.preventDefault();
  fileDrop.classList.remove("armed");
  const file = event.dataTransfer.files[0];
  if (!file) return;
  tactile("crunch");
  try {
    els.uploadStatus.textContent = `Feeding ${file.name}...`;
    els.scriptInput.value = file.name.toLowerCase().endsWith(".pdf") ? await extractPdfText(file) : await file.text();
    els.uploadStatus.textContent = `${file.name} cleaned. Build rehearsal when ready.`;
    processScript();
  } catch (error) {
    notify(error.message, false);
  }
});
els.characterSelect.addEventListener("change", event => {
  const previousRole = state.currentCharacter;
  state.currentCharacter = event.target.value;
  if (previousRole && previousRole !== state.currentCharacter && state.readRoles[previousRole] === false) {
    state.readRoles[previousRole] = true;
  }
  state.readRoles[state.currentCharacter] = false;
  notify(`Role set to ${state.currentCharacter}.`);
  setActivePanel("role");
  render();
});
els.readRoleList.addEventListener("change", event => {
  const input = event.target.closest("[data-read-role]");
  if (!input) return;
  state.readRoles[input.dataset.readRole] = input.checked;
  notify(input.checked ? `${input.dataset.readRole} will be read by partner.` : `${input.dataset.readRole} muted for partner.`);
  setActivePanel("partner");
  render();
});
els.beatSelect.addEventListener("change", event => {
  state.selectedBeat = event.target.value;
  state.tapIndex = 0;
  state.focusIndex = 0;
  setActivePanel("chunk");
  render();
});
els.beatTabs.addEventListener("click", event => {
  const tab = event.target.closest("[data-beat]");
  if (!tab) return;
  state.selectedBeat = tab.dataset.beat;
  state.tapIndex = 0;
  state.focusIndex = 0;
  setActivePanel("chunk");
  render();
});
els.trainingSelect.addEventListener("change", event => {
  state.training = event.target.value;
  state.partnerIndex = 0;
  state.focusIndex = 0;
  state.ladderStepPeeks = 0;
  state.ladderComplete = false;
  state.previousView = null;
  setActivePanel("chunk");
  render();
});
els.monologueUnitSelect.addEventListener("change", event => {
  state.monologueUnit = event.target.value;
  state.tapIndex = 0;
  setActivePanel("memory");
  render();
});
els.triggerSelect.addEventListener("change", event => {
  state.trigger = event.target.value;
  setActivePanel("partner");
  render();
});
document.querySelectorAll(".mode").forEach(btn => {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
});
document.querySelectorAll(".preset").forEach(btn => {
  btn.addEventListener("click", () => applyPreset(btn.dataset.preset));
});
document.querySelectorAll("[data-open-panel]").forEach(btn => {
  btn.addEventListener("click", () => setActivePanel(btn.dataset.openPanel));
});
els.searchInput.addEventListener("input", event => {
  state.searchQuery = event.target.value;
  setActivePanel("role");
  render();
});
els.scriptDisplay.addEventListener("click", event => {
  const boundary = event.target.closest("[data-boundary]");
  if (boundary) {
    addBeatAt(boundary.dataset.boundary);
    return;
  }
  const peek = event.target.closest("[data-peek]");
  if (peek) {
    peekLine(peek.dataset.peek);
    return;
  }
  const deleteButton = event.target.closest("[data-delete-line]");
  if (deleteButton) {
    deleteLine(deleteButton.dataset.deleteLine);
    return;
  }
  const readLine = event.target.closest("[data-read-line]");
  if (readLine) {
    const id = Number(readLine.dataset.readLine);
    state.mutedLineIds = readLine.checked
      ? state.mutedLineIds.filter(lineId => lineId !== id)
      : [...new Set([...state.mutedLineIds, id])];
    notify(readLine.checked ? "Cue line enabled for partner." : "Cue line muted for partner.");
    render();
    return;
  }
  const line = event.target.closest(".line");
  if (line) {
    state.focusIndex = Number(line.dataset.local) || 0;
    state.partnerIndex = state.focusIndex;
    render();
  }
});
els.scriptDisplay.addEventListener("change", event => {
  const characterInput = event.target.closest("[data-edit-character]");
  if (characterInput) {
    updateLine(characterInput.dataset.editCharacter, { character: characterInput.value });
    return;
  }
  const textInput = event.target.closest("[data-edit-text]");
  if (textInput) updateLine(textInput.dataset.editText, { text: textInput.value });
});
els.visibilityRange.addEventListener("input", render);
els.blankRange.addEventListener("input", render);
els.sizeRange.addEventListener("input", render);
els.scrollBtn.addEventListener("click", toggleScroll);
els.speakBtn.addEventListener("click", togglePartner);
els.listenBtn.addEventListener("click", () => {
  state.trigger = "voice";
  els.triggerSelect.value = "voice";
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    notify("Voice recognition is not available here. Use Tap or Timed Gap.", false);
    return;
  }
  els.partnerBar.classList.remove("hidden");
  els.partnerStatus.textContent = "Mic test listening. Say a few words.";
  stopRecognition();
  state.recognition = new SpeechRecognition();
  state.recognition.continuous = false;
  state.recognition.interimResults = true;
  state.recognition.onresult = event => {
    const transcript = Array.from(event.results).map(result => result[0].transcript).join(" ");
    els.partnerStatus.textContent = transcript ? `Heard: ${transcript}` : "Listening...";
  };
  state.recognition.onerror = () => {
    els.partnerStatus.textContent = "Mic test could not start. Check browser microphone permission.";
    notify("Mic test could not start. Check browser microphone permission.", false);
  };
  state.recognition.onend = () => {
    state.recognition = null;
  };
  state.recognition.start();
});
els.recordBtn.addEventListener("click", toggleRecording);
els.playbackBtn.addEventListener("click", playBackRecording);
els.refreshVoicesBtn.addEventListener("click", () => {
  refreshVoicesWithHandshake();
  els.partnerBar.classList.remove("hidden");
  els.partnerStatus.textContent = state.voices.length ? `${state.voices.length} voices available` : "Refreshing voices...";
});
els.editModeBtn.addEventListener("click", () => {
  state.editMode = !state.editMode;
  els.editModeBtn.classList.toggle("active", state.editMode);
  notify(state.editMode ? "Edit Mode on. Clean, rewrite, or remove lines." : "Edit Mode off.");
  render();
});
els.prevLineBtn.addEventListener("click", () => moveFocus(-1));
els.nextLineBtn.addEventListener("click", () => moveFocus(1));
els.analyticsBtn.addEventListener("click", showAnalytics);
els.masteredBtn.addEventListener("click", markMastered);
els.chaosBtn.addEventListener("click", toggleChaos);
els.closeAnalyticsBtn.addEventListener("click", () => els.analyticsPanel.classList.add("hidden"));
els.drillBtn.addEventListener("click", practiceTrouble);
els.dashboardDrillBtn.addEventListener("click", () => {
  els.analyticsPanel.classList.add("hidden");
  practiceTrouble();
});
els.dashboardResetBtn.addEventListener("click", resetAll);
els.backFromTroubleBtn.addEventListener("click", backFromTrouble);
els.ladderBackBtn.addEventListener("click", ladderBackStep);
els.ladderFirstBtn.addEventListener("click", ladderFirstStep);
els.addBeatBtn.addEventListener("click", addBeat);
els.clearBeatsBtn.addEventListener("click", clearBeats);
els.restartRunBtn.addEventListener("click", restartRun);
els.slashModeBtn.addEventListener("click", toggleSlashMode);
els.sourceToggleBtn.addEventListener("click", () => {
  state.sourceView = state.sourceView === "script" ? "clean" : state.sourceView === "clean" ? "source" : "script";
  render();
});
els.decayBtn.addEventListener("click", startGhostDecay);
els.tapNextBtn.addEventListener("click", nextTapWord);
els.continueBtn.addEventListener("click", () => {
  if (state.waitingResolver) state.waitingResolver();
  state.waitingResolver = null;
});
els.saveBtn.addEventListener("click", saveState);
els.loadBtn.addEventListener("click", loadState);
els.resetBtn.addEventListener("click", resetAll);
els.exportBtn.addEventListener("click", exportReport);
els.nextActionBtn.addEventListener("click", () => {
  advanceCurrentFlow();
});
async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      els.fullscreenBtn.textContent = "Exit Full Screen";
      document.body.classList.add("fullscreen-mode");
    } else {
      await document.exitFullscreen();
      els.fullscreenBtn.textContent = "Full Screen";
      document.body.classList.remove("fullscreen-mode");
    }
  } catch (_error) {
    notify("Full screen is not available in this browser.", false);
  }
}

els.fullscreenBtn.addEventListener("click", toggleFullscreen);

document.addEventListener("fullscreenchange", () => {
  const active = !!document.fullscreenElement;
  els.fullscreenBtn.textContent = active ? "Exit Full Screen" : "Full Screen";
  document.body.classList.toggle("fullscreen-mode", active);
});
document.addEventListener("keydown", event => {
  if (state.mode === "tap" && (event.code === "Space" || event.code === "Enter")) {
    event.preventDefault();
    nextTapWord();
  }
  if (state.partnerActive && state.trigger === "tap" && event.code === "Space") {
    event.preventDefault();
    if (state.waitingResolver) state.waitingResolver();
    state.waitingResolver = null;
  }
});

document.addEventListener("click", event => {
  if (!state.partnerActive || state.trigger !== "tap" || !state.waitingResolver) return;
  if (event.target.closest("button, select, input, textarea")) return;
  state.waitingResolver();
  state.waitingResolver = null;
});

loadVoices();
if ("speechSynthesis" in window) {
  speechSynthesis.onvoiceschanged = loadVoices;
}

