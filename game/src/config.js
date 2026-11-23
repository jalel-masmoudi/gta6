// Coral Bay: Underworld - Game Configuration & Constants

export const GAME_TITLE = 'Coral Bay: Underworld';
export const SAVE_KEY = 'coral_bay_save_v1';
export const STEP = 1 / 60;
export const MAX_FRAME = 0.25;

// World & Map Dimensions
export const MAP_WIDTH = 4800;
export const MAP_HEIGHT = 4800;
export const TILE_SIZE = 120;

// Districts
export const DISTRICTS = [
  { id: 'promenade', name: 'Ocean Promenade', color: '#ff7b54', bounds: { x: 0, y: 0, w: 2400, h: 1600 } },
  { id: 'neon_palms', name: 'Neon Palms', color: '#ea0599', bounds: { x: 2400, y: 0, w: 2400, h: 1600 } },
  { id: 'downtown', name: 'Downtown Spire', color: '#00b4d8', bounds: { x: 0, y: 1600, w: 2400, h: 1800 } },
  { id: 'marina', name: 'Marina Cay', color: '#06d6a0', bounds: { x: 2400, y: 1600, w: 2400, h: 1800 } },
  { id: 'docks', name: 'Industrial Docks', color: '#ffb703', bounds: { x: 0, y: 3400, w: 4800, h: 1400 } },
];

// Special Landmarks & POIs
export const LANDMARKS = [
  { name: 'Ocean View Pier', district: 'Ocean Promenade', x: 480, y: 900, icon: 'anchor' },
  { name: 'Neon Palms Nightclub', district: 'Neon Palms', x: 2800, y: 700, icon: 'cocktail' },
  { name: 'Downtown Spire Tower', district: 'Downtown Spire', x: 1100, y: 2200, icon: 'building' },
  { name: 'Marina Yacht Club', district: 'Marina Cay', x: 3600, y: 1900, icon: 'boat' },
  { name: 'Dock Bay 4 Contraband Depot', district: 'Industrial Docks', x: 1800, y: 3900, icon: 'warehouse' },
];

// Vehicle Types & Specs
export const VEHICLE_TYPES = {
  venom: {
    id: 'venom',
    name: 'Venom GT',
    type: 'Supercar',
    width: 44,
    length: 86,
    maxSpeed: 17.5,
    accel: 0.42,
    reverseSpeed: 6.0,
    handling: 0.046,
    friction: 0.965,
    driftFriction: 0.89,
    health: 350,
    mass: 1200,
    bodyColor: '#ff3b30',
    accentColor: '#1c1c1e',
    soundPitch: 1.3,
  },
  vindicator: {
    id: 'vindicator',
    name: 'Vindicator',
    type: 'Muscle',
    width: 46,
    length: 90,
    maxSpeed: 14.5,
    accel: 0.38,
    reverseSpeed: 5.5,
    handling: 0.038,
    friction: 0.96,
    driftFriction: 0.86,
    health: 480,
    mass: 1650,
    bodyColor: '#1a1a24',
    accentColor: '#ffffff',
    soundPitch: 0.85,
  },
  stallion: {
    id: 'stallion',
    name: 'Stallion LX',
    type: 'Sedan',
    width: 44,
    length: 84,
    maxSpeed: 12.5,
    accel: 0.28,
    reverseSpeed: 5.0,
    handling: 0.042,
    friction: 0.955,
    driftFriction: 0.91,
    health: 400,
    mass: 1450,
    bodyColor: '#0a84ff',
    accentColor: '#d1d1d6',
    soundPitch: 1.0,
  },
  interceptor: {
    id: 'interceptor',
    name: 'CBPD Interceptor',
    type: 'Police Cruiser',
    width: 46,
    length: 88,
    maxSpeed: 16.0,
    accel: 0.40,
    reverseSpeed: 6.0,
    handling: 0.045,
    friction: 0.962,
    driftFriction: 0.90,
    health: 520,
    mass: 1600,
    bodyColor: '#111116',
    accentColor: '#ffffff',
    hasSiren: true,
    soundPitch: 1.15,
  },
  cargo: {
    id: 'cargo',
    name: 'Titan Cargo',
    type: 'Transport Van',
    width: 52,
    length: 104,
    maxSpeed: 9.5,
    accel: 0.18,
    reverseSpeed: 4.0,
    handling: 0.030,
    friction: 0.94,
    driftFriction: 0.92,
    health: 750,
    mass: 2400,
    bodyColor: '#d97706',
    accentColor: '#78350f',
    soundPitch: 0.7,
  },
};

// Weapons Specification
export const WEAPON_TYPES = {
  fists: {
    id: 'fists',
    name: 'Bare Knuckles',
    damage: 20,
    fireRate: 0.35,
    range: 50,
    bulletSpeed: 0,
    ammo: Infinity,
    maxAmmo: Infinity,
    magSize: Infinity,
    color: '#ffcc00',
    recoil: 0,
  },
  pistol: {
    id: 'pistol',
    name: 'Hawk .45 Pistol',
    damage: 34,
    fireRate: 0.28,
    range: 420,
    bulletSpeed: 28,
    ammo: 72,
    maxAmmo: 180,
    magSize: 12,
    color: '#ffd60a',
    spread: 0.06,
    recoil: 3,
  },
  smg: {
    id: 'smg',
    name: 'Viper 9mm SMG',
    damage: 22,
    fireRate: 0.09,
    range: 460,
    bulletSpeed: 32,
    ammo: 150,
    maxAmmo: 360,
    magSize: 30,
    color: '#ff9f0a',
    spread: 0.14,
    recoil: 4.5,
  },
  rifle: {
    id: 'rifle',
    name: 'Titan Assault Rifle',
    damage: 48,
    fireRate: 0.14,
    range: 600,
    bulletSpeed: 38,
    ammo: 120,
    maxAmmo: 300,
    magSize: 30,
    color: '#ff453a',
    spread: 0.08,
    recoil: 6,
  },
};

