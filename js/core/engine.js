/* =====================================================================
   ENGINE
   Drives navigation through a course's beats and builds the home screen.
   Everything it needs is pulled from the registry (App), so new courses
   light up automatically with no edits here.
   ===================================================================== */
const DECKS = App.buildDecks();
const RENDER = App.buildRender();

let idx = 0, autoTimer = null, deckKey = 'network';
const sceneEl = document.getElementById('scene');

const uniqueChapters = (beats) => [...new Set(beats.map((b) => b.ch))];

let BEATS = DECKS[deckKey];
let chapters = uniqueChapters(BEATS);

function setDeck(key) { deckKey = key; BEATS = DECKS[key]; chapters = uniqueChapters(BEATS); buildSegs(); }

function buildSegs() {
  const segs = document.getElementById('segs');
  segs.innerHTML = '';
  chapters.forEach(() => { segs.innerHTML += '<div class="seg"><div class="fill"></div></div>'; });
}

function render() {
  const b = BEATS[idx];
  const fn = RENDER[b.scene];
  const art = fn(b.sub);
  sceneEl.innerHTML = art + `<div class="narr">
      <h2 class="ttl">${b.ttl}</h2><p class="txt">${b.txt}</p></div>`;
  const cur = App.getCourse(deckKey);
  document.getElementById('chapterChip').textContent = (cur && cur.section === 'network' ? 'Chapter ' : '') + b.ch;
  document.getElementById('count').textContent = (idx + 1) + ' / ' + BEATS.length;
  const curCh = chapters.indexOf(b.ch);
  document.querySelectorAll('.seg').forEach((s, i) => {
    s.classList.toggle('done', i < curCh);
    s.classList.toggle('cur', i === curCh);
  });
  document.getElementById('back').disabled = idx === 0;
  document.getElementById('next').disabled = idx === BEATS.length - 1;
  document.getElementById('next').textContent = idx === BEATS.length - 1 ? 'The End' : 'Next →';
}

function next() { if (idx < BEATS.length - 1) { idx++; render(); } else stopAuto(); }
function back() { if (idx > 0) { idx--; render(); } }
function restart() { idx = 0; render(); }

function startAuto() { stopAuto(); autoTimer = setInterval(() => { if (idx < BEATS.length - 1) next(); else stopAuto(); }, 4200); }
function stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } document.getElementById('auto').checked = false; }

document.getElementById('next').onclick = () => { stopAuto(); next(); };
document.getElementById('back').onclick = () => { stopAuto(); back(); };
document.getElementById('restart').onclick = () => { stopAuto(); restart(); };
document.getElementById('auto').onchange = (e) => { e.target.checked ? startAuto() : stopAuto(); };
document.addEventListener('keydown', (e) => {
  if (document.body.classList.contains('on-home')) {
    if (e.code === 'Enter') { e.preventDefault(); scrollToTopics(); }
    return;
  }
  if (e.code === 'ArrowRight' || e.code === 'Space') { e.preventDefault(); stopAuto(); next(); }
  else if (e.code === 'ArrowLeft') { stopAuto(); back(); }
  else if (e.key.toLowerCase() === 'r') { stopAuto(); restart(); }
  else if (e.key.toLowerCase() === 'h') { stopAuto(); showHome(); }
});

/* ----- home / landing screen (built from the registry) ----- */
function chapterIndex(beats) {
  const map = {};
  beats.forEach((b, i) => { if (!(b.ch in map)) map[b.ch] = { first: i, count: 0 }; map[b.ch].count++; });
  return map;
}
function cardHtml(num, icon, color, title, blurb, steps, deck, first) {
  return `<div class="homecard" style="border-top-color:${color}" data-deck="${deck}" data-i="${first}">
     <div class="hc-top"><span class="hc-num" style="background:${color}">${num}</span><span class="hc-ic">${icon}</span></div>
     <div class="hc-title">${title}</div>
     <div class="hc-blurb">${blurb}</div>
     <div class="hc-steps">${steps} step${steps > 1 ? 's' : ''} →</div>
   </div>`;
}
function gridFor(html) { return `<div class="home-grid">${html}</div>`; }
const stripTags = (s) => s.replace(/<[^>]+>/g, '');

// a single high-level card representing a whole topic (opens its overview page)
function topicCardHtml(course, num) {
  const card = course.card || { icon: '•', color: '#4c6ef5', title: course.title || course.key, blurb: '' };
  const chs = uniqueChapters(course.beats).length;
  return `<div class="homecard" style="border-top-color:${card.color}" data-overview="${course.key}">
     <div class="hc-top"><span class="hc-num" style="background:${card.color}">${num}</span><span class="hc-ic">${card.icon}</span></div>
     <div class="hc-title">${card.title}</div>
     <div class="hc-blurb">${card.blurb}</div>
     <div class="hc-steps">${chs} chapters →</div>
   </div>`;
}

