// Color mappings for puzzle groups
const COLOR_MAP = {purple:'#9c27b0', blue:'#4da3ff', green:'#4caf50', yellow:'#ffca28'};
const COLOR_EMOJI = {purple:'🟪', blue:'🟦', green:'🟩', yellow:'🟨'};
const COLOR_REVERSE = {'#9c27b0':'purple', '#4da3ff':'blue', '#4caf50':'green', '#ffca28':'yellow'};

/**
 * Shorthand for document.querySelector
 * @param {string} s - CSS selector
 * @param {Element} r - Root element to search from (defaults to document)
 * @returns {Element|null} The first matching element
 */
const $ = (s, r=document) => r.querySelector(s);

/**
 * Shorthand for document.querySelectorAll, returns array instead of NodeList
 * @param {string} s - CSS selector
 * @param {Element} r - Root element to search from (defaults to document)
 * @returns {Array<Element>} Array of matching elements
 */
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

/**
 * Fisher-Yates shuffle algorithm to randomize array order
 * @param {Array} a - Array to shuffle
 * @returns {Array} Shuffled copy of the array
 */
const shuffle = a => a.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(p => p[1]);

/**
 * Display a temporary toast notification message at the bottom of the screen
 * @param {string} m - Message to display
 * @param {number} ms - Duration in milliseconds (default 1400ms)
 */
const toast = (m, ms=1400) => {
  const t = $('#toast');
  t.textContent = m;
  t.style.display = 'block';
  clearTimeout(t._h);
  t._h = setTimeout(() => t.style.display = 'none', ms);
};

// LocalStorage key prefix for saved game state
const STORAGE_PREFIX = 'connections.v2.';

// Current puzzle index in the allPuzzles array
let currentIndex = 0;

// Array of all available puzzles
let allPuzzles = [];

// Game state for the current puzzle
const state = {
  data: null,           // Normalized puzzle data
  id: null,             // Puzzle ID (e.g., 'p1', 'p2')
  order: [],            // Shuffled order of word indices
  selection: new Set(), // Currently selected word indices
  found: [],            // Array of solved groups
  mistakes: 0,          // Number of incorrect guesses
  mistakesLog: [],      // History of incorrect guesses
  guesses: [],          // All guesses made (for results display)
  locked: false,        // True when puzzle is complete (solved or failed)
  failed: false         // True when player used all 4 mistakes
};

// Maximum number of mistakes allowed before game over
const MAX_MISTAKES = 4;

/* ---------- Screens ---------- */

/**
 * Show the intro/welcome screen with Christmas tree
 * Hides all other screens, shows welcome message and tree
 */
function showIntro() {
  $('#introScreen').hidden = false;
  $('#homeScreen').hidden = true;
  $('#gameScreen').hidden = true;
  $('#resultsScreen').hidden = true;
  $('#homeBtn').disabled = true;
  $('#resetBtn').disabled = true;
  $('#actionbar').style.display = 'none';
  $('#logo').textContent = '🔗 Laura\'s Connections';
  renderChristmasTree();
}

/**
 * Show the home screen with puzzle selector grid
 * Hides game and results screens, disables nav buttons, updates logo
 */
function showHome() {
  $('#introScreen').hidden = true;
  $('#homeScreen').hidden = false;
  $('#gameScreen').hidden = true;
  $('#resultsScreen').hidden = true;
  $('#homeBtn').disabled = true;
  $('#resetBtn').disabled = true;
  $('#actionbar').style.display = 'none';
  $('#logo').textContent = '🔗 Laura\'s Connections';
  renderHome();
}

/**
 * Show the game screen with the puzzle board
 * Hides home and results screens, enables nav buttons, shows action bar, updates logo with puzzle number
 */
function showGame() {
  $('#introScreen').hidden = true;
  $('#homeScreen').hidden = true;
  $('#gameScreen').hidden = false;
  $('#resultsScreen').hidden = true;
  $('#homeBtn').disabled = false;
  $('#resetBtn').disabled = false;
  $('#actionbar').style.display = '';
  $('#logo').textContent = `🔗 Laura's Connections #${currentIndex + 1}`;
  buildBoard();
  updateCongratsDisplay();
}

