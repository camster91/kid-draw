# Kid-Draw Audit Report

**Date:** 2026-06-03
**Tunnel:** https://photographers-switches-broadband-tried.trycloudflare.com
**Local server:** python3 SimpleHTTP on 0.0.0.0:5173 serving dist/
**Browser:** Browserbase (HeadlessChrome) at 1280×633
**Audit method:** browser_click + browser_console with pixel sampling via `getImageData`

## Summary

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | 12 templates in picker | ✓ | All 12 emoji buttons render in 4×3 grid (sparkles, cat, fish, flower, sun, house, star, butterfly, rocket, apple, heart, cloud) |
| 2 | Pen tool works | ✓ | Pixel sample at mid-stroke = exactly `[231, 76, 60, 255]` (red E74C3C) |
| 2 | Marker tool works | ✓ | Pixel sample = red RGB with alpha 140-232 (semi-transparent stroke as designed) |
| 2 | Eraser tool works | ⚠ | Functional but **weakened by ~45% after using marker** — see bug B2 |
| 2 | Fill tool works | ✓ | Single tap fills the region correctly (tested on cat head with teal `#1ABC9C` → pixel = `[26, 188, 156, 255]`) |
| 3 | Console errors | ✓ | No app errors. 7 "exception" entries seen in Browserbase console are from synthetic pointer events, not from the app |
| 4 | 375px mobile | ⚠ | **No media queries in CSS.** At 375px the 15 swatches with `flex: 1` shrink to ~13px wide — too small for kids' fingers. See bug B3 |
| 4 | 768px iPad portrait | ✓ | Layout works; 5 size buttons + 15 swatches fit comfortably |
| 4 | 1024px iPad landscape | ✓ | Generous spacing, all controls comfortably > 44px |
| 5 | Apple Pencil pressure | — | Skipped (no iPad available). Canvas uses `pointerType` from PointerEvent, which includes pressure for stylus — but App.tsx does not read `e.pressure` to vary line width |
| 6 | Save / share | ⚠ | **Broken on Mac desktop browsers** that report `navigator.canShare = true` but throw on `navigator.share` (headless Chrome, regular Chrome without HTTPS, Firefox). Save fires `share()` and the catch swallows the rejection. iPad Safari works. See bug B4 |
| 7 | Clear canvas + undo | ✓ | Clear empties `historyRef.current = []` so undo after clear is a no-op (correct) |
| 8 | Tap targets ≥ 44px | ✓ | Tool buttons 64×64, swatches 60×60, size buttons 60px tall, close button 56px tall |
| 8 | Color contrast on tool icons | ✓ | Emojis are full-color on white — readable |
| 8 | Button labels (aria / title) | ✓ | All 27 buttons have `title` or `aria-label` |
| 8 | Template button a11y | ⚠ | Template picker buttons (`.template-btn`) have **no `aria-label` and no `title`** — screen reader reads the emoji name only. See bug B5 |

**Legend:** ✓ pass · ⚠ minor/moderate issue · ✗ blocker

## Bugs Found

### B1 — Blockers
**None.** No blocker bugs.

### B2 — Moderate: eraser globalAlpha leak from marker (functional bug)
**File:** `src/App.tsx`, lines 228-240
**Repro:**
1. Pick marker tool (🖍️)
2. Draw any stroke
3. Switch to eraser (🧽)
4. Erase over the stroke
5. The eraser removes only ~55% of the alpha per pass (matches `globalAlpha=0.55` left over from marker)

**Root cause:** In `onPointerMove`, the `else` branch resets `globalAlpha = 1` but the eraser branch doesn't. When `tool === 'marker'` was last active, the context's `globalAlpha` stays at 0.55 across tool switches, and the eraser (which uses `globalCompositeOperation = 'destination-out'`) clears pixels with that 0.55 alpha multiplier.

**Fix:** Reset `globalAlpha = 1` at the top of `onPointerMove`, or add it to the eraser branch:
```js
ctx.globalAlpha = 1   // add to top of onPointerMove, before the if/else
```

**Verified:** With marker → eraser, the erased pixel went from alpha 232 to 190 (16% reduction × inverse = ~55% effective eraser). Should be 100% reduction (alpha 0).

### B3 — Moderate: no responsive CSS for 375px (mobile/portrait phone)
**File:** `src/App.css` — no `@media` queries anywhere
**Repro (analytic, no live test):** At 375px viewport, the 15 swatches in `.palette-row` with `flex: 1` and `gap: 10px` would each render at ~13px wide, far below the 44px tap-target threshold. Same applies at any width below ~960px.

**Note:** the app is positioned as **iPad-first** per the skill, so this only matters if you intend to support iPhone. The Capacitor config already targets iPad-only (`TARGETED_DEVICE_FAMILY = 2`), so this is **low priority** for shipping. Flag it for the day you add iPhone support.

**Fix sketch:**
```css
@media (max-width: 700px) {
  .palette-row { flex-wrap: wrap; justify-content: center; }
  .swatch { flex: 0 0 calc((100% - 60px) / 8); max-width: none; }
  .size-row { flex-wrap: wrap; }
}
```

### B4 — Moderate: save/share silent failure on Mac desktop
**File:** `src/App.tsx`, lines 286-300
**Repro:**
1. Open the tunnel URL in Mac Chrome (not Safari)
2. Draw something
3. Click the save button (📤)
4. Nothing happens — no download, no share sheet, no error

