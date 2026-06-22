---
name: learning-story-style
description: The storytelling voice, animation, and design conventions for the packet-journey learning app, so new content is easy to follow, memorable, and visually consistent. Use when writing or editing beat narration (ttl/txt), scene visuals, or styles/animations for any course in this project.
---

# Learning Story Style

This app turns networking & system design into **interactive, animated stories**. Every addition should make a concept *easy to follow and hard to forget*. Apply this whenever you write narration or build a scene.

## Voice: tell a story, don't lecture

- **One idea per beat.** Each step teaches a single thing. If a beat needs "and", split it.
- **Hook with a problem or a question.** Titles like *"One server, too many users"* or *"But… what's the router's MAC?"* create curiosity before the answer.
- **Second person, present tense, concrete.** "Your request crosses cables owned by strangers" beats "data is transmitted".
- **Use analogies as anchors.** DNS = the internet's phone book; load balancer = a traffic cop; cache = remembering the answer. Name the analogy once, then reuse it.
- **Ground it with real numbers.** "Mumbai → Virginia is ~230 ms each way", "MTU ≈ 1500 bytes". Specifics make it memorable.
- **Call back to earlier chapters.** "(remember those OSI layers?)", "Anycast announces via BGP (Chapter 10!)". Connections build a mental map.
- **Keep `txt` to 2–4 sentences.** The visual carries half the meaning.

### Highlight markup (inside ttl/txt)
- `<b>…</b>` — the key term being introduced.
- `<span class="hl">…</span>` — a punchy quote or result (warm yellow).
- `<span class="mono">…</span>` / `<b class="mono">` — code, IPs, values.
- `<i>…</i>` — emphasis / rhetorical aside.

## Story arc (use for any topic)

1. **Problem** — make them feel the pain.
2. **Solution** — name it + the one-line mental model.
3. **How it works** — the mechanism, visually.
4. **Variants / choices** — flavours, algorithms, "X vs Y".
5. **Trade-offs** — `compareHtml` Advantages vs Disadvantages (always, for system-design blocks).
6. **Gotcha** — the twist / failure mode people hit in production.

## Animation: motion that explains

Animations should *show the concept moving*, not just decorate. Reuse existing CSS (in `styles/main.css`); add new `@keyframes` there when needed.

- **Travel / flow:** `chainHtml(...)` animates a beam along the active connection (`connDir:'fwd'|'back'`). Use it for anything that moves between nodes (requests, packets, announcements).
- **Reveal in sequence:** stagger with `animation-delay` (see the fibre pulses in `network.js`: `style="animation-delay:${i*0.4}s"`).
- **Build up / wrap:** `ringpop` for encapsulation onions; `pop` / `bounce` for things that appear.
- **Scene entry** is automatic (`.scene` fades in). Keep individual animations short (~0.3–1.1s) and looping ones subtle.
- Animate to clarify state changes (active vs dim nodes, done vs current steps) — `.node.active`, `.node.dim`, `.st.done`, `.seg.cur`.

## Design: stay consistent

- **Dark theme, CSS tokens.** Use `:root` vars — `--bg --panel --panel2 --line --text --muted --accent` — never hardcode the background palette.
- **Per-topic accent.** Give each course a distinct `card.color`; reuse it for that scene's highlights and borders.
- **Wrap visuals in `.art`.** It centers/sizes content in the stage. Add `style="gap:..."` for spacing.
- **Emoji as iconography.** Each node/card gets one clear emoji icon (💻 🧭 🌍 ⚖️ 🗄️). Keep them meaningful and consistent across a course.
- **Reuse components** before inventing: `chainHtml`, `compareHtml`, `infoCard`, and the `.compare` / `.sidecard` / `.tier` patterns already in `styles/main.css`.

## Quick checklist before finishing

```
- [ ] Each beat teaches exactly one idea
- [ ] Title hooks with a problem or question
- [ ] Key term in <b>, the payoff in <span class="hl">
- [ ] At least one analogy and one concrete number
- [ ] The visual moves/changes to mirror the narration
- [ ] System-design topics end with a compareHtml pros/cons scene
- [ ] Colors/emoji are consistent within the course
```