/**
 * Show the results screen with colored emoji grid of guesses
 * Hides home and game screens, hides action bar
 */
function showResults() {
  $('#introScreen').hidden = true;
  $('#homeScreen').hidden = true;
  $('#gameScreen').hidden = true;
  $('#resultsScreen').hidden = false;
  $('#actionbar').style.display = 'none';
  renderResults();
}

/**
 * Update congratulations/failure message visibility based on game state
 * Shows success banner if solved, failure banner if failed, and results button if game is over
 */
function updateCongratsDisplay() {
  const solved = state.locked && !state.failed;
  $('#congrats').hidden = !solved;
  $('#failure').hidden = !state.failed;
  $('#resultsButtonWrapper').style.display = state.locked ? 'block' : 'none';
}

/* ---------- Home grid ---------- */

/**
 * Get the completion status of a puzzle from localStorage
 * @param {Object} p - Puzzle object with id property
 * @returns {string} 'solved', 'failed', or 'unsolved'
 */
function getPuzzleStatus(p) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + (p.id || ''));
    if (!raw) return 'unsolved';
    const obj = JSON.parse(raw);
    if (obj.locked) {
      if (obj.mistakes >= MAX_MISTAKES) return 'failed';
      if (Array.isArray(obj.found) && obj.found.length === 4) return 'solved';
    }
  } catch(e) {}
  return 'unsolved';
}

/**
 * Convert puzzle status string to emoji symbol
 * @param {string} status - 'solved', 'failed', or 'unsolved'
 * @returns {string} Emoji representing the status (✅, ✖️, or ⬜)
 */
function statusSymbol(status) {
  return status === 'solved' ? '✅' : (status === 'failed' ? '✖️' : '⬜');
}

/**
 * Render the home screen puzzle grid
 * Creates clickable tiles for each puzzle showing status and number
 */
function renderHome() {
  const grid = $('#homeGrid');
  grid.innerHTML = '';
  allPuzzles.forEach((p, i) => {
    const tile = document.createElement('button');
    tile.className = 'tile';
    tile.setAttribute('aria-label', `Open puzzle ${i + 1}`);
    const s = getPuzzleStatus(p);
    tile.innerHTML = `<div class="status">${statusSymbol(s)}</div><div class="num">${i + 1}</div>`;
    tile.onclick = () => {
      currentIndex = i;
      loadPuzzle(allPuzzles[i]);
      showGame();
    };
    grid.appendChild(tile);
  });
}

/**
 * Render a Christmas tree using colored emoji blocks
 * Creates a symmetric tree with green blocks and a yellow star on top
 */
function renderChristmasTree() {
  const tree = $('#christmasTree');
  tree.innerHTML = '';

  // Christmas tree pattern: star on top, then progressively wider rows
  const treePattern = [
    ['🟨'],                           // Star
    ['🟩'],                           // Top of tree
    ['🟩', '🟩', '🟩'],               // Row 2
    ['🟩', '🟩', '🟩', '🟩', '🟩'],   // Row 3
    ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩'], // Row 4
    ['🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩', '🟩'], // Bottom
    ['🟫']                            // Trunk
  ];

  treePattern.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'tree-row';
    rowDiv.textContent = row.join('');
    tree.appendChild(rowDiv);
  });
}

/* ---------- Game ---------- */

/**
 * Get flat array of all words in the current puzzle
 * @returns {Array<string>} All words from all groups
 */
function pool() {
  return state.data.groups.flatMap(g => g.words);
}

/**
 * Build and render the game board
 * Shows solved groups at top, then either remaining cards (if playing) or all unsolved groups (if locked)
 * Manages card selection state and shuffle order
 */
