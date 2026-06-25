# CHRONO-PICTURE-CARD — TRANSFER DOCUMENT

Purpose: hand the full working context of this project to a fresh Claude instance.
Read this together with `DEVELOPMENT_RULES.md` and the latest code file before doing anything.

Current version at handoff: **1.0.108** (file: `chrono-picture-card_1.0.108.js`).

---

## 0. READ THE RULES FIRST — THEN INTERNALIZE THIS ONE

`DEVELOPMENT_RULES.md` is binding and non-negotiable. The single most important rule,
and the one most often violated, is **RULE 6: FIX THE CAUSE, NEVER THE CONSEQUENCE.**
No workarounds. No timing hacks, retry loops, defensive flags, or poking values in by
hand. If you do not understand *why* a fix works, you are not allowed to ship it — find
the cause first, verify it (read the actual source, run the actual check), then fix that.

Also non-negotiable: **RULE 2 — there is NO implicit permission to write code, ever.**
A bug report, a test result, an error message, a screenshot, a "this doesn't work" — none
of these are permission. Describe the change, list every edit, confirm you have the latest
file, and WAIT for an explicit order ("go", "do it", "proceed"). Looking at code needs no
permission; generating it always does.

The user maintains the canonical code. Always work from the file they give you, not from
memory of a prior version.

---

## 1. WHAT THE CARD IS

A Home Assistant custom Lovelace card. It is, in spirit, the built-in **picture-glance
card** — same job, same feel — with ONE deliberate deviation: instead of a fixed entities
row, it has a flexible **items array**. Items are positioned into six zones
(top/bottom × left/center/right), are template-capable throughout, and each has its own
typography. That items array is the entire reason the card exists.

---

## 2. THE GOVERNING PHILOSOPHY (this drove every architectural decision)

1. **Do it the Home Assistant way.** If HA provides it, use it. Deviate only where HA
   genuinely cannot do what's needed — and even then, deviate using HA's own tools.
2. **Write it as an HA core developer would** if it were going into the standard
   distribution.
3. **The card must be transparent — never a gatekeeper.** This is the deepest principle.
   The card must NOT inspect, filter, or maintain its own list of valid actions. It
   forwards the user's intent to HA and gets out of the way. Third-party add-ons
   (browser_mod etc.) can define their own actions; a card with an action allowlist breaks
   the moment the ecosystem grows. So: no allowlist, ever.

---

## 3. KEY ARCHITECTURAL DECISIONS (the v1.0.100 rewrite)

The pre-1.0.100 card re-implemented huge amounts of HA itself. The rewrite stripped that out.

