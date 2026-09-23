import { LevelData, TileType, DEFAULT_SETTINGS } from './types';

function createEmptyGrid(width = 28, height = 15): TileType[][] {
  const grid: TileType[][] = [];
  for (let y = 0; y < height; y++) {
    const row: TileType[] = [];
    for (let x = 0; x < width; x++) {
      row.push('empty');
    }
    grid.push(row);
  }
  return grid;
}

export function createLevel1(): LevelData {
  const width = 28;
  const height = 15;
  const tiles = createEmptyGrid(width, height);

  // Ground floor
  for (let x = 0; x < width; x++) {
    tiles[13][x] = 'solid_ground';
    tiles[14][x] = 'solid_brick';
  }

  // Gaps and hazards
  tiles[13][8] = 'empty';
  tiles[14][8] = 'hazard_lava';
  tiles[13][9] = 'empty';
  tiles[14][9] = 'hazard_lava';

  tiles[13][18] = 'hazard_spikes';
  tiles[13][19] = 'hazard_spikes';

  // Platforms
  // Step 1
  tiles[11][4] = 'solid_wood';
  tiles[11][5] = 'solid_wood';
  tiles[10][5] = 'coin';

  // Step 2
  tiles[9][9] = 'solid_wood';
  tiles[9][10] = 'solid_wood';
  tiles[8][9] = 'powerup_jump';
  tiles[8][10] = 'coin';

  // Floating islands
  tiles[8][13] = 'solid_brick';
  tiles[8][14] = 'solid_brick';
  tiles[8][15] = 'solid_brick';
  tiles[7][14] = 'gem';

  // High secret platform
  tiles[5][10] = 'solid_wood';
  tiles[5][11] = 'solid_wood';
  tiles[4][10] = 'star';

  // Moving platform indicator
  tiles[10][20] = 'moving_platform_h';

  // Enemy patrols
  tiles[12][6] = 'enemy_slime';
  tiles[12][23] = 'enemy_slime';
  tiles[7][19] = 'enemy_bat';

  // Coins on floor
  tiles[12][2] = 'coin';
  tiles[12][3] = 'coin';
  tiles[12][15] = 'coin';
  tiles[12][16] = 'coin';

  // Player spawn and goal
  tiles[12][1] = 'player_spawn';
  tiles[12][26] = 'goal';

  return {
    id: 'lvl_1',
    name: '1. Zöld Szigetek (Kezdő Kaland)',
    description: 'Egyszerű terep érmékkel, ugróplatformmal és a célkapuval.',
    width,
    height,
    tileSize: 32,
    tiles,
    settings: {
      ...DEFAULT_SETTINGS,
      theme: 'forest',
    },
  };
}

export function createLevel2(): LevelData {
  const width = 28;
  const height = 15;
  const tiles = createEmptyGrid(width, height);

  // Bottom hazard zone
  for (let x = 0; x < width; x++) {
    tiles[14][x] = 'hazard_lava';
    tiles[13][x] = 'hazard_lava';
  }

  // Safe starting island
  tiles[13][0] = 'solid_brick';
  tiles[13][1] = 'solid_brick';
  tiles[13][2] = 'solid_brick';
  tiles[14][0] = 'solid_brick';
  tiles[14][1] = 'solid_brick';
  tiles[14][2] = 'solid_brick';
  tiles[12][1] = 'player_spawn';

  // Stepping stones
  tiles[11][5] = 'solid_wood';
  tiles[11][6] = 'solid_wood';
  tiles[10][5] = 'coin';

  // Moving platforms
  tiles[10][9] = 'moving_platform_h';
  tiles[8][14] = 'moving_platform_v';

  // Island with speed boost
  tiles[9][17] = 'solid_ground';
  tiles[9][18] = 'solid_ground';
  tiles[9][19] = 'solid_ground';
  tiles[8][18] = 'powerup_speed';

  // Enemies
  tiles[5][10] = 'enemy_bat';
  tiles[8][17] = 'enemy_slime';

  // High treasure
  tiles[4][13] = 'solid_wood';
  tiles[4][14] = 'solid_wood';
  tiles[3][13] = 'gem';
  tiles[3][14] = 'star';

  // End island
  tiles[11][24] = 'solid_brick';
  tiles[11][25] = 'solid_brick';
  tiles[11][26] = 'solid_brick';
  tiles[12][24] = 'solid_brick';
  tiles[12][25] = 'solid_brick';
  tiles[12][26] = 'solid_brick';
  tiles[10][25] = 'goal';

  return {
    id: 'lvl_2',
    name: '2. Lávamedence & Lebegő Lapok',
    description: 'Ügyességi pálya lávával, lebegő és mozgó liftekkel, sebességnövelővel.',
    width,
    height,
    tileSize: 32,
    tiles,
    settings: {
      ...DEFAULT_SETTINGS,
      theme: 'dungeon',
      allowDoubleJump: true,
      gravity: 0.62,
    },
  };
}

export function createLevel3(): LevelData {
  const width = 28;
  const height = 15;
  const tiles = createEmptyGrid(width, height);

  // Ground with spikes
  for (let x = 0; x < width; x++) {
    tiles[14][x] = 'solid_brick';
    tiles[13][x] = 'solid_brick';
  }

  // Spikes fields
  for (let x = 6; x <= 10; x++) {
    tiles[12][x] = 'hazard_spikes';
  }
  for (let x = 16; x <= 20; x++) {
    tiles[12][x] = 'hazard_spikes';
  }

  // Castle pillars and bridges
  tiles[10][4] = 'solid_brick';
  tiles[10][5] = 'solid_wood';
  tiles[10][6] = 'solid_wood';
  tiles[9][5] = 'coin';

  tiles[7][8] = 'solid_wood';
  tiles[7][9] = 'solid_wood';
  tiles[7][10] = 'solid_wood';
  tiles[6][9] = 'powerup_jump';

  // High bridge
  for (let x = 12; x <= 16; x++) {
    tiles[5][x] = 'solid_brick';
    tiles[4][x] = 'coin';
  }
  tiles[3][14] = 'star';

  // Flying enemies
  tiles[4][7] = 'enemy_bat';
  tiles[4][18] = 'enemy_bat';

  // Lower slime guards
  tiles[12][3] = 'enemy_slime';
  tiles[12][23] = 'enemy_slime';

  // Moving platforms
  tiles[9][18] = 'moving_platform_h';

  // Spawn and Goal
  tiles[12][1] = 'player_spawn';
  tiles[12][26] = 'goal';

  return {
    id: 'lvl_3',
    name: '3. Cyber Citadella & Denevérek',
    description: 'Haladó szint több emeletnyi platformmal és ellenségekkel.',
    width,
    height,
    tileSize: 32,
    tiles,
    settings: {
      ...DEFAULT_SETTINGS,
      theme: 'cyber',
      enemySpeed: 2.2,
      jumpForce: -12,
    },
  };
}

export const PRESET_LEVELS: LevelData[] = [
  createLevel1(),
  createLevel2(),
  createLevel3(),
];
