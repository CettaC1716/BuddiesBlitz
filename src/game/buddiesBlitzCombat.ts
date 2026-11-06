import * as THREE from 'three';
import {
  BUDDY_CLASSES,
  RAYCAST_LAYERS,
  RAYCAST_MAX_DISTANCE,
  RaycastCollider3D,
  Vec3,
  clamp,
} from './buddiesBlitzRules';
import {
  getTerrainElevation,
  getPlanetShortestDelta,
  getPlanetShortestDistance,
  wrapPlanetCoord,
} from './planetCurvature';
import {
  getBaseSkyshieldTurrets,
} from './buddiesBlitzShadersAndAssets';
import {
  BuddyUnit,
  TankVehicle,
  DestructibleTree,
  ActiveMapPropPhysics,
  StaticWorldStructureObb,
} from './buddiesBlitzTypes';

/**
 * Generates the soft radial holographic ground aura texture used when the player's muzzle raycast locks onto an enemy target.
 */
export function createGroundLockAuraTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  if (ctx) {
    const cx = 256;
    const cy = 256;
    ctx.clearRect(0, 0, 512, 512);

    const radGrad = ctx.createRadialGradient(cx, cy, 24, cx, cy, 240);
    radGrad.addColorStop(0.0, 'rgba(255, 56, 92, 0.0)');
    radGrad.addColorStop(0.52, 'rgba(255, 56, 92, 0.08)');
    radGrad.addColorStop(0.76, 'rgba(255, 70, 95, 0.34)');
    radGrad.addColorStop(0.88, 'rgba(255, 190, 60, 0.22)');
    radGrad.addColorStop(1.0, 'rgba(255, 45, 85, 0.0)');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 245, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.shadowColor = 'rgba(255, 45, 85, 0.95)';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = 'rgba(255, 75, 105, 0.92)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const startAng = (i * Math.PI) / 2 + 0.16;
      const endAng = ((i + 1) * Math.PI) / 2 - 0.16;
      ctx.beginPath();
      ctx.arc(cx, cy, 196, startAng, endAng);
      ctx.stroke();
    }

    ctx.shadowColor = 'rgba(255, 215, 64, 0.9)';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = 'rgba(255, 225, 100, 0.88)';
    ctx.lineWidth = 3.5;
    for (let i = 0; i < 8; i++) {
      const a0 = (i * Math.PI) / 4 + 0.08;
      const a1 = a0 + 0.18;
      ctx.beginPath();
      ctx.arc(cx, cy, 162, a0, a1);
      ctx.stroke();
    }
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates the optical HUD target lock reticle texture for enemy lock-on.
 */
export function createHudLockReticleTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  if (ctx) {
    const cx = 256;
    const cy = 256;
    ctx.clearRect(0, 0, 512, 512);

    const coreGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 190);
    coreGrad.addColorStop(0.0, 'rgba(255, 90, 110, 0.35)');
    coreGrad.addColorStop(0.35, 'rgba(255, 45, 85, 0.12)');
    coreGrad.addColorStop(0.78, 'rgba(255, 180, 50, 0.08)');
    coreGrad.addColorStop(1.0, 'rgba(255, 45, 85, 0.0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 195, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.shadowColor = 'rgba(255, 45, 85, 0.95)';
    ctx.shadowBlur = 16;
    ctx.strokeStyle = 'rgba(255, 82, 110, 0.95)';
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const centerAng = (i * Math.PI) / 2 + Math.PI / 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 148, centerAng - 0.32, centerAng + 0.32);
      ctx.stroke();
    }

    ctx.shadowColor = 'rgba(255, 220, 90, 0.95)';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = 'rgba(255, 238, 150, 0.92)';
    ctx.lineWidth = 3.5;
    const tickDirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (const [dx, dy] of tickDirs) {
      ctx.beginPath();
      ctx.moveTo(cx + dx * 112, cy + dy * 112);
      ctx.lineTo(cx + dx * 136, cy + dy * 136);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255, 245, 190, 0.96)';
    ctx.beginPath();
    ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Computes the active player's muzzle origin, aim direction vector, and shooter collider ID.
 */