// one card per chapter inside a topic overview page
function chapterCardsHtml(course) {
  const info = chapterIndex(course.beats), chs = uniqueChapters(course.beats);
  return chs.map((ch, i) => {
    const meta = (course.chapterMeta && course.chapterMeta[ch]) || null;
    const parts = ch.split(' · ');
    const num = meta ? parts[0] : String(i + 1).padStart(2, '0');
    const title = parts.slice(1).join(' · ') || ch;
    const icon = (meta && meta.icon) || (course.card && course.card.icon) || '•';
    const color = (meta && meta.color) || (course.card && course.card.color) || '#4c6ef5';
    let blurb = meta && meta.blurb;
    if (!blurb) blurb = stripTags(course.beats[info[ch].first].txt).slice(0, 96) + '…';
    return cardHtml(num, icon, color, title, blurb, info[ch].count, course.key, info[ch].first);
  }).join('');
}

function buildHome() {
  const body = document.getElementById('homeBody');
  let html = '';

  const netCourses = App.coursesInSection('network');
  if (netCourses.length) {
    html += `<div class="sec-h"><h2>🌐 Networking</h2><p>How the internet actually moves your data.</p></div>`;
    html += gridFor(netCourses.map((c, i) => topicCardHtml(c, String(i + 1).padStart(2, '0'))).join(''));
  }

  const sdCourses = App.coursesInSection('systemdesign');
  if (sdCourses.length) {
    html += `<div class="sec-h"><h2>🏗️ System Design</h2><p>The building blocks of large-scale systems — each taught as a story.</p></div>`;
    html += gridFor(sdCourses.map((c, i) => topicCardHtml(c, c.card.num || String(i + 1).padStart(2, '0'))).join(''));
  }

  body.innerHTML = html;
  body.querySelectorAll('.homecard[data-overview]').forEach((c) =>
    c.onclick = () => showOverview(c.dataset.overview));

  const topicCount = netCourses.length + sdCourses.length;
  document.getElementById('homeFoot').textContent =
    `A growing library — ${topicCount} topic${topicCount !== 1 ? 's' : ''} so far · more on the way`;
}

// ---- topic overview page (chapters of one topic) ----
function buildOverview(key) {
  const course = App.getCourse(key);
  if (!course) return;
  const card = course.card || { icon: '•', color: '#4c6ef5', title: course.title || key, blurb: '' };
  const chs = uniqueChapters(course.beats).length;
  const body = document.getElementById('overviewBody');
  body.innerHTML = `
    <button class="btn ovr-back" id="ovrBack">← All topics</button>
    <div class="ovr-hero">
      <div class="ovr-ic" style="background:${card.color}22;color:${card.color}">${card.icon}</div>
      <h1>${card.title}</h1>
      <p>${card.blurb}</p>
      <div class="ovr-meta">📖 ${chs} chapters · ${course.beats.length} steps</div>
      <button class="btn primary big" id="ovrStart">▶ Start from the beginning</button>
    </div>
    <div class="sec-h"><h2>Chapters</h2><p>Jump straight to any part of the story</p></div>
    ${gridFor(chapterCardsHtml(course))}`;

  document.getElementById('ovrBack').onclick = showHome;
  document.getElementById('ovrStart').onclick = () => enterStory(key, 0);
  body.querySelectorAll('.homecard[data-deck]').forEach((c) =>
    c.onclick = () => enterStory(c.dataset.deck, +c.dataset.i));
}

function setMode(mode) {
  document.body.classList.toggle('on-home', mode === 'home');
  document.body.classList.toggle('on-overview', mode === 'overview');
}
function showHome() { stopAuto(); setMode('home'); }
function showOverview(key) {
  stopAuto(); buildOverview(key); setMode('overview');
  const ov = document.getElementById('overview'); if (ov) ov.scrollTop = 0;
}
function enterStory(deck, i) {
  if (deck) setDeck(deck);
  setMode('story');
  idx = i;
  render();
  const stage = document.getElementById('stage');
  if (stage) stage.scrollTop = 0;
}

function scrollToTopics() {
  const el = document.getElementById('homeBody');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
document.getElementById('startBtn').onclick = scrollToTopics;
document.getElementById('homeBtn').onclick = () => showHome();

buildSegs();
buildHome();
showHome();
