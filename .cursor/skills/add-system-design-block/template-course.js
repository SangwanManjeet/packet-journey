/* =====================================================================
   COURSE · <Block Name>  (section: system-design)
   Copy this file to js/courses/<block>.js, rename the identifiers, fill in
   the story, then add a <script src> for it in index.html before engine.js.
   Story arc: problem -> solution -> how -> variants -> pros/cons -> gotchas.
   ===================================================================== */

/* ----- the story beats (the narration script) ----- */
const TEMPLATE_BEATS = [
  { ch:'Block · Why?', scene:'tplProblem', ttl:'The pain we are solving',
    txt:'Open with a relatable problem the reader has felt. Make them <b>want</b> the solution before you name it.' },

  { ch:'Block · Idea', scene:'tplSolution', ttl:'Enter the &lt;Block&gt;',
    txt:'Name the building block and give the one-line mental model — an analogy works great (a traffic cop, a phone book, a notebook).' },

  { ch:'Block · How', scene:'tplHow', ttl:'How it actually works',
    txt:'Walk through the core mechanism. Use a numbered/visual flow so it sticks.' },

  { ch:'Block · Trade-offs', scene:'tplProsCons', ttl:'Advantages &amp; disadvantages',
    txt:'Nothing is free. Here is the honest balance sheet to weigh before reaching for it.' },

  { ch:'Block · Gotcha', scene:'tplGotcha', ttl:'The classic gotcha',
    txt:'End with the twist — the failure mode or "now X is the bottleneck" lesson people learn the hard way.' },
];

/* ----- scene renderers (the visuals) — return HTML wrapped in .art ----- */
function rTplProblem(){
  return `<div class="art">${chainHtml(
    [{icon:'👤',nm:'Users'},{icon:'🖥️',nm:'Your system',sub:'struggling'}],
    1, 0, 'fwd', 'too much load', ''
  )}</div>`;
}

function rTplSolution(){
  return `<div class="art" style="gap:20px">
    ${infoCard('🧩','&lt;Block&gt;','One-line mental model goes here.')}
  </div>`;
}

function rTplHow(){
  return `<div class="art">${chainHtml(
    [{icon:'👤',nm:'Client'},{icon:'🧩',nm:'<Block>',gl:'#4c6ef5aa'},{icon:'🗄️',nm:'Backend'}],
    1, 0, 'fwd', 'does its job', ''
  )}</div>`;
}

function rTplProsCons(){
  return `<div class="art">${compareHtml(
    {color:'#00b894',icon:'✅',title:'Advantages',sub:'why we add it',
     rows:[['⚡','Concrete benefit one'],['📈','Concrete benefit two']],
     foot:'Usually worth it.'},
    {color:'#ff7675',icon:'⚠️',title:'Disadvantages',sub:'the costs to weigh',
     rows:[['🧩','Concrete cost one'],['💸','Concrete cost two']],
     foot:'Never quite free.'}
  )}</div>`;
}

function rTplGotcha(){
  return `<div class="art" style="gap:16px">
    ${infoCard('⚠️','The gotcha','Describe the failure mode and the standard fix.')}
  </div>`;
}

/* ----- register this building block with the app ----- */
App.registerCourse({
  key: 'template',               // <-- unique key, e.g. 'cache'
  section: 'systemdesign',
  card: {
    icon: '🧩', color: '#a29bfe', title: '<Block Name>',
    blurb: 'One-sentence summary shown on the home card.',
  },
  beats: TEMPLATE_BEATS,
  scenes: {
    tplProblem: rTplProblem,
    tplSolution: rTplSolution,
    tplHow: rTplHow,
    tplProsCons: rTplProsCons,
    tplGotcha: rTplGotcha,
  },
});
