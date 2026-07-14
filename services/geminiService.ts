import { Move } from "../types";

// Commentary is generated server-side via the Cloudflare Pages Function at
// /api/commentary, so the Gemini API key never ships in the client bundle.
// When the endpoint is unavailable (plain `vite dev`, or no key configured),
// the game silently falls back to canned commentary.

let lastCallTime = 0;
const MIN_INTERVAL = 3500; // Minimum 3.5 seconds between API calls to save quota
let proxyDisabled = false; // Set after a hard failure so we stop hitting the endpoint

const FALLBACK_COMMENTARY = [
    "What a powerful strike!",
    "Solid hit connects!",
    "The crowd is roaring!",
    "Big damage dealt!",
    "Incredible technique on display!",
    "That has to hurt!",
    "This is true Kun Khmer spirit!",
    "Brutal impact!",
    "A devastating blow!",
    "Fast and furious action!"
];

const getRandomFallback = () => FALLBACK_COMMENTARY[Math.floor(Math.random() * FALLBACK_COMMENTARY.length)];

const requestCommentary = async (payload: Record<string, unknown>): Promise<string | null> => {
  if (proxyDisabled) return null;
  try {
    const res = await fetch('/api/commentary', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.status === 404 || res.status === 503) {
      // No backend (local vite dev) or GEMINI_API_KEY not configured — stop asking.
      proxyDisabled = true;
      return null;
    }
    if (!res.ok) return null;
    const data = await res.json();
    const text = typeof data?.text === 'string' ? data.text.trim() : '';
    return text || null;
  } catch {
    return null;
  }
};

export const generateFightCommentary = async (
  attacker: 'Player' | 'Opponent',
  move: Move,
  wasHit: boolean,
  remainingHealth: number,
  gameMode: string = 'PVE',
  opponentName: string = 'Opponent',
  comboCount: number = 0
): Promise<string> => {
  // Rate Limiting Check
  const now = Date.now();
  if (now - lastCallTime < MIN_INTERVAL) {
      return getRandomFallback();
  }
  lastCallTime = now;

  const text = await requestCommentary({
    kind: 'commentary',
    attacker,
    moveId: move.id,
    moveName: move.name,
    moveKhmerName: move.khmerName,
    wasHit,
    remainingHealth,
    gameMode,
    opponentName,
    comboCount,
  });

  return text || getRandomFallback();
};

export const generateMatchIntro = async (
    gameMode: string = 'PVE',
    opponentName: string = 'Opponent'
): Promise<string> => {
  const text = await requestCommentary({
    kind: 'intro',
    gameMode,
    opponentName,
  });

  return text || "Welcome to the Kun Khmer Arena! Fighters are ready!";
};
