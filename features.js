// ==========================================
// ULTIMATE FEATURES SCRIPT - AFGHAN TURK EDITION (DARI)
// ==========================================

let currentTab = 'dictionary';
let currentGrade = 'all';
let currentLetter = 'all';
let bookmarkedWords = JSON.parse(localStorage.getItem('bookmarks')) || [];

let customWords = JSON.parse(localStorage.getItem('customVocab')) || [];
if (typeof vocabularyData !== 'undefined') {
  vocabularyData.unshift(...customWords);
}

let flashcardList = [];
let currentFlashIndex = 0;
let flashcardMode = 'standard';
let selectedFlashGrade = 'all';

let quizConfig = { grade: 'all', difficulty: 'medium', questionCount: 10 };
let quizQuestions = [];
let currentQuizIdx = 0;
let quizScore = 0;
let userAnswersLog = [];

let writeConfig = { grade: 'all' };
let writeQuestions = [];
let currentWriteIdx = 0;
let writeScore = 0;

let speedConfig = { grade: 'all' };
let speedGameScore = 0;
let speedGameWord = null;
let speedGameTimer = null;
let speedGameSeconds = 20;

document.addEventListener('DOMContentLoaded', () => {
  initApp();
  checkDailyStreak();
});

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'click') {
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.start(); osc.stop(ctx.currentTime + 0.04);
    } else if (type === 'correct') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'wrong') {
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(150, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'finished') {
      osc.frequency.setValueAtTime(330, ctx.currentTime);
      osc.frequency.setValueAtTime(220, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(); osc.stop(ctx.currentTime + 0.6);
    }
  } catch(e) {}
}

function triggerConfetti() {
  for (let i = 0; i < 70; i++) {
    const conf = document.createElement('div');
    conf.className = 'confetti-piece';
    conf.style.left = Math.random() * 100 + 'vw';
    conf.style.backgroundColor = ['#16a34a', '#0066cc', '#f59e0b', '#dc2626', '#8b5cf6'][Math.floor(Math.random() * 5)];
    conf.style.animationDuration = (Math.random() * 2 + 1) + 's';
    document.body.appendChild(conf);
    setTimeout(() => conf.remove(), 3000);
  }
}

function checkDailyStreak() {
  const today = new Date().toDateString();
  let streakData = JSON.parse(localStorage.getItem('vocabStreak')) || { lastDate: '', count: 0 };
  if (streakData.lastDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (streakData.lastDate === yesterday) {
      streakData.count++;
    } else if (streakData.lastDate !== today) {
      streakData.count = 1;
    }
    streakData.lastDate = today;
    localStorage.setItem('vocabStreak', JSON.stringify(streakData));
  }
  return streakData.count;
}

function toggleMainHeader(hide) {
  const banner = document.getElementById('mainHeaderBanner');
  const controlsPanel = document.getElementById('controlsPanel');

  if (hide) {
    if (banner) banner.style.display = 'none';
    if (controlsPanel) controlsPanel.style.display = 'none';
  } else {
    if (banner) banner.style.display = '';
    if (controlsPanel) controlsPanel.style.display = '';
  }
}

function initApp() {
  const filterContainer = document.getElementById('filterContainer');
  const alphabetBar = document.getElementById('alphabetBar');
  const searchBox = document.getElementById('searchInput');

  if (filterContainer) filterContainer.style.display = 'flex';
  if (alphabetBar) alphabetBar.style.display = 'flex';
  if (searchBox) searchBox.style.display = 'block';

  setupTabs();
  setupDarkMode();
  setupWordOfTheDay();
  setupCustomizers();
  
  if (typeof vocabularyData !== 'undefined') {
    renderDictionary(vocabularyData);
  }

  if (searchBox) {
    searchBox.addEventListener('input', filterAndSearch);
  }
  
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      playSound('click');
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentGrade = this.getAttribute('data-grade');
      filterAndSearch();
    });
  });

  document.querySelectorAll('.alpha-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      playSound('click');
      document.querySelectorAll('.alpha-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentLetter = this.getAttribute('data-letter');
      filterAndSearch();
    });
  });
}

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.getAttribute('data-tab');
      
      const controlsPanel = document.getElementById('controlsPanel');
      
      document.removeEventListener('keydown', handleFlashcardKeyboard);
      stopMatchTimer();
      stopSpeedGameTimer();
      toggleMainHeader(false);

      if (currentTab === 'dictionary') {
        if (controlsPanel) controlsPanel.style.display = 'block';
        filterAndSearch();
      } else if (currentTab === 'bookmarks') {
        if (controlsPanel) controlsPanel.style.display = 'none';
        renderBookmarks();
      } else if (currentTab === 'quiz') {
        toggleMainHeader(true);
        startMultipleChoiceQuiz();
      } else if (currentTab === 'writeExam') {
        toggleMainHeader(true);
        renderWritingExamSetup();
      } else if (currentTab === 'flashcards') {
        toggleMainHeader(true);
        startFlashcards();
      } else if (currentTab === 'progress') {
        if (controlsPanel) controlsPanel.style.display = 'none';
        renderProgressDashboard();
      } else if (currentTab === 'random') {
        if (controlsPanel) controlsPanel.style.display = 'none';
        renderRandomWord();
      } else if (currentTab === 'match') {
        toggleMainHeader(true);
        startMatchingGame();
      } else if (currentTab === 'speedgame') {
        toggleMainHeader(true);
        renderSpeedGameSetup();
      } else if (currentTab === 'ai') {
        toggleMainHeader(true);
        renderAiTutor();
      } else if (currentTab === 'custom') {
        if (controlsPanel) controlsPanel.style.display = 'none';
        renderCustomWordForm();
      }
    });
  });
}

// Function to handle "جستجو در واژکان" button click from anywhere (including bookmarks)
function focusSearch() {
  playSound('click');
  const dictTabBtn = document.querySelector('[data-tab="dictionary"]');
  if (dictTabBtn) {
    dictTabBtn.click();
  } else {
    returnToMainWeb();
  }
  setTimeout(() => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.focus();
    }
  }, 100);
}

function setupDarkMode() {
  const darkModeBtn = document.getElementById('darkModeToggle');
  const savedTheme = localStorage.getItem('darkMode');
  const isDark = savedTheme === null ? true : savedTheme === 'true';

  if (isDark) {
    document.body.classList.add('dark-mode');
    darkModeBtn.textContent = '☀️';
  } else {
    document.body.classList.remove('dark-mode');
    darkModeBtn.textContent = '🌙';
  }

  darkModeBtn.addEventListener('click', () => {
    playSound('click');
    document.body.classList.toggle('dark-mode');
    const darkModeActive = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', darkModeActive);
    darkModeBtn.textContent = darkModeActive ? '☀️' : '🌙';
  });
}

