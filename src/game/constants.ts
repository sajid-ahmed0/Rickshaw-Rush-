export const LANES = [4, 0, -4]; // Left is +X, Right is -X from camera perspective looking at +Z
export const LANE_WIDTH = 4;
export const INITIAL_SPEED = 0.5;
export const SPEED_INCREMENT = 0.0001;
export const MAX_SPEED = 1.5;

export const PLAYER_INITIAL_Z = 0;
export const PLAYER_Y = 1.5;

export const CHUNK_LENGTH = 80;
export const CHUNKS_AHEAD = 5;

export const GRAVITY = -0.015;
export const JUMP_FORCE = 0.35;
export const SLIDE_DURATION = 800; // ms

export const POWERUP_DURATION = 10000; // 10s

export interface Skin {
  id: string;
  name: string;
  color: number;
  price: number;
}

export const SKINS: Skin[] = [
  { id: 'default', name: 'Rookie', color: 0x3366ff, price: 0 },
  { id: 'neon', name: 'Neon Runner', color: 0x00ffff, price: 100 },
  { id: 'gold', name: 'Golden Sprint', color: 0xffd700, price: 500 },
  { id: 'lava', name: 'Magma Dash', color: 0xff4500, price: 1000 },
];