- **Actions:** A faithful, vendored copy of HA's own `handleAction` (in the file as
  `handleAction` + `fireEvent` + `navigate` + `toggleEntity`). Every action is forwarded
  to HA unfiltered, including `fire-dom-event` (which HA dispatches as the `ll-custom`
  event — this is HA's extension point for add-on actions). Unknown actions do nothing,
  exactly as HA does. We vendor rather than import because an externally-loaded card cannot
  import HA's internal modules, and the public `custom-card-helpers` package is ~4 years
  stale. NOT implemented: `assist` and action `confirmation` — both need internal HA
  dialogs an external card cannot open.
- **The one card-owned action:** `input-select-popup`. It has no HA equivalent (it shows a
  popup list from an input_select's options). It is NOT really an action that gets
  forwarded — it is a self-contained UI feature with zero ecosystem dependency. That is why
  it is allowed to live in the card. `_handleAction` intercepts only this; everything else
  goes to the vendored `handleAction`.
- **Images:** all three source types (camera / url / entity) render through HA's
  `hui-image`. No raw `<img>`, no manual `/api/image_proxy/` URL building.
- **Icons / state:** entity items use HA's `ha-state-icon` (handles icon + state colour).
  The old private DOMAIN_ICON_MAP / ACTIVE_STATES / domainIcon / isStateActive are gone.
- **Default tap action** for entity items is `more-info` (the old toggle-by-domain logic
  was removed).
- **Templates:** live template bar items resolve via HA's `subscribeMessage`
  (`render_template`). Client-side template pre-resolution of call-service data was removed
  in the rewrite — HA does not do that; users needing it use an HA script.

---

## 4. THE CUSTOM UI CONTROLS — DELIBERATELY KEPT (do not "fix" these)

The editor uses four custom controls: `chrono-cp-textfield`, `chrono-cp-textarea`,
`chrono-cp-select`, `chrono-cp-button-toggle-group` (plus a native `<input type=color>`
based colour picker). These are KEPT custom on purpose: HA itself advises third-party cards
NOT to use HA's internal frontend UI components, because those are not a stable public API
and change frequently. These controls are shared across all the user's "chrono" cards, so
they must stay consistent and must not be redesigned here.

HA components that ARE used as-is (they sit on the HA side of the line): `ha-switch`,
`ha-expansion-panel`, `ha-sortable`, `ha-icon`, `ha-svg-icon`, `ha-card`, `hui-image`,
`ha-state-icon`. We do NOT define our own versions of these.

---

## 5. THE EDITOR DRAG-AND-DROP / ZONE SYSTEM (v1.0.101)

- The editor builds a visible list of: all six group dividers, each followed by that
  group's items. **All six dividers are always shown**, even empty ones, so every zone is a
  drop target.
- The dividers are real entries in the visible list (so HA's drag tool counts them in the
  index it reports) but are non-draggable (no `.handle`). This was verified empirically with
  a debug build — the reported drop index DOES include the dividers.
- On drop, an item takes the group of the nearest divider above it. An item dropped above
  the top divider joins the top-left group (the top divider is always first).
- Dividers are never written to YAML — only real items, each carrying its updated
  horizontal/vertical.
- `_GROUP_DEFS` is the single source of truth for group order/labels; `_GROUP_ORDER` is
  derived from it.
- Build order detail (matters if you touch it): the list is built by walking the items and
  prepending under the matching divider, NOT by snapping back via sort. The old snap-back
  (which overruled the user's drop position) was removed — never overrule the user's intent.

---

## 6. EDITOR UX BEHAVIOURS

- **Add item:** creates an item with a sensible default value (entity → first `light.*`
  entity, fallback first entity; template → `{{ now().strftime('%H:%M') }}`), expands only
  the new item, collapses the others, scrolls it into view, focuses its field. Critically:
  `_addItem` sets config and calls `_fireConfig` (so the preview renders), and focus AWAITS
  THE `ha-expansion-panel`'s OWN `updateComplete` before focusing — because the panel
  renders its slotted content on its own update cycle when `expanded` is set
  programmatically. (Verified against HA source: `expanded-changed` only fires on user
  click, not on programmatic property set; the slot content is gated by the panel's internal
  `_showContent`, set in its `willUpdate`.) The field value comes from the data binding —
  never poke `field.value` by hand.
- **Remove item:** undo pattern, NOT a confirmation dialog. The removed item's row is
  replaced in place by a row reading "Undo remove" (styled exactly like the "Remove item"
  row). Clicking it restores the item at its original index. ANY other interaction
  (`_itemChanged`, `_itemToggled`, `_itemYamlChanged`, `_valueChanged`, `_itemMoved`,
  adding) silently discards the undo via `_clearUndo()`. No timer/auto-dismiss.
- **Additional YAML** sections (card-level and per-item) are currently commented out
  (hidden), code kept, so they can be re-enabled.
- `SHOW_ITEM_POSITION_BADGES` is a deliberate constant set to `false` — leave it.
- Item header text truncates at 30 chars; `.item-type-badge` has `white-space: nowrap`.

---

## 7. KNOWN / ACCEPTED LIMITATIONS

- The editor re-renders after every config change via HA's `config-changed` round-trip,
  which feels slightly un-snappy. This is HA editor infrastructure, not the card. A
  double-render (render locally then again on round-trip) was explicitly REJECTED by the
  user because it flickers. Left as-is.
- Single-file, JavaScript (not TypeScript), Lit + js-yaml imported from CDN. To reach HA's
  internal "platinum" review bar would require: TypeScript, a build pipeline, Lit/js-yaml
  bundled instead of CDN, files split (card/editor/helpers/types), and dropping the vendored
  handleAction. That is a near-total technical rewrite and is NOT planned — this is a
  personal card, "excellent custom card" is the target, not HA-distribution platinum.

---

## 8. VERSIONING (from the rules — easy to get wrong)

- Format `x.y.z` (or `x.y.z.n` for throwaway debug builds — no history entry, `z` does not
  increment).
- `x`/`y` only the user changes. `z` increments on EVERY generation, never resets, never
  goes backward (it is currently well past 9 — at 108).
- Version is embedded near the top of the file; a history block sits right below it, newest
  entry on top, format `// vX.Y.Z: description`.
- Output filename uses DOTS between version numbers: `chrono-picture-card_1.0.108.js`.
- Every code-generating response ends with a summary of changes as plain prose, THEN a
  separate fenced block containing ONLY the release command:
  `release "message"`. The message must not contain `( ) & | < > ^ %` (Windows batch breaks
  on them). Nothing but the release line goes inside that fenced block.

---

## 9. HOW THE USER WORKS (read this — it matters more than the code)

- The user maintains the real code, tests in a live Home Assistant, and reports back.
- They do not read code fluently — explain in plain language, not jargon. When you must
  reference a mechanism, describe what it does, not its name.
- They will ask "what are you going to change?" before giving permission. Answer precisely
  and briefly; that question is a gate, not small talk.
- They despise: workarounds, guessing presented as fact, changing things not asked for,
  writing without permission, and verbosity. They value: finding the true cause, verifying
  against real sources, being a sparring partner (challenge flawed reasoning once, clearly),
  and admitting "I don't know" over plausible filler.
- Use `[Speculation]` for anything not verified in the current session. Do not claim how HA
  (or any third-party system) behaves unless you verified it this session — by reading the
  actual source or running the actual check. The user can fetch files/URLs for you if you
  give the exact URL.

---

*End of transfer document. Start the next session by reading the rules, this document, and
the latest code file — then wait for instructions.*
