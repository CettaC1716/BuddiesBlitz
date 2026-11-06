import * as THREE from 'three';
import {
  IndividualCommanderBaseState,
} from './buddiesBlitzRules';
import {
  resetTerrainSculptGrid,
  restoreTerrainSculptGrid,
} from './planetCurvature';
import {
  getBaseSkyshieldTurrets,
} from './buddiesBlitzShadersAndAssets';
import {
  ArenaMapLayout,
  PlacedMapProp,
  StaticWorldStructureObb,
} from './buddiesBlitzTypes';

export const MAP_STORAGE_KEY = 'lyo_arena_map_layout_v36';

/**
 * Single 180°-Rotationally Symmetric Base Section Generator (`buildTeamBaseQuadrant`):
 * - `sign = +1` ('blue'): South Base Complex `(4 Individual Base Plots at x = [-45, -15, +15, +45], z > 0)`
 * - `sign = -1` ('red') : North Base Complex `(4 Individual Base Plots at x = [+45, +15, -15, -45], z < 0)`
 */
export function buildTeamBaseQuadrant(
  team: 'blue' | 'red',
  sign: 1 | -1 = team === 'blue' ? 1 : -1,
  startId: number = team === 'blue' ? 100 : 200,
): PlacedMapProp[] {
  const rotOffset = Math.PI / 2 + (sign === -1 ? Math.PI : 0);
  let nextId = startId;
  const placeWorld = (
    kind: PlacedMapProp['kind'],
    wx: number,
    wz: number,
    lRotY: number,
    scale = 1.0,
  ): PlacedMapProp => ({
    id: nextId++,
    kind,
    x: Number((sign * wx).toFixed(2)),
    z: Number((sign * wz).toFixed(2)),
    rotY: Number((lRotY + rotOffset).toFixed(4)),
    scale,
  });

  return [
    placeWorld('hydrant', -55.2, 56.8, 0.0, 1.05),
    placeWorld('hydrant', -25.2, 56.8, 0.0, 1.05),
    placeWorld('hydrant', 4.8, 56.8, 0.0, 1.05),
    placeWorld('hydrant', 34.8, 56.8, 0.0, 1.05),
    placeWorld('tree_purple', 66.5, 74.5, -0.45, 1.12),
    placeWorld('tree_gold', 66.5, 91.5, 0.25, 1.1),
    placeWorld('tree_purple', -66.5, 74.5, 0.55, 1.12),
    placeWorld('tree_gold', -66.5, 91.5, -0.35, 1.1),
  ];
}

