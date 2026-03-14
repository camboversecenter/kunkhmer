
import React from 'react';
import { ThreeElements } from '@react-three/fiber';

export enum GameState {
  MENU = 'MENU',
  CHARACTER_SELECT = 'CHARACTER_SELECT',
  RITUAL = 'RITUAL', // New: Pre-fight rhythm phase
  FIGHTING = 'FIGHTING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  SAK_YANT_MENU = 'SAK_YANT_MENU',
  LEADERBOARD = 'LEADERBOARD',
  ONLINE_LOBBY = 'ONLINE_LOBBY',
  HOW_TO_PLAY = 'HOW_TO_PLAY',
  ADVENTURE_MAP = 'ADVENTURE_MAP'
}

export enum GameMode {
  PVE = 'PVE',
  ADVENTURE = 'ADVENTURE',
  PVP_ONLINE = 'PVP_ONLINE'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum MoveType {
  IDLE = 'IDLE',
  PUNCH = 'PUNCH', // Mat
  UPPERCUT = 'UPPERCUT', // Mok Keng
  KICK = 'KICK',   // Ti
  ELBOW = 'ELBOW', // Sok
  KNEE = 'KNEE',   // Kumpleang
  BLOCK = 'BLOCK',
  BLOCK_HIT = 'BLOCK_HIT', // Visual state for successful block impact
  TAUNT = 'TAUNT',
  ROLL = 'ROLL',   // Dodge Roll
  HIT = 'HIT',
  KNOCKOUT = 'KNOCKOUT',
  VICTORY_POSE = 'VICTORY_POSE',
  RITUAL_KNEEL = 'RITUAL_KNEEL', // New: Ritual animations
  RITUAL_DANCE = 'RITUAL_DANCE'
}

export enum SakYantType {
  HANUMAN = 'HANUMAN',      // Agility / Stamina
  GAO_YORD = 'GAO_YORD',    // Defense / Protection
  TWIN_TIGER = 'TWIN_TIGER', // Power / Crit
  NAGA = 'NAGA'             // Health / Regen
}

// --- NEW HERO TYPES ---
export enum HeroId {
    DARA = 'DARA',
    SOMBATH = 'SOMBATH',
    VIBOL = 'VIBOL'
}

export enum CombatStyle {
    NAK_DAL = 'NAK_DAL',     // Puncher
    NAK_TOAT = 'NAK_TOAT',   // Kicker
    NAK_KAENG = 'NAK_KAENG' // Elbowist
}

export enum ProvinceId {
    PP = 'PHNOM_PENH',
    SR = 'SIEM_REAP',
    BTB = 'BATTAMBANG',
    KPC = 'KAMPONG_CHAM',
    KPS = 'KAMPONG_SPEU',
    KPT = 'KAMPOT',
    KEP = 'KEP',
    KOK = 'KOH_KONG',
    KRT = 'KRATIE',
    MDK = 'MONDULKIRI',
    BMC = 'BANTEAY_MEANCHEY',
    ODC = 'ODDAR_MEANCHEY',
    PLN = 'PAILIN',
    PREV = 'PREAH_VIHEAR',
    PRV = 'PREY_VENG',
    PS = 'PURSAT',
    RTK = 'RATANAKIRI',
    ST = 'STUNG_TRENG',
    SVR = 'SVAY_RIENG',
    TKM = 'TAKEO',
    TBK = 'TBONG_KHMUM'
}

export interface HeroAttributes {
    strength: number; // Punch/Elbow Dmg
    agility: number;  // Speed/Stamina
    technique: number; // Kick/Knee Dmg
    vitality: number; // Health
}

export interface HeroData {
    id: HeroId;
    name: string;
    description: string;
    khmerName: string;
    color: string;
    attributes: HeroAttributes;
    // Multipliers for specific moves (1.0 is base)
    modifiers: {
        punch: number;
        kick: number;
        elbow: number;
        knee: number;
        speed: number; // Movement speed
        defense: number; // Damage reduction (lower is better, e.g. 0.9)
    };
    unlockDescription?: string; // Text to show if locked
    requiredStage?: number; // Adventure stage needed to unlock
}

export interface SakYantLevel {
  level: number;
  description: string;
  effectValue: number; // % multiplier
  secondaryEffect?: number; // e.g., crit chance
  maxIntegrity: number; // Durability of the book
  upgradeCost: number; // Cost in Prak Doung
  piecesRequired: number; // Fragments required to unlock/upgrade
}

export interface SakYantAttributes {
    strength: number;  // Damage scaling
    agility: number;   // Speed / Stamina
    endurance: number; // Defense / Health
    magic: number;     // Special effects (Proc chance)
}

export interface SakYantData {
  id: SakYantType;
  name: string;
  khmerName: string;
  color: string;
  attributes: SakYantAttributes;
  levels: Record<number, SakYantLevel>;
}

export interface PlayerInventory {
  unlockedYants: Record<SakYantType, number>; // 0 = Locked, 1+ = Level
  durabilityLevels?: Record<SakYantType, number>; // Extra reinforcement levels
  sakYantPieces?: Record<SakYantType, number>; // Fragments collected for each type
  unlockedHeroes?: Record<HeroId, boolean>; // Track unlocked characters
  heroLevels?: Record<HeroId, number>; // Level of each hero
  heroExp?: Record<HeroId, number>; // Current XP of each hero
}

export interface RitualBuff {
    isActive: boolean;
    timeLeft: number; // Duration in seconds
    staminaMultiplier: number;
    defenseMultiplier: number;
}

export interface FighterStats {
  heroId?: HeroId; // Track which hero this is
  name?: string;
  locationName?: string; // For map
  mapPosition?: { x: number, y: number }; // For map
  description?: string;
  maxHealth: number;
  currentHealth: number;
  stamina: number;
  maxStamina: number;
  staminaRegenMultiplier?: number;
  spiritGauge: number;
  isSpiritMode: boolean;
  combatStyle?: CombatStyle;
  ritualBuff?: RitualBuff; // New: Spirit Buff data
  // Dynamic modifiers based on Hero selection
  damageModifiers?: {
      punch: number;
      kick: number;
      elbow: number;
      knee: number;
      defense: number;
  };
  activeSakYant: {
    type: SakYantType;
    level: number;
    currentIntegrity: number;
    maxIntegrity: number;
  } | null;
}

export interface Move {
  id: MoveType;
  name: string;
  khmerName: string;
  damage: number;
  staminaCost: number;
  hitChance: number;
  color: string;
}

export interface Commentary {
    id: string;
    text: string;
    timestamp: number;
    author: 'AI' | 'System';
}

export interface SceneryTheme {
  id: string;
  name: string;
  skyTop: string;
  skyBottom: string;
  ground: string;
  fogColor: string;
  sunColor: string;
  ambientIntensity: number;
  templeColor: string;
  templeEmissive: string;
  environmentPreset: 'sunset' | 'park' | 'night' | 'city' | 'forest' | 'studio';
}

export type GraphicsPreset = 'LOW' | 'BALANCED' | 'HIGH' | 'ULTRA';
export type GraphicsMode = 'AUTO' | GraphicsPreset;
export type GpuTier = 'UNKNOWN' | 'LOW' | 'MID' | 'HIGH';
export type NetworkClass = 'OFFLINE' | 'SLOW' | 'STANDARD' | 'FAST';
export type AssetDownloadPlan = 'ESSENTIAL' | 'BALANCED' | 'FULL';

export interface RendererTelemetry {
  renderer: string;
  vendor: string;
  maxTextureSize: number | null;
  anisotropy: number;
}

export interface DeviceCapabilities {
  cpuCores: number;
  memoryGB: number | null;
  devicePixelRatio: number;
  screenPixels: number;
  isMobile: boolean;
  networkClass: NetworkClass;
  saveData: boolean;
  renderer: string;
  vendor: string;
  gpuTier: GpuTier;
  recommendedPreset: GraphicsPreset;
  maxTextureSize: number | null;
  anisotropy: number;
}

export interface DevicePerformanceProfile extends DeviceCapabilities {
  preset: GraphicsPreset;
  dpr: [number, number];
  antialias: boolean;
  enableShadows: boolean;
  shadowMapSize: number;
  enablePostProcessing: boolean;
  bloomIntensity: number;
  vignetteDarkness: number;
  enableEnvironment: boolean;
  sceneryDensity: number;
  crowdDensity: number;
  particleMultiplier: number;
  cloudSegments: number;
  starCount: number;
  characterDetail: 'low' | 'medium' | 'high';
  enableAccentLights: boolean;
  assetPlan: AssetDownloadPlan;
  customModelUrls: string[];
}

export interface AssetDownloadStatus {
  phase: 'idle' | 'checking' | 'downloading' | 'ready';
  plan: AssetDownloadPlan;
  requested: number;
  available: number;
  completed: number;
  message: string;
}

export interface UserProfile {
    name: string;
    email: string;
    picture: string;
    sub?: string;
    provinceId?: ProvinceId;
}

export interface PlayerProfile {
    level: number;
    currentExp: number;
    maxExp: number;
    currency: number;
    adventureStage?: number; // 0 to 14
}

export interface LootReward {
    type: SakYantType;
    amount: number;
}

// --- ONLINE TYPES ---
export interface PeerData {
    type: 'MOVE' | 'STATS_UPDATE' | 'HIT_CONFIRM' | 'GAME_OVER' | 'POSITION' | 'HANDSHAKE';
    move?: MoveType;
    stats?: Partial<FighterStats>;
    health?: number;
    stamina?: number;
    spirit?: number;
    isSpiritMode?: boolean;
    combatStyle?: CombatStyle;
    provinceId?: ProvinceId;
    sakYant?: any;
    damage?: number;
    isBlocked?: boolean;
    winner?: string;
    position?: [number, number, number];
    rotation?: [number, number, number];
}

export type OnlineState = 'LOBBY' | 'HOSTING' | 'JOINING' | 'CONNECTED';

export interface LeaderboardEntry {
    rank: number;
    name: string;
    wins: number;
    picture?: string;
}

export type LeaderboardPeriod = 'ALL_TIME' | 'THIS_SEASON';

/* Fix for JSX elements in R3F. Extend both global and React namespaces to ensure compatibility with HTML and Three.js elements. 
   Merging ThreeElements into the IntrinsicElements interface allows standard React and R3F elements to coexist. */
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {
      [elemName: string]: any;
    }
  }
}
