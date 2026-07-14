# Kun Khmer Fight 3D

A 3D fighting game celebrating **Kun Khmer** (Cambodian kickboxing), built with React Three Fiber. Fight through Adventure mode across Cambodia, battle friends in peer-to-peer online PVP, unlock Sak Yant tattoos and heroes — on desktop, mobile, or fully in **VR** on a WebXR headset. An AI ring announcer powered by Gemini provides live commentary.

**VER 1.2.0 • ANGKOR EDITION**

## Features

- ⚔️ **Authentic Kun Khmer moves** — Mat (punch), Ti (kick), Sok (elbow), Kumpleang (knee), Mok Keng (uppercut), Rung (block), Romiel (dodge roll)
- 🗺️ **Adventure mode** — story campaign across Cambodian landscapes with Angkor-inspired scenery
- 🥽 **VR support** — full WebXR: throw punches with your controllers, guard with your hands, stick locomotion
- 🌐 **Online PVP** — peer-to-peer matches via WebRTC (PeerJS), no game server needed
- 🎙️ **AI commentary** — live Gemini-generated ring announcing (optional, degrades gracefully to canned lines)
- 🏋️ **Heroes, Sak Yant, spirit mode** — progression, unlocks, and buffs
- 📱 **Mobile-friendly** — touch joystick and on-screen move buttons

## Getting started

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev        # http://localhost:3000
```

That's it — the game is fully playable without any API key (commentary falls back to built-in lines).

### Optional: enable AI commentary locally

Commentary is served by a Cloudflare Pages Function ([functions/api/commentary.js](functions/api/commentary.js)) so the Gemini API key never reaches the browser. To run it locally:

```bash
cp .dev.vars.example .dev.vars   # put your GEMINI_API_KEY inside
npm run build
npx wrangler pages dev dist
```

## Deployment (Cloudflare Pages)

1. Connect the repo to Cloudflare Pages (build command `npm run build`, output `dist`).
2. In **Settings → Environment variables**, add `GEMINI_API_KEY` as an encrypted variable.
3. Deploy. VR requires HTTPS, which Pages provides out of the box.

## Controls

### Desktop keyboard

| Action | Key |
|---|---|
| Move | `W A S D` |
| Punch (Mat) | `U` |
| Uppercut (Mok Keng) | `Shift + U` |
| Kick (Ti) | `I` |
| Elbow (Sok) | `O` |
| Knee (Kumpleang) | `P` |
| Block (Rung) | `Space` (hold) |
| Taunt / Spirit Mode | `T` |
| Dodge Roll (Romiel) | `Shift` |

### VR (WebXR controllers)

| Action | Input |
|---|---|
| Punch (Mat) | Right trigger |
| Kick (Ti) | Left trigger |
| Uppercut (Mok Keng) | `A` |
| Knee (Kumpleang) | `B` |
| Elbow (Sok) | `X` |
| Taunt | `Y` |
| Block (Rung) | Grip, or raise both hands to your head |
| Move | Left thumbstick |

**PC VR simulator:** press `Shift + V` in-game to test the VR experience without a headset (WASD to move, Q/E/R/F/T to attack).

## Good to know

- **Leaderboard & sign-in are local demos.** Google Sign-In runs client-side only and scores are stored in your browser's localStorage — there is no backend database. Wins are not synced between devices or players.
- **Multiplayer** uses the public PeerJS broker for matchmaking handshakes; game data flows peer-to-peer over WebRTC.
- **Audio and 3D model assets** under `public/assets/` are optional; the game synthesizes audio and uses procedural fighters when they are absent.

## License

Licensed under the [Apache License 2.0](LICENSE).

Copyright 2026 camboversecenter