function buildBoard() {
  const b = $('#board');
  b.innerHTML = '';

  // First, render any solved groups at the top
  if (state.found.length > 0) {
    state.found.forEach(g => {
      const wrap = document.createElement('div');
      wrap.className = 'group';
      wrap.style.borderLeftColor = g.color || '#43699e';
      wrap.style.gridColumn = 'span 4';
      wrap.innerHTML = `<div class="title">${escapeHtml(g.category)}</div><div class="words">${g.words.map(escapeHtml).join(' · ')}</div>`;
      b.appendChild(wrap);
    });
  }

  // Then render remaining cards or show all groups if locked
  if (state.locked) {
    const allGroups = state.found.length === 4 ? [] : state.data.groups
      .filter(g => !state.found.some(f => f.category === g.category))
      .map(g => ({
        category: g.category,
        words: [...g.words],
        color: COLOR_MAP[g.color] || g.color
      }));
    allGroups.forEach(g => {
      const wrap = document.createElement('div');
      wrap.className = 'group';
      wrap.style.borderLeftColor = g.color || '#43699e';
      wrap.style.gridColumn = 'span 4';
      wrap.innerHTML = `<div class="title">${escapeHtml(g.category)}</div><div class="words">${g.words.map(escapeHtml).join(' · ')}</div>`;
      b.appendChild(wrap);
    });
  } else {
    const foundWords = new Set(state.found.flatMap(g => g.words));
    const words = pool();
    const activeWords = words.filter(w => !foundWords.has(w));

    if (state.order.length !== activeWords.length) {
      const activeIndices = words
        .map((w, i) => [w, i])
        .filter(pair => !foundWords.has(pair[0]))
        .map(pair => pair[1]);
      state.order = shuffle(activeIndices);
      state.selection.clear();
    }

    state.order.forEach(i => {
      const d = document.createElement('div');
      d.className = 'card';
      d.textContent = words[i];
      if (state.selection.has(i)) d.classList.add('selected');
      d.onclick = () => toggle(i, d);
      b.appendChild(d);
    });
  }

  $('#mistakes b').textContent = `${state.mistakes}/${MAX_MISTAKES}`;
  $('#puzzleId b').textContent = state.id || '-';
  reflectLockedUI();
}

/**
 * Update UI button states based on whether puzzle is locked
 * Disables submit/deselect/shuffle buttons when puzzle is complete
 */
function reflectLockedUI() {
  const disabled = state.locked;
  $('#submitBtn').disabled = disabled;
  $('#deselectBtn').disabled = disabled;
  $('#shuffleBtn').disabled = disabled;
  $('#resetBtn').disabled = false;
}

/**
 * Toggle selection state of a word card
 * @param {number} i - Word index in the pool
 * @param {Element} d - DOM element for the card
 */
function toggle(i, d) {
  if (state.locked) {
    toast('Puzzle is finished.');
    return;
  }
  if (state.selection.has(i)) {
    state.selection.delete(i);
    d.classList.remove('selected');
  } else {
    if (state.selection.size >= 4) {
      toast('Maximum 4 words');
      return;
    }
    state.selection.add(i);
    d.classList.add('selected');
  }
}

/**
 * Submit the current selection of 4 words as a guess
 * Checks for correct match, tracks guess for results, handles win/loss conditions
 * Shows "one away" message if 3 out of 4 words are correct
 */
