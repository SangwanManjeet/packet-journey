---
name: add-system-design-block
description: Add a new System Design building block (e.g. caching, databases, message queues, API gateway) to this learning app as a self-contained, animated, story-first course that ends with a pros/cons scene. Use when the user wants to add or extend a system-design topic, building block, or component to the packet-journey project.
---

# Add a System Design Building Block

This project teaches the internet & system design as **interactive, animated stories**. Each topic is a self-contained "course" file that plugs into a registry — no engine edits needed.

Read [reference.md](reference.md) for the full data shapes and the shared helper API. Copy [template-course.js](template-course.js) as your starting point.

## Workflow

```
- [ ] 1. Plan the story arc (problem → solution → how → variants → pros/cons → gotchas)
- [ ] 2. Create js/courses/<block>.js from template-course.js
- [ ] 3. Write the beats (the narration script) in storytelling voice
- [ ] 4. Write the scene renderers (the visuals) reusing shared helpers
- [ ] 5. Add a pros/cons scene with compareHtml  (REQUIRED for every block)
- [ ] 6. Register the course (section: 'systemdesign')
- [ ] 7. Add one <script src> line in index.html before js/core/engine.js
- [ ] 8. Run `node test.mjs` — must report 0 failures
```

## 1. Plan the arc

Every building block follows the same memorable arc (mirrors the Load Balancer course):

1. **The problem** — a relatable pain ("one server, too many users").
2. **The solution** — name the building block, give the one-line mental model.
3. **How it works** — the core mechanism, step by step.
4. **Variants / choices** — the flavours and routing/algorithm options.
5. **Trade-offs** — `compareHtml` Advantages vs Disadvantages. **Always include this.**
6. **Gotchas** — the classic "but now X is the bottleneck" twist.

## 2–3. Beats (the script)

A beat is one user-paced step. Shape: `{ ch, scene, sub?, ttl, txt }`.

```js
{ ch:'Cache · Why?', scene:'cacheProblem', ttl:'The database is melting',
  txt:'Every page hit re-runs the same expensive query. As traffic grows the DB becomes the bottleneck — we keep asking it the <b>same question</b> over and over. What if we remembered the answer?' }
```

- `ch` groups beats into a chapter shown on the progress bar (prefix with the block name, e.g. `Cache · Routing`).
- `scene` is the key of the renderer that draws the visual.
- `sub` (optional) is a 0-based step index for multi-step scenes (reuse one renderer across several beats).
- `ttl` / `txt` are HTML. Follow the **learning-story-style** skill for voice. Highlight with `<b>…</b>` and `<span class="hl">…</span>`.

## 4. Scene renderers (the visuals)

A renderer returns an HTML string wrapped in `.art`. The engine appends the narration automatically.

```js
function rCacheProblem(){
  return `<div class="art">${chainHtml(
    [{icon:'👤',nm:'Users'},{icon:'🖥️',nm:'App'},{icon:'🗄️',nm:'Database',sub:'overloaded'}],
    2, 1, 'fwd', 'same query, again', ''
  )}</div>`;
}
```

Prefer the **shared helpers** before writing custom HTML (see reference.md): `chainHtml`, `compareHtml`, `infoCard`. Add new CSS/animations to `styles/main.css` (see learning-story-style).

## 5. The pros/cons scene (required)

Every block must end with an honest trade-off scene using `compareHtml`:

```js
function rCacheProsCons(){
  return `<div class="art">${compareHtml(
    {color:'#00b894',icon:'✅',title:'Advantages',sub:'why we add a cache',
     rows:[['⚡','Huge latency drop on hot data'],['📉','Sheds load off the database']]},
    {color:'#ff7675',icon:'⚠️',title:'Disadvantages',sub:'the costs to weigh',
     rows:[['🌀','Stale data / invalidation is hard'],['🧩','Another moving part to operate']]}
  )}</div>`;
}
```

## 6. Register

At the bottom of the course file:

```js
App.registerCourse({
  key: 'cache',
  section: 'systemdesign',
  card: { icon:'🗄️', color:'#fdcb6e', title:'Caching',
          blurb:'Remember expensive answers — cache patterns, eviction, invalidation, and the trade-offs.' },
  beats: CACHE_BEATS,
  scenes: { cacheProblem:rCacheProblem, /* …every scene key used in beats… */ cacheProsCons:rCacheProsCons },
});
```

Cards in the System Design section are **auto-numbered** by load order — omit `card.num`.

## 7. Wire it in

Add one line in `index.html`, in the courses block, **before** `js/core/engine.js`:

```html
<script src="js/courses/cache.js"></script>
```

## 8. Verify

```bash
node test.mjs   # loads every course and renders every beat; must print "0 failures"
```

Then open `index.html` (double-click works, or `python3 -m http.server`) and click the new card.

## Rules

- One idea per beat; keep `txt` to 2–4 sentences.
- Every scene's `scene` key must appear in the course's `scenes` map (the test enforces this).
- Reuse existing CSS animation classes; only add new `@keyframes` to `styles/main.css`.
- Never edit `js/core/*` to add a topic — the registry handles it.
