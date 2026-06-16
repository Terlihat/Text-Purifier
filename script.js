const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const keepSpaces = document.getElementById('keepSpaces');
const keepSymbols = document.getElementById('keepSymbols'); // Fitur Baru
const removeNumbers = document.getElementById('removeNumbers');
const removeEmptyLines = document.getElementById('removeEmptyLines');
const collapseSpaces = document.getElementById('collapseSpaces');
const reverseText = document.getElementById('reverseText');
const caseOptions = document.getElementsByName('textCase');
const findText = document.getElementById('findText');
const replaceText = document.getElementById('replaceText');
const findSymbol = document.getElementById('findSymbol');
const replaceSymbol = document.getElementById('replaceSymbol');
const profanityText = document.getElementById('profanityText');
const charLimitInput = document.getElementById('charLimit');
const presetSelect = document.getElementById('presetSelect');
const autoCopy = document.getElementById('autoCopy');
const truncateBtn = document.getElementById('truncateBtn');
const readTimeEl = document.getElementById('readTime');
const wordDensityList = document.getElementById('wordDensityList');
const historyList = document.getElementById('historyList');
const autosaveBadge = document.getElementById('autosaveBadge');
const fileUpload = document.getElementById('fileUpload');
const transformMode = document.getElementById('transformMode');
const modeStatusBadge = document.getElementById('modeStatusBadge');
const body = document.body;
const themeBtn = document.getElementById('themeBtn');
const micBtn = document.getElementById('micBtn');
const speakBtn = document.getElementById('speakBtn');

let historyArr = JSON.parse(localStorage.getItem('tp_history')) || [];
let currentFontSize = 14;
let autoCopyTimer;
let lastCopiedText = "";

const modeLabels = {
    'none': '', 'b64-enc': '[Mode: Base64 Encode]', 'b64-dec': '[Mode: Base64 Decode]',
    'url-enc': '[Mode: URL Encode]', 'url-dec': '[Mode: URL Decode]',
    'json-min': '[Mode: JSON Minify]', 'json-beau': '[Mode: JSON Beautify]',
    'css-min': '[Mode: CSS Minify]', 'css-beau': '[Mode: CSS Beautify]'
};

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('tp_theme') === 'dark') toggleTheme();
    if (localStorage.getItem('tp_text')) inputText.value = localStorage.getItem('tp_text');
    purifyText();
    renderHistory();
});

const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function changeFontSize(direction) {
    currentFontSize += direction * 2;
    if (currentFontSize < 10) currentFontSize = 10;
    if (currentFontSize > 24) currentFontSize = 24;
    inputText.style.fontSize = currentFontSize + 'px';
    outputText.style.fontSize = currentFontSize + 'px';
}

function applyPreset() {
    const mode = presetSelect.value;
    if (mode === 'cleanall') {
        keepSpaces.checked = true; keepSymbols.checked = false; removeNumbers.checked = true;
        removeEmptyLines.checked = true; collapseSpaces.checked = true;
    } else if (mode === 'keepnum') {
        keepSpaces.checked = true; keepSymbols.checked = true; removeNumbers.checked = false;
        removeEmptyLines.checked = false; collapseSpaces.checked = true;
    } else if (mode === 'stripspaces') {
        keepSpaces.checked = false; keepSymbols.checked = false; removeNumbers.checked = false;
        removeEmptyLines.checked = true; collapseSpaces.checked = false;
    }
    setTransformMode('none'); 
}

function setTransformMode(mode) {
    transformMode.value = mode;
    modeStatusBadge.innerText = modeLabels[mode];
    purifyText();
}

