// =============================================
//  CONFIG.JS — Semua konstanta & definisi data
// =============================================

// --- World ---
const WORLD_W = 6400;
const WORLD_H = 6400;
const TILE = 64;
const COLS = WORLD_W / TILE;   // 100
const ROWS = WORLD_H / TILE;   // 100

// --- Player ---
const PLAYER_SPEED   = 160;
const PLAYER_MAX_HP  = 100;
const MELEE_RANGE    = 85;
const MELEE_DMG      = 25;
const MELEE_CD       = 400;     // ms
const BULLET_SPEED   = 400;
const BULLET_DMG     = 35;
const PICKUP_RANGE   = 65;

// --- Zombies ---
const MAX_ZOMBIES    = 120;
const SPAWN_INTERVAL = 2000;    // ms

const ZTYPES = {
    walker:   { w: 40, hp: 50,  spd: 55,  dmg: 15, det: 250, col: 0x5a8a3c },
    runner:   { w: 30, hp: 30,  spd: 120, dmg: 12, det: 400, col: 0xc44e4e },
    screamer: { w: 20, hp: 25,  spd: 50,  dmg: 8,  det: 300, col: 0x9b59b6 },
    tank:     { w: 10, hp: 150, spd: 40,  dmg: 30, det: 250, col: 0x5d4e37 }
};

// --- Survival (per detik) ---
const HUNGER_DRAIN     = 0.4;
const THIRST_DRAIN     = 0.6;
const ENERGY_DRAIN     = 0.2;
const STARVE_DMG       = 2;
const DEHYDRATE_DMG    = 3;

// --- Day / Night ---
const DAY_LENGTH   = 120;   // detik per siklus penuh
const NIGHT_START  = 0.75;
const NIGHT_END    = 0.25;

// --- Items ---
const ITEMS = {
    bandage:    { cat: 'medical', heal: 25,  col: 0xffffff, lbl: 'Bandage' },
    medkit:     { cat: 'medical', heal: 60,  col: 0xff4444, lbl: 'Medkit' },
    cannedfood: { cat: 'food',    hunger: 30, col: 0xd4a030, lbl: 'Canned Food' },
    water:      { cat: 'drink',   thirst: 35, col: 0x4488ff, lbl: 'Water' },
    energybar:  { cat: 'food',    hunger: 15, energy: 20, col: 0x88cc44, lbl: 'Energy Bar' }
};
const ITEM_KEYS = Object.keys(ITEMS);

// --- Score ---
function calcScore(sec, kills, day) {
    return Math.floor(sec) * 10 + kills * 50 + (day - 1) * 200;
}
