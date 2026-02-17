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

### Where to find free models:
1.  **Sketchfab**: Search for "Muay Thai" or "Kickboxer" (filterable by downloadable/GLTF).
    - [Sketchfab Search](https://sketchfab.com/search?features=downloadable&q=muay+thai&type=models)
2.  **Tripo3D / AI Generators**: Generate a "Low poly shirtless fighter with armbands" and export as GLB.

### Requirements:
- Format: **.glb** or **.gltf**
- Animations: If the model has built-in animations, they might not play automatically without further code changes. Ideally, use a static mesh (T-pose or stance) for now, or ensure the rig matches standard humanoid bones if we enable animation retargeting later.
- **Note:** If no file is found, the game will default to the procedural "capsule" fighter.