function submit() {
  if (state.locked) {
    toast('Puzzle is finished.');
    return;
  }
  if (state.selection.size !== 4) {
    toast('Pick exactly 4');
    return;
  }

  const wordsSel = [...state.selection].map(i => pool()[i]);

  // Check if this combination was already tried
  const sortedWords = wordsSel.slice().sort().join(',');
  const alreadyTried = state.mistakesLog.some(entry =>
    entry.words.slice().sort().join(',') === sortedWords
  );
  if (alreadyTried) {
    toast('Already tried that...');
    return;
  }

  const match = state.data.groups.find(g =>
    g.words.every(w => wordsSel.includes(w))
  );

  // Track guess for results visualization
  const guessColors = wordsSel.map(w => {
    const group = state.data.groups.find(g => g.words.includes(w));
    if (!group) return 'gray';
    return group.colorName || COLOR_REVERSE[group.color] || 'gray';
  });
  state.guesses.push({words: wordsSel, colors: guessColors, correct: !!match});

  if (match) {
    state.found.push({
      category: match.category,
      words: [...match.words],
      color: COLOR_MAP[match.color] || match.color
    });
    toast('✅ Correct');
    const foundSet = new Set(match.words);
    const words = pool();
    state.order = state.order.filter(i => !foundSet.has(words[i]));
    state.selection.clear();
    if (state.found.length === 4) {
      toast('🎉 Solved!');
      state.locked = true;
      state.failed = false;
      updateCongratsDisplay();
    }
    buildBoard();
    saveSilently();
  } else {
    const entry = {ts: Date.now(), words: [...wordsSel]};
    state.mistakesLog.push(entry);
    state.mistakes = Math.min(MAX_MISTAKES, state.mistakes + 1);
    $('#mistakes b').textContent = `${state.mistakes}/${MAX_MISTAKES}`;
    const oneAway = state.data.groups.some(g =>
      g.words.filter(w => wordsSel.includes(w)).length === 3
    );
    toast(oneAway ? 'One away...' : '❌ Not a group');
    if (state.mistakes >= MAX_MISTAKES) {
      toast('💥 Max mistakes reached — revealing solution');
      state.failed = true;
      revealAllAndLock();
      updateCongratsDisplay();
    }
    saveSilently();
  }
}

/**
 * Reveal all remaining groups and lock the puzzle (used when max mistakes reached)
 * Adds all unsolved groups to the found array and rebuilds the board
 */
function revealAllAndLock() {
  const foundWords = new Set(state.found.flatMap(g => g.words));
  state.data.groups.forEach(g => {
    if (!g.words.every(w => foundWords.has(w))) {
      state.found.push({
        category: g.category,
        words: [...g.words],
        color: COLOR_MAP[g.color] || g.color
      });
    }
  });
  state.locked = true;
  state.selection.clear();
  buildBoard();
}

/**
 * Clear all selected cards
 * Updates both state and UI to remove all selections
 */
function deselectAll() {
  if (state.locked) {
    toast('Puzzle is finished.');
    return;
  }
  state.selection.clear();
  $$('.card').forEach(c => c.classList.remove('selected'));
}

/**
 * Shuffle the order of cards on the board
 * Re-randomizes the display order of remaining unsolved words
 */
function shuffleBoard() {
  if (state.locked) {
    toast('Puzzle is finished.');
    return;
  }
  state.order = shuffle(state.order);
  buildBoard();
}

/**
 * Save current game state to localStorage without user feedback
 * Serializes all state properties including progress, guesses, and mistakes
 */
function saveSilently() {
  if (!state.id) return;
  const payload = {
    data: state.data,
    id: state.id,
    order: state.order,
    selection: [...state.selection],
    found: state.found,
    mistakes: state.mistakes,
    mistakesLog: state.mistakesLog,
    guesses: state.guesses,
    locked: state.locked,
    failed: state.failed
  };
  localStorage.setItem(STORAGE_PREFIX + state.id, JSON.stringify(payload));
}

/**
 * Restore saved game state from localStorage if it exists
 * Handles backward compatibility for old saves missing colorName or failed properties
 */
function restoreIfAny() {
  if (!state.id) return;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + state.id);
    if (!raw) return;
    const p = JSON.parse(raw);
    state.order = Array.isArray(p.order) ? p.order : state.order;
    state.selection = new Set(Array.isArray(p.selection) ? p.selection : []);
    state.found = Array.isArray(p.found) ? p.found : [];
    state.mistakes = Number.isInteger(p.mistakes) ? p.mistakes : 0;
    state.mistakesLog = Array.isArray(p.mistakesLog) ? p.mistakesLog : [];
    state.guesses = Array.isArray(p.guesses) ? p.guesses : [];
    state.locked = !!p.locked;
    if (p.failed === undefined && state.locked) {
      state.failed = state.mistakes >= MAX_MISTAKES;
    } else {
      state.failed = !!p.failed;
    }
    if (state.data && state.data.groups) {
      state.data.groups.forEach(g => {
        if (!g.colorName && g.color) {
          g.colorName = COLOR_REVERSE[g.color] || g.color;
        }
      });
    }
  } catch(e) {}
}