export function computePlayerMuzzleAndAimDirection(
  playerUnit: BuddyUnit,
  mountedTank: TankVehicle | null,
  aimWorldPoint: THREE.Vector3,
): { muzzleOrigin: Vec3; aimDir: Vec3; shooterId: string } {
  if (mountedTank) {
    if (mountedTank.vehicleKind === 'plane') {
      const alt = mountedTank.altitude ?? 0;
      const groundElev = getTerrainElevation(mountedTank.x, mountedTank.z);
      const muzzleY = groundElev + 0.55 + alt;
      const fwdX = Math.cos(mountedTank.hullYaw);
      const fwdZ = -Math.sin(mountedTank.hullYaw);
      const distToAim = Math.max(
        9.0,
        getPlanetShortestDistance(aimWorldPoint.x, aimWorldPoint.z, mountedTank.x, mountedTank.z),
      );
      const pitchDropY =
        alt > 1.2 ? clamp((groundElev + 1.2 - muzzleY) / distToAim, -0.55, 0.02) : 0;
      const dLen = Math.hypot(fwdX, pitchDropY, fwdZ) || 1;
      return {
        muzzleOrigin: {
          x: wrapPlanetCoord(mountedTank.x + fwdX * 2.1),
          y: muzzleY,
          z: wrapPlanetCoord(mountedTank.z + fwdZ * 2.1),
        },
        aimDir: { x: fwdX / dLen, y: pitchDropY / dLen, z: fwdZ / dLen },
        shooterId: `veh_${mountedTank.id}`,
      };
    }
    const totalYaw =
      mountedTank.vehicleKind === 'truck'
        ? mountedTank.hullYaw
        : mountedTank.hullYaw + mountedTank.turretYaw;
    const fwdX = Math.cos(totalYaw);
    const fwdZ = -Math.sin(totalYaw);
    const tankGroundY = getTerrainElevation(mountedTank.x, mountedTank.z);
    return {
      muzzleOrigin: {
        x: wrapPlanetCoord(mountedTank.x + fwdX * 3.4),
        y: tankGroundY + 2.15,
        z: wrapPlanetCoord(mountedTank.z + fwdZ * 3.4),
      },
      aimDir: { x: fwdX, y: 0, z: fwdZ },
      shooterId: `veh_${mountedTank.id}`,
    };
  }

  const aimDx = getPlanetShortestDelta(aimWorldPoint.x, playerUnit.x);
  const aimDz = getPlanetShortestDelta(aimWorldPoint.z, playerUnit.z);
  const aimHorizLen = Math.hypot(aimDx, aimDz);
  const fwdX = aimHorizLen > 0.25 ? aimDx / aimHorizLen : Math.cos(playerUnit.yaw);
  const fwdZ = aimHorizLen > 0.25 ? aimDz / aimHorizLen : -Math.sin(playerUnit.yaw);
  const rightX = -fwdZ;
  const rightZ = fwdX;
  const playerTerrainY = getTerrainElevation(playerUnit.x, playerUnit.z) + playerUnit.jumpOffset;
  const wId = playerUnit.weaponId;
  const muzzleY =
    wId === 'bazooka'
      ? playerTerrainY + 1.82
      : wId === 'rifle'
        ? playerTerrainY + 1.46
        : playerTerrainY + 1.54;
  const fwdOff = wId === 'bazooka' ? 1.38 : wId === 'rifle' ? 1.42 : 1.15;
  const rightOff = wId === 'bazooka' ? 0.54 : wId === 'rifle' ? 0.12 : 0.07;

  return {
    muzzleOrigin: {
      x: wrapPlanetCoord(playerUnit.x + fwdX * fwdOff + rightX * rightOff),
      y: muzzleY,
      z: wrapPlanetCoord(playerUnit.z + fwdZ * fwdOff + rightZ * rightOff),
    },
    aimDir: { x: fwdX, y: 0, z: fwdZ },
    shooterId: `buddy_${playerUnit.id}`,
  };
}

/**
 * Builds the 3D raycast collider list for muzzle hit detection and enemy target lock-on.
 */
