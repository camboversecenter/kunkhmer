

import { GoogleGenAI } from "@google/genai";
import { Move, MoveType } from "../types";

let client: GoogleGenAI | null = null;
let lastCallTime = 0;
const MIN_INTERVAL = 3500; // Minimum 3.5 seconds between API calls to save quota

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

const getClient = () => {
  if (!client && process.env.API_KEY) {
    /* Always use named parameter for apiKey */
    client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return client;
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

  const ai = getClient();
  if (!ai) return getRandomFallback();

  lastCallTime = now;

  let moveDetail = "";
  switch(move.id) {
      case MoveType.ELBOW: moveDetail = "A slicing elbow (Sok), known for causing cuts."; break;
      case MoveType.KNEE: moveDetail = "A rib-crushing knee (Kumpleang)."; break;
      case MoveType.KICK: moveDetail = "A powerful roundhouse kick (Ti) with the shin."; break;
      case MoveType.PUNCH: moveDetail = "A precise punch (Mat)."; break;
      case MoveType.UPPERCUT: moveDetail = "A rising uppercut (Mok Keng) aiming for the chin."; break;
      case MoveType.TAUNT: moveDetail = "Psychological warfare, taunting the opponent."; break;
      case MoveType.BLOCK: moveDetail = "A solid defensive guard (Rung)."; break;
      case MoveType.ROLL: moveDetail = "An evasive tactical roll (Romiel)."; break;
  }

  let healthStatus = "Both fighters are trading blows!";
  if (remainingHealth < 15) healthStatus = "KNOCKOUT IMMINENT! The fighter is barely standing!";
  else if (remainingHealth < 35) healthStatus = "CRITICAL CONDITION - One clean hit could end it!";
  else if (remainingHealth < 60) healthStatus = "Showing signs of heavy fatigue and damage.";
  else if (remainingHealth > 85) healthStatus = "Still looking fresh and dangerous.";

  const comboText = comboCount > 1 ? `Currently unleashing a ${comboCount}-hit combination!` : "Looking for an opening.";
  const modeContext = gameMode === 'ADVENTURE' ? "High-stakes adventure mode battle." : "Standard competitive match.";

  const prompt = `
    You are a legendary Kun Khmer ring announcer commenting on a live match.
    
    MATCH CONTEXT:
    Mode: ${modeContext}
    Matchup: Player vs ${opponentName}
    
    CURRENT ACTION:
    Attacker: ${attacker}
    Move: ${move.khmerName} (${move.name})
    Outcome: ${wasHit ? 'CLEAN HIT' : 'MISSED/BLOCKED/DODGED'}
    Context: ${moveDetail}
    Combo: ${comboText}
    Receiver Health: ${remainingHealth}% - ${healthStatus}

    INSTRUCTION:
    Generate a SINGLE, explosive, hyping commentary sentence (max 15 words).
    - If health is critical (<25%), scream about the potential knockout!
    - Use Kun Khmer terminology (Sok, Ti, Mat, Kumpleang) naturally.
    - If a combo > 1 is active, hype up the flurry of strikes.
    - React specifically to the move used (e.g. "That Ti cut right through!").
    - Do NOT use quotes.
  `;

  try {
    /* Use gemini-3-flash-preview for text tasks */
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    /* Access .text property directly */
    return response.text?.trim() || getRandomFallback();
  } catch (error: any) {
    if (error?.status === 429 || error?.code === 429 || error?.message?.includes('quota')) {
        console.warn("Gemini Quota Exceeded - using fallback.");
        return getRandomFallback();
    }
    console.error("Gemini API Error:", error);
    return getRandomFallback();
  }
};

export const generateMatchIntro = async (
    gameMode: string = 'PVE',
    opponentName: string = 'Opponent'
): Promise<string> => {
  const ai = getClient();
  if (!ai) return "Welcome to the Kun Khmer Arena! Fighters are ready!";

  const prompt = `
    Generate a short, hype 1-sentence introduction for a Kun Khmer fight.
    Context: Player vs ${opponentName} in ${gameMode} mode.
    If Adventure mode, mention the specific challenge of ${opponentName}.
    If PvP, mention the clash of warriors.
    Use high energy.
  `;

  try {
    /* Use gemini-3-flash-preview for text tasks */
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    /* Access .text property directly */
    return response.text?.trim() || "Welcome to the Kun Khmer Arena! Fighters are ready!";
  } catch (error) {
    return "Welcome to the Kun Khmer Arena! Fighters are ready!";
  }
};