/**
 * Normalize puzzle data for consistent internal format
 * Uppercases all words, converts color names to hex values, preserves colorName for emoji mapping
 * @param {Object} p - Puzzle object with groups array
 * @returns {Object} Normalized puzzle object
 */
function normalizePuzzle(p) {
  p.groups.forEach(g => {
    g.words = g.words.map(w => String(w).toUpperCase());
    const originalColor = g.color;
    g.colorName = COLOR_MAP[originalColor] ? originalColor : COLOR_REVERSE[originalColor] || originalColor;
    g.color = COLOR_MAP[originalColor] || originalColor;
  });
  return p;
}

/**
 * Load a puzzle and initialize game state
 * Normalizes puzzle data, resets state, attempts to restore progress from localStorage
 * @param {Object} json - Puzzle data with id and groups
 */
function loadPuzzle(json) {
  state.data = normalizePuzzle(json);
  state.id = json.id || Math.random().toString(36).slice(2);
  state.order = [];
  state.selection.clear();
  state.found = [];
  state.mistakes = 0;
  state.mistakesLog = [];
  state.guesses = [];
  state.locked = false;
  state.failed = false;
  restoreIfAny();
  buildBoard();
}

/**
 * Reset the current puzzle to starting state
 * Clears localStorage, resets all state, rebuilds board
 */
function resetPuzzle() {
  if (!state.data) return;
  localStorage.removeItem(STORAGE_PREFIX + state.id);
  state.order = [];
  state.selection.clear();
  state.found = [];
  state.mistakes = 0;
  state.mistakesLog = [];
  state.guesses = [];
  state.locked = false;
  state.failed = false;
  buildBoard();
  updateCongratsDisplay();
  toast('🔄 Puzzle reset!');
}

/* ---------- Results ---------- */

/**
 * Render the results screen with colored emoji grid representing all guesses
 * Groups emoji by color and sorts by frequency for cleaner visualization
 */
function renderResults() {
  const grid = $('#resultsGrid');
  grid.innerHTML = '';
  if (!state.guesses || state.guesses.length === 0) {
    grid.innerHTML = '<p style="color:var(--muted)">No guesses recorded</p>';
    return;
  }
  state.guesses.forEach(guess => {
    const row = document.createElement('div');
    row.className = 'results-row';
    const colorCounts = {};
    guess.colors.forEach(c => {
      const colorName = COLOR_EMOJI[c] ? c : COLOR_REVERSE[c] || c;
      colorCounts[colorName] = (colorCounts[colorName] || 0) + 1;
    });
    const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
    sortedColors.forEach(([color, count]) => {
      for (let i = 0; i < count; i++) {
        row.textContent += COLOR_EMOJI[color] || '⬜';
      }
    });
    grid.appendChild(row);
  });
}

/**
 * Copy results to clipboard as formatted text
 * Generates shareable text with puzzle number, status, mistakes, and emoji grid
 */
function copyResults() {
  const puzzleNum = currentIndex + 1;
  let text = `Laura's Connections #${puzzleNum}\n`;
  if (state.locked && state.found.length === 4) {
    text += 'Solved! ✅\n';
  } else if (state.locked) {
    text += 'Failed ❌\n';
  }
  text += `Mistakes: ${state.mistakes}/${MAX_MISTAKES}\n\n`;
  state.guesses.forEach(guess => {
    const colorCounts = {};
    guess.colors.forEach(c => {
      const colorName = COLOR_EMOJI[c] ? c : COLOR_REVERSE[c] || c;
      colorCounts[colorName] = (colorCounts[colorName] || 0) + 1;
    });
    const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
    sortedColors.forEach(([color, count]) => {
      for (let i = 0; i < count; i++) {
        text += COLOR_EMOJI[color] || '⬜';
      }
    });
    text += '\n';
  });
  navigator.clipboard.writeText(text)
    .then(() => toast('📋 Copied to clipboard!'))
    .catch(() => toast('Failed to copy'));
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} s - String to escape
 * @returns {string} HTML-safe string
 */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[c]));
}

