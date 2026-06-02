# Kid Draw

iPad-first drawing & colouring app for kids, built with Vite + React + Capacitor 8.

## Features

- **Free draw** with smooth pen, marker (translucent), and eraser tools
- **Fill (bucket) tool** with kid-friendly outline-mask flood fill — tap inside a shape to color it, tap outside to color the background
- **15-colour palette** plus 4 brush sizes
- **12 starter templates** (cat, fish, flower, sun, house, star, butterfly, rocket, apple, heart, cloud, blank) for colouring in
- **Sound feedback** via Web Audio API — no asset files needed
- **Save & share** via iPad native share sheet (or download fallback)
- **Single-canvas architecture** with pre-rendered outline mask — outline stays visible under the kid's strokes, fill respects outlines as hard boundaries
- **DPR-aware** rendering for crisp lines on Retina iPad
- **iPad-only target** (TARGETED_DEVICE_FAMILY = 2)

## Stack

- Vite 8 + React 19 + TypeScript
- Capacitor 8 (iOS bundle: `com.ashbi.kiddraw`)
- HTML5 Canvas with Pointer Events
- Web Audio API for sounds

## Develop

```bash
npm install
npm run dev          # localhost:5173
```

## Build for iPad

```bash
npm run build        # tsc + vite → dist/
npx cap sync ios     # copy dist/ into ios/App/App/public
npx cap open ios     # opens Xcode
# In Xcode: Signing & Capabilities → set Apple Developer Team
# Product → Archive → Distribute App → App Store Connect
```

Requires a Mac with **full Xcode** installed. This machine has only
CommandLineTools (`/Library/Developer/CommandLineTools`), so the iOS archive
step must run on a real Mac.

## File Map

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app: canvas, tools, palette, modal, save flow |
| `src/sound.ts` | Web Audio API — tap, pop, scribble, clear, done |
| `src/templates.ts` | SVG template definitions + data-URL loader |
| `src/index.css`, `src/App.css` | UI styles (cream bg, big touch targets, no text labels) |
| `capacitor.config.ts` | App ID, splash, light-mode lock |
| `ios/App/App/Info.plist` | iPad-only, light mode, Photos add permission |
| `ios/App/App/Base.lproj/LaunchScreen.storyboard` | Cream launch screen w/ brand mark |

## Architecture Notes

The drawing app uses a **single canvas** strategy instead of stacking a
template layer over a drawing layer. When a template is selected:
1. The canvas is whitewashed
2. The template SVG is drawn centered at 85% of viewport (preserving aspect)
3. Kid's strokes go directly on top — outline stays visible under the colour

This means the saved PNG is just `canvas.toBlob()` — no compositing needed
at save time, and there are no layer z-index surprises.

The canvas is resized on `window.resize` and the template is re-stamped.
Template changes clear undo history (a new template is a new drawing).

## Known Limits

- Undo is image-data snapshot based, capped at 30 entries
- Apple Pencil pressure not yet used (line width is fixed per brush size)
- Templates are hard-coded SVGs — no way to add custom ones yet
- No iOS build attempted on this machine (no full Xcode)
