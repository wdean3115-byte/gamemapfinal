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
 * Creates all platforms for the level (World 2)
 */
export const createPlatforms = (groundY: number): Platform[] => [
  { x: 0, y: groundY, width: 250, height: 20 },
  { x: 320, y: groundY, width: 60, height: 20 },
  { x: 450, y: groundY, width: 60, height: 20 },
  { x: 580, y: groundY, width: 60, height: 20 },
  { x: 710, y: groundY, width: 80, height: 20 },
  { x: 850, y: groundY - 60, width: 100, height: 20 },
  { x: 1000, y: groundY - 100, width: 80, height: 20 },
  { x: 1130, y: groundY - 140, width: 80, height: 20 },
  { x: 1260, y: groundY - 100, width: 80, height: 20 },
  { x: 1390, y: groundY - 60, width: 100, height: 20 },
  { x: 1550, y: groundY, width: 50, height: 20 },
  { x: 1660, y: groundY - 40, width: 50, height: 20 },
  { x: 1770, y: groundY, width: 50, height: 20 },
  { x: 1880, y: groundY - 40, width: 50, height: 20 },
  { x: 1990, y: groundY, width: 50, height: 20 },
  { x: 2100, y: groundY, width: 120, height: 20 },
  { x: 2280, y: groundY - 180, width: 100, height: 20 },
  { x: 2440, y: groundY - 180, width: 100, height: 20 },
  { x: 2600, y: groundY - 120, width: 80, height: 20 },
  { x: 2740, y: groundY - 60, width: 80, height: 20 },
  { x: 2880, y: groundY, width: 60, height: 20 },
  { x: 3000, y: groundY - 50, width: 60, height: 20 },
  { x: 3120, y: groundY, width: 60, height: 20 },
  { x: 3240, y: groundY - 50, width: 60, height: 20 },
  { x: 3360, y: groundY, width: 60, height: 20 },
  { x: 3480, y: groundY, width: 150, height: 20 },
  { x: 3700, y: groundY - 220, width: 120, height: 20 },
  { x: 3880, y: groundY - 160, width: 80, height: 20 },
  { x: 4020, y: groundY - 100, width: 80, height: 20 },
  { x: 4160, y: groundY - 40, width: 80, height: 20 },
  { x: 4300, y: groundY, width: 100, height: 20 },
  { x: 4460, y: groundY, width: 200, height: 20 },
];

/**
 * Creates all danger buttons for the level (World 2)
 */
export const createDangerButtons = (groundY: number): DangerButton[] => [
  { x: 280, y: groundY - 35, width: 40, height: 35 },
  { x: 520, y: groundY - 35, width: 40, height: 35 },
  { x: 920, y: groundY - 35, width: 40, height: 35 },
  { x: 1180, y: groundY - 35, width: 40, height: 35 },
  { x: 1440, y: groundY - 35, width: 40, height: 35 },
  { x: 1610, y: groundY - 35, width: 40, height: 35 },
  { x: 1830, y: groundY - 35, width: 40, height: 35 },
  { x: 2200, y: groundY - 35, width: 40, height: 35 },
  { x: 2500, y: groundY - 35, width: 40, height: 35 },
  { x: 2950, y: groundY - 35, width: 40, height: 35 },
  { x: 3190, y: groundY - 35, width: 40, height: 35 },
  { x: 3580, y: groundY - 35, width: 40, height: 35 },
  { x: 3780, y: groundY - 35, width: 40, height: 35 },
  { x: 4020, y: groundY - 35, width: 40, height: 35 },
  { x: 4300, y: groundY - 35, width: 40, height: 35 },
];

/**
 * Creates all platforms for World 3
 */
export const createPlatformsWorld3 = (groundY: number): Platform[] => [
  { x: 0, y: groundY, width: 400, height: 20 },
  { x: 480, y: groundY, width: 100, height: 20 },
  { x: 650, y: groundY - 30, width: 100, height: 20 },
  { x: 820, y: groundY, width: 100, height: 20 },
  { x: 990, y: groundY - 50, width: 120, height: 20 },
  { x: 1180, y: groundY, width: 150, height: 20 },
  { x: 1400, y: groundY - 130, width: 120, height: 20 },
  { x: 1590, y: groundY - 80, width: 100, height: 20 },
  { x: 1760, y: groundY - 30, width: 100, height: 20 },
  { x: 1930, y: groundY, width: 150, height: 20 },
  { x: 2150, y: groundY, width: 200, height: 20 },
  { x: 2420, y: groundY - 200, width: 150, height: 20 },
  { x: 2640, y: groundY - 150, width: 100, height: 20 },
  { x: 2810, y: groundY - 80, width: 100, height: 20 },
  { x: 2980, y: groundY, width: 150, height: 20 },
  { x: 3200, y: groundY - 40, width: 80, height: 20 },
  { x: 3350, y: groundY, width: 80, height: 20 },
  { x: 3500, y: groundY - 40, width: 80, height: 20 },
  { x: 3650, y: groundY, width: 80, height: 20 },
  { x: 3800, y: groundY - 40, width: 80, height: 20 },
  { x: 3950, y: groundY, width: 150, height: 20 },
  { x: 4170, y: groundY, width: 250, height: 20 },
  { x: 4500, y: groundY - 280, width: 150, height: 20 },
  { x: 4720, y: groundY - 200, width: 100, height: 20 },
  { x: 4890, y: groundY - 130, width: 100, height: 20 },
  { x: 5060, y: groundY - 60, width: 100, height: 20 },
  { x: 5230, y: groundY, width: 150, height: 20 },
  { x: 5450, y: groundY - 30, width: 80, height: 20 },
  { x: 5600, y: groundY, width: 80, height: 20 },
  { x: 5750, y: groundY - 30, width: 80, height: 20 },
  { x: 5900, y: groundY, width: 80, height: 20 },
  { x: 6050, y: groundY, width: 300, height: 20 },
];

/**
 * Creates all danger buttons for World 3
 */
export const createDangerButtonsWorld3 = (groundY: number): DangerButton[] => [
  { x: 560, y: groundY - 35, width: 35, height: 35 },
  { x: 3290, y: groundY - 35, width: 35, height: 35 },
  { x: 3590, y: groundY - 35, width: 35, height: 35 },
  { x: 4350, y: groundY - 35, width: 35, height: 35 },
  { x: 5530, y: groundY - 35, width: 35, height: 35 },
  { x: 5830, y: groundY - 35, width: 35, height: 35 },
];

/**
 * Game object positions and sizes (relative to groundY)
 */
export const GAME_CONSTANTS = {
  KEY_POSITION: { x: 3740, y: -280 },
  DOOR_POSITION: { x: 4520, y: -75 },
  DOOR_SIZE: { width: 55, height: 75 },
  KEY_SIZE: { width: 40, height: 40 },
  GROUND_OFFSET: 60, // Height from bottom of canvas
  
  // World 3 specific constants
  KEY_POSITION_WORLD3: { x: 4540, y: -340 },
  DOOR_POSITION_WORLD3: { x: 6150, y: -75 },
};

export type { Platform, DangerButton };