function setupCustomizers() {
  const fontSelect = document.getElementById('fontSwitcherSelect');
  const sizeSelect = document.getElementById('fontSizeSelect');
  if (!fontSelect || !sizeSelect) return;

  const savedFont = localStorage.getItem('preferredFont') || 'font-vazir';
  document.body.classList.remove('font-vazir', 'font-shabnam', 'font-sahel', 'font-bzar', 'font-mitra', 'font-nastaliq');
  document.body.classList.add(savedFont);
  fontSelect.value = savedFont;

  fontSelect.addEventListener('change', (e) => {
    playSound('click');
    document.body.classList.remove('font-vazir', 'font-shabnam', 'font-sahel', 'font-bzar', 'font-mitra', 'font-nastaliq');
    document.body.classList.add(e.target.value);
    localStorage.setItem('preferredFont', e.target.value);
  });

  const savedSize = localStorage.getItem('preferredSize') || '16';
  document.body.style.fontSize = savedSize + 'px';
  sizeSelect.value = savedSize;

  sizeSelect.addEventListener('change', (e) => {
    playSound('click');
    const newSize = e.target.value;
    document.body.style.fontSize = newSize + 'px';
    localStorage.setItem('preferredSize', newSize);
  });
}

function setupWordOfTheDay() {
  const wotdContainer = document.getElementById('wordOfTheDay');
  const heroTotal = document.getElementById('heroTotalWords');
  if (typeof vocabularyData === 'undefined' || vocabularyData.length === 0) return;

  if (heroTotal) heroTotal.textContent = `+${vocabularyData.length}`;
  
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const wotd = vocabularyData[dayOfYear % vocabularyData.length];
  const streakCount = checkDailyStreak();

  wotdContainer.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
      <span style="font-size: 0.85rem; color: #38bdf8;">🌟 واژه برگزیده امروز</span>
      <span style="display: inline-flex; align-items: center; gap: 5px; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); padding: 3px 10px; border-radius: 999px; font-size: 0.8rem;">
        <img src="Streak.png" alt="زنجیره" class="wotd-icon"> زنجیره: ${streakCount} روز
      </span>
    </div>
    <div style="font-size: 1.5rem; font-weight: 800; color: var(--heading-color); margin-top: 4px;">
      ${wotd.word} <span style="font-size: 0.8rem; font-weight: 600; color: #38bdf8;">(صنف ${wotd.grade})</span>
    </div>
    <div style="color: var(--text-muted); font-size: 0.95rem;">
      معنی: <strong style="color: var(--text-color);">${wotd.meaning}</strong>
    </div>
  `;
}

function toggleBookmark(wordItem) {
  playSound('click');
  const index = bookmarkedWords.findIndex(item => item.word === wordItem.word);
  if (index > -1) {
    bookmarkedWords.splice(index, 1);
  } else {
    bookmarkedWords.push(wordItem);
  }
  localStorage.setItem('bookmarks', JSON.stringify(bookmarkedWords));
  
  if (currentTab === 'dictionary') filterAndSearch();
  else if (currentTab === 'bookmarks') renderBookmarks();
}

function renderBookmarks() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  listContainer.innerHTML = '';
  statsContainer.textContent = `تعداد واژه‌های لغات دلخواه: ${bookmarkedWords.length}`;

  if (bookmarkedWords.length === 0) {
    listContainer.innerHTML = '<div class="no-results">هیچ واژه‌ای در لغات دلخواه ذخیره نشده است.</div>';
    return;
  }

  bookmarkedWords.forEach(item => {
    appendCard(item, listContainer, true, '');
  });
}

function highlightText(text, searchTerm) {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function renderDictionary(words, searchTerm = '') {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  listContainer.innerHTML = '';
  statsContainer.textContent = `تعداد واژه‌های یافته‌شده: ${words.length}`;

  if (words.length === 0) {
    listContainer.innerHTML = '<div class="no-results">هیچ لغتی یافت نشد.</div>';
    return;
  }

  words.forEach(item => {
    const isBookmarked = bookmarkedWords.some(b => b.word === item.word);
    appendCard(item, listContainer, isBookmarked, searchTerm);
  });
}

function appendCard(item, container, isBookmarked, searchTerm) {
  const card = document.createElement('div');
  card.className = 'word-card';
  
  const heartIcon = isBookmarked ? '❤️' : '🤍';
  const itemJson = JSON.stringify(item).replace(/'/g, "&apos;");

  const pos = item.pos || 'اسم/صفت';
  const example = item.example || `مثال ادبی: ${item.word} در متن درس به کار رفته است.`;

  const highlightedWord = highlightText(item.word, searchTerm);
  const highlightedMeaning = highlightText(item.meaning, searchTerm);

  card.innerHTML = `
    <div class="word-info">
      <div class="word-meta">
        <span class="pos-badge">${pos}</span>
        <span class="grade-badge">صنف ${item.grade}</span>
      </div>
      <h3>${highlightedWord}</h3>
      <p>${highlightedMeaning}</p>
      <span class="example-sentence">${example}</span>
    </div>
    <div class="card-actions">
      <button class="action-icon ${isBookmarked ? 'bookmarked' : ''}" title="نشان کردن" onclick='toggleBookmark(${itemJson})'>${heartIcon}</button>
    </div>
  `;
  container.appendChild(card);
}

function filterAndSearch() {
  const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();

  const filtered = vocabularyData.filter(item => {
    const matchesGrade = (currentGrade === 'all' || item.grade == currentGrade);
    const matchesLetter = (currentLetter === 'all' || item.word.startsWith(currentLetter));
    const matchesSearch = item.word.toLowerCase().includes(searchTerm) || 
                          item.meaning.toLowerCase().includes(searchTerm);
    return matchesGrade && matchesLetter && matchesSearch;
  });

  renderDictionary(filtered, searchTerm);
}

function returnToMainWeb() {
  playSound('click');
  toggleMainHeader(false);
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-tab="dictionary"]').classList.add('active');
  currentTab = 'dictionary';
  
  const controlsPanel = document.getElementById('controlsPanel');
  if (controlsPanel) controlsPanel.style.display = 'block';
  filterAndSearch();
}

// WRITING EXAM SECTION
function renderWritingExamSetup() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  statsContainer.textContent = 'تنظیمات امتحان نوشتاری';

  listContainer.innerHTML = `
    <div class="quiz-box">
      <h2>امتحان نوشتاری (تشریحی)</h2>
      <div style="margin-bottom: 20px; text-align: right;">
        <label style="display: block; font-weight: bold; margin-bottom: 5px;">انتخاب صنف:</label>
        <select id="writeGrade" class="search-box" style="margin-bottom: 0;">
          <option value="all">تمام صنوف (۷ الی ۱۲)</option>
          <option value="7">صنف ۷</option><option value="8">صنف ۸</option><option value="9">صنف ۹</option>
          <option value="10">صنف ۱۰</option><option value="11">صنف ۱۱</option><option value="12">صنف ۱۲</option>
        </select>
      </div>
      <button class="icon-btn" onclick="startWritingExam()" style="width: 100%; padding: 12px; background: var(--primary); color: white; font-weight: bold; margin-bottom: 12px;">شروع امتحان 🚀</button>
      <button class="icon-btn" onclick="returnToMainWeb()" style="width: 100%; padding: 10px; background: var(--btn-bg); color: var(--text-color); font-weight: bold; border-radius: 8px;">⬅️ بازگشت به صفحه اصلی</button>
    </div>
  `;
}

function startWritingExam() {
  playSound('click');
  writeConfig.grade = document.getElementById('writeGrade').value;

  let pool = vocabularyData;
  if (writeConfig.grade !== 'all') {
    pool = vocabularyData.filter(item => String(item.grade) === String(writeConfig.grade));
  }

  if (pool.length < 5) {
    alert('واژگان کافی برای این صنف موجود نیست.');
    return;
  }

  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  writeQuestions = shuffled.slice(0, 10);
  currentWriteIdx = 0;
  writeScore = 0;

  renderWritingQuestion();
}

function renderWritingQuestion() {
  const listContainer = document.getElementById('wordList');

  if (currentWriteIdx >= writeQuestions.length) {
    const percentage = Math.round((writeScore / writeQuestions.length) * 100);
    if (percentage >= 80) triggerConfetti();

    listContainer.innerHTML = `
      <div class="quiz-box">
        <h2>کارنامه امتحان نوشتاری</h2>
        <p style="font-size: 1.3rem; margin: 15px 0;">نمره شما: <strong>${writeScore} از ${writeQuestions.length}</strong> (${percentage}%)</p>
        <div style="display: flex; flex-direction: column; gap: 10px; justify-content: center;">
          <button class="icon-btn" onclick="renderWritingExamSetup()" style="padding: 10px 20px; background: var(--primary); color: white; font-weight: bold;">تکرار امتحان 🔄</button>
          <button class="icon-btn" onclick="returnToMainWeb()" style="padding: 10px 20px; background: var(--btn-bg); color: var(--text-color); font-weight: bold;">صفحه اصلی 🏠</button>
        </div>
      </div>
    `;
    return;
  }

  const q = writeQuestions[currentWriteIdx];

  listContainer.innerHTML = `
    <div class="quiz-box">
      <div class="quiz-question">معنی کلمه «<span style="color: var(--accent);">${q.word}</span>» (صنف ${q.grade}) را بنویسید:</div>
      
      <form onsubmit="submitWrittenAnswer(event, '${q.meaning.replace(/'/g, "\\'")} ')" style="margin-top: 15px;">
        <input type="text" id="userWrittenInput" class="search-box" required autocomplete="off" placeholder="معنی را اینجا تایپ کنید...">
        <button type="submit" class="icon-btn" style="width: 100%; padding: 12px; background: var(--primary); color: white; font-weight: bold; margin-top: 10px;">تایید پاسخ ✅</button>
      </form>
      <div style="margin-top: 15px;">
        <button class="icon-btn" onclick="returnToMainWeb()" style="width: 100%; padding: 8px; background: var(--btn-bg); color: var(--text-color); font-weight: bold; border-radius: 8px;">⬅️ بازگشت</button>
      </div>
    </div>
  `;
  document.getElementById('userWrittenInput').focus();
}

function submitWrittenAnswer(e, correctMeaning) {
  e.preventDefault();
  const userVal = document.getElementById('userWrittenInput').value.trim().toLowerCase();
  const isCorrect = correctMeaning.toLowerCase().includes(userVal) && userVal.length > 1;

  if (isCorrect) {
    playSound('correct');
    writeScore++;
    alert('پاسخ شما صحیح است! آفرین 🌟');
  } else {
    playSound('wrong');
    alert(`پاسخ نادرست. معنی صحیح: ${correctMeaning}`);
  }

  currentWriteIdx++;
  renderWritingQuestion();
}

// CUSTOM WORD CREATOR
function renderCustomWordForm() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  statsContainer.textContent = 'افزودن واژه شخصی جدید';

  listContainer.innerHTML = `
    <div class="quiz-box">
      <h2>➕ ثبت واژه جدید در فرهنگ لغت</h2>
      <p style="color: var(--btn-color); margin-bottom: 20px;">واژه‌های دلخواه خود را به مجموعه اضافه کنید:</p>
      
      <form id="customWordForm" onsubmit="saveCustomWord(event)">
        <div style="margin-bottom: 15px; text-align: right;">
          <label style="font-weight: bold; display: block; margin-bottom: 5px;">واژه:</label>
          <input type="text" id="customWordInput" class="search-box" required placeholder="مثلاً: دلیر">
        </div>
        <div style="margin-bottom: 15px; text-align: right;">
          <label style="font-weight: bold; display: block; margin-bottom: 5px;">معنی:</label>
          <input type="text" id="customMeaningInput" class="search-box" required placeholder="مثلاً: شجاع">
        </div>
        <div style="margin-bottom: 15px; text-align: right;">
          <label style="font-weight: bold; display: block; margin-bottom: 5px;">صنف:</label>
          <select id="customGradeInput" class="search-box">
            <option value="7">صنف ۷</option><option value="8">صنف ۸</option><option value="9">صنف ۹</option>
            <option value="10">صنف ۱۰</option><option value="11">صنف ۱۱</option><option value="12">صنف ۱۲</option>
          </select>
        </div>
        <div style="margin-bottom: 20px; text-align: right;">
          <label style="font-weight: bold; display: block; margin-bottom: 5px;">مثال (اختیاری):</label>
          <input type="text" id="customExampleInput" class="search-box" placeholder="مثال کاربرد...">
        </div>
        <button type="submit" class="icon-btn" style="width: 100%; padding: 12px; background: var(--primary); color: white; font-weight: bold; margin-bottom: 10px;">ذخیره واژه 💾</button>
        <button type="button" class="icon-btn" onclick="returnToMainWeb()" style="width: 100%; padding: 10px; background: var(--btn-bg); color: var(--text-color); font-weight: bold; border-radius: 8px;">⬅️ بازگشت</button>
      </form>
    </div>
  `;
}

function saveCustomWord(e) {
  e.preventDefault();
  playSound('correct');
  const newWord = {
    word: document.getElementById('customWordInput').value.trim(),
    meaning: document.getElementById('customMeaningInput').value.trim(),
    grade: document.getElementById('customGradeInput').value,
    pos: 'شخصی',
    example: document.getElementById('customExampleInput').value.trim() || 'ثبت شده توسط کاربر'
  };

  customWords.unshift(newWord);
  localStorage.setItem('customVocab', JSON.stringify(customWords));
  vocabularyData.unshift(newWord);

  triggerConfetti();
  alert('واژه جدید با موفقیت افزوده شد!');
  document.getElementById('customWordForm').reset();
}

// MATCHING GAME SECTION (2 CHANCES, NO HEART RESTORATION ON CORRECT MATCH)
let firstSelectedMatch = null;
let matchPairsCount = 0;
let matchTimer = null;
let matchSecondsLeft = 45;
let matchSelectedGrade = 'all';
let matchChances = 2;
let matchMistakesCount = 0;

function startMatchingGame() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  statsContainer.textContent = 'بازی مقایسوی واژگان (دوستونی)';

  listContainer.innerHTML = `
    <div class="quiz-box">
      <h2>🎮 بازی مقایسوی صنف‌بندی‌شده</h2>
      <p style="color: var(--btn-color); margin-bottom: 15px;">صنف مورد نظر خود را انتخاب کنید تا بازی شروع شود:</p>
      
      <div style="margin-bottom: 20px; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
        <button class="filter-btn active" onclick="setMatchGrade('all', this)">همه صنوف</button>
        <button class="filter-btn" onclick="setMatchGrade('7', this)">صنف ۷</button>
        <button class="filter-btn" onclick="setMatchGrade('8', this)">صنف ۸</button>
        <button class="filter-btn" onclick="setMatchGrade('9', this)">صنف ۹</button>
        <button class="filter-btn" onclick="setMatchGrade('10', this)">صنف ۱۰</button>
        <button class="filter-btn" onclick="setMatchGrade('11', this)">صنف ۱۱</button>
        <button class="filter-btn" onclick="setMatchGrade('12', this)">صنف ۱۲</button>
      </div>
      <button class="icon-btn" onclick="initMatchGameSession()" style="width: 100%; padding: 12px; background: var(--primary); color: white; font-weight: bold; margin-bottom: 12px;">شروع بازی 🚀</button>
      <button class="icon-btn" onclick="returnToMainWeb()" style="width: 100%; padding: 10px; background: var(--btn-bg); color: var(--text-color); font-weight: bold; border-radius: 8px;">⬅️ بازگشت</button>
    </div>
  `;
}

function setMatchGrade(grade, btn) {
  playSound('click');
  document.querySelectorAll('.quiz-box .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  matchSelectedGrade = grade;
}

function initMatchGameSession() {
  playSound('click');
  let pool = vocabularyData;
  if (matchSelectedGrade !== 'all') {
    pool = vocabularyData.filter(item => String(item.grade) === String(matchSelectedGrade));
  }

  if (pool.length < 4) {
    alert('واژگان کافی برای این صنف موجود نیست.');
    return;
  }

  const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 4);
  matchPairsCount = shuffled.length;
  firstSelectedMatch = null;
  matchSecondsLeft = 45;
  matchChances = 2;
  matchMistakesCount = 0;

  let wordsColumn = [];
  let meaningsColumn = [];
  shuffled.forEach(item => {
    wordsColumn.push({ text: item.word, id: item.word, type: 'word' });
    meaningsColumn.push({ text: item.meaning, id: item.word, type: 'meaning' });
  });

  wordsColumn.sort(() => 0.5 - Math.random());
  meaningsColumn.sort(() => 0.5 - Math.random());

  const listContainer = document.getElementById('wordList');
  listContainer.innerHTML = `
    <div class="quiz-box">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span id="matchChancesDisplay" style="font-weight: bold; color: var(--danger);">❤️❤️ جان (۲ فرصت)</span>
        <span id="matchMistakeDisplay" style="font-weight: bold; color: var(--danger);">خطاها: 0</span>
        <span id="matchTimerDisplay" style="font-weight: bold; color: var(--accent); font-size: 1.05rem;">⏱️ 45 ثانیه</span>
      </div>

      <div class="game-layout-with-timer">
        <!-- Vertical Timer Bar (Bottom to Top) -->
        <div class="vertical-timer-container" title="تایمر بازی">
          <div id="verticalTimerFill" class="vertical-timer-fill" style="height: 100%;"></div>
        </div>

        <div style="flex-grow: 1;">
          <p style="color: var(--btn-color); margin: 0 0 10px 0; text-align: right;">یک واژه از ستون راست و معنی آن را از ستون چپ انتخاب کنید:</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="display: flex; flex-direction: column; gap: 10px;" id="colWords">
              <div style="font-weight: bold; color: var(--heading-color);">ستون واژگان</div>
              ${wordsColumn.map(w => `<div class="match-card" data-id="${w.id}" data-type="${w.type}" onclick="handleMatchClick(this)">${w.text}</div>`).join('')}
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;" id="colMeanings">
              <div style="font-weight: bold; color: var(--heading-color);">ستون معانی</div>
              ${meaningsColumn.map(m => `<div class="match-card" data-id="${m.id}" data-type="${m.type}" onclick="handleMatchClick(this)">${m.text}</div>`).join('')}
            </div>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 20px;">
        <button class="icon-btn" onclick="returnToMainWeb()" style="width: 100%; padding: 10px; background: var(--btn-bg); color: var(--text-color); font-weight: bold; border-radius: 8px;">⬅️ بازگشت</button>
      </div>
    </div>
  `;

  stopMatchTimer();
  matchTimer = setInterval(() => {
    matchSecondsLeft--;
    const display = document.getElementById('matchTimerDisplay');
    const vFill = document.getElementById('verticalTimerFill');
    if (display) display.textContent = `⏱️ ${matchSecondsLeft} ثانیه`;
    if (vFill) vFill.style.height = `${(matchSecondsLeft / 45) * 100}%`;

    if (matchSecondsLeft <= 0) {
      stopMatchTimer();
      playSound('wrong');
      alert('زمان شما به پایان رسید! دوباره تلاش کنید.');
      initMatchGameSession();
    }
  }, 1000);
}

function stopMatchTimer() {
  if (matchTimer) {
    clearInterval(matchTimer);
    matchTimer = null;
  }
}

function handleMatchClick(cardElement) {
  playSound('click');
  if (cardElement.classList.contains('matched') || cardElement.classList.contains('selected')) return;

  if (!firstSelectedMatch) {
    firstSelectedMatch = cardElement;
    cardElement.classList.add('selected');
  } else {
    const firstId = firstSelectedMatch.getAttribute('data-id');
    const firstType = firstSelectedMatch.getAttribute('data-type');
    const secondId = cardElement.getAttribute('data-id');
    const secondType = cardElement.getAttribute('data-type');

    if (firstType !== secondType && firstId === secondId) {
      playSound('correct');
      firstSelectedMatch.classList.remove('selected');
      firstSelectedMatch.classList.add('matched');
      cardElement.classList.add('matched');
      firstSelectedMatch = null;
      matchPairsCount--;

      if (matchPairsCount === 0) {
        stopMatchTimer();
        triggerConfetti();
        setTimeout(() => {
          alert(`تبریک! شما برنده شدید با ${matchSecondsLeft} ثانیه زمان اضافه! 🌟`);
          initMatchGameSession();
        }, 400);
      }
    } else {
      playSound('wrong');
      matchMistakesCount++;
      matchChances--;

      const cDisp = document.getElementById('matchChancesDisplay');
      const mDisp = document.getElementById('matchMistakeDisplay');
      if (cDisp) cDisp.textContent = matchChances === 1 ? '❤️ جان (۱ فرصت)' : '❌ بدون جان';
      if (mDisp) mDisp.textContent = `خطاها: ${matchMistakesCount}`;

      firstSelectedMatch.classList.remove('selected');
      firstSelectedMatch.classList.add('wrong');
      cardElement.classList.add('wrong');
      const prevSelected = firstSelectedMatch;

      setTimeout(() => {
        prevSelected.classList.remove('wrong');
        cardElement.classList.remove('wrong');
        firstSelectedMatch = null;

        if (matchChances <= 0) {
          stopMatchTimer();
          alert(`شما ۲ اشتباه مرتکب شدید و بازی تمام شد! تعداد کل خطاها: ${matchMistakesCount}`);
          initMatchGameSession();
        }
      }, 600);
    }
  }
}

// SPEED EXAM / GAME SECTION WITH VERTICAL TIMER
function renderSpeedGameSetup() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  statsContainer.textContent = 'تنظیمات مسابقه سرعت';

  listContainer.innerHTML = `
    <div class="quiz-box">
      <h2>⚡ مسابقه سرعت واژگان</h2>
      <div style="margin-bottom: 20px; text-align: right;">
        <label style="display: block; font-weight: bold; margin-bottom: 5px;">انتخاب صنف:</label>
        <select id="speedGrade" class="search-box" style="margin-bottom: 0;">
          <option value="all">تمام صنوف (۷ الی ۱۲)</option>
          <option value="7">صنف ۷</option><option value="8">صنف ۸</option><option value="9">صنف ۹</option>
          <option value="10">صنف ۱۰</option><option value="11">صنف ۱۱</option><option value="12">صنف ۱۲</option>
        </select>
      </div>
      <button class="icon-btn" onclick="startSpeedGame()" style="width: 100%; padding: 12px; background: var(--primary); color: white; font-weight: bold; margin-bottom: 12px;">شروع مسابقه 🚀</button>
      <button class="icon-btn" onclick="returnToMainWeb()" style="width: 100%; padding: 10px; background: var(--btn-bg); color: var(--text-color); font-weight: bold; border-radius: 8px;">⬅️ بازگشت</button>
    </div>
  `;
}

function startSpeedGame() {
  playSound('click');
  speedConfig.grade = document.getElementById('speedGrade') ? document.getElementById('speedGrade').value : 'all';

  let pool = vocabularyData;
  if (speedConfig.grade !== 'all') {
    pool = vocabularyData.filter(item => String(item.grade) === String(speedConfig.grade));
  }

  if (pool.length < 4) {
    alert('واژگان کافی برای این صنف موجود نیست.');
    return;
  }

  speedGameScore = 0;
  nextSpeedQuestion(pool);
}

function nextSpeedQuestion(pool) {
  speedGameWord = pool[Math.floor(Math.random() * pool.length)];
  speedGameSeconds = 20;

  const listContainer = document.getElementById('wordList');
  listContainer.innerHTML = `
    <div class="quiz-box">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span>امتیاز شما: <strong>${speedGameScore}</strong></span>
        <span id="speedTimerText" style="color: var(--danger); font-weight: bold;">⏳ 20 ثانیه</span>
      </div>
      
      <div class="game-layout-with-timer" style="align-items: center;">
        <!-- Vertical Timer Bar (Bottom to Top) -->
        <div class="vertical-timer-container" style="height: 180px;" title="تایمر سرعت">
          <div id="verticalSpeedFill" class="vertical-timer-fill" style="height: 100%;"></div>
        </div>

        <div style="flex-grow: 1; text-align: right;">
          <h3 style="color: var(--heading-color); margin-bottom: 10px;">معنی این کلمه (صنف ${speedGameWord.grade}) را انتخاب کنید:</h3>
          <div style="font-size: 2rem; font-weight: bold; color: var(--accent); margin-bottom: 20px; text-align: center;">${speedGameWord.word}</div>
          <div class="quiz-options" id="speedOptions"></div>
        </div>
      </div>
      
      <div style="margin-top: 20px;">
        <button class="icon-btn" onclick="returnToMainWeb()" style="width: 100%; padding: 8px; background: var(--btn-bg); color: var(--text-color); font-weight: bold; border-radius: 8px;">⬅️ بازگشت به صفحه اصلی</button>
      </div>
    </div>
  `;

  const wrongOptions = pool.filter(item => item.meaning !== speedGameWord.meaning).sort(() => 0.5 - Math.random()).slice(0, 3).map(i => i.meaning);
  const options = [...wrongOptions, speedGameWord.meaning].sort(() => 0.5 - Math.random());

  const optContainer = document.getElementById('speedOptions');
  optContainer.innerHTML = options.map(opt => `<button type="button" class="quiz-option-btn speed-option-btn">${opt}</button>`).join('');

  const optButtons = optContainer.querySelectorAll('.speed-option-btn');
  optButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      if (!speedGameWord) return;
      const selected = this.textContent.trim();
      const correct = speedGameWord.meaning.trim();

      stopSpeedGameTimer();
      optButtons.forEach(b => b.style.pointerEvents = 'none');

      if (selected === correct) {
        playSound('correct');
        speedGameScore += 10;
        this.classList.add('correct');
        setTimeout(() => nextSpeedQuestion(pool), 600);
      } else {
        playSound('wrong');
        this.classList.add('wrong');
        optButtons.forEach(b => { if (b.textContent.trim() === correct) b.classList.add('correct'); });
        setTimeout(() => {
          alert(`پاسخ اشتباه! امتیاز نهایی شما: ${speedGameScore}`);
          renderSpeedGameSetup();
        }, 900);
      }
    });
  });

  stopSpeedGameTimer();
  speedGameTimer = setInterval(() => {
    speedGameSeconds--;
    const tEl = document.getElementById('speedTimerText');
    const fillEl = document.getElementById('verticalSpeedFill');
    
    if (tEl) tEl.textContent = `⏳ ${speedGameSeconds} ثانیه`;
    if (fillEl) fillEl.style.height = `${(speedGameSeconds / 20) * 100}%`;

    if (speedGameSeconds <= 0) {
      stopSpeedGameTimer();
      playSound('finished');
      alert(`زمان تمام شد! امتیاز نهایی شما: ${speedGameScore}`);
      renderSpeedGameSetup();
    }
  }, 1000);
}

function stopSpeedGameTimer() {
  if (speedGameTimer) {
    clearInterval(speedGameTimer);
    speedGameTimer = null;
  }
}

// DARI-SUBJECT RESTRICTED AI TUTOR
function renderAiTutor() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  statsContainer.textContent = 'مشاور هوشمند زبان و ادبیات دری';

  listContainer.innerHTML = `
    <div style="max-width: 750px; margin: auto; width: 100%; display: flex; flex-direction: column; height: 100%;">
      <div class="ai-chat-box">
        <div class="ai-messages" id="aiMessages">
          <div class="ai-msg bot">سلام! من مشاور هوش مصنوعی صنف‌های ۷ الی ۱۲ لیسه افغان ترک هستم. لطفاً فقط سوالات مربوط به **زبان و ادبیات دری** (واژگان، دستور زبان، شعر، شعرا و متون ادبی) بپرسید تا راهنمایی‌تان کنم.</div>
        </div>
        <div class="ai-input-area">
          <input type="text" id="aiUserInput" class="search-box" style="margin-bottom: 0;" placeholder="سوال خود را درباره ادبیات دری بپرسید...">
          <button class="icon-btn" onclick="sendAiMessage()" style="background: var(--primary); color: white; font-weight: bold; padding: 0 20px;">ارسال 📤</button>
        </div>
      </div>
      <div style="margin-top: 10px;">
        <button class="icon-btn" onclick="returnToMainWeb()" style="width: 100%; padding: 8px; background: var(--btn-bg); color: var(--text-color); font-weight: bold; border-radius: 8px;">⬅️ بازگشت به صفحه اصلی</button>
      </div>
    </div>
  `;

  const inputEl = document.getElementById('aiUserInput');
  if (inputEl) {
    inputEl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendAiMessage();
    });
  }
}

async function sendAiMessage() {
  const input = document.getElementById('aiUserInput');
  const msgContainer = document.getElementById('aiMessages');
  const userText = input.value.trim();
  if (!userText) return;

  playSound('click');
  msgContainer.innerHTML += `<div class="ai-msg user">${userText}</div>`;
  input.value = '';
  msgContainer.scrollTop = msgContainer.scrollHeight;

  const lower = userText.toLowerCase();
  const allowedKeywords = ['دری', 'ادبیات', 'شعر', 'کلمه', 'لغت', 'معنی', 'گرامر', 'دستور', 'شاعر', 'صنف', 'بیت', 'مصرع', 'قافیه', 'قصیده', 'غزل', 'متن', 'فرهنگ', 'مولانا', 'حافظ', 'فردوسی', 'بیدل', 'نثر', 'نظم'];
  const isDariRelated = allowedKeywords.some(kw => lower.includes(kw));

  if (!isDariRelated && userText.length > 5) {
    msgContainer.innerHTML += `<div class="ai-msg bot">من فقط مشاور اختصاصی **زبان و ادبیات دری** هستم و به سوالات متفرقه پاسخ نمی‌دهم. لطفاً سوالی مرتبط با دروس دری مطرح کنید!</div>`;
    msgContainer.scrollTop = msgContainer.scrollHeight;
    playSound('wrong');
    return;
  }

  const loadingId = 'ai-loading-' + Date.now();
  msgContainer.innerHTML += `<div class="ai-msg bot" id="${loadingId}">در حال تحلیل ادبی... ✍️</div>`;
  msgContainer.scrollTop = msgContainer.scrollHeight;

  try {
    const prompt = encodeURIComponent(`شما یک مشاور سخت‌گیر و متخصص زبان و ادبیات دری برای مکاتب افغان ترک هستید. به زبان دری روان و دقیق پاسخ دهید: ${userText}`);
    const response = await fetch(`https://text.pollinations.ai/${prompt}`);
    const botReply = await response.text();

    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();

    msgContainer.innerHTML += `<div class="ai-msg bot">${botReply.replace(/\n/g, '<br>')}</div>`;
    playSound('correct');
    msgContainer.scrollTop = msgContainer.scrollHeight;

  } catch (err) {
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();

    msgContainer.innerHTML += `<div class="ai-msg bot">خطا در اتصال به هوش مصنوعی. لطفاً دوباره تلاش کنید.</div>`;
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }
}