function updateStats(text, charId, wordId) {
    const charCount = text.length;
    const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
    
    const charEl = document.getElementById(charId);
    charEl.innerText = `${charCount} Karakter`;
    document.getElementById(wordId).innerText = `${wordCount} Kata`;

    if (charId === 'outChars') {
        const readingSeconds = Math.ceil(wordCount / 3.3);
        readTimeEl.innerText = readingSeconds > 60 ? `⏱️ ~${Math.ceil(readingSeconds/60)} mnt baca` : `⏱️ ~${readingSeconds} dtk baca`;

        const limit = parseInt(charLimitInput.value);
        if (limit > 0 && charCount > limit) {
            charEl.classList.add('char-limit-warning');
            truncateBtn.style.display = 'inline-flex';
        } else {
            charEl.classList.remove('char-limit-warning');
            truncateBtn.style.display = 'none';
        }
    }
}

function smartTruncate() {
    const limit = parseInt(charLimitInput.value);
    if (!limit || limit <= 0) return;
    let text = outputText.value; 
    if (text.length <= limit) return;

    let truncated = text.substring(0, limit);
    let lastPeriod = truncated.lastIndexOf('.');
    let lastSpace = truncated.lastIndexOf(' ');

    if (lastPeriod > limit * 0.7) truncated = truncated.substring(0, lastPeriod + 1);
    else if (lastSpace > 0) truncated = truncated.substring(0, lastSpace);

    inputText.value = truncated;
    setTransformMode('none');
    alert("Teks dipotong pintar berdasarkan batas! ✂️");
}

function formatCSS(css) {
    let minified = css.replace(/\/\*[\s\S]*?\*\//g, '')
                      .replace(/\s+/g, ' ')
                      .replace(/\s*{\s*/g, '{')
                      .replace(/\s*}\s*/g, '}')
                      .replace(/\s*:\s*/g, ': ')
                      .replace(/\s*;\s*/g, ';')
                      .trim();
    return minified.replace(/{/g, ' {\n    ')
                   .replace(/;/g, ';\n    ')
                   .replace(/}/g, '\n}\n\n')
                   .replace(/\n    \n}/g, '\n}');
}

function purifyText() {
    let text = inputText.value;
    localStorage.setItem('tp_text', text);
    autosaveBadge.style.display = text ? 'inline' : 'none';
    autosaveBadge.innerText = "(Tersimpan ✔)";

    let currentMode = transformMode.value;

    if (currentMode !== "none") {
        try {
            if (currentMode === "b64-enc") text = btoa(unescape(encodeURIComponent(text)));
            else if (currentMode === "b64-dec") text = decodeURIComponent(escape(atob(text)));
            else if (currentMode === "url-enc") text = encodeURIComponent(text);
            else if (currentMode === "url-dec") text = decodeURIComponent(text);
            else if (currentMode === "json-min") text = JSON.stringify(JSON.parse(text));
            else if (currentMode === "json-beau") text = JSON.stringify(JSON.parse(text), null, 4);
            else if (currentMode === "css-min") {
                text = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*{\s*/g, '{').replace(/\s*}\s*/g, '}').replace(/\s*:\s*/g, ':').replace(/\s*;\s*/g, ';').trim();
            }
            else if (currentMode === "css-beau") text = formatCSS(text);
        } catch (e) {
            // Abaikan jika error format dev agar user bisa memperbaiki kodenya
        }
    } 
    else {
        const findStr = findText.value;
        if (findStr) text = text.replace(new RegExp(escapeRegExp(findStr), 'g'), replaceText.value);

        const findSymStr = findSymbol.value;
        if (findSymStr) {
            const cleanSym = escapeRegExp(findSymStr);
            text = text.replace(new RegExp('[' + cleanSym + ']', 'g'), replaceSymbol.value);
        }

        if (removeEmptyLines.checked) text = text.replace(/^\s*[\r\n]/gm, '');

        let regexStr = '[^a-zA-Z';
        if (!removeNumbers.checked) regexStr += '0-9';
        if (keepSpaces.checked) regexStr += '\\s';
        if (keepSymbols.checked) regexStr += '\\p{P}\\p{S}'; // Mempertahankan tanda baca & simbol unik
        regexStr += ']';
        
        // Menggunakan flag 'gu' agar pendeteksian Unicode Property Escape berjalan lancar
        text = text.replace(new RegExp(regexStr, 'gu'), '');

        if (collapseSpaces.checked) text = text.replace(/[ \t]+/g, ' ');

        const profanityStr = profanityText.value;
        if (profanityStr) {
            profanityStr.split(',').map(w => w.trim()).filter(w => w.length > 0).forEach(word => {
                text = text.replace(new RegExp(`\\b${escapeRegExp(word)}\\b`, 'gi'), '*'.repeat(word.length));
            });
        }
    }

    if (reverseText.checked) text = text.split('').reverse().join('');
    let selectedCase = 'normal';
    for (const radio of caseOptions) { if (radio.checked) { selectedCase = radio.value; break; } }
    if (selectedCase === 'upper') text = text.toUpperCase();
    else if (selectedCase === 'lower') text = text.toLowerCase();
    else if (selectedCase === 'title') text = text.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());

    outputText.value = text;

    updateStats(inputText.value, 'srcChars', 'srcWords');
    updateStats(text, 'outChars', 'outWords');
    
    if(currentMode === 'none') updateWordDensity(text);
    else wordDensityList.innerHTML = '<span style="color: var(--text-muted); font-size: 0.85rem;">[Mode Developer] Analisis Kata Dinonaktifkan.</span>';

    if (autoCopy.checked && text.trim() !== '') {
        clearTimeout(autoCopyTimer);
        autoCopyTimer = setTimeout(() => {
            if (lastCopiedText !== text) {
                navigator.clipboard.writeText(text).then(() => {
                    lastCopiedText = text;
                    autosaveBadge.innerText = "(Tersalin Otomatis 📋✔)";
                }).catch(() => {});
            }
        }, 1500); 
    }
}

