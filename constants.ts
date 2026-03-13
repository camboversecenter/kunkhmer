
import { Move, MoveType, SakYantType, SakYantData, FighterStats, PlayerInventory, HeroId, HeroData } from './types';

export const MOVES: Record<string, Move> = {
  [MoveType.PUNCH]: {
    id: MoveType.PUNCH,
    name: 'Punch',
    khmerName: 'ម៉ាត់', // Mat
    damage: 12,
    staminaCost: 10,
    hitChance: 0.95,
    color: '#3b82f6' // Blue
  },
  [MoveType.UPPERCUT]: {
    id: MoveType.UPPERCUT,
    name: 'Uppercut',
    khmerName: 'មក់កេង', // Mok Keng
    damage: 18,
    staminaCost: 20,
    hitChance: 0.85,
    color: '#1d4ed8' // Darker Blue
  },
  [MoveType.KICK]: {
    id: MoveType.KICK,
    name: 'Kick',
    khmerName: 'ទាត់', // Teat
    damage: 20,
    staminaCost: 25,
    hitChance: 0.75,
    color: '#ca8a04' // Yellow
  },
  [MoveType.ELBOW]: {
    id: MoveType.ELBOW,
    name: 'Elbow',
    khmerName: 'កែង', // Sok
    damage: 28,
    staminaCost: 35,
    hitChance: 0.65,
    color: '#dc2626' // Red
  },
  [MoveType.KNEE]: {
    id: MoveType.KNEE,
    name: 'Knee',
    khmerName: 'ជង្គង់', // Jong Kong
    damage: 35,
    staminaCost: 45,
    hitChance: 0.55,
    color: '#9333ea' // Purple
  },
  [MoveType.BLOCK]: {
    id: MoveType.BLOCK,
    name: 'Block',
    khmerName: 'រង', // Rung
    damage: 0,
    staminaCost: -15, // Regenerate stamina
    hitChance: 1.0,
    color: '#16a34a' // Green
  },
  [MoveType.BLOCK_HIT]: {
    id: MoveType.BLOCK_HIT,
    name: 'Block Impact',
    khmerName: 'រង',
    damage: 0,
    staminaCost: 0,
    hitChance: 1.0,
    color: '#16a34a'
  },
  [MoveType.TAUNT]: {
    id: MoveType.TAUNT,
    name: 'Taunt',
    khmerName: 'ឌឺដង', // Deu Dong
    damage: 0,
    staminaCost: -20, // Major stamina regen
    hitChance: 1.0,
    color: '#db2777' // Pink
  },
  [MoveType.ROLL]: {
    id: MoveType.ROLL,
    name: 'Dodge Roll',
    khmerName: 'រមៀល', // Romiel
    damage: 0,
    staminaCost: 20,
    hitChance: 0,
    color: '#9ca3af' // Gray
  },
  [MoveType.VICTORY_POSE]: {
    id: MoveType.VICTORY_POSE,
    name: 'Victory',
    khmerName: 'ជ័យជំនះ', // Chey Chomneah
    damage: 0,
    staminaCost: 0,
    hitChance: 0,
    color: '#facc15' // Gold
  }
};

