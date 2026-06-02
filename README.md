# Kid Draw — iPad-first drawing & colouring app

Built for Adelaide and Madden.

## Develop

```bash
npm install
npm run dev          # http://localhost:5173
```

## iOS Build (requires a Mac with full Xcode)

```bash
npm run build        # tsc + vite → dist/
npx cap sync ios     # copy dist/ into ios/App/App/public
npx cap open ios     # opens Xcode
# In Xcode: Signing & Capabilities → set Apple Developer Team
# Product → Archive → Distribute App → App Store Connect
```

This machine has only CommandLineTools. Run the Xcode steps on your Mac.

## Web Deploy (Coolify)

1. Create the GitHub repo: `ashbi/kid-draw`
2. Push: `git remote add origin git@github.com:ashbi/kid-draw.git && git push -u origin main`
3. Set Coolify token: `export COOLIFY_API_TOKEN=...`
4. Set basicauth: `export KIDDRAW_BASICAUTH=...`
5. Deploy: `python3 ~/projects/coolify-deploy-tool/coolify-deploy.py --config deploy-config.json`

## File Map

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app: canvas, tools, palette, modal, save flow, flood fill |
| `src/sound.ts` | Web Audio API — tap, pop, scribble, clear, done |
| `src/templates.ts` | 12 SVG template definitions (cat, fish, flower, sun, house, star, butterfly, rocket, apple, heart, cloud, blank) |
| `src/index.css`, `src/App.css` | UI styles (cream bg, big touch targets, no text labels) |
| `capacitor.config.ts` | App ID, splash, light-mode lock |
| `ios/App/App/Info.plist` | iPad-only, light mode, Photos add permission |
| `ios/App/App/Base.lproj/LaunchScreen.storyboard` | Cream launch screen w/ brand mark |
| `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` | Custom palette-and-paint app icon |
| `Dockerfile` | nginx-unprivileged container for Coolify |
| `deploy-config.json` | Coolify deploy config (read by coolify-deploy.py) |

## Architecture

**Single canvas with pre-rendered outline mask.** When a template is selected:
1. Canvas is whitewashed
2. Template SVG is drawn centered at 85% of viewport
3. An outline mask (Uint8Array, 1=outline, 0=fillable) is pre-computed from the rendered template
4. Kid's strokes go directly on top — outline stays visible under the colour
5. Fill tool uses the mask as a hard boundary so fills stay inside shapes

Save is `canvas.toBlob()` — no compositing at save time.

The flood fill uses an outline mask rather than RGB tolerance, so fills don't bleed across the white background through gaps in the outline.

## iOS Build Specifics

- **Bundle ID**: `com.ashbi.kiddraw` (iPad-only)
- **iPad-only**: `TARGETED_DEVICE_FAMILY = 2` in project.pbxproj
- **Light mode forced**: `UIUserInterfaceStyle: Light` in Info.plist (prevents dark flash)
- **Photos add permission**: `NSPhotoLibraryAddUsageDescription` (for share sheet)
- **All 4 orientations supported** on iPad (locked out on iPhone)
- **Cream launch screen** with centered emoji + name label

## Known Limits

- Undo is image-data snapshot based, capped at 30 entries
- Apple Pencil pressure not yet used (line width is fixed per brush size)
- Templates are hard-coded SVGs — no way to add custom ones yet
- No iOS build attempted on this machine (no full Xcode)
- App icon is a programmatic palette + paint blobs (no text/face) — could be replaced with a real designer icon later
