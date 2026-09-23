export type TileType = 
  | 'empty'
  | 'solid_ground'
  | 'solid_brick'
  | 'solid_wood'
  | 'hazard_spikes'
  | 'hazard_lava'
  | 'coin'
  | 'gem'
  | 'star'
  | 'powerup_jump'
  | 'powerup_speed'
  | 'enemy_slime'
  | 'enemy_bat'
  | 'moving_platform_h'
  | 'moving_platform_v'
  | 'player_spawn'
  | 'goal';

export interface TileDefinition {
  type: TileType;
  name: string;
  category: 'terep' | 'csapda' | 'gyűjthető' | 'ellenség' | 'speciális';
  color: string;
  iconChar?: string;
  isSolid?: boolean;
  isHazard?: boolean;
  isCollectible?: boolean;
}

export interface GameSettings {
  gravity: number; // e.g. 0.6
  jumpForce: number; // e.g. -11
  moveSpeed: number; // e.g. 4.5
  allowDoubleJump: boolean;
  maxLives: number;
  enemySpeed: number;
  theme: 'forest' | 'cyber' | 'dungeon' | 'sunset';
  soundEnabled: boolean;
}

export interface LevelData {
  id: string;
  name: string;
  description: string;
  width: number; // in tiles, e.g. 30
  height: number; // in tiles, e.g. 16
  tileSize: number; // px, e.g. 32
  tiles: TileType[][]; // [y][x]
  settings: GameSettings;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  canDoubleJump: boolean;
  facing: 'left' | 'right';
  invulnerableTimer: number;
  hasJumpPowerup: boolean;
  hasSpeedPowerup: boolean;
  speedPowerupTimer: number;
}

export interface EnemyEntity {
  id: number;
  type: 'slime' | 'bat';
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  startX: number;
  patrolDistance: number;
  direction: 1 | -1;
  alive: boolean;
}

export interface MovingPlatformEntity {
  id: number;
  type: 'horizontal' | 'vertical';
  x: number;
  y: number;
  width: number;
  height: number;
  startX: number;
  startY: number;
  range: number;
  progress: number;
  speed: number;
  prevX: number;
  prevY: number;
}

export interface CollectibleEntity {
  id: number;
  type: 'coin' | 'gem' | 'star' | 'powerup_jump' | 'powerup_speed';
  x: number;
  y: number;
  collected: boolean;
}

export const TILE_DEFINITIONS: Record<TileType, TileDefinition> = {
  empty: {
    type: 'empty',
    name: 'Radír / Üres',
    category: 'terep',
    color: 'transparent',
  },
  solid_ground: {
    type: 'solid_ground',
    name: 'Föld & Fű',
    category: 'terep',
    color: '#34d399',
    isSolid: true,
  },
  solid_brick: {
    type: 'solid_brick',
    name: 'Kőtégla',
    category: 'terep',
    color: '#94a3b8',
    isSolid: true,
  },
  solid_wood: {
    type: 'solid_wood',
    name: 'Fapalló',
    category: 'terep',
    color: '#b45309',
    isSolid: true,
  },
  hazard_spikes: {
    type: 'hazard_spikes',
    name: 'Tüskék',
    category: 'csapda',
    color: '#ef4444',
    isHazard: true,
  },
  hazard_lava: {
    type: 'hazard_lava',
    name: 'Láva',
    category: 'csapda',
    color: '#f97316',
    isHazard: true,
  },
  coin: {
    type: 'coin',
    name: 'Arany érme',
    category: 'gyűjthető',
    color: '#eab308',
    isCollectible: true,
  },
  gem: {
    type: 'gem',
    name: 'Smaragd drágakő',
    category: 'gyűjthető',
    color: '#10b981',
    isCollectible: true,
  },
  star: {
    type: 'star',
    name: 'Csillag (+1 Élet)',
    category: 'gyűjthető',
    color: '#facc15',
    isCollectible: true,
  },
  powerup_jump: {
    type: 'powerup_jump',
    name: 'Szuper Ugrás Toll',
    category: 'gyűjthető',
    color: '#38bdf8',
    isCollectible: true,
  },
  powerup_speed: {
    type: 'powerup_speed',
    name: 'Sebesség Cipő',
    category: 'gyűjthető',
    color: '#a855f7',
    isCollectible: true,
  },
  enemy_slime: {
    type: 'enemy_slime',
    name: 'Járőr Nyálka (Slime)',
    category: 'ellenség',
    color: '#84cc16',
  },
  enemy_bat: {
    type: 'enemy_bat',
    name: 'Repülő Denevér',
    category: 'ellenség',
    color: '#6366f1',
  },
  moving_platform_h: {
    type: 'moving_platform_h',
    name: 'Vízszintes Lebegő Lap',
    category: 'speciális',
    color: '#38bdf8',
  },
  moving_platform_v: {
    type: 'moving_platform_v',
    name: 'Függőleges Lift Lap',
    category: 'speciális',
    color: '#818cf8',
  },
  player_spawn: {
    type: 'player_spawn',
    name: 'Játékos Kezdőpont',
    category: 'speciális',
    color: '#60a5fa',
  },
  goal: {
    type: 'goal',
    name: 'Célkapu / Trófea',
    category: 'speciális',
    color: '#ec4899',
  },
};

export const DEFAULT_SETTINGS: GameSettings = {
  gravity: 0.6,
  jumpForce: -11.5,
  moveSpeed: 4.5,
  allowDoubleJump: true,
  maxLives: 3,
  enemySpeed: 1.8,
  theme: 'forest',
  soundEnabled: true,
};