export const HEROES_DB: Record<HeroId, HeroData> = {
    [HeroId.DARA]: {
        id: HeroId.DARA,
        name: "Dara",
        khmerName: "តារា",
        description: "The Eagle. Agile and precise. Specializes in rapid Kicks and evasion.",
        color: "#0ea5e9", // Sky Blue
        attributes: { strength: 6, agility: 10, technique: 8, vitality: 6 },
        modifiers: {
            punch: 0.9,
            kick: 1.3, // Strong kicks
            elbow: 0.9,
            knee: 1.0,
            speed: 1.2, // Fast movement
            defense: 1.1 // Takes 10% more damage (squishy)
        },
        unlockDescription: "Unlocked by default.",
        requiredStage: 0
    },
    [HeroId.SOMBATH]: {
        id: HeroId.SOMBATH,
        name: "Sombath",
        khmerName: "សម្បត្តិ",
        description: "The Ox. A powerhouse brawler. Deadly Elbows and Punches, but slower.",
        color: "#dc2626", // Red
        attributes: { strength: 10, agility: 5, technique: 6, vitality: 9 },
        modifiers: {
            punch: 1.2, // Strong punch
            kick: 0.9,
            elbow: 1.4, // Deadly elbow
            knee: 1.0,
            speed: 0.85, // Slow
            defense: 0.9 // Takes 10% less damage
        },
        unlockDescription: "Clear Adventure Stage 5 (Hall of Dancers) to unlock.",
        requiredStage: 5
    },
    [HeroId.VIBOL]: {
        id: HeroId.VIBOL,
        name: "Vibol",
        khmerName: "វិបុល",
        description: "The Iron Mountain. Unstoppable endurance. Master of Knees and blocking.",
        color: "#16a34a", // Green
        attributes: { strength: 8, agility: 4, technique: 7, vitality: 10 },
        modifiers: {
            punch: 1.0,
            kick: 1.0,
            elbow: 1.0,
            knee: 1.5, // Devastating Knees
            speed: 0.9,
            defense: 0.8 // Takes 20% less damage (Tank)
        },
        unlockDescription: "Clear Adventure Stage 10 (Tower Warden) to unlock.",
        requiredStage: 10
    }
};

export const GAME_ECONOMY = {
    BASE_XP: 50,
    BASE_CURRENCY: 25, // Prak Doung
    XP_DIFFICULTY_MULTIPLIER: {
        EASY: 0.8,
        MEDIUM: 1.0,
        HARD: 1.5
    },
    LEVEL_BASE_XP: 100,
    LEVEL_MULTIPLIER: 1.2, 
    REINFORCE_BASE_COST: 150, 
    REINFORCE_INTEGRITY_BONUS: 100, // Boosted reinforcement bonus
    HERO_BASE_XP: 200, // XP needed for first hero level up
    HERO_LEVEL_MULTIPLIER: 1.3, // Curve for hero levels
    HERO_STAT_GAIN_PER_LEVEL: 0.02 // 2% stat boost per level
};

export const FIGHTER_CONFIG = {
  PLAYER_COLOR: '#3b82f6', 
  CPU_COLOR: '#ef4444',    
  FLOOR_COLOR: '#374151',
  ROPE_COLOR: '#dc2626'
};

export const skinBase = {
    color: "#d2b48c",
    roughness: 0.5,
    metalness: 0.0,
    clearcoat: 0.1,
    clearcoatRoughness: 0.25,
    sheen: 0.5,
    sheenRoughness: 0.5,
    sheenColor: "#ffecd2"
};

export const skinFlushed = {
    color: "#cc9e8e",
    roughness: 0.45,
    metalness: 0.0,
    clearcoat: 0.15,
    clearcoatRoughness: 0.2,
    sheen: 0.6,
    sheenColor: "#ffccd2"
};

export const shortsMaterial = {
    roughness: 0.8,
    metalness: 0.05
};

export const INITIAL_INVENTORY: PlayerInventory = {
  unlockedYants: {
    [SakYantType.HANUMAN]: 1, 
    [SakYantType.GAO_YORD]: 0,
    [SakYantType.TWIN_TIGER]: 0,
    [SakYantType.NAGA]: 0
  },
  durabilityLevels: {
    [SakYantType.HANUMAN]: 0,
    [SakYantType.GAO_YORD]: 0,
    [SakYantType.TWIN_TIGER]: 0,
    [SakYantType.NAGA]: 0
  },
  sakYantPieces: {
    [SakYantType.HANUMAN]: 0,
    [SakYantType.GAO_YORD]: 0,
    [SakYantType.TWIN_TIGER]: 0,
    [SakYantType.NAGA]: 0
  },
  unlockedHeroes: {
      [HeroId.DARA]: true,
      [HeroId.SOMBATH]: false,
      [HeroId.VIBOL]: false
  },
  heroLevels: {
      [HeroId.DARA]: 1,
      [HeroId.SOMBATH]: 1,
      [HeroId.VIBOL]: 1
  },
  heroExp: {
      [HeroId.DARA]: 0,
      [HeroId.SOMBATH]: 0,
      [HeroId.VIBOL]: 0
  }
};

