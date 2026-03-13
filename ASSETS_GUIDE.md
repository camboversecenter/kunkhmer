# Kun Khmer Fight 3D - Asset Guide

This game is set up to load custom local assets if they exist. Use this guide to add real traditional music and 3D models to your game.

## 🎵 Audio (Music)
**Place file here:** `public/assets/audio/sarama.mp3`

### Where to find authentic Sarama music:
1.  **Internet Archive (Royal Music of Cambodia)**: [Download Link](https://archive.org/details/RoyalMusicOfCambodia)
    - Look for tracks like "Salamat" or "Sarama".
    - Download the MP3 and rename it to `sarama.mp3`.
2.  **YouTube to MP3**: Search for "Kun Khmer Sarama Music" and use a converter (use with caution regarding copyrights).

---

## 🥊 3D Models (Fighters)
**Place file here:** `public/assets/models/fighter.glb`

### Best format for realistic humans
The project now supports `VRM` humanoid avatars through `@pixiv/three-vrm`, which is a better fit than a generic mesh if you want a real human silhouette, proper proportions, hair, face detail, and cleaner material setup.

- Standard quality: `public/assets/models/fighter.vrm`
- HD quality: `public/assets/models/fighter-hq.vrm`

### Optional HD quality pack
If you want the new adaptive downloader to use a higher-detail fighter on stronger devices, also add:

- `public/assets/models/fighter-hq.glb`
- `public/assets/models/fighter-hq.vrm`

The game now chooses assets by device tier:
- `ESSENTIAL`: procedural fighter only, no optional downloads
- `BALANCED`: tries `fighter.vrm` first, then falls back to `fighter.glb`
- `FULL`: tries `fighter-hq.vrm`, then `fighter-hq.glb`, then the standard files

### Where to find free models:
1.  **Sketchfab**: Search for "Muay Thai" or "Kickboxer" (filterable by downloadable/GLTF).
    - [Sketchfab Search](https://sketchfab.com/search?features=downloadable&q=muay+thai&type=models)
2.  **Tripo3D / AI Generators**: Generate a "Low poly shirtless fighter with armbands" and export as GLB.
3.  **VRoid / VRM exports**: If you want the most human-looking result, export a realistic athletic male fighter as `.vrm`.

### Requirements:
- Format: **.vrm**, **.glb**, or **.gltf**
- Animations: If the model has built-in animations, they might not play automatically without further code changes. Ideally, use a static mesh (T-pose or stance) for now, or ensure the rig matches standard humanoid bones if we enable animation retargeting later.
- Best result: use a realistic athletic body mesh with wrapped hands, shorts geometry, skin/hair materials, and packed roughness/normal textures.
- **Note:** If no file is found, the game will default to the procedural "capsule" fighter.