// MULTIPLE CHOICE SECTION (4-ANSWER)
function startMultipleChoiceQuiz() { renderQuizSetup(); }
function renderQuizSetup() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  statsContainer.textContent = 'تنظیمات سوالات چهار جوابه';

  listContainer.innerHTML = `
    <div class="quiz-box">
      <h2>تنظیمات آزمون چهار جوابه</h2>
      <div style="margin-bottom: 15px; text-align: right;">
        <label style="display: block; font-weight: bold; margin-bottom: 5px;">انتخاب صنف:</label>
        <select id="quizGrade" class="search-box" style="margin-bottom: 0;">
          <option value="all">تمام صنوف (۷ الی ۱۲)</option>
          <option value="7">صنف ۷</option><option value="8">صنف ۸</option><option value="9">صنف ۹</option>
          <option value="10">صنف ۱۰</option><option value="11">صنف ۱۱</option><option value="12">صنف ۱۲</option>
        </select>
      </div>
      <div style="margin-bottom: 15px; text-align: right;">
        <label style="display: block; font-weight: bold; margin-bottom: 5px;">سطح دشواری:</label>
        <select id="quizDifficulty" class="search-box" style="margin-bottom: 0;">
          <option value="easy">آسان (۴ گزینه ساده)</option>
          <option value="medium" selected>متوسط (ترکیبی)</option>
          <option value="hard">سخت (سوالات صحیح/غلط)</option>
        </select>
      </div>
      <div style="margin-bottom: 25px; text-align: right;">
        <label style="display: block; font-weight: bold; margin-bottom: 5px;">تعداد سوالات:</label>
        <select id="quizCount" class="search-box" style="margin-bottom: 0;">
          <option value="5">۵ سوال</option><option value="10" selected>۱۰ سوال</option><option value="15">۱۵ سوال</option>
        </select>
      </div>
      <button class="icon-btn" onclick="initAdvancedQuiz()" style="width: 100%; padding: 12px; background: var(--primary); color: white; font-weight: bold; margin-bottom: 12px;">شروع آزمون 🚀</button>
      <button class="icon-btn" onclick="returnToMainWeb()" style="width: 100%; padding: 10px; background: var(--btn-bg); color: var(--text-color); font-weight: bold; border-radius: 8px;">⬅️ بازگشت</button>
    </div>
  `;
}

