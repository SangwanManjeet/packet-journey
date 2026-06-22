# Reference — architecture, data shapes & helper API

## Project layout

```
index.html              # shell: progress bar, home, stage, nav + <script> includes
styles/main.css         # all CSS + animation @keyframes (design tokens in :root)
js/core/registry.js     # window.App — registerCourse + buildDecks/buildRender
js/core/helpers.js      # shared, course-agnostic render helpers
js/core/engine.js       # navigation + home screen (built from the registry)
js/courses/<topic>.js   # ONE self-contained course per topic (beats + scenes + register)
test.mjs                # node smoke test: renders every beat of every course
```

Script load order (in `index.html`) matters: `registry.js` → `helpers.js` → course files → `engine.js`. Courses are plain classic scripts sharing one global scope (works via `file://` and GitHub Pages, no build step).

## Course object (passed to `App.registerCourse`)

```js
{
  key:        'cache',              // unique id, also the "deck" key
  section:    'systemdesign',       // 'systemdesign' (one card) | 'network' (a card per chapter)
  title:      'Caching',            // optional human title
  beats:      [ /* Beat[] */ ],     // the ordered story script
  scenes:     { sceneKey: fn },     // every scene key used by beats -> renderer
  card:       { icon, color, title, blurb, num? },  // system-design card (num auto-assigned if omitted)
  chapterMeta:{ 'Chapter label': { icon, color, blurb } }, // network-style only: a card per chapter
}
```

## Beat object

```js
{
  ch:   'Cache · Why?',   // chapter label (groups beats; drives the progress segments)
  scene:'cacheProblem',   // key into scenes map
  sub:   0,               // optional 0-based step for multi-step scenes
  ttl:  'Title (HTML)',   // shown big above narration
  txt:  'Narration (HTML)'// 2–4 sentences; <b>, <i>, <span class="hl">, <span class="mono">
}
```

The engine renders `scenes[scene](sub)` then appends `<div class="narr"><h2 class="ttl">ttl</h2><p class="txt">txt</p></div>`.

## Shared helpers (js/core/helpers.js)

### `chainHtml(nodes, activeIdx, activeConn, connDir, msg, msgKind)`
A horizontal row of avatar nodes with an animated beam on the active connection.
- `nodes`: `[{ icon, nm, sub?, gl? }]` — `gl` is a glow color for the active node.
- `activeIdx`: index of the highlighted node (`-1` for none).
- `activeConn`: index of the connection to animate (`-1` for none).
- `connDir`: `'fwd'` | `'back'` (beam direction).
- `msg`, `msgKind`: optional speech bubble on the active node; `msgKind:'ans'` makes it green.

### `compareHtml(L, R)`  ← use for every pros/cons & "X vs Y" scene
Two side-by-side cards with a "VS" divider. Each side:
```js
{ color:'#00b894', icon:'✅', title:'Advantages', sub:'subtitle',
  rows:[['⚡','short point'], ['📉','another point']], foot:'optional footnote' }
```

### `infoCard(icon, title, text)`
A small labelled card. Combine several inside a flex row for "key facts".

### `colorN(n)` / OSI palette
`colorN(1..7)` returns the CSS variable color for OSI layers (`--l1`..`--l7`). Network-specific helpers `ringStack`/`sideCard`/`LYR` live in `js/courses/network.js`.

## Returning visuals

Wrap the visual in `.art` (centers and sizes it within the stage):
```js
function rThing(sub){ return `<div class="art" style="gap:20px"> …visual… </div>`; }
```
Multi-step scenes branch on `sub`:
```js
function rThing(sub){
  let extra='';
  if(sub===0){ /* … */ }
  if(sub===1){ /* … */ }
  return `<div class="art">…${extra}</div>`;
}
```

## Design tokens (styles/main.css `:root`)

`--bg --panel --panel2 --line --text --muted --accent` and OSI layer colors `--l1..--l7`.
Pick a distinct `card.color` per building block for its accent.