// Embedded puzzles
const SAMPLES = [
  {id:'Puzzle 1', groups:[
    {category:'FALSE FRIENDS (EN WORDS, FR MEANINGS)', color:'purple', words:['LOCATION','LECTURE','SENSIBLE','AGENDA']},
    {category:'FRENCH LOANWORDS IN ENGLISH', color:'blue', words:['CAFÉ','MENU','CHEF','DEPOT']},
    {category:'HOMOGRAPHS ACROSS LANGUAGES', color:'green', words:['CHAT','PAIN','COIN','GIFT']},
    {category:'INTERNATIONAL WORDS', color:'yellow', words:['TAXI','HOTEL','RADIO','PIANO']}
  ]},
  {id:'Puzzle 2', groups:[
    {category:'HOMOPHONES OF NUMBERS', color:'yellow', words:['WON','TOO','FOR','ATE']},
    {category:'WORDS ENDING IN -OUGH', color:'green', words:['THROUGH','THOUGH','ROUGH','COUGH']},
    {category:'SAME /U:/ VOWEL SOUND', color:'blue', words:['BLUE','TRUE','CREW','SHOE']},
    {category:'WORDS WITH SILENT LETTERS', color:'purple', words:['KNIGHT','WRITE','THUMB','LAMB']}
  ]},
  {id:'Puzzle 3', groups:[
    {category:'PERCEPTUAL FREQUENCY SCALES', color:'purple', words:['MEL','BARK','ERB','SEMITONE']},
    {category:'PROSODIC FEATURES', color:'blue', words:['PITCH','STRESS','TONE','DURATION']},
    {category:'SPECTRAL COMPONENTS', color:'green', words:['FORMANT','HARMONIC','CEPSTRUM','SPECTRUM']},
    {category:'MEASUREMENT UNITS', color:'yellow', words:['HERTZ','DECIBEL','FRAME','SAMPLE']}
  ]},
  {id:'Puzzle 4', groups:[
    {category:'MEANS "GIFT" (EN/FR/DE/ES)', color:'purple', words:['GIFT','CADEAU','GESCHENK','REGALO']},
    {category:'MEANS "NAME" (EN/FR/ES/IT)', color:'blue', words:['NAME','NOM','NOMBRE','NOME']},
    {category:'MEANS "WORD" (FR/DE/ES/IT)', color:'green', words:['MOT','WORT','PALABRA','PAROLA']},
    {category:'MEANS "LANGUAGE" (FR/DE/ES/IT)', color:'yellow', words:['LANGUE','SPRACHE','LENGUA','LINGUA']}
  ]},
  {id:'Puzzle 5', groups:[
    {category:'DISTINCTIVE PHONOLOGICAL FEATURES', color:'purple', words:['SONORANT','CONTINUANT','STRIDENT','SIBILANT']},
    {category:'PLACES OF ARTICULATION', color:'blue', words:['LABIAL','DENTAL','VELAR','GLOTTAL']},
    {category:'PHONATION TYPES', color:'green', words:['CREAKY','BREATHY','MODAL','FALSETTO']},
    {category:'SYNTACTIC CONSTITUENTS', color:'yellow', words:['CLAUSE','PHRASE','MORPHEME','LEXEME']}
  ]},
  {id:'Puzzle 6', groups:[
    {category:'TOKENIZATION ALGORITHMS', color:'purple', words:['BPE','WORDPIECE','SENTENCEPIECE','UNIGRAM']},
    {category:'DECODING STRATEGIES', color:'blue', words:['GREEDY','BEAM','SAMPLING','NUCLEUS']},
    {category:'ACOUSTIC FEATURES', color:'green', words:['MFCC','FBANK','SPECTROGRAM','WAVEFORM']},
    {category:'NEURAL ARCHITECTURES', color:'yellow', words:['TRANSFORMER','CONFORMER','LSTM','GRU']}
  ]},
  {id:'Puzzle 7', groups:[
    {category:'MEANS "POTATO" (FR/DE/RU/ES)', color:'purple', words:['POMME DE TERRE','KARTOFFEL','КАРТОФЕЛЬ','PATATA']},
    {category:'MEANS "ORANGE" (FR/DE/RU/ES)', color:'blue', words:['ORANGE','APFELSINE','АПЕЛЬСИН','NARANJA']},
    {category:'MEANS "PINEAPPLE" (FR/DE/RU/ES)', color:'green', words:['ANANAS','ANANAS','АНАНАС','PIÑA']},
    {category:'MEANS "LEMON" (FR/DE/RU/ES)', color:'yellow', words:['CITRON','ZITRONE','ЛИМОН','LIMÓN']}
  ]},
  {id:'Puzzle 8', groups:[
    {category:'PHONOLOGICAL PROCESSES', color:'purple', words:['ASSIMILATION','DISSIMILATION','EPENTHESIS','METATHESIS']},
    {category:'LINGUISTIC TYPOLOGY', color:'blue', words:['AGGLUTINATIVE','FUSIONAL','ISOLATING','POLYSYNTHETIC']},
    {category:'WRITING SYSTEMS', color:'green', words:['ABJAD','ABUGIDA','SYLLABARY','LOGOGRAPHIC']},
    {category:'SPEECH ERRORS', color:'yellow', words:['SPOONERISM','MALAPROPISM','EGGCORN','MONDEGREEN']}
  ]},
  {id:'Puzzle 9', groups:[
    {category:'LOSS FUNCTIONS IN ASR/TTS', color:'purple', words:['CTC','TRANSDUCER','ATTENTION','FOCAL']},
    {category:'DATA AUGMENTATION METHODS', color:'blue', words:['SPECAUGMENT','MIXUP','SPEED','VOLUME']},
    {category:'SPEECH CORPORA', color:'green', words:['LIBRISPEECH','COMMONVOICE','VCTK','LJSPEECH']},
    {category:'EVALUATION METRICS', color:'yellow', words:['WER','MOS','BLEU','PESQ']}
  ]},
  {id:'Puzzle 10', groups:[
    {category:'NEURAL VOCODERS', color:'purple', words:['HIFIGAN','MELGAN','WAVEGLOW','PARALLEL-WAVEGAN']},
    {category:'END-TO-END TTS MODELS', color:'blue', words:['TACOTRON','FASTSPEECH','VITS','GLOWTTS']},
    {category:'SELF-SUPERVISED SPEECH MODELS', color:'green', words:['WAV2VEC','HUBERT','WAVLM','W2V-BERT']},
    {category:'SPEECH SYNTHESIS FEATURES', color:'yellow', words:['PROSODY','SPEAKER','STYLE','EMOTION']}
  ]}
];