function initAdvancedQuiz() {
  playSound('click');
  quizConfig.grade = document.getElementById('quizGrade').value;
  quizConfig.difficulty = document.getElementById('quizDifficulty').value;
  quizConfig.questionCount = parseInt(document.getElementById('quizCount').value);

  let pool = vocabularyData;
  if (quizConfig.grade !== 'all') {
    pool = vocabularyData.filter(item => String(item.grade) === String(quizConfig.grade));
  }

  if (pool.length < 4) {
    alert('تعداد واژگان این صنف کافی نیست.');
    return;
  }

  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  quizQuestions = shuffled.slice(0, Math.min(quizConfig.questionCount, shuffled.length));
  currentQuizIdx = 0;
  quizScore = 0;
  userAnswersLog = [];

  renderAdvancedQuizQuestion();
}

function renderAdvancedQuizQuestion() {
  const statsContainer = document.getElementById('stats');
  statsContainer.textContent = `سوالات چهار جوابه (سوال ${currentQuizIdx + 1} از ${quizQuestions.length})`;

  if (currentQuizIdx >= quizQuestions.length) {
    renderQuizResults();
    return;
  }

  const q = quizQuestions[currentQuizIdx];
  let isTrueFalse = quizConfig.difficulty === 'hard' && Math.random() > 0.5;
  if (isTrueFalse) renderTrueFalseQuestion(q);
  else renderMultipleChoiceQuestion(q);
}

