# VER-DÉ Spatial Cinema

**Tell the cinema how you feel. With just your hands, VER-DÉ finds the film for the moment and remembers you.**

A hands-first, seated WebXR cinema for Meta Quest. You sit in a quiet, dark room in front of a large screen. Mood choices float within arm's reach. Pinch one, or simply touch it with your fingertip, and VER-DÉ answers with three independent films and a reason for each. Pinch a film to watch it on the big screen. Next time, VER-DÉ greets you with what you watched and offers something like it.

Built for the Meta VR Start Developer Competition 2026 (Entertainment track).

## How it works

- **Hands-first, end to end.** Every step works with hands only: pinch with a hand ray, or touch a button with your index finger. No controller is required (controllers also work).
- **Seated.** All controls sit within about 60 cm of the viewer, tilted toward the eyes. No walking, no room-scale.
- **AI recommendations.** `api/engine.js` relays requests to the existing VER-DÉ 2.0 AI Cinema Engine (`engine.ver-de.com/api/chat`, Gemini), which writes a reason for each film from catalog facts only. If the engine is unreachable, the cinema uses each film's published description, so it never shows an error.
- **Own playback.** Films play from the project's own MP4 files on a video texture. No third-party players.
- **Memory.** The last film watched is kept on the device (`localStorage`) and shapes the next visit.

## Files

| Path | What it is |
|---|---|
| `index.html`, `app.js` | The experience (three.js + WebXR) |
| `api/engine.js` | Vercel serverless relay to the VER-DÉ engine |
| `films/bagsak.mp4` | The film that plays in the cinema |
| `vendor/` | three.js r160 (MIT) |

## Run

- **Quest:** open the deployed URL in the Meta Quest Browser and press **Enter the Cinema**. Hand tracking turns on automatically when you put the controllers down.
- **Desktop with emulation:** install the **Immersive Web Emulator** Chrome extension, choose a Meta Quest device, enable hand tracking, then press **Enter the Cinema**.
- **Desktop preview:** open the page and click. Add `?reset=1` to clear the viewing memory.
- **Locally:** `npx vercel dev` (the AI relay needs Vercel); a plain static server also works, with recommendations falling back to catalog descriptions.

## License

Code: MIT (see `LICENSE`). Films, music, artwork, synopses, and the VER-DÉ name: © Ralph Anthony Sales, all rights reserved.

*A VER-DÉ Film · Music by Green Ralph · Nabua, Camarines Sur*