export const DEFAULT_ARENA_MAP_LAYOUT: ArenaMapLayout = {
  blueHq: { x: 0.0, z: 86.0 },
  bluePad: { x: -37.7, z: 77.8 },
  redHq: { x: 0.0, z: -86.0 },
  redPad: { x: 37.7, z: -77.8 },
  centerDropZone: { x: 0, z: 0 },
  props: [
    ...buildTeamBaseQuadrant('blue', 1, 100),
    ...buildTeamBaseQuadrant('red', -1, 200),
    { id: 502, kind: 'giant_pipe', x: -5.5, z: -22.5, rotY: 0.0, scale: 1.12 },
    { id: 503, kind: 'giant_pipe', x: -5.5, z: 22.5, rotY: 0.0, scale: 1.12 },
    { id: 504, kind: 'pipe_cluster', x: 7.5, z: -5.6, rotY: 0.0, scale: 1.08 },
    { id: 505, kind: 'pipe_cluster', x: 7.5, z: 5.6, rotY: Math.PI, scale: 1.08 },
    { id: 506, kind: 'tree_purple', x: -4.5, z: -7.2, rotY: 0.35, scale: 1.08 },
    { id: 507, kind: 'tree_purple', x: -4.5, z: 7.2, rotY: -0.35, scale: 1.08 },
    { id: 508, kind: 'tree_gold', x: 3.2, z: -7.2, rotY: 0.65, scale: 1.08 },
    { id: 509, kind: 'tree_gold', x: 3.2, z: 7.2, rotY: -0.65, scale: 1.08 },
    { id: 510, kind: 'tree_purple', x: 12.5, z: -5.5, rotY: 0.15, scale: 1.08 },
    { id: 511, kind: 'tree_purple', x: 12.5, z: 5.5, rotY: -0.15, scale: 1.08 },
    { id: 512, kind: 'tree_gold', x: 16.5, z: 0.0, rotY: 0.45, scale: 1.1 },

    { id: 550, kind: 'tree_gold', x: -9.5, z: -28.0, rotY: 0.25, scale: 1.14 },
    { id: 551, kind: 'tree_purple', x: -2.5, z: -24.5, rotY: -0.45, scale: 1.12 },
    { id: 552, kind: 'tree_gold', x: 6.5, z: -25.5, rotY: 0.75, scale: 1.15 },
    { id: 553, kind: 'tree_purple', x: 11.0, z: -32.5, rotY: -0.65, scale: 1.1 },
    { id: 554, kind: 'tree_gold', x: 2.5, z: -41.5, rotY: 0.35, scale: 1.12 },
    { id: 555, kind: 'tree_purple', x: -8.5, z: -38.5, rotY: 0.95, scale: 1.08 },
    { id: 556, kind: 'tree_gold', x: 9.5, z: -42.0, rotY: -0.25, scale: 1.12 },
    { id: 557, kind: 'flower_cluster', x: 0.0, z: -35.0, rotY: 0.4, scale: 1.35 },
    { id: 558, kind: 'river_rock', x: -3.5, z: -33.0, rotY: 0.8, scale: 1.4 },

    { id: 560, kind: 'tree_gold', x: -9.5, z: 28.0, rotY: -0.25, scale: 1.14 },
    { id: 561, kind: 'tree_purple', x: -2.5, z: 24.5, rotY: 0.45, scale: 1.12 },
    { id: 562, kind: 'tree_gold', x: 6.5, z: 25.5, rotY: -0.75, scale: 1.15 },
    { id: 563, kind: 'tree_purple', x: 11.0, z: 32.5, rotY: 0.65, scale: 1.1 },
    { id: 564, kind: 'tree_gold', x: 2.5, z: 41.5, rotY: -0.35, scale: 1.12 },
    { id: 565, kind: 'tree_purple', x: -8.5, z: 38.5, rotY: -0.95, scale: 1.08 },
    { id: 566, kind: 'tree_gold', x: 9.5, z: 42.0, rotY: 0.25, scale: 1.12 },
    { id: 567, kind: 'flower_cluster', x: 0.0, z: 35.0, rotY: -0.4, scale: 1.35 },
    { id: 568, kind: 'river_rock', x: -3.5, z: 33.0, rotY: -0.8, scale: 1.4 },

    { id: 570, kind: 'tree_gold', x: 28.5, z: 0.0, rotY: 0.45, scale: 1.14 },
    { id: 571, kind: 'tree_purple', x: 25.5, z: -8.5, rotY: -0.35, scale: 1.12 },
    { id: 572, kind: 'tree_purple', x: 25.5, z: 8.5, rotY: 0.35, scale: 1.12 },
    { id: 573, kind: 'tree_gold', x: 28.0, z: -14.5, rotY: -0.55, scale: 1.12 },
    { id: 574, kind: 'tree_gold', x: 28.0, z: 14.5, rotY: 0.55, scale: 1.12 },
    { id: 575, kind: 'flower_cluster', x: 26.5, z: -4.2, rotY: 0.6, scale: 1.32 },
    { id: 576, kind: 'flower_cluster', x: 26.5, z: 4.2, rotY: -0.6, scale: 1.32 },
    { id: 577, kind: 'tree_purple', x: 38.5, z: -6.5, rotY: 0.25, scale: 1.14 },
    { id: 578, kind: 'tree_purple', x: 38.5, z: 6.5, rotY: -0.25, scale: 1.14 },
    { id: 579, kind: 'tree_gold', x: 46.5, z: 0.0, rotY: -0.4, scale: 1.16 },
    { id: 590, kind: 'tree_gold', x: 31.0, z: -36.5, rotY: 0.35, scale: 1.14 },
    { id: 591, kind: 'tree_gold', x: 31.0, z: 36.5, rotY: -0.35, scale: 1.14 },
    { id: 592, kind: 'tree_purple', x: 54.5, z: -34.0, rotY: -0.45, scale: 1.14 },
    { id: 593, kind: 'tree_purple', x: 54.5, z: 34.0, rotY: 0.45, scale: 1.14 },
    { id: 594, kind: 'tree_gold', x: 60.5, z: -28.0, rotY: 0.55, scale: 1.12 },
    { id: 595, kind: 'tree_gold', x: 60.5, z: 28.0, rotY: -0.55, scale: 1.12 },
    { id: 596, kind: 'flower_cluster', x: 52.0, z: -38.5, rotY: 0.5, scale: 1.32 },
    { id: 597, kind: 'flower_cluster', x: 52.0, z: 38.5, rotY: -0.5, scale: 1.32 },
    { id: 598, kind: 'river_rock', x: 48.0, z: -8.5, rotY: 0.7, scale: 1.35 },
    { id: 599, kind: 'river_rock', x: 48.0, z: 8.5, rotY: -0.7, scale: 1.35 },

    { id: 490, kind: 'tree_purple', x: -100.5, z: -26.5, rotY: 0.25, scale: 1.08 },
    { id: 491, kind: 'tree_gold', x: -100.5, z: 26.5, rotY: -0.25, scale: 1.08 },
    { id: 494, kind: 'flower_cluster', x: -96.5, z: -32.5, rotY: 0.4, scale: 1.32 },
    { id: 495, kind: 'flower_cluster', x: -96.5, z: 32.5, rotY: -0.4, scale: 1.32 },

    { id: 301, kind: 'turbine', x: -59.5, z: -36.5, rotY: 0.45, scale: 1.25 },
    { id: 302, kind: 'turbine', x: -59.5, z: 36.5, rotY: 0.45, scale: 1.25 },
    { id: 303, kind: 'turbine', x: -34.5, z: -38.5, rotY: 0.3, scale: 1.25 },
    { id: 304, kind: 'turbine', x: -34.5, z: 38.5, rotY: 0.3, scale: 1.25 },
    { id: 305, kind: 'turbine', x: -84.0, z: -43.5, rotY: 0.35, scale: 1.24 },
    { id: 306, kind: 'turbine', x: -84.0, z: 43.5, rotY: 0.35, scale: 1.24 },

    { id: 310, kind: 'river_rock', x: -41.2, z: -4.5, rotY: 0.2, scale: 1.45 },
    { id: 311, kind: 'river_rock', x: -41.2, z: 4.5, rotY: -0.2, scale: 1.45 },
    { id: 312, kind: 'river_rock', x: -38.5, z: -10.2, rotY: 1.1, scale: 1.35 },
    { id: 313, kind: 'river_rock', x: -38.5, z: 10.2, rotY: -1.1, scale: 1.35 },
    { id: 314, kind: 'river_rock', x: -31.0, z: -12.6, rotY: 2.0, scale: 1.5 },
    { id: 315, kind: 'river_rock', x: -31.0, z: 12.6, rotY: -2.0, scale: 1.5 },
    { id: 316, kind: 'river_rock', x: -23.2, z: -9.2, rotY: 0.6, scale: 1.4 },
    { id: 317, kind: 'river_rock', x: -23.2, z: 9.2, rotY: -0.6, scale: 1.4 },
    { id: 318, kind: 'river_rock', x: -21.2, z: -3.5, rotY: 1.4, scale: 1.35 },
    { id: 319, kind: 'river_rock', x: -21.2, z: 3.5, rotY: -1.4, scale: 1.35 },

    { id: 320, kind: 'flower_cluster', x: -42.0, z: 0.0, rotY: 0.0, scale: 1.35 },
    { id: 321, kind: 'flower_cluster', x: -35.0, z: -12.2, rotY: 0.8, scale: 1.3 },
    { id: 322, kind: 'flower_cluster', x: -35.0, z: 12.2, rotY: -0.8, scale: 1.3 },
    { id: 323, kind: 'flower_cluster', x: -25.5, z: -11.5, rotY: 1.5, scale: 1.35 },
    { id: 324, kind: 'flower_cluster', x: -25.5, z: 11.5, rotY: -1.5, scale: 1.35 },
    { id: 325, kind: 'flower_cluster', x: -21.5, z: 0.0, rotY: 1.2, scale: 1.3 },

    { id: 330, kind: 'tree_gold', x: -42.5, z: -7.8, rotY: 0.3, scale: 1.12 },
    { id: 331, kind: 'tree_gold', x: -42.5, z: 7.8, rotY: -0.3, scale: 1.12 },
    { id: 332, kind: 'tree_purple', x: -28.5, z: -15.2, rotY: -0.5, scale: 1.1 },
    { id: 333, kind: 'tree_purple', x: -28.5, z: 15.2, rotY: 0.5, scale: 1.1 },
    { id: 334, kind: 'tree_gold', x: -48.5, z: -36.5, rotY: 0.6, scale: 1.1 },
    { id: 335, kind: 'tree_gold', x: -48.5, z: 36.5, rotY: -0.6, scale: 1.1 },
    { id: 336, kind: 'tree_purple', x: -84.0, z: -48.0, rotY: -0.3, scale: 1.12 },
    { id: 337, kind: 'tree_purple', x: -84.0, z: 48.0, rotY: 0.3, scale: 1.12 },

    { id: 401, kind: 'crane', x: 105.8, z: 0.0, rotY: Math.PI / 2, scale: 1.38 },
    { id: 430, kind: 'forklift', x: 88.5, z: -29.5, rotY: 0.0, scale: 1.18 },
    { id: 431, kind: 'forklift', x: 88.5, z: 29.5, rotY: Math.PI, scale: 1.18 },
    { id: 432, kind: 'concrete_fence_1b', x: 98.5, z: -43.8, rotY: 0.0, scale: 1.18 },
    { id: 433, kind: 'concrete_fence_1b', x: 103.0, z: -43.8, rotY: 0.0, scale: 1.18 },
    { id: 434, kind: 'concrete_fence_1b', x: 98.5, z: 43.8, rotY: 0.0, scale: 1.18 },
    { id: 435, kind: 'concrete_fence_1b', x: 103.0, z: 43.8, rotY: 0.0, scale: 1.18 },

    { id: 520, kind: 'bench', x: 2.0, z: -32.7, rotY: Math.PI, scale: 1.35 },
    { id: 521, kind: 'bench', x: 2.0, z: -31.3, rotY: 0.0, scale: 1.35 },
    { id: 580, kind: 'recycle_bin', x: 4.3, z: -32.0, rotY: -Math.PI / 2, scale: 1.08 },
    { id: 522, kind: 'bench', x: 2.0, z: 31.3, rotY: Math.PI, scale: 1.35 },
    { id: 523, kind: 'bench', x: 2.0, z: 32.7, rotY: 0.0, scale: 1.35 },
    { id: 581, kind: 'recycle_bin', x: 4.3, z: 32.0, rotY: -Math.PI / 2, scale: 1.08 },
    { id: 524, kind: 'bench', x: 23.8, z: 0.0, rotY: Math.PI / 2, scale: 1.35 },
    { id: 525, kind: 'bench', x: 25.2, z: 0.0, rotY: -Math.PI / 2, scale: 1.35 },
    { id: 582, kind: 'recycle_bin', x: 24.5, z: -2.3, rotY: 0.0, scale: 1.08 },
    { id: 583, kind: 'recycle_bin', x: 24.5, z: 2.3, rotY: Math.PI, scale: 1.08 },
    { id: 526, kind: 'bench', x: -44.2, z: -2.0, rotY: -Math.PI / 2, scale: 1.35 },
    { id: 527, kind: 'bench', x: -44.2, z: 2.0, rotY: -Math.PI / 2, scale: 1.35 },
    { id: 584, kind: 'recycle_bin', x: -44.2, z: -4.2, rotY: -Math.PI / 2, scale: 1.08 },
    { id: 585, kind: 'recycle_bin', x: -44.2, z: 4.2, rotY: -Math.PI / 2, scale: 1.08 },
    { id: 528, kind: 'bench', x: -9.5, z: -44.6, rotY: 0.0, scale: 1.35 },
    { id: 529, kind: 'bench', x: -9.5, z: 44.6, rotY: Math.PI, scale: 1.35 },
    { id: 586, kind: 'recycle_bin', x: -12.0, z: -44.6, rotY: 0.0, scale: 1.08 },
    { id: 587, kind: 'recycle_bin', x: -12.0, z: 44.6, rotY: Math.PI, scale: 1.08 },

    { id: 530, kind: 'lamppost_1b', x: -6.2, z: -7.2, rotY: 0.0, scale: 1.15 },
    { id: 531, kind: 'lamppost_1b', x: -6.2, z: 7.2, rotY: Math.PI / 2, scale: 1.15 },
    { id: 532, kind: 'lamppost_1b', x: 25.8, z: -30.8, rotY: Math.PI / 2, scale: 1.15 },
    { id: 533, kind: 'lamppost_1b', x: 25.8, z: 30.8, rotY: 0.0, scale: 1.15 },
    { id: 534, kind: 'lamppost_1b', x: -61.2, z: -43.2, rotY: 0.0, scale: 1.15 },
    { id: 535, kind: 'lamppost_1b', x: -61.2, z: 43.2, rotY: Math.PI / 2, scale: 1.15 },
    { id: 536, kind: 'lamppost_1b', x: 61.2, z: -43.2, rotY: -Math.PI / 2, scale: 1.15 },
    { id: 537, kind: 'lamppost_1b', x: 61.2, z: 43.2, rotY: Math.PI, scale: 1.15 },

    { id: 538, kind: 'lamppost_1a', x: 0.0, z: -45.2, rotY: 0.0, scale: 1.15 },
    { id: 539, kind: 'lamppost_1a', x: 0.0, z: 45.2, rotY: Math.PI, scale: 1.15 },
    { id: 540, kind: 'lamppost_1a', x: -64.8, z: -78.0, rotY: -Math.PI / 2, scale: 1.15 },
    { id: 541, kind: 'lamppost_1a', x: -64.8, z: 78.0, rotY: -Math.PI / 2, scale: 1.15 },
    { id: 542, kind: 'lamppost_1a', x: 64.8, z: -78.0, rotY: Math.PI / 2, scale: 1.15 },
    { id: 543, kind: 'lamppost_1a', x: 64.8, z: 78.0, rotY: Math.PI / 2, scale: 1.15 },

    { id: 608, kind: 'barricade', x: 96.5, z: 63.5, rotY: Math.PI / 2, scale: 1.1 },
    { id: 609, kind: 'barricade', x: 96.5, z: 80.5, rotY: Math.PI / 2, scale: 1.1 },
    { id: 618, kind: 'barricade', x: 96.5, z: -63.5, rotY: Math.PI / 2, scale: 1.1 },
    { id: 619, kind: 'barricade', x: 96.5, z: -80.5, rotY: Math.PI / 2, scale: 1.1 },
  ],
};