export function buildArenaRaycastColliders(params: {
  shooterId: string;
  rayOriginX: number;
  rayOriginZ: number;
  playerUnit: BuddyUnit;
  mountedTank: TankVehicle | null;
  buddyUnits: ReadonlyArray<BuddyUnit>;
  tanks: ReadonlyArray<TankVehicle>;
  redBase: { baseGroup: THREE.Group; hqX: number; hqZ: number };
  activeMapProps: ReadonlyArray<ActiveMapPropPhysics>;
  trees: ReadonlyArray<DestructibleTree>;
  staticStructures: ReadonlyArray<StaticWorldStructureObb>;
}): RaycastCollider3D[] {
  const {
    shooterId,
    rayOriginX,
    rayOriginZ,
    playerUnit,
    mountedTank,
    buddyUnits,
    tanks,
    redBase,
    activeMapProps,
    trees,
    staticStructures,
  } = params;

  const colliders: RaycastCollider3D[] = [];
  const maxCullDist = RAYCAST_MAX_DISTANCE + 10.0;

  if (mountedTank) {
    colliders.push({
      id: shooterId,
      layer: RAYCAST_LAYERS.SHOOTER,
      targetKind: 'vehicle',
      team: 'blue',
      label: 'Player Vehicle',
      shape: 'obb',
      center: {
        x: mountedTank.x,
        y: getTerrainElevation(mountedTank.x, mountedTank.z) + (mountedTank.altitude ?? 0) + 1.15,
        z: mountedTank.z,
      },
      halfExtents: { x: 2.5, y: 1.35, z: 1.7 },
      rotY: -(mountedTank.hullYaw ?? 0),
    });
  } else if (playerUnit.alive) {
    colliders.push({
      id: shooterId,
      layer: RAYCAST_LAYERS.SHOOTER,
      targetKind: 'enemy_character',
      team: 'blue',
      label: 'Player Buddy',
      shape: 'cylinder',
      center: {
        x: playerUnit.x,
        y: getTerrainElevation(playerUnit.x, playerUnit.z) + playerUnit.jumpOffset + 1.05,
        z: playerUnit.z,
      },
      radius: 0.85,
      halfExtents: { x: 0.85, y: 1.1, z: 0.85 },
    });
  }

  for (let i = 0; i < buddyUnits.length; i++) {
    const b = buddyUnits[i];
    if (!b.alive || b.isPlayer || b.team === 'blue' || !b.root.visible) continue;
    if (tanks.some((t) => t.occupiedByAiId === b.id)) continue;
    const floatY = BUDDY_CLASSES[b.classId].canFly ? 0.65 : 0;
    const by = getTerrainElevation(b.x, b.z) + floatY + b.jumpOffset + 1.05;
    colliders.push({
      id: `buddy_${b.id}`,
      layer: RAYCAST_LAYERS.ENEMY_CHARACTER,
      targetKind: 'enemy_character',
      team: 'red',
      label: `Musuh ${b.classId}`,
      shape: 'cylinder',
      center: { x: b.x, y: by, z: b.z },
      radius: 1.02,
      halfExtents: { x: 1.02, y: 1.22, z: 1.02 },
    });
  }

  for (let i = 0; i < tanks.length; i++) {
    const tv = tanks[i];
    if (tv.hp <= 0 || tv === mountedTank || tv.team === 'blue' || !tv.root.visible) continue;
    const vGroundY = getTerrainElevation(tv.x, tv.z);
    const vCenterY = vGroundY + (tv.altitude ?? 0) + 1.15;
    const tvHalfX =
      tv.vehicleKind === 'truck' ? 3.66 : tv.vehicleKind === 'tank' ? 2.48 : 2.52;
    const tvHalfZ =
      tv.vehicleKind === 'truck' ? 1.76 : tv.vehicleKind === 'tank' ? 1.66 : 2.48;
    const vehLabel =
      tv.vehicleKind === 'plane'
        ? 'Pesawat Tempur Musuh'
        : tv.vehicleKind === 'truck'
          ? 'Dump Truck Musuh'
          : tv.isSuper
            ? 'Tyrant Tank Musuh'
            : 'Tank Tempur Musuh';
    colliders.push({
      id: `veh_${tv.id}`,
      layer: RAYCAST_LAYERS.VEHICLE,
      targetKind: 'vehicle',
      team: 'red',
      label: vehLabel,
      shape: 'obb',
      center: { x: tv.x, y: vCenterY, z: tv.z },
      halfExtents: { x: tvHalfX, y: 1.38, z: tvHalfZ },
      rotY: -(tv.hullYaw ?? 0),
    });
  }

  const enemySkyshields = getBaseSkyshieldTurrets(redBase.baseGroup);
  for (let si = 0; si < enemySkyshields.length; si++) {
    const st = enemySkyshields[si];
    if (!st.isBuilt || st.hp <= 0) continue;
    const wx = redBase.hqX - st.localZ;
    const wz = redBase.hqZ + st.localX;
    const groundY = getTerrainElevation(wx, wz);
    colliders.push({
      id: `skyshield_red_${si}`,
      layer: RAYCAST_LAYERS.SKYSHIELD,
      targetKind: 'skyshield',
      team: 'red',
      label: `Skyshield 35mm Musuh (#${si + 1})`,
      shape: 'cylinder',
      center: { x: wx, y: groundY + 2.85, z: wz },
      radius: 2.22,
      halfExtents: { x: 2.22, y: 2.85, z: 2.22 },
    });
  }

  for (let i = 0; i < activeMapProps.length; i++) {
    const mp = activeMapProps[i];
    if (!mp.alive || mp.category === 'none') continue;
    if (Math.abs(mp.x - rayOriginX) > maxCullDist || Math.abs(mp.z - rayOriginZ) > maxCullDist) {
      continue;
    }
    const groundY = getTerrainElevation(mp.x, mp.z);
    const halfH = Math.max(0.75, mp.heightY * 0.5);
    if (mp.halfX !== undefined && mp.halfZ !== undefined) {
      colliders.push({
        id: `prop_${mp.id}`,
        layer: RAYCAST_LAYERS.PROP,
        targetKind: 'prop',
        label: mp.kind,
        shape: 'obb',
        center: { x: mp.x, y: groundY + halfH, z: mp.z },
        halfExtents: { x: mp.halfX, y: halfH, z: mp.halfZ },
        rotY: mp.rotY,
      });
    } else {
      colliders.push({
        id: `prop_${mp.id}`,
        layer: RAYCAST_LAYERS.PROP,
        targetKind: 'prop',
        label: mp.kind,
        shape: 'cylinder',
        center: { x: mp.x, y: groundY + halfH, z: mp.z },
        radius: Math.max(0.55, mp.radius),
        halfExtents: { x: mp.radius, y: halfH, z: mp.radius },
      });
    }
  }

  for (let i = 0; i < trees.length; i++) {
    const tr = trees[i];
    if (!tr.alive) continue;
    if (Math.abs(tr.x - rayOriginX) > maxCullDist || Math.abs(tr.z - rayOriginZ) > maxCullDist) {
      continue;
    }
    const groundY = getTerrainElevation(tr.x, tr.z);
    const trunkR = 0.88 * tr.scale;
    colliders.push({
      id: `tree_${tr.id}`,
      layer: RAYCAST_LAYERS.PROP,
      targetKind: 'prop',
      label: 'Tree',
      shape: 'cylinder',
      center: { x: tr.x, y: groundY + 2.2 * tr.scale, z: tr.z },
      radius: trunkR,
      halfExtents: { x: trunkR, y: 2.2 * tr.scale, z: trunkR },
    });
  }

  for (let i = 0; i < staticStructures.length; i++) {
    const st = staticStructures[i];
    if (st.id.startsWith('bastion_')) continue;
    const structSpan = Math.max(st.halfX, st.halfZ) + maxCullDist;
    if (Math.abs(st.x - rayOriginX) > structSpan || Math.abs(st.z - rayOriginZ) > structSpan) {
      continue;
    }
    const groundY = getTerrainElevation(st.x, st.z);
    const halfH = st.heightY * 0.5;
    colliders.push({
      id: `struct_${st.id}`,
      layer: RAYCAST_LAYERS.STRUCTURE,
      targetKind: 'structure',
      label: st.id,
      shape: 'obb',
      center: { x: st.x, y: groundY + halfH, z: st.z },
      halfExtents: { x: st.halfX, y: halfH, z: st.halfZ },
      rotY: st.rotY,
    });
  }

  return colliders;
}
