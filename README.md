# Kid Draw

A simple drawing and coloring app for kids, built with Vite + React + Capacitor 8.

**Made for iPad and iPhone. Also runs on Android and web.**

> "Adelaide and Madden approved." — Cam

---

## Features

- 🎨 **Free draw** with colorful brushes and markers
- 🖌️ **Coloring pages** to fill in with guided outlines
- ↩️ **Undo** support
- 🧹 **Eraser** tool
- 💾 **Save to Photos** — export your child's masterpiece to the camera roll
- ✈️ **Works offline** — no internet required
- 🚫 **No ads, no accounts, no data collection**

---

## Tech Stack

- **Vite** — fast build tooling
- **React 18** — UI
- **Capacitor 8** — native app wrapper (iOS, Android, PWA)
- **HTML5 Canvas / React-Canon-Drawing** — drawing engine (see `src/DrawingCanvas.tsx`)

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Xcode 15+ (for iOS)
- Android Studio (for Android)
- CocoaPods (`sudo gem install cocoapods`) — iOS only

### Install

```bash
git clone https://github.com/camster91/kid-draw.git
cd kid-draw
npm install
```

### Dev (Web)

```bash
npm run dev
```

Opens at `http://localhost:5173`.

### Add Platforms

```bash
npx cap add ios
npx cap add android
```

### Sync & Open in IDE

```bash
npx cap sync
npx cap open ios      # opens Xcode
npx cap open android  # opens Android Studio
```

### Build for Production

```bash
npm run build          # web build
npx cap sync           # sync to native
npx cap open ios       # open Xcode to archive + submit
npx cap open android   # open Android Studio to build AAB
```

---

## Project Structure

```
kid-draw/
├── src/
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   ├── components/
│   │   ├── DrawingCanvas.tsx   # Main canvas — free draw
│   │   ├── ColoringPage.tsx    # Guided coloring page view
│   │   ├── Toolbar.tsx          # Brush/eraser/color picker
│   │   └── ColorPicker.tsx      # Color selection grid
│   ├── data/
│   │   └── coloringPages.ts  # Built-in coloring page SVGs
│   └── styles/
│       └── index.css
├── public/
├── ios/                      # Native iOS project (Capacitor)
├── android/                  # Native Android project (Capacitor)
├── capacitor.config.ts       # Capacitor configuration
├── vite.config.ts
└── package.json
```

---

## Design Philosophy

1. **Offline first** — nothing requires the internet
2. **No data collection** — COPPA-compliant, no analytics, no tracking
3. **Kid-friendly UI** — large touch targets, simple navigation, no clutter
4. **Works on the device it's on** — no accounts, no cloud sync, no complexity

---

## Privacy

Kid Draw collects **no personal data**. It works entirely offline. The only permission requested is optional photo library access (to save drawings). See [`privacy-policy.md`](./privacy-policy.md).

---

## Store Listing

See [`store-listing.md`](./store-listing.md) for:
- App Store Connect metadata
- Google Play Console metadata
- Screenshot specifications
- Keywords and description copy

---

## Submitting

See [`submission-checklist.md`](./submission-checklist.md) for a step-by-step guide to submitting to the Apple App Store and Google Play Store.

---

## Alternatives

The repo [kids-drawing-game](https://github.com/camster91/kids-drawing-game) is a heavier Flutter-based alternative. Kid Draw (this repo) is the simpler, lighter Capacitor PWA.

---

## License

MIT