export const SAK_YANT_DB: Record<SakYantType, SakYantData> = {
  [SakYantType.HANUMAN]: {
    id: SakYantType.HANUMAN,
    name: 'Hanuman',
    khmerName: 'ហនុមាន',
    color: '#4ade80', // Green
    attributes: { strength: 4, agility: 10, endurance: 6, magic: 5 },
    levels: {
      1: { level: 1, description: 'Stamina Regen +10%', effectValue: 1.1, maxIntegrity: 250, upgradeCost: 100, piecesRequired: 3 },
      2: { level: 2, description: 'Stamina Regen +20%', effectValue: 1.2, maxIntegrity: 400, upgradeCost: 200, piecesRequired: 5 },
      3: { level: 3, description: 'Stamina Regen +30%, Dodge Chance 5%', effectValue: 1.3, secondaryEffect: 0.05, maxIntegrity: 550, upgradeCost: 400, piecesRequired: 8 },
      4: { level: 4, description: 'Stamina Regen +40%, Dodge Chance 10%', effectValue: 1.4, secondaryEffect: 0.10, maxIntegrity: 750, upgradeCost: 800, piecesRequired: 12 },
      5: { level: 5, description: 'Stamina Regen +50%, Dodge Chance 15%', effectValue: 1.5, secondaryEffect: 0.15, maxIntegrity: 1000, upgradeCost: 1600, piecesRequired: 20 },
    }
  },
  [SakYantType.GAO_YORD]: {
    id: SakYantType.GAO_YORD,
    name: 'Gao Yord',
    khmerName: 'កោ​​​យ័ន្ត',
    color: '#facc15', // Gold
    attributes: { strength: 3, agility: 3, endurance: 10, magic: 8 },
    levels: {
      1: { level: 1, description: 'Damage Taken -10%', effectValue: 0.9, maxIntegrity: 200, upgradeCost: 150, piecesRequired: 3 },
      2: { level: 2, description: 'Damage Taken -15%', effectValue: 0.85, maxIntegrity: 350, upgradeCost: 300, piecesRequired: 5 },
      3: { level: 3, description: 'Damage Taken -20%, Reflect 5%', effectValue: 0.8, secondaryEffect: 0.05, maxIntegrity: 500, upgradeCost: 600, piecesRequired: 8 },
      4: { level: 4, description: 'Damage Taken -25%, Reflect 10%', effectValue: 0.75, secondaryEffect: 0.10, maxIntegrity: 700, upgradeCost: 1200, piecesRequired: 12 },
      5: { level: 5, description: 'Damage Taken -30%, Reflect 15%', effectValue: 0.7, secondaryEffect: 0.15, maxIntegrity: 900, upgradeCost: 2400, piecesRequired: 20 },
    }
  },
  [SakYantType.TWIN_TIGER]: {
    id: SakYantType.TWIN_TIGER,
    name: 'Twin Tiger',
    khmerName: 'យ័ន្តខ្លា',
    color: '#f97316', // Orange/Red
    attributes: { strength: 10, agility: 7, endurance: 4, magic: 3 },
    levels: {
      1: { level: 1, description: 'Damage Dealt +10%', effectValue: 1.1, maxIntegrity: 300, upgradeCost: 150, piecesRequired: 3 },
      2: { level: 2, description: 'Damage Dealt +20%', effectValue: 1.2, maxIntegrity: 450, upgradeCost: 300, piecesRequired: 5 },
      3: { level: 3, description: 'Damage Dealt +25%, Crit Chance +10%', effectValue: 1.25, secondaryEffect: 0.1, maxIntegrity: 600, upgradeCost: 600, piecesRequired: 8 },
      4: { level: 4, description: 'Damage Dealt +30%, Crit Chance +15%', effectValue: 1.3, secondaryEffect: 0.15, maxIntegrity: 800, upgradeCost: 1200, piecesRequired: 12 },
      5: { level: 5, description: 'Damage Dealt +40%, Crit Chance +20%', effectValue: 1.4, secondaryEffect: 0.2, maxIntegrity: 1100, upgradeCost: 2400, piecesRequired: 20 },
    }
  },
  [SakYantType.NAGA]: {
    id: SakYantType.NAGA,
    name: 'Naga',
    khmerName: 'នាគ',
    color: '#06b6d4', // Cyan
    attributes: { strength: 5, agility: 4, endurance: 8, magic: 9 },
    levels: {
        1: { level: 1, description: 'Max Health +20%', effectValue: 1.2, maxIntegrity: 300, upgradeCost: 200, piecesRequired: 3 },
        2: { level: 2, description: 'Max Health +30%', effectValue: 1.3, maxIntegrity: 450, upgradeCost: 400, piecesRequired: 5 },
        3: { level: 3, description: 'Max Health +40%, Life Steal 5%', effectValue: 1.4, secondaryEffect: 0.05, maxIntegrity: 650, upgradeCost: 800, piecesRequired: 8 },
        4: { level: 4, description: 'Max Health +50%, Life Steal 10%', effectValue: 1.5, secondaryEffect: 0.10, maxIntegrity: 850, upgradeCost: 1600, piecesRequired: 12 },
        5: { level: 5, description: 'Max Health +70%, Life Steal 15%', effectValue: 1.7, secondaryEffect: 0.15, maxIntegrity: 1200, upgradeCost: 3200, piecesRequired: 20 },
    }
  }
};