const allInputs = [inputText, findText, replaceText, findSymbol, replaceSymbol, profanityText, charLimitInput, keepSpaces, keepSymbols, removeNumbers, removeEmptyLines, collapseSpaces, reverseText];
allInputs.forEach(el => el.addEventListener('input', () => {
    if (el === inputText && transformMode.value.startsWith('b64')) setTransformMode('none'); 
    if (el !== presetSelect) presetSelect.value = 'custom';
    purifyText();
}));
caseOptions.forEach(radio => radio.addEventListener('change', () => { purifyText(); }));

function updateWordDensity(text) {
    wordDensityList.innerHTML = '';
    const words = text.toLowerCase().match(/\b[a-zA-Z0-9À-ÿ']+\b/g);
    if (!words || words.length === 0) {
        wordDensityList.innerHTML = '<span style="color: var(--text-muted); font-size: 0.85rem;">Belum ada data.</span>';
        return;
    }
    const freqMap = {};
    words.forEach(word => { if(word.length > 2 && !word.includes('*')) freqMap[word] = (freqMap[word] || 0) + 1; });
    const topFive = Object.keys(freqMap).map(key => [key, freqMap[key]]).sort((a, b) => b[1] - a[1]).slice(0, 5);

    topFive.forEach(([word, count]) => {
        const badge = document.createElement('span');
        badge.className = 'word-badge';
        badge.innerHTML = `${word} <span class="word-count">${count}x</span>`;
        wordDensityList.appendChild(badge);
    });
}

function renderHistory() {
    historyList.innerHTML = '';
    if (historyArr.length === 0) {
        historyList.innerHTML = '<span style="color: var(--text-muted); font-size: 0.85rem;">Belum ada riwayat.</span>';
        return;
    }
    historyArr.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="history-text-preview" onclick="restoreHistory(${index})">${item.text}</div>
            <div class="history-meta">
                <span style="color: var(--text-muted); font-size: 0.75rem;">${item.date}</span>
                <button class="history-btn" onclick="deleteHistory(${index})">❌</button>
            </div>
        `;
        historyList.appendChild(div);
    });
}

function saveToHistory() {
    const text = outputText.value.trim();
    if (!text) return alert("Tidak ada teks untuk disimpan! ❌");
    const date = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    historyArr.unshift({ text, date });
    if (historyArr.length > 5) historyArr.pop();
    localStorage.setItem('tp_history', JSON.stringify(historyArr));
    renderHistory();
    alert("Teks disimpan ke riwayat! 💾");
}

function restoreHistory(index) {
    inputText.value = historyArr[index].text;
    setTransformMode('none');
}

function deleteHistory(index) {
    historyArr.splice(index, 1);
    localStorage.setItem('tp_history', JSON.stringify(historyArr));
    renderHistory();
}

let isListening = false;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition(); recognition.continuous = true; recognition.lang = 'id-ID';
    recognition.onstart = () => { isListening = true; micBtn.innerHTML = '🔴 Rekam'; };
    recognition.onresult = (e) => {
        let currentText = inputText.value;
        const transcript = e.results[e.results.length - 1][0].transcript;
        inputText.value = currentText + (currentText.endsWith(' ') || currentText === '' ? '' : ' ') + transcript;
        setTransformMode('none');
    };
    recognition.onend = () => { if(isListening) recognition.start(); else micBtn.innerHTML = '🎙️ Dikte'; };
} else { micBtn.style.display = 'none'; }

function toggleMic() {
    if(!SpeechRecognition) return alert("Browser tidak support dikte!");
    if(isListening) { isListening = false; recognition.stop(); } else { recognition.start(); }
}

let synth = window.speechSynthesis;
function toggleSpeak() {
    if (!synth) return alert("Browser tidak support Text-to-Speech!");
    if (synth.speaking) { synth.cancel(); speakBtn.innerHTML = '🔊 Dengarkan'; return; }
    if (!outputText.value) return;
    const utterance = new SpeechSynthesisUtterance(outputText.value); utterance.lang = 'id-ID';
    utterance.onend = () => { speakBtn.innerHTML = '🔊 Dengarkan'; };
    speakBtn.innerHTML = '🛑 Berhenti'; synth.speak(utterance);
}

fileUpload.addEventListener('change', function(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) { 
        inputText.value = e.target.result; 
        if(file.name.endsWith('.json')) setTransformMode('json-beau');
        else if(file.name.endsWith('.css')) setTransformMode('css-beau');
        else setTransformMode('none');
    };
    reader.readAsText(file);
});

function downloadText() {
    if (!outputText.value) return;
    let ext = '.txt';
    let currentMode = transformMode.value;
    if (currentMode.includes('json')) ext = '.json';
    if (currentMode.includes('css')) ext = '.css';
    
    const blob = new Blob([outputText.value], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Text_Export${ext}`; a.click();
}

function downloadPDF() {
    if (!outputText.value) return;
    const { jsPDF } = window.jspdf; const doc = new jsPDF();
    const lines = doc.splitTextToSize(outputText.value, 180);
    let cursorY = 20;
    for (let i = 0; i < lines.length; i++) {
        if (cursorY > 280) { doc.addPage(); cursorY = 20; }
        doc.text(lines[i], 15, cursorY); cursorY += 7;
    }
    doc.save("Dokumen_Clean.pdf");
}

function clearText() {
    inputText.value = ''; outputText.value = ''; findText.value = ''; replaceText.value = '';
    findSymbol.value = ''; replaceSymbol.value = ''; profanityText.value = ''; charLimitInput.value = '';
    presetSelect.value = 'custom';
    if (isListening) toggleMic(); if (synth && synth.speaking) synth.cancel();
    setTransformMode('none');
}

function copyText() {
    if (!outputText.value) return;
    navigator.clipboard.writeText(outputText.value).then(() => alert("Data Berhasil Disalin! ✅"));
}

function toggleTheme() {
    const isLight = body.getAttribute('data-theme') === 'light';
    body.setAttribute('data-theme', isLight ? 'dark' : 'light');
    themeBtn.innerHTML = isLight ? '☀️ Light' : '🌙 Dark';
    localStorage.setItem('tp_theme', isLight ? 'dark' : 'light');
}