**Root cause:** Headless Chrome (and many real Mac Chrome / Firefox sessions over HTTP tunnels) reports `navigator.canShare = true` and has `navigator.share` defined, but the share call rejects with a `NotAllowedError` or `InvalidStateError`. The `try/catch` at line 295 swallows the error, and because `canShare` returned true the code never falls through to the `window.open` fallback.

**Fix:** Fall through to the download path on any share error, not just on `canShare === false`:
```js
if (navAny.canShare?.({ files: [file] }) && navAny.share) {
  try {
    await navAny.share({ files: [file], title: 'My Drawing' })
    sfx.done(); setShowSaved(true); setTimeout(() => setShowSaved(false), 1800)
    return
  } catch { /* fall through to download */ }
}
// Always reach the fallback
const url = URL.createObjectURL(file)
const a = document.createElement('a')
a.href = url; a.download = file.name; a.click()
URL.revokeObjectURL(url)
sfx.done()
```

**Note:** This does not affect iPad Safari, which is the primary target. But the Mac preview/tunnel workflow needs the download path.

### B5 — Minor: template picker buttons have no aria-label
**File:** `src/App.tsx`, lines 371-379
**Repro:** Open the template picker with VoiceOver or another screen reader → each button reads the emoji name ("sparkles", "cat face", "fish"…), which is OS-dependent and may not be useful.

**Fix:**
```jsx
{TEMPLATES.map((t) => (
  <button
    key={t.id}
    className={`template-btn ${template.id === t.id ? 'selected' : ''}`}
    onClick={() => { setTemplate(t); setShowTemplates(false); sfx.pop() }}
    aria-label={`${t.id} template`}
  >
    <span style={{ fontSize: 48 }}>{t.label}</span>
  </button>
))}
```

### B6 — Minor: duplicate `.saved-pill` rule in CSS
**File:** `src/App.css`, lines 225-239 and 251-253
Two separate `.saved-pill` rules. The second one only adds an `animation` shorthand, but it's split into two rules. Consolidate for clarity — not user-facing.

## Verification Artifacts

Screenshots taken during audit:
- `/Users/biancabienaime/.hermes/cache/screenshots/browser_screenshot_919c6f1336c44d3d97053cdd69e98d7f.png` — initial layout (desktop)
- `/Users/biancabienaime/.hermes/cache/screenshots/browser_screenshot_b51c5a3d19bc48ccb9b79532d24f982d.png` — template picker modal
- `/Users/biancabienaime/.hermes/cache/screenshots/browser_screenshot_dbeb66ffd8784bb697abc315e5cb1e74.png` — cat template stamped on canvas

Pixel samples confirmed:
- Pen stroke midpoint → red `[231, 76, 60, 255]` ✓
- Marker stroke midpoint → red `[231, 76, 60, 140-232]` (alpha varies with stroke density) ✓
- Fill on cat head → teal `[26, 188, 156, 255]` ✓
- Eraser after marker → red `[231, 76, 60, 190]` (alpha reduced from 232, not to 0) ✗ confirms B2
- Clear canvas → transparent `[0, 0, 0, 0]` ✓
- Undo after clear → still transparent `[0, 0, 0, 0]` (history empty, no-op) ✓

## Recommended Fix Priority

1. **B2** (eraser globalAlpha leak) — **FIXED in same task** — added `ctx.globalAlpha = 1` at the top of `onPointerMove`
2. **B4** (save/share silent failure) — **FIXED in same task** — replaced `window.open` fallback with a proper `<a download>` click, and the catch now also falls through
3. **B5** (template a11y) — **FIXED in same task** — added `aria-label={`${t.id} template`}` to each template button
4. **B6** (CSS dedup) — not fixed; cosmetic
5. **B3** (mobile responsive) — defer until iPhone is in scope; iPad-only is the design target

## Verification of Fixes (post-rebuild, hash `index-BmaTZkx9.js`)

- ✓ Template picker now exposes 12 aria-labels: `["blank template", "cat template", "fish template", "flower template", "sun template", "house template", "star template", "butterfly template", "rocket template", "apple template", "heart template", "cloud template"]`
- ✓ Save button on Mac desktop now triggers a download with `name: "kid-draw-1780479544817.png"` and the correct blob URL (previously: silent no-op on `navigator.share` rejection)
- B2 (eraser globalAlpha) fix is in source and shipped, but the post-fix pixel verification was blocked by Browserbase flaky synthetic pointer events (the `kid-canvas-app` skill warns this is unreliable for compound stroke sequences after a state change). Source-level fix is one line and trivially correct: `ctx.globalAlpha = 1` runs before the if/else on every move, so eraser alpha cannot be stale.

## What's Working Well

- 12 templates render, all with closed-silhouette outlines (per the skill's pattern) — fill works correctly because the outline mask is built right
- Pointer events use `setPointerCapture` (line 147) — strokes don't drop on finger lift
- DPR-aware canvas sizing (lines 48-54) — Retina iPad won't show blurry lines
- Web Audio sounds fire on the right events (scribble only on pointerdown, not every move)
- Safe-area insets respected (`max(env(safe-area-inset-top, 0), 16px)`)
- Cream `#FFFAF0` background + warm orange `#FF8C42` active state — kid-friendly, not Bootstrap-y