function renderMultipleChoiceQuestion(q) {
  const listContainer = document.getElementById('wordList');
  const wrongOptions = vocabularyData.filter(item => item.meaning !== q.meaning).sort(() => 0.5 - Math.random()).slice(0, 3).map(item => item.meaning);
  const options = [...wrongOptions, q.meaning].sort(() => 0.5 - Math.random());

  listContainer.innerHTML = `
    <div class="quiz-box">
      <div style="font-size: 0.9rem; color: var(--btn-color); margin-bottom: 8px;">سوال ${currentQuizIdx + 1} از ${quizQuestions.length}</div>
      <div class="quiz-question">معنی صحیح واژه «<span style="color: var(--accent);">${q.word}</span>» چیست؟</div>
      <div class="quiz-options">
        ${options.map(opt => `<button class="quiz-option-btn" onclick="checkAdvancedAnswer(this, '${opt.replace(/'/g, "\\'")}', '${q.meaning.replace(/'/g, "\\'")} ', '${q.word}')">${opt}</button>`).join('')}
      </div>
      <div style="margin-top: 15px;">
        <button class="icon-btn" onclick="returnToMainWeb()" style="width: 100%; padding: 8px; background: var(--btn-bg); color: var(--text-color); font-weight: bold; border-radius: 8px;">⬅️ بازگشت</button>
      </div>
    </div>
  `;
}

function renderTrueFalseQuestion(q) {
  const listContainer = document.getElementById('wordList');
  const isCorrectPair = Math.random() > 0.5;
  
  let wrongCandidates = vocabularyData.filter(item => item.meaning !== q.meaning);
  let randomWrongItem = wrongCandidates[Math.floor(Math.random() * wrongCandidates.length)];
  let displayedMeaning = isCorrectPair ? q.meaning : (randomWrongItem ? randomWrongItem.meaning : 'تعریف نامشخص');

  listContainer.innerHTML = `
    <div class="quiz-box">
      <div style="font-size: 0.9rem; color: var(--btn-color); margin-bottom: 8px;">سوال ${currentQuizIdx + 1} از ${quizQuestions.length} (صحیح/غلط)</div>
      <div class="quiz-question">آیا معنی واژه «<span style="color: var(--accent);">${q.word}</span>» برابر با «<strong>${displayedMeaning}</strong>» است؟</div>
      <div class="quiz-options" style="display: flex; flex-direction: row; gap: 15px; justify-content: center;">
        <button class="quiz-option-btn" style="flex: 1; text-align: center; background: var(--success); color: white; font-weight: bold;" onclick="checkTrueFalseAnswer(this, ${isCorrectPair}, true, '${q.word}', '${q.meaning}')">صحیح ✅</button>
        <button class="quiz-option-btn" style="flex: 1; text-align: center; background: var(--danger); color: white; font-weight: bold;" onclick="checkTrueFalseAnswer(this, ${isCorrectPair}, false, '${q.word}', '${q.meaning}')">غلط ❌</button>
      </div>
      <div style="margin-top: 15px;">
        <button class="icon-btn" onclick="returnToMainWeb()" style="width: 100%; padding: 8px; background: var(--btn-bg); color: var(--text-color); font-weight: bold; border-radius: 8px;">⬅️ بازگشت</button>
      </div>
    </div>
  `;
}

function checkAdvancedAnswer(btn, selected, correct, word) {
  const buttons = document.querySelectorAll('.quiz-option-btn');
  buttons.forEach(b => b.style.pointerEvents = 'none');

  const isCorrect = (selected.trim() === correct.trim());
  if (isCorrect) {
    playSound('correct');
    quizScore++;
    btn.classList.add('correct');
  } else {
    playSound('wrong');
    btn.classList.add('wrong');
    buttons.forEach(b => { if (b.textContent.trim() === correct.trim()) b.classList.add('correct'); });
  }

  userAnswersLog.push({ word, selected, correct, isCorrect });
  setTimeout(() => { currentQuizIdx++; renderAdvancedQuizQuestion(); }, 1200);
}

function checkTrueFalseAnswer(btn, isActualCorrect, userChoice, word, correctMeaning) {
  const buttons = document.querySelectorAll('.quiz-option-btn');
  buttons.forEach(b => b.style.pointerEvents = 'none');

  const isCorrect = (userChoice === isActualCorrect);
  if (isCorrect) { playSound('correct'); quizScore++; btn.style.border = '3px solid #fff'; }
  else { playSound('wrong'); btn.style.opacity = '0.6'; }

  userAnswersLog.push({ word, selected: userChoice ? 'صحیح' : 'غلط', correct: correctMeaning, isCorrect });
  setTimeout(() => { currentQuizIdx++; renderAdvancedQuizQuestion(); }, 1200);
}

function renderQuizResults() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  statsContainer.textContent = 'نتیجه نهایی سوالات چهار جوابه';

  const percentage = Math.round((quizScore / quizQuestions.length) * 100);
  if (percentage >= 80) triggerConfetti();

  let reviewHtml = userAnswersLog.map((log, idx) => `
    <div style="text-align: right; padding: 8px 12px; margin-bottom: 6px; border-radius: 8px; background: ${log.isCorrect ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)'}; border: 1px solid ${log.isCorrect ? 'var(--success)' : 'var(--danger)'};">
      <strong>${idx + 1}. واژه: ${log.word}</strong> — ${log.isCorrect ? '✅ پاسخ درست' : '❌ پاسخ نادرست'}
      <div style="font-size: 0.85rem; color: var(--btn-color);">معنی صحیح: ${log.correct}</div>
    </div>
  `).join('');

  listContainer.innerHTML = `
    <div class="quiz-box" style="max-height: 75vh; overflow-y: auto;">
      <h2>کارنامه سوالات چهار جوابه</h2>
      <p style="font-size: 1.2rem; margin: 10px 0;">نمره شما: <strong>${quizScore} از ${quizQuestions.length}</strong> (${percentage}%)</p>
      <div style="margin-bottom: 20px;">${reviewHtml}</div>
      <div style="display: flex; flex-direction: column; gap: 10px; justify-content: center;">
        <button class="icon-btn" onclick="startMultipleChoiceQuiz()" style="padding: 10px 20px; background: var(--primary); color: white; font-weight: bold;">تکرار آزمون 🔄</button>
        <button class="icon-btn" onclick="returnToMainWeb()" style="padding: 10px 20px; background: var(--btn-bg); color: var(--text-color); font-weight: bold;">صفحه اصلی 🏠</button>
      </div>
    </div>
  `;
}

// FLASHCARDS SECTION
function startFlashcards() { renderFlashcardSetup(); }
function renderFlashcardSetup() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  statsContainer.textContent = 'تنظیمات فلش‌کارت‌های آموزشی';

  listContainer.innerHTML = `
    <div class="quiz-box">
      <h2>🃏 تنظیمات مطالعه با فلش‌کارت</h2>
      <div style="margin-bottom: 15px; text-align: right;">
        <label style="display: block; font-weight: bold; margin-bottom: 5px;">انتخاب صنف:</label>
        <select id="flashGrade" class="search-box" style="margin-bottom: 0;">
          <option value="all">تمام صنوف (۷ الی ۱۲)</option>
          <option value="7">صنف ۷</option><option value="8">صنف ۸</option><option value="9">صنف ۹</option>
          <option value="10">صنف ۱۰</option><option value="11">صنف ۱۱</option><option value="12">صنف ۱۲</option>
        </select>
      </div>
      <div style="margin-bottom: 20px; text-align: right;">
        <label style="display: block; font-weight: bold; margin-bottom: 5px;">حالت نمایش کارت‌ها:</label>
        <select id="flashMode" class="search-box" style="margin-bottom: 0;">
          <option value="standard">استاندارد (روی کارت: واژه | پشت کارت: معنی)</option>
          <option value="reverse">چالش معکوس (روی کارت: معنی | پشت کارت: واژه)</option>
        </select>
      </div>
      <button class="icon-btn" onclick="initAdvancedFlashcards()" style="width: 100%; padding: 12px; background: var(--primary); color: white; font-weight: bold; margin-bottom: 12px;">شروع مطالعه 🚀</button>
      <button class="icon-btn" onclick="returnToMainWeb()" style="width: 100%; padding: 10px; background: var(--btn-bg); color: var(--text-color); font-weight: bold; border-radius: 8px;">⬅️ بازگشت</button>
    </div>
  `;
}

function initAdvancedFlashcards() {
  playSound('click');
  selectedFlashGrade = document.getElementById('flashGrade').value;
  flashcardMode = document.getElementById('flashMode').value;

  let pool = vocabularyData;
  if (selectedFlashGrade !== 'all') {
    pool = vocabularyData.filter(item => String(item.grade) === String(selectedFlashGrade));
  }

  flashcardList = [...pool].sort(() => 0.5 - Math.random());
  currentFlashIndex = 0;

  document.removeEventListener('keydown', handleFlashcardKeyboard);
  document.addEventListener('keydown', handleFlashcardKeyboard);
  renderCurrentFlashcard();
}

function renderCurrentFlashcard() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  
  if (currentFlashIndex >= flashcardList.length) currentFlashIndex = flashcardList.length - 1;
  if (currentFlashIndex < 0) currentFlashIndex = 0;

  const item = flashcardList[currentFlashIndex];
  statsContainer.textContent = `فلش‌کارت (${currentFlashIndex + 1} از ${flashcardList.length})`;

  const frontTitle = flashcardMode === 'standard' ? item.word : item.meaning;
  const backTitle = flashcardMode === 'standard' ? item.meaning : item.word;
  const progressPercent = Math.round(((currentFlashIndex + 1) / flashcardList.length) * 100);

  listContainer.innerHTML = `
    <div class="flashcard-wrapper">
      <div class="flashcard" id="mainFlashcard" onclick="playSound('click'); this.classList.toggle('flipped')">
        <div class="flash-face flash-front">
          <div class="flash-card-top"><span>صنف ${item.grade}</span><span>${currentFlashIndex + 1} / ${flashcardList.length}</span></div>
          <div class="flash-word">${frontTitle}</div>
          <div style="font-size: 0.85rem; opacity: 0.8; margin-top: 15px;">برای دیدن پاسخ کلیک کنید ⟳</div>
        </div>
        <div class="flash-face flash-back">
          <div class="flash-card-top" style="color: var(--btn-color);"><span>${item.pos || 'اسم'}</span><span>صنف ${item.grade}</span></div>
          <div class="flash-meaning">${backTitle}</div>
          <div class="flash-example">${item.example || ''}</div>
        </div>
      </div>

      <div class="flash-controls">
        <button class="learn-btn unknown" onclick="rateFlashcard('unknown', false)">نا آشنا ❌</button>
        <button class="learn-btn review" onclick="rateFlashcard('review', false)">نیازمند مرور ⚠️</button>
        <button class="learn-btn known" onclick="rateFlashcard('known', false)">خواندم ✅</button>
      </div>

      <div style="display: flex; justify-content: space-between; gap: 10px; margin-top: 12px;">
        <button class="icon-btn" onclick="navigateFlashcard(-1)" style="flex: 1; padding: 10px; background: var(--btn-bg); color: var(--text-color); font-weight: bold;">قبلی ⬅️</button>
        <button class="icon-btn" onclick="navigateFlashcard(1)" style="flex: 1; padding: 10px; background: var(--primary); color: white; font-weight: bold;">بعدی ➡️</button>
      </div>

      <div style="margin-top: 10px;">
        <button class="icon-btn" onclick="returnToMainWeb()" style="width: 100%; padding: 8px; background: var(--btn-bg); color: var(--text-color); font-weight: bold; border-radius: 8px;">⬅️ بازگشت به صفحه اصلی</button>
      </div>

      <div class="flash-progress">
        <div class="progress-bar"><div class="progress-fill" style="width: ${progressPercent}%;"></div></div>
      </div>
    </div>
  `;
}

function rateFlashcard(status, autoAdvance = false) {
  playSound('click');
  let progressStats = JSON.parse(localStorage.getItem('vocabProgress')) || { known: 0, review: 0, unknown: 0 };
  if (status === 'known') progressStats.known++;
  else if (status === 'review') progressStats.review++;
  else if (status === 'unknown') progressStats.unknown++;
  
  localStorage.setItem('vocabProgress', JSON.stringify(progressStats));
  alert('وضعیت واژه ثبت شد!');
  
  if (autoAdvance) {
    currentFlashIndex++;
    renderCurrentFlashcard();
  }
}

function navigateFlashcard(direction) {
  playSound('click');
  currentFlashIndex += direction;
  if (currentFlashIndex >= flashcardList.length) {
    triggerConfetti();
    alert('تبریک! تمام فلش‌کارت‌های این مجموعه مرور شد.');
    currentFlashIndex = flashcardList.length - 1;
  }
  if (currentFlashIndex < 0) currentFlashIndex = 0;
  renderCurrentFlashcard();
}

function handleFlashcardKeyboard(e) {
  const card = document.getElementById('mainFlashcard');
  if (!card) return;
  if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); card.classList.toggle('flipped'); }
  else if (e.code === 'ArrowRight') { e.preventDefault(); navigateFlashcard(1); }
  else if (e.code === 'ArrowLeft') { e.preventDefault(); navigateFlashcard(-1); }
}

// PROGRESS DASHBOARD & RANDOM WORD
function renderProgressDashboard() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  statsContainer.textContent = 'داشبورد پیشرفت یادگیری';

  const progressStats = JSON.parse(localStorage.getItem('vocabProgress')) || { known: 0, review: 0, unknown: 0 };
  const bookmarksCount = bookmarkedWords.length;
  const totalVocab = typeof vocabularyData !== 'undefined' ? vocabularyData.length : 0;
  const masteryPercent = totalVocab > 0 ? Math.round((progressStats.known / totalVocab) * 100) : 0;
  const streakCount = checkDailyStreak();

  listContainer.innerHTML = `
    <div class="dashboard" style="max-width: 650px; margin: auto; width: 100%;">
      <h2>آمار کلی یادگیری شما</h2>
      <div class="stat-card">🔥 زنجیره مطالعه فعلی: <strong>${streakCount} روز متوالی</strong></div>
      <div class="stat-card">📚 کل واژگان موجود: <strong>${totalVocab} واژه</strong></div>
      <div class="stat-card">❤️ لغات دلخواه: <strong>${bookmarksCount} واژه</strong></div>
      <div class="stat-card">✅ واژه‌های خوانده شده: <strong style="color: var(--success);">${progressStats.known}</strong></div>
      <h3 style="margin-top: 20px;">درصد تسلط کل</h3>
      <div class="progress-bar"><div class="progress-fill" style="width: ${masteryPercent}%;"></div></div>
      <div style="margin-top: 15px;">
        <button class="icon-btn" onclick="returnToMainWeb()" style="width: 100%; padding: 10px; background: var(--btn-bg); color: var(--text-color); font-weight: bold; border-radius: 8px;">⬅️ بازگشت</button>
      </div>
    </div>
  `;
}

function renderRandomWord() {
  const listContainer = document.getElementById('wordList');
  const statsContainer = document.getElementById('stats');
  statsContainer.textContent = 'واژه تصادفی روز';

  if (typeof vocabularyData === 'undefined' || vocabularyData.length === 0) return;
  const item = vocabularyData[Math.floor(Math.random() * vocabularyData.length)];
  const isBookmarked = bookmarkedWords.some(b => b.word === item.word);

  listContainer.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.style.maxWidth = '650px'; wrapper.style.margin = 'auto'; wrapper.style.width = '100%';
  appendCard(item, wrapper, isBookmarked, '');
  
  wrapper.innerHTML += `
    <div style="text-align: center; margin-top: 20px; display: flex; flex-direction: column; gap: 10px;">
      <button class="icon-btn" onclick="renderRandomWord()" style="padding: 10px 20px; font-weight: bold; width: 100%;">انتخاب واژه دیگر 🎲</button>
      <button class="icon-btn" onclick="returnToMainWeb()" style="padding: 10px; background: var(--btn-bg); color: var(--text-color); font-weight: bold; border-radius: 8px; width: 100%;">⬅️ بازگشت</button>
    </div>
  `;
  listContainer.appendChild(wrapper);
}