// Wanted System Thresholds
export const WANTED_LEVELS = [
  { level: 0, threshold: 0, cruisers: 0, officers: 0, aggressive: false, dispatchDelay: 0 },
  { level: 1, threshold: 100, cruisers: 1, officers: 1, aggressive: false, dispatchDelay: 10 },
  { level: 2, threshold: 300, cruisers: 2, officers: 2, aggressive: true, dispatchDelay: 7 },
  { level: 3, threshold: 650, cruisers: 3, officers: 4, aggressive: true, roadblocks: true, dispatchDelay: 5 },
  { level: 4, threshold: 1200, cruisers: 5, officers: 6, aggressive: true, roadblocks: true, dispatchDelay: 3 },
  { level: 5, threshold: 2200, cruisers: 7, officers: 8, aggressive: true, roadblocks: true, dispatchDelay: 2 },
];

// Story Missions
export const MISSIONS = [
  {
    id: 'mission_1',
    title: 'Neon Arrival',
    client: 'Rico Cruz',
    reward: 2500,
    summary: 'Rendezvous with Rico at the Neon Palms club and shake off rival Vance scouts.',
    dialogueStart: 'Jax! Welcome to Coral Bay. Grab a car and get down to Neon Palms before Viktor’s enforcers spot you.',
    dialogueSuccess: 'Clean drive, Jax. You’re on the payroll now. Here is your cut.',
    stages: [
      { text: 'Steal a vehicle and drive to Neon Palms Club', targetType: 'location', x: 2800, y: 700, radius: 100 },
      { text: 'Eliminate 2 Vance scouts scoping the alley', targetType: 'eliminate', count: 2 },
      { text: 'Lose the heat and return to safehouse', targetType: 'lose_wanted' },
    ],
  },
  {
    id: 'mission_2',
    title: 'High-Octane Repo',
    client: 'Rico Cruz',
    reward: 5000,
    summary: 'Steal the prototype Venom GT from the Downtown highrise garage and evade CBPD.',
    dialogueStart: 'There is a prototype Venom GT parked at the Downtown Spire garage. Viktor thinks it is his. Go prove him wrong.',
    dialogueSuccess: 'What a beauty! She screams down the highway. The crew is impressed.',
    stages: [
      { text: 'Head to Downtown Spire garage', targetType: 'location', x: 1100, y: 2200, radius: 120 },
      { text: 'Jack the Venom GT supercar', targetType: 'steal_vehicle', vehicleId: 'venom' },
      { text: 'Evade the 2-Star CBPD pursuit', targetType: 'wanted_escape', stars: 2 },
      { text: 'Deliver the supercar to Marina Warehouse', targetType: 'location', x: 3200, y: 2400, radius: 110 },
    ],
  },
  {
    id: 'mission_3',
    title: 'Warehouse Strike',
    client: 'Selena Vance',
    reward: 8500,
    summary: 'Raid the Vance Syndicate contraband hub at the Industrial Docks.',
    dialogueStart: 'Viktor is storing weapons and black market cash in Dock Bay 4. Hit them hard, Jax. Take no prisoners.',
    dialogueSuccess: 'Contraband secured and Viktor is furious. You own these streets now, Jax.',
    stages: [
      { text: 'Drive to Industrial Docks Bay 4', targetType: 'location', x: 1800, y: 3900, radius: 140 },
      { text: 'Neutralize 5 Vance Syndicate enforcers', targetType: 'eliminate', count: 5 },
      { text: 'Collect the contraband cash stash', targetType: 'pickup_cash', amount: 5000 },
      { text: 'Evade police dragnet to the Harbor Hideout', targetType: 'location', x: 3800, y: 4100, radius: 120 },
    ],
  },
  {
    id: 'mission_4',
    title: 'The Grand Marina Heist',
    client: 'Rico & Selena',
    reward: 20000,
    summary: 'Breach the Marina Vault, seize the bearer bonds, and escape a 4-Star CBPD dragnet.',
    dialogueStart: 'This is the big one. The Marina vault holds $100k in bonds. Security is tight, and CBPD will lock down the whole bay. Floor it!',
    dialogueSuccess: 'YOU PULLED IT OFF! Coral Bay belongs to us. You are the undisputed King of the Underworld!',
    stages: [
      { text: 'Infiltrate Marina Yacht Club Vault', targetType: 'location', x: 3600, y: 1900, radius: 120 },
      { text: 'Eliminate syndicate vault guards', targetType: 'eliminate', count: 6 },
      { text: 'Survive the 4-Star CBPD city dragnet', targetType: 'wanted_escape', stars: 4 },
      { text: 'Deliver the loot to the Coastal Penthouse', targetType: 'location', x: 1200, y: 600, radius: 120 },
    ],
  },
];
