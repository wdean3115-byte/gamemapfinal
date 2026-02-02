interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DangerButton {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Creates all platforms for the level (World 1)
 */
export const createPlatforms = (groundY: number): Platform[] => [
  { x: 0, y: groundY + 40, width: 250, height: 20 },
  { x: 320, y: groundY + 40, width: 60, height: 20 },
  { x: 450, y: groundY + 40, width: 60, height: 20 },
  { x: 580, y: groundY + 40, width: 60, height: 20 },
  { x: 710, y: groundY + 40, width: 60, height: 20 },
  { x: 840, y: groundY + 40, width: 80, height: 20 },
  { x: 1100, y: groundY - 20, width: 100, height: 20 },
  { x: 1280, y: groundY - 50, width: 80, height: 20 },
  { x: 1440, y: groundY - 70, width: 80, height: 20 },
  { x: 1600, y: groundY - 50, width: 80, height: 20 },
  { x: 1760, y: groundY - 20, width: 100, height: 20 },
  { x: 2000, y: groundY + 20, width: 50, height: 20 },
  { x: 2120, y: groundY + 40, width: 50, height: 20 },
  { x: 2240, y: groundY + 20, width: 50, height: 20 },
  { x: 2360, y: groundY + 40, width: 50, height: 20 },
  { x: 2480, y: groundY + 20, width: 50, height: 20 },
  { x: 2600, y: groundY + 40, width: 50, height: 20 },
  { x: 2720, y: groundY + 40, width: 120, height: 20 },
  { x: 3020, y: groundY - 90, width: 100, height: 20 },
  { x: 3200, y: groundY - 90, width: 100, height: 20 },
  { x: 3380, y: groundY - 60, width: 80, height: 20 },
  { x: 3540, y: groundY - 30, width: 80, height: 20 },
  { x: 3700, y: groundY + 40, width: 60, height: 20 },
  { x: 3850, y: groundY + 15, width: 60, height: 20 },
  { x: 3990, y: groundY + 40, width: 60, height: 20 },
  { x: 4130, y: groundY + 15, width: 60, height: 20 },
  { x: 4270, y: groundY + 40, width: 60, height: 20 },
  { x: 4410, y: groundY + 40, width: 150, height: 20 },
  { x: 4760, y: groundY - 100, width: 120, height: 20 },
  { x: 4960, y: groundY - 80, width: 80, height: 20 },
  { x: 5120, y: groundY - 50, width: 80, height: 20 },
  { x: 5280, y: groundY - 20, width: 80, height: 20 },
  { x: 5440, y: groundY + 20, width: 100, height: 20 },
  { x: 5620, y: groundY + 40, width: 200, height: 20 },
];

/**
 * Creates all danger buttons for the level (World 2)
 */
export const createDangerButtons = (groundY: number): DangerButton[] => [
  { x: 260, y: groundY + 5, width: 40, height: 35 },
  { x: 470, y: groundY + 5, width: 40, height: 35 },
  { x: 710, y: groundY + 5, width: 40, height: 35 },
  { x: 990, y: groundY + 5, width: 40, height: 35 },
  { x: 1250, y: groundY + 5, width: 40, height: 35 },
  { x: 1500, y: groundY + 5, width: 40, height: 35 },
  { x: 1700, y: groundY + 5, width: 40, height: 35 },
  { x: 2070, y: groundY + 5, width: 40, height: 35 },
  { x: 2370, y: groundY + 5, width: 40, height: 35 },
  { x: 2740, y: groundY + 5, width: 40, height: 35 },
  { x: 2960, y: groundY + 5, width: 40, height: 35 },
  { x: 3330, y: groundY + 5, width: 40, height: 35 },
  { x: 3550, y: groundY + 5, width: 40, height: 35 },
  { x: 3790, y: groundY + 5, width: 40, height: 35 },
  { x: 4090, y: groundY + 5, width: 40, height: 35 },
];

/**
 * Creates all platforms for World 3
 */
export const createPlatformsWorld3 = (groundY: number): Platform[] => [
  { x: 0, y: groundY + 40, width: 400, height: 20 },
  { x: 550, y: groundY + 40, width: 100, height: 20 },
  { x: 750, y: groundY + 10, width: 100, height: 20 },
  { x: 950, y: groundY + 40, width: 100, height: 20 },
  { x: 1150, y: groundY - 10, width: 120, height: 20 },
  { x: 1380, y: groundY + 40, width: 150, height: 20 },
  { x: 1650, y: groundY - 90, width: 120, height: 20 },
  { x: 1880, y: groundY - 40, width: 100, height: 20 },
  { x: 2090, y: groundY + 10, width: 100, height: 20 },
  { x: 2300, y: groundY + 40, width: 150, height: 20 },
  { x: 2570, y: groundY + 40, width: 200, height: 20 },
  { x: 2920, y: groundY - 160, width: 150, height: 20 },
  { x: 3180, y: groundY - 110, width: 100, height: 20 },
  { x: 3390, y: groundY - 40, width: 100, height: 20 },
  { x: 3600, y: groundY + 40, width: 150, height: 20 },
  { x: 3880, y: groundY, width: 80, height: 20 },
  { x: 4070, y: groundY + 40, width: 80, height: 20 },
  { x: 4260, y: groundY, width: 80, height: 20 },
  { x: 4450, y: groundY + 40, width: 80, height: 20 },
  { x: 4640, y: groundY, width: 80, height: 20 },
  { x: 4830, y: groundY + 40, width: 150, height: 20 },
  { x: 5100, y: groundY + 40, width: 250, height: 20 },
  { x: 5500, y: groundY - 240, width: 150, height: 20 },
  { x: 5760, y: groundY - 160, width: 100, height: 20 },
  { x: 5970, y: groundY - 90, width: 100, height: 20 },
  { x: 6180, y: groundY - 20, width: 100, height: 20 },
  { x: 6390, y: groundY + 40, width: 150, height: 20 },
  { x: 6670, y: groundY + 10, width: 80, height: 20 },
  { x: 6860, y: groundY + 40, width: 80, height: 20 },
  { x: 7050, y: groundY + 10, width: 80, height: 20 },
  { x: 7240, y: groundY + 40, width: 80, height: 20 },
  { x: 7430, y: groundY + 40, width: 300, height: 20 },
];

/**
 * Creates all danger buttons for World 3
 */
export const createDangerButtonsWorld3 = (groundY: number): DangerButton[] => [
  { x: 540, y: groundY + 5, width: 35, height: 35 },
  { x: 2980, y: groundY + 5, width: 35, height: 35 },
  { x: 3240, y: groundY + 5, width: 35, height: 35 },
  { x: 3990, y: groundY + 5, width: 35, height: 35 },
  { x: 4970, y: groundY + 5, width: 35, height: 35 },
  { x: 5210, y: groundY + 5, width: 35, height: 35 },
];

/**
 * Game object positions and sizes (relative to groundY)
 */
export const GAME_CONSTANTS = {
  KEY_POSITION: { x: 4800, y: -140 },
  DOOR_POSITION: { x: 5660, y: -35 },
  DOOR_SIZE: { width: 55, height: 75 },
  KEY_SIZE: { width: 40, height: 40 },
  GROUND_OFFSET: 50, // Height from bottom of canvas

  // World 3 specific constants
  KEY_POSITION_WORLD3: { x: 5540, y: -280 },
  DOOR_POSITION_WORLD3: { x: 7530, y: -35 },
};

export type { Platform, DangerButton };