/**
 * Export functions and constants for testing
 * Used by test.html to access internal functions without polluting global scope
 * @returns {Object} Object containing all testable functions and constants
 */
window.getTestExports = function() {
  return {
    COLOR_MAP,
    COLOR_EMOJI,
    COLOR_REVERSE,
    shuffle,
    escapeHtml,
    normalizePuzzle,
    statusSymbol,
    state,
    MAX_MISTAKES,
    SAMPLES
  };
};

/**
 * Initialize the game when DOM is ready
 * Sets up event handlers, loads first puzzle, and configures keyboard shortcuts
 * Only runs when game DOM elements are present (not in test environment)
 */
function initializeGame() {
  allPuzzles = SAMPLES;

  // Event handlers
  $('#submitBtn').onclick = submit;
  $('#deselectBtn').onclick = deselectAll;
  $('#shuffleBtn').onclick = () => {
    shuffleBoard();
    saveSilently();
  };
  $('#resetBtn').onclick = resetPuzzle;
  $('#homeBtn').onclick = showHome;
  $('#resultsBtn2').onclick = showResults;
  $('#copyResultsBtn').onclick = copyResults;
  $('#backToGameBtn').onclick = showGame;
  $('#startBtn').onclick = showHome;
  $('#logo').onclick = showIntro;

  // Show intro screen on first load
  showIntro();

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if ($('#gameScreen').hidden) return;
    if (e.key === 'Enter') submit();
    if (e.key === 'Escape') deselectAll();
  });
}

// Only initialize if we have the required DOM elements
if (typeof document !== 'undefined' && document.getElementById('gameScreen')) {
  initializeGame();
}