export function cloneDefaultLayout(): ArenaMapLayout {
  return JSON.parse(JSON.stringify(DEFAULT_ARENA_MAP_LAYOUT));
}

export function loadSavedArenaLayout(): ArenaMapLayout {
  try {
    const raw = localStorage.getItem(MAP_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ArenaMapLayout;
      if (parsed && Array.isArray(parsed.props) && parsed.blueHq && parsed.redHq) {
        if (Array.isArray(parsed.sculptData) && parsed.sculptData.length > 0) {
          restoreTerrainSculptGrid(parsed.sculptData);
        }
        return parsed;
      }
    }
  } catch {
    // Ignore storage errors
  }
  resetTerrainSculptGrid();
  return cloneDefaultLayout();
}

export function getPropBaseHeight(kind: PlacedMapProp['kind']): number {
  switch (kind) {
    case 'turbine':
      return 17.5;
    case 'chimney':
      return 15.6;
    case 'crane':
      return 18.5;
    case 'giant_tank':
      return 9.2;
    case 'lamppost_1a':
    case 'lamppost_1b':
      return 7.4;
    case 'dump_truck':
      return 3.8;
    case 'forklift':
      return 3.15;
    case 'power_core':
      return 7.8;
    case 'pipe_cluster':
    case 'pipe_cluster_1b':
      return 3.4;
    case 'giant_pipe':
      return 3.3;
    case 'giant_pipe_1b':
      return 3.85;
    case 'tank_1a':
    case 'tank_1b':
      return 3.4;
    case 'concrete_fence':
      return 2.85;
    case 'concrete_fence_1b':
      return 2.05;
    case 'concrete_pipe':
      return 2.35;
    case 'h_beam':
      return 2.45;
    case 'barricade':
      return 1.85;
    case 'explosive_barrel':
    case 'barrel_1c':
      return 1.75;
    case 'hydrant':
      return 1.65;
    case 'recycle_bin':
      return 1.6;
    case 'bench':
      return 1.75;
    case 'wheelbarrow':
      return 1.45;
    case 'pallet_1a':
      return 1.35;
    case 'fuel_cell':
      return 1.25;
    case 'circuit_module':
      return 1.15;
    case 'traffic_cone':
      return 1.08;
    default:
      return 2.2;
  }
}