export const ADVENTURE_OPPONENTS: FighterStats[] = [
    // --- THE OUTER ENCLOSURE ---
    { 
        name: "Bridge Guard", 
        locationName: "Naga Bridge",
        mapPosition: { x: 50, y: 95 },
        description: "Guards the western causeway entrance.",
        maxHealth: 400, currentHealth: 400, stamina: 100, maxStamina: 100, activeSakYant: null 
    },
    { 
        name: "Moat Patrol", 
        locationName: "Western Moat",
        mapPosition: { x: 50, y: 88 },
        description: "Patrols the waters surrounding the complex.",
        maxHealth: 450, currentHealth: 450, stamina: 105, maxStamina: 105, activeSakYant: null 
    },
    { 
        name: "Gatekeeper", 
        locationName: "West Gopura",
        mapPosition: { x: 50, y: 80 },
        description: "The first true test of the temple.",
        maxHealth: 500, currentHealth: 500, stamina: 120, maxStamina: 120, activeSakYant: { type: SakYantType.HANUMAN, level: 1, currentIntegrity: 250, maxIntegrity: 250 } 
    },
    { 
        name: "The Scholar", 
        locationName: "South Library",
        mapPosition: { x: 30, y: 70 },
        description: "Uses ancient techniques found in scrolls.",
        maxHealth: 550, currentHealth: 550, stamina: 110, maxStamina: 110, activeSakYant: { type: SakYantType.GAO_YORD, level: 1, currentIntegrity: 300, maxIntegrity: 300 } 
    },
    { 
        name: "The Archivist", 
        locationName: "North Library",
        mapPosition: { x: 70, y: 70 },
        description: "A master of defensive arts.",
        maxHealth: 600, currentHealth: 600, stamina: 120, maxStamina: 120, activeSakYant: { type: SakYantType.NAGA, level: 2, currentIntegrity: 350, maxIntegrity: 350 } 
    },

    // --- THE MIDDLE ENCLOSURE ---
    { 
        name: "Relief Guardian", 
        locationName: "Outer Gallery",
        mapPosition: { x: 20, y: 50 },
        description: "His skin is as hard as the stone walls.",
        maxHealth: 700, currentHealth: 700, stamina: 130, maxStamina: 130, activeSakYant: { type: SakYantType.TWIN_TIGER, level: 2, currentIntegrity: 400, maxIntegrity: 400 } 
    },
    { 
        name: "Apsara Dancer", 
        locationName: "Hall of Dancers",
        mapPosition: { x: 80, y: 50 },
        description: "Deceptively fast and agile movements.",
        maxHealth: 650, currentHealth: 650, stamina: 180, maxStamina: 180, activeSakYant: { type: SakYantType.HANUMAN, level: 3, currentIntegrity: 500, maxIntegrity: 500 } 
    },
    { 
        name: "Terrace Sentinel", 
        locationName: "Cruciform Terrace",
        mapPosition: { x: 50, y: 55 },
        description: "Watches over the crossroads of the temple.",
        maxHealth: 800, currentHealth: 800, stamina: 140, maxStamina: 140, activeSakYant: { type: SakYantType.GAO_YORD, level: 3, currentIntegrity: 550, maxIntegrity: 550 } 
    },
    { 
        name: "Shadow Monk", 
        locationName: "Echo Gallery",
        mapPosition: { x: 35, y: 40 },
        description: "Strikes from the darkness.",
        maxHealth: 750, currentHealth: 750, stamina: 160, maxStamina: 160, activeSakYant: { type: SakYantType.TWIN_TIGER, level: 3, currentIntegrity: 600, maxIntegrity: 600 } 
    },
    { 
        name: "Wall Breaker", 
        locationName: "Inner Enclosure",
        mapPosition: { x: 65, y: 40 },
        description: "Can shatter stones with his knees.",
        maxHealth: 900, currentHealth: 900, stamina: 150, maxStamina: 150, activeSakYant: { type: SakYantType.HANUMAN, level: 4, currentIntegrity: 650, maxIntegrity: 650 } 
    },

    // --- THE INNER SANCTUARY (BAKAN) ---
    { 
        name: "Tower Warden SW", 
        locationName: "Corner Tower SW",
        mapPosition: { x: 30, y: 25 },
        description: "Protector of the first peak.",
        maxHealth: 1000, currentHealth: 1000, stamina: 180, maxStamina: 180, activeSakYant: { type: SakYantType.NAGA, level: 3, currentIntegrity: 700, maxIntegrity: 700 } 
    },
    { 
        name: "Tower Warden NE", 
        locationName: "Corner Tower NE",
        mapPosition: { x: 70, y: 25 },
        description: "Protector of the second peak.",
        maxHealth: 1100, currentHealth: 1100, stamina: 190, maxStamina: 190, activeSakYant: { type: SakYantType.TWIN_TIGER, level: 4, currentIntegrity: 750, maxIntegrity: 750 } 
    },
    { 
        name: "The Climber", 
        locationName: "Stairs to Bakan",
        mapPosition: { x: 40, y: 15 },
        description: "Only the worthy may ascend.",
        maxHealth: 1200, currentHealth: 1200, stamina: 200, maxStamina: 200, activeSakYant: { type: SakYantType.GAO_YORD, level: 4, currentIntegrity: 800, maxIntegrity: 800 } 
    },
    { 
        name: "Royal Executioner", 
        locationName: "Upper Terrace",
        mapPosition: { x: 60, y: 15 },
        description: "The King's personal bodyguard.",
        maxHealth: 1400, currentHealth: 1400, stamina: 220, maxStamina: 220, activeSakYant: { type: SakYantType.TWIN_TIGER, level: 5, currentIntegrity: 1000, maxIntegrity: 1000 } 
    },
    { 
        name: "The God King", 
        locationName: "Central Sanctuary",
        mapPosition: { x: 50, y: 5 },
        description: "The Avatar of Vishnu. The ultimate master.",
        maxHealth: 2000, currentHealth: 2000, stamina: 350, maxStamina: 350, activeSakYant: { type: SakYantType.NAGA, level: 5, currentIntegrity: 2000, maxIntegrity: 2000 } 
    }
];
