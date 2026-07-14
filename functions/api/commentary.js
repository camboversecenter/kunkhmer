// Cloudflare Pages Function: POST /api/commentary
// Keeps GEMINI_API_KEY server-side (set it as a secret in the Cloudflare Pages
// dashboard, or in .dev.vars for local `wrangler pages dev`). The browser never
// sees the key. The endpoint only produces fight commentary: all inputs are
// whitelisted or clamped before they reach the prompt.

const GEMINI_MODEL = 'gemini-3-flash-preview';

const MOVE_DETAILS = {
  ELBOW: 'A slicing elbow (Sok), known for causing cuts.',
  KNEE: 'A rib-crushing knee (Kumpleang).',
  KICK: 'A powerful roundhouse kick (Ti) with the shin.',
  PUNCH: 'A precise punch (Mat).',
  UPPERCUT: 'A rising uppercut (Mok Keng) aiming for the chin.',
  TAUNT: 'Psychological warfare, taunting the opponent.',
  BLOCK: 'A solid defensive guard (Rung).',
  ROLL: 'An evasive tactical roll (Romiel).',
};

const clampText = (value, maxLen) =>
  typeof value === 'string' ? value.replace(/[\r\n]+/g, ' ').slice(0, maxLen) : '';

const clampNumber = (value, min, max, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
};

function buildCommentaryPrompt(body) {
  const attacker = body.attacker === 'Opponent' ? 'Opponent' : 'Player';
  const moveDetail = MOVE_DETAILS[body.moveId] || '';
  const moveName = clampText(body.moveName, 40) || 'strike';
  const moveKhmerName = clampText(body.moveKhmerName, 40) || moveName;
  const wasHit = body.wasHit === true;
  const remainingHealth = clampNumber(body.remainingHealth, 0, 100, 100);
  const comboCount = clampNumber(body.comboCount, 0, 99, 0);
  const opponentName = clampText(body.opponentName, 30) || 'Opponent';
  const modeContext =
    body.gameMode === 'ADVENTURE'
      ? 'High-stakes adventure mode battle.'
      : 'Standard competitive match.';

  let healthStatus = 'Both fighters are trading blows!';
  if (remainingHealth < 15) healthStatus = 'KNOCKOUT IMMINENT! The fighter is barely standing!';
  else if (remainingHealth < 35) healthStatus = 'CRITICAL CONDITION - One clean hit could end it!';
  else if (remainingHealth < 60) healthStatus = 'Showing signs of heavy fatigue and damage.';
  else if (remainingHealth > 85) healthStatus = 'Still looking fresh and dangerous.';

  const comboText =
    comboCount > 1 ? `Currently unleashing a ${comboCount}-hit combination!` : 'Looking for an opening.';

  return `
    You are a legendary Kun Khmer ring announcer commenting on a live match.

    MATCH CONTEXT:
    Mode: ${modeContext}
    Matchup: Player vs ${opponentName}

    CURRENT ACTION:
    Attacker: ${attacker}
    Move: ${moveKhmerName} (${moveName})
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
}

function buildIntroPrompt(body) {
  const opponentName = clampText(body.opponentName, 30) || 'Opponent';
  const gameMode = body.gameMode === 'ADVENTURE' ? 'ADVENTURE' : 'PVE';

  return `
    Generate a short, hype 1-sentence introduction for a Kun Khmer fight.
    Context: Player vs ${opponentName} in ${gameMode} mode.
    If Adventure mode, mention the specific challenge of ${opponentName}.
    If PvP, mention the clash of warriors.
    Use high energy.
  `;
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.GEMINI_API_KEY) {
    return json({ error: 'not_configured' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  let prompt;
  if (body && body.kind === 'commentary') prompt = buildCommentaryPrompt(body);
  else if (body && body.kind === 'intro') prompt = buildIntroPrompt(body);
  else return json({ error: 'bad_request' }, 400);

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY,
        },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (!upstream.ok) {
      return json({ error: 'upstream', status: upstream.status }, 502);
    }

    const data = await upstream.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    return json({ text });
  } catch {
    return json({ error: 'upstream' }, 502);
  }
}