export function createBillboardSign(widthWorld: number, heightWorld: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(widthWorld, heightWorld, 1);
  sprite.renderOrder = 10;

  const updateText = (title: string, subtitle: string, accentHex: string, ratio = 1) => {
    ctx.clearRect(0, 0, 512, 128);
    ctx.fillStyle = '#11121a';
    ctx.beginPath();
    ctx.roundRect(8, 8, 496, 112, 22);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = accentHex;
    ctx.stroke();

    if (ratio >= 0) {
      ctx.fillStyle = '#272935';
      ctx.fillRect(24, 82, 464, 22);
      ctx.fillStyle = accentHex;
      ctx.fillRect(24, 82, Math.max(0, Math.min(1, ratio)) * 464, 22);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 30px "Barlow", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, 256, 44);

    ctx.fillStyle = accentHex;
    ctx.font = '800 22px "JetBrains Mono", monospace';
    ctx.fillText(subtitle, 256, 72);
    tex.needsUpdate = true;
  };

  return { sprite, updateText };
}

/**
 * Builds the list of static 3D OBB world structures (Retaining Walls, Base Plot Buildings & Fences,
 * Bastions, Container Stacks, Excavators, Kiosks, Planters, and Parking Pillars).
 */
export function buildStaticWorldStructuresList(params: {
  blueBase: { baseGroup: THREE.Group; hqX: number; hqZ: number };
  redBase: { baseGroup: THREE.Group; hqX: number; hqZ: number };
  blueCommanderBases: ReadonlyArray<IndividualCommanderBaseState>;
  redCommanderBases: ReadonlyArray<IndividualCommanderBaseState>;
}): StaticWorldStructureObb[] {
  const { blueBase, redBase, blueCommanderBases, redCommanderBases } = params;
  const blueSkyshields = getBaseSkyshieldTurrets(blueBase.baseGroup);
  const redSkyshields = getBaseSkyshieldTurrets(redBase.baseGroup);

  const sExcRot = -0.35;
  const nExcRot = Math.PI + 0.35;
  const excBoomOffset = 4.55;
  const plotOffsetsX = [-45.0, -15.0, 15.0, 45.0] as const;
  const structures: StaticWorldStructureObb[] = [
    { id: 'west_wall_north', x: -90.5, z: -38.05, halfX: 14.05, halfZ: 0.22, rotY: 0, heightY: 1.48, mat: 'concrete', isRetainingWall: true },
    { id: 'west_wall_south', x: -90.5, z: 38.05, halfX: 14.05, halfZ: 0.22, rotY: 0, heightY: 1.48, mat: 'concrete', isRetainingWall: true },
    { id: 'west_wall_east_n', x: -76.45, z: -27.95, halfX: 0.22, halfZ: 10.15, rotY: 0, heightY: 1.48, mat: 'concrete', isRetainingWall: true },
    { id: 'west_wall_east_mid', x: -76.45, z: 0.0, halfX: 0.22, halfZ: 12.2, rotY: 0, heightY: 1.48, mat: 'concrete', isRetainingWall: true },
    { id: 'west_wall_east_s', x: -76.45, z: 27.95, halfX: 0.22, halfZ: 10.15, rotY: 0, heightY: 1.48, mat: 'concrete', isRetainingWall: true },

    { id: 'const_excavator_s_body', x: 92.0, z: 72.0, halfX: 2.22, halfZ: 2.75, rotY: sExcRot, heightY: 4.85, mat: 'metal' },
    {
      id: 'const_excavator_s_boom',
      x: 92.0 + Math.sin(sExcRot) * excBoomOffset,
      z: 72.0 + Math.cos(sExcRot) * excBoomOffset,
      halfX: 0.62,
      halfZ: 2.15,
      rotY: sExcRot,
      heightY: 4.85,
      mat: 'metal',
    },
    { id: 'const_excavator_n_body', x: 92.0, z: -72.0, halfX: 2.22, halfZ: 2.75, rotY: nExcRot, heightY: 4.85, mat: 'metal' },
    {
      id: 'const_excavator_n_boom',
      x: 92.0 + Math.sin(nExcRot) * excBoomOffset,
      z: -72.0 + Math.cos(nExcRot) * excBoomOffset,
      halfX: 0.62,
      halfZ: 2.15,
      rotY: nExcRot,
      heightY: 4.85,
      mat: 'metal',
    },
    { id: 'const_girders_s1', x: 93.0, z: 55.0, halfX: 1.85, halfZ: 3.48, rotY: 0.0, heightY: 1.75, mat: 'metal' },
    { id: 'const_girders_n1', x: 93.0, z: -55.0, halfX: 1.85, halfZ: 3.48, rotY: 0.0, heightY: 1.75, mat: 'metal' },
    { id: 'const_pallets_s2', x: 92.5, z: 89.0, halfX: 2.85, halfZ: 2.65, rotY: 0.0, heightY: 1.95, mat: 'concrete' },
    { id: 'const_pallets_n2', x: 92.5, z: -89.0, halfX: 2.85, halfZ: 2.65, rotY: 0.0, heightY: 1.95, mat: 'concrete' },

    { id: 'bastion_b_0', x: blueBase.hqX - 51.4, z: blueBase.hqZ - 26.0, halfX: 1.85, halfZ: 1.85, rotY: 0, heightY: blueSkyshields[0]?.isBuilt ? 5.2 : 2.6, mat: 'concrete' },
    { id: 'bastion_b_1', x: blueBase.hqX - 21.4, z: blueBase.hqZ - 26.0, halfX: 1.85, halfZ: 1.85, rotY: 0, heightY: blueSkyshields[1]?.isBuilt ? 5.2 : 2.6, mat: 'concrete' },
    { id: 'bastion_b_2', x: blueBase.hqX + 21.4, z: blueBase.hqZ - 26.0, halfX: 1.85, halfZ: 1.85, rotY: 0, heightY: blueSkyshields[2]?.isBuilt ? 5.2 : 2.6, mat: 'concrete' },
    { id: 'bastion_b_3', x: blueBase.hqX + 51.4, z: blueBase.hqZ - 26.0, halfX: 1.85, halfZ: 1.85, rotY: 0, heightY: blueSkyshields[3]?.isBuilt ? 5.2 : 2.6, mat: 'concrete' },
    { id: 'bastion_r_0', x: redBase.hqX + 51.4, z: redBase.hqZ + 26.0, halfX: 1.85, halfZ: 1.85, rotY: 0, heightY: redSkyshields[0]?.isBuilt ? 5.2 : 2.6, mat: 'concrete' },
    { id: 'bastion_r_1', x: redBase.hqX + 21.4, z: redBase.hqZ + 26.0, halfX: 1.85, halfZ: 1.85, rotY: 0, heightY: redSkyshields[1]?.isBuilt ? 5.2 : 2.6, mat: 'concrete' },
    { id: 'bastion_r_2', x: redBase.hqX - 21.4, z: redBase.hqZ + 26.0, halfX: 1.85, halfZ: 1.85, rotY: 0, heightY: redSkyshields[2]?.isBuilt ? 5.2 : 2.6, mat: 'concrete' },
    { id: 'bastion_r_3', x: redBase.hqX - 51.4, z: redBase.hqZ + 26.0, halfX: 1.85, halfZ: 1.85, rotY: 0, heightY: redSkyshields[3]?.isBuilt ? 5.2 : 2.6, mat: 'concrete' },

    { id: 'cont_stack_harbor_nw', x: 80.15, z: -34.5, halfX: 3.55, halfZ: 3.64, rotY: 0, heightY: 6.72, mat: 'metal' },
    { id: 'cont_stack_harbor_sw', x: 80.15, z: 34.5, halfX: 3.55, halfZ: 3.64, rotY: 0, heightY: 6.72, mat: 'metal' },
    { id: 'cont_stack_harbor_nc', x: 80.15, z: -24.5, halfX: 3.55, halfZ: 3.64, rotY: 0, heightY: 3.4, mat: 'metal' },
    { id: 'cont_stack_harbor_sc', x: 80.15, z: 24.5, halfX: 3.55, halfZ: 3.64, rotY: 0, heightY: 3.4, mat: 'metal' },
    { id: 'cont_stack_harbor_ne', x: 101.5, z: -33.45, halfX: 3.55, halfZ: 3.64, rotY: Math.PI / 2, heightY: 6.72, mat: 'metal' },
    { id: 'cont_stack_harbor_se', x: 101.5, z: 33.45, halfX: 3.55, halfZ: 3.64, rotY: Math.PI / 2, heightY: 6.72, mat: 'metal' },
    { id: 'west_plaza_kiosk_n', x: -95.7, z: -18.5, halfX: 2.35, halfZ: 1.95, rotY: 0, heightY: 3.2, mat: 'wood' },
    { id: 'west_plaza_kiosk_s', x: -95.7, z: -9.2, halfX: 2.35, halfZ: 1.95, rotY: 0, heightY: 3.2, mat: 'wood' },
    { id: 'west_plaza_pergola', x: -92.9, z: 11.5, halfX: 3.1, halfZ: 2.6, rotY: 0, heightY: 3.2, mat: 'wood' },
    { id: 'west_plaza_planter_n', x: -92.3, z: -33.2, halfX: 2.65, halfZ: 1.15, rotY: 0, heightY: 1.6, mat: 'concrete' },
    { id: 'west_plaza_planter_s', x: -92.3, z: 33.2, halfX: 2.65, halfZ: 1.15, rotY: 0, heightY: 1.6, mat: 'concrete' },
  ];

  const gardenCornersLocal: readonly [number, number][] = [
    [18.4, -7.8],
    [18.4, 7.8],
    [-11.2, -7.8],
    [-11.2, 7.8],
  ];
  const parkingPillarsLocal: readonly [number, number][] = [
    [12.4, -7.2],
    [12.4, -3.2],
    [17.6, -7.2],
    [17.6, -3.2],
  ];

  for (let i = 0; i < 4; i++) {
    const ox = plotOffsetsX[i];
    const bPlot = blueCommanderBases[i];
    const bwx = blueBase.hqX + ox;
    structures.push({
      id: `blue_plot_${i}_kiosk`,
      x: bwx + 8.52,
      z: blueBase.hqZ - 14.68,
      halfX: 0.85,
      halfZ: 0.78,
      rotY: 0,
      heightY: 4.1,
      mat: 'metal',
    });

    if (bPlot && !bPlot.destroyed) {
      if (bPlot.buildingHp > 0) {
        structures.push({
          id: `blue_plot_${i}_building`,
          x: bwx,
          z: blueBase.hqZ + 5.5,
          halfX: 4.25,
          halfZ: 3.65,
          rotY: Math.PI / 2,
          heightY: 6.8 + bPlot.buildingLevel * 2.1,
          mat: 'concrete',
        });
      }
      if (bPlot.fenceHp > 0) {
        const fh = 1.9 + bPlot.fenceLevel * 0.35;
        structures.push(
          { id: `blue_plot_${i}_fence_rear`, x: bwx, z: blueBase.hqZ + 13.2, halfX: 9.8, halfZ: 0.32, rotY: 0, heightY: fh, mat: 'concrete' },
          { id: `blue_plot_${i}_fence_w`, x: bwx - 9.8, z: blueBase.hqZ - 4.3, halfX: 0.32, halfZ: 17.5, rotY: 0, heightY: fh, mat: 'concrete' },
          { id: `blue_plot_${i}_fence_e`, x: bwx + 9.8, z: blueBase.hqZ - 4.3, halfX: 0.32, halfZ: 17.5, rotY: 0, heightY: fh, mat: 'concrete' },
          { id: `blue_plot_${i}_fence_fl`, x: bwx - 6.3, z: blueBase.hqZ - 21.8, halfX: 3.5, halfZ: 0.32, rotY: 0, heightY: fh, mat: 'concrete' },
          { id: `blue_plot_${i}_fence_fr`, x: bwx + 6.3, z: blueBase.hqZ - 21.8, halfX: 3.5, halfZ: 0.32, rotY: 0, heightY: fh, mat: 'concrete' },
          { id: `blue_plot_${i}_gate`, x: bwx, z: blueBase.hqZ - 21.8, halfX: 2.8, halfZ: 0.34, rotY: 0, heightY: fh, mat: 'metal' },
        );
      }
      for (let cIdx = 0; cIdx < gardenCornersLocal.length; cIdx++) {
        const [gx, gz] = gardenCornersLocal[cIdx];
        structures.push({
          id: `blue_plot_${i}_planter_${cIdx}`,
          x: bwx + gz,
          z: blueBase.hqZ - gx,
          halfX: 1.08,
          halfZ: 1.18,
          rotY: 0,
          heightY: 4.2,
          mat: 'wood',
        });
      }
      if (bPlot.hasParkingBay) {
        for (let pIdx = 0; pIdx < parkingPillarsLocal.length; pIdx++) {
          const [lx, relZ] = parkingPillarsLocal[pIdx];
          structures.push({
            id: `blue_plot_${i}_parking_pillar_${pIdx}`,
            x: bwx + relZ,
            z: blueBase.hqZ - lx,
            halfX: 0.3,
            halfZ: 0.3,
            rotY: 0,
            heightY: 2.95,
            mat: 'metal',
          });
        }
      }
    }

    const rPlot = redCommanderBases[i];
    const rwx = redBase.hqX - ox;
    structures.push({
      id: `red_plot_${i}_kiosk`,
      x: rwx - 8.52,
      z: redBase.hqZ + 14.68,
      halfX: 0.85,
      halfZ: 0.78,
      rotY: 0,
      heightY: 4.1,
      mat: 'metal',
    });

    if (rPlot && !rPlot.destroyed) {
      if (rPlot.buildingHp > 0) {
        structures.push({
          id: `red_plot_${i}_building`,
          x: rwx,
          z: redBase.hqZ - 5.5,
          halfX: 4.25,
          halfZ: 3.65,
          rotY: -Math.PI / 2,
          heightY: 6.8 + rPlot.buildingLevel * 2.1,
          mat: 'concrete',
        });
      }
      if (rPlot.fenceHp > 0) {
        const fh = 1.9 + rPlot.fenceLevel * 0.35;
        structures.push(
          { id: `red_plot_${i}_fence_rear`, x: rwx, z: redBase.hqZ - 13.2, halfX: 9.8, halfZ: 0.32, rotY: 0, heightY: fh, mat: 'concrete' },
          { id: `red_plot_${i}_fence_w`, x: rwx - 9.8, z: redBase.hqZ + 4.3, halfX: 0.32, halfZ: 17.5, rotY: 0, heightY: fh, mat: 'concrete' },
          { id: `red_plot_${i}_fence_e`, x: rwx + 9.8, z: redBase.hqZ + 4.3, halfX: 0.32, halfZ: 17.5, rotY: 0, heightY: fh, mat: 'concrete' },
          { id: `red_plot_${i}_fence_fl`, x: rwx - 6.3, z: redBase.hqZ + 21.8, halfX: 3.5, halfZ: 0.32, rotY: 0, heightY: fh, mat: 'concrete' },
          { id: `red_plot_${i}_fence_fr`, x: rwx + 6.3, z: redBase.hqZ + 21.8, halfX: 3.5, halfZ: 0.32, rotY: 0, heightY: fh, mat: 'concrete' },
          { id: `red_plot_${i}_gate`, x: rwx, z: redBase.hqZ + 21.8, halfX: 2.8, halfZ: 0.34, rotY: 0, heightY: fh, mat: 'metal' },
        );
      }
      for (let cIdx = 0; cIdx < gardenCornersLocal.length; cIdx++) {
        const [gx, gz] = gardenCornersLocal[cIdx];
        structures.push({
          id: `red_plot_${i}_planter_${cIdx}`,
          x: rwx - gz,
          z: redBase.hqZ + gx,
          halfX: 1.08,
          halfZ: 1.18,
          rotY: 0,
          heightY: 4.2,
          mat: 'wood',
        });
      }
      if (rPlot.hasParkingBay) {
        for (let pIdx = 0; pIdx < parkingPillarsLocal.length; pIdx++) {
          const [lx, relZ] = parkingPillarsLocal[pIdx];
          structures.push({
            id: `red_plot_${i}_parking_pillar_${pIdx}`,
            x: rwx - relZ,
            z: redBase.hqZ + lx,
            halfX: 0.3,
            halfZ: 0.3,
            rotY: 0,
            heightY: 2.95,
            mat: 'metal',
          });
        }
      }
    }
  }

  return structures;
}
