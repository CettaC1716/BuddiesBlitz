import {
  IndividualCommanderBaseState,
  TeamCommandMode,
  evaluateGrassChunkVisibilityFactor,
  computeLandMineGrassYOffset,
  evaluatePersonalCommandCenterRadarOperator,
  PersonalCommandCenterRadarOperatorStatus,
  isPointVisibleOnCommandCenterRadar,
  RadarOperatorCandidateUnit,
} from './buddiesBlitzRules';
import {
  evaluateLyoGrassMask,
} from './planetCurvature';
import {
  BuddyUnit,
  TankVehicle,
  WorldCrate,
  WorldPickup,
  ActiveOrdnanceDevice3D,
  RadarDot,
  PlayMode,
} from './buddiesBlitzTypes';

export interface MinimapRadarEvaluationResult {
  radarDots: RadarDot[];
  operatorStatus: PersonalCommandCenterRadarOperatorStatus;
}

/**
 * Evaluates the Player's Personal Command Center Radar operator state (`commanderIdx = 0`)
 * and builds the filtered Minimap `radarDots` list:
 * - Box/Crate dots are intentionally omitted so the Minimap stays clean and uncluttered.
 * - Radar operator is ONLY active if at least 1 living squad unit owned by the player (`team === 'blue' && ownerCommanderId === 0`)
 *   is set to `DEFEND` (`teamCommand === 'DEFEND'`) and stationed inside the player's own Command Center / base area,
 *   OR the player's own main character is currently inside their own Command Center / base area.
 * - Teammate / AI multiplayer allies (`ownerCommanderId !== 0`) CANNOT activate the player's radar.
 * - Enemy infantry (`kind: 'enemy'`) and Enemy heavy vehicles (`kind: 'tank_red'`) are only included on the Minimap
 *   if they are inside the player's 21.0m grass chunk streaming circle OR within the active Command Center radar scan radius
 *   (Lv.1 = 45% map, Lv.2 = 75% map, Lv.3 = 100% map).
 */
export function evaluatePlayerCommandCenterRadarAndMinimapDots(params: {
  myPlot: IndividualCommanderBaseState;
  buddyUnits: ReadonlyArray<BuddyUnit>;
  tanks: ReadonlyArray<TankVehicle>;
  playerUnit: BuddyUnit;
  mountedTank: TankVehicle | null;
  teamCommand: TeamCommandMode;
  actorX: number;
  actorZ: number;
  activeSupplyDropSignal?: { x: number; z: number } | null;
}): MinimapRadarEvaluationResult {
  const {
    myPlot,
    buddyUnits,
    tanks,
    playerUnit,
    mountedTank,
    teamCommand,
    actorX,
    actorZ,
    activeSupplyDropSignal,
  } = params;

  const operatorCandidates: RadarOperatorCandidateUnit[] = [];
  for (let i = 0; i < buddyUnits.length; i++) {
    const b = buddyUnits[i];
    if (!b.alive || b.isPlayer) continue;
    // Units driving/riding inside a vehicle cannot operate the Command Center radar console
    if (tanks.some((v) => v.hp > 0 && v.occupiedByAiId === b.id)) continue;
    // Each player-owned squad unit (`ownerCommanderId === 0 && team === 'blue'`) uses its own `assignedRole` (falling back to `teamCommand`)
    const unitCommand: TeamCommandMode =
      b.team === 'blue' && b.ownerCommanderId === myPlot.commanderIdx
        ? (b.assignedRole ?? teamCommand)
        : 'ATTACK';
    operatorCandidates.push({
      id: b.id,
      team: b.team,
      ownerCommanderId: b.ownerCommanderId,
      alive: b.alive,
      command: unitCommand,
      x: b.x,
      z: b.z,
    });
  }

  // If the player's active character mounts a vehicle (e.g. Cargo Truck) or leaves the Command Center area,
  // they cannot operate the radar console unless another DEFEND unit remains stationed at the Command Center.
  const operatorStatus = evaluatePersonalCommandCenterRadarOperator(
    myPlot,
    operatorCandidates,
    mountedTank
      ? null
      : {
          team: playerUnit.team,
          ownerCommanderId: playerUnit.ownerCommanderId,
          alive: playerUnit.alive,
          x: actorX,
          z: actorZ,
        },
  );

  const radarBaseCenterX = myPlot.buildingX;
  const radarBaseCenterZ = myPlot.buildingZ;
  const cmdCenterLevel = myPlot.commandCenterLevel ?? myPlot.buildingLevel;

  const radarDots: RadarDot[] = [];

  if (activeSupplyDropSignal) {
    radarDots.push({
      id: 'supply-drop-signal',
      kind: 'supply_drop',
      x: activeSupplyDropSignal.x,
      z: activeSupplyDropSignal.z,
    });
  }

  // Vehicles (Tanks, Dump Trucks, Fighter Planes):
  // Enemy heavy vehicles receive `kind: 'tank_red'` so the Minimap renders them as a prominent blinking large red circle dot.
  for (let i = 0; i < tanks.length; i++) {
    const t = tanks[i];
    if (t.hp <= 0) continue;
    // Skip unmounted neutral/empty vehicles unless occupied or belonging to an active team combatant
    const isFriendlyVehicle = t.team === 'blue';
    if (
      !isPointVisibleOnCommandCenterRadar(
        t.x,
        t.z,
        isFriendlyVehicle,
        cmdCenterLevel,
        radarBaseCenterX,
        radarBaseCenterZ,
        actorX,
        actorZ,
        operatorStatus.radarActive,
      )
    ) {
      continue;
    }
    radarDots.push({
      id: `t-${t.id}`,
      kind: isFriendlyVehicle ? 'tank_blue' : 'tank_red',
      x: t.x,
      z: t.z,
    });
  }

  // Characters / Infantry:
  // Enemy infantry receive `kind: 'enemy'` so the Minimap renders them as a blinking small red dot.
  for (let i = 0; i < buddyUnits.length; i++) {
    const b = buddyUnits[i];
    if (!b.alive) continue;
    // If an AI unit is currently inside a vehicle, its vehicle dot already represents it on radar
    if (!b.isPlayer && tanks.some((v) => v.hp > 0 && v.occupiedByAiId === b.id)) {
      continue;
    }
    const bx = b.isPlayer && mountedTank ? mountedTank.x : b.x;
    const bz = b.isPlayer && mountedTank ? mountedTank.z : b.z;
    const isFriendly = b.isPlayer || b.team === 'blue';
    if (
      !isPointVisibleOnCommandCenterRadar(
        bx,
        bz,
        isFriendly,
        cmdCenterLevel,
        radarBaseCenterX,
        radarBaseCenterZ,
        actorX,
        actorZ,
        operatorStatus.radarActive,
      )
    ) {
      continue;
    }
    radarDots.push({
      id: `b-${b.id}`,
      kind: b.isPlayer ? 'player' : b.team === 'blue' ? 'ally' : 'enemy',
      x: bx,
      z: bz,
    });
  }

  return {
    radarDots,
    operatorStatus,
  };
}

/**
 * Synchronizes 3D screen visibility of field objects (`worldCrates`, `worldPickups`, `activeOrdnanceDevices`)
 * and Enemy units/vehicles (`team === 'red'`) with the player's 3D grass chunk streaming radius (`21.0m`,
 * smooth inner fade `18.9m..21.0m`), and lowers `land_mine` Y by `-0.04m` on grass so it sits camouflaged in the grass blades.
 */
export function applyGrassChunkSyncedFogOfWar3D(params: {
  viewerX: number;
  viewerZ: number;
  playMode: PlayMode;
  bypassFogOfWar: boolean;
  worldCrates: ReadonlyArray<WorldCrate>;
  worldPickups: ReadonlyArray<WorldPickup>;
  activeOrdnanceDevices: ReadonlyArray<ActiveOrdnanceDevice3D>;
  buddyUnits: ReadonlyArray<BuddyUnit>;
  tanks: ReadonlyArray<TankVehicle>;
}): void {
  const {
    viewerX,
    viewerZ,
    playMode,
    bypassFogOfWar,
    worldCrates,
    worldPickups,
    activeOrdnanceDevices,
    buddyUnits,
    tanks,
  } = params;

  if (bypassFogOfWar || playMode === 'editor') {
    for (let i = 0; i < worldCrates.length; i++) {
      const c = worldCrates[i];
      if (c.state !== 'carried') {
        c.mesh.visible = true;
        c.boxVisualGroup.scale.setScalar(1);
      }
    }
    for (let i = 0; i < worldPickups.length; i++) {
      worldPickups[i].mesh.visible = true;
      worldPickups[i].mesh.scale.setScalar(1);
    }
    for (let i = 0; i < activeOrdnanceDevices.length; i++) {
      activeOrdnanceDevices[i].mesh.visible = true;
    }
    return;
  }

  // 1. Field Crates (Wild Boxes / Drops): hide outside 21.0m grass chunk radius, smooth scale at inner edge (18.9m..21.0m)
  for (let i = 0; i < worldCrates.length; i++) {
    const c = worldCrates[i];
    if (c.state === 'carried') continue;
    const vis = evaluateGrassChunkVisibilityFactor(c.x, c.z, viewerX, viewerZ);
    c.mesh.visible = vis.visible;
    if (vis.visible) {
      c.boxVisualGroup.scale.setScalar(vis.scaleFactor);
    }
  }

  // 2. Field Pickups (Warzone Coins, Dropped Weapons, Medkits, Secondary Items):
  for (let i = 0; i < worldPickups.length; i++) {
    const pk = worldPickups[i];
    const vis = evaluateGrassChunkVisibilityFactor(pk.x, pk.z, viewerX, viewerZ);
    if (!vis.visible) {
      pk.mesh.visible = false;
      continue;
    }
    // Preserve rapid despawn blink state if active, otherwise visible
    if (!pk.isFromDeathDrop || pk.totalLifeSec <= 0) {
      pk.mesh.visible = true;
    }
    pk.mesh.scale.setScalar(vis.scaleFactor);
    if (pk.kind === 'secondary' && pk.secondaryId === 'land_mine') {
      const gMask = evaluateLyoGrassMask(pk.x, pk.z);
      pk.mesh.position.y += computeLandMineGrassYOffset(gMask);
    }
  }

  // 3. Active 3D Ordnance Devices (Land Mine, Frag Grenade, Cluster Bomb):
  //    Specially lower Land Mine Y by -0.04m in grass areas (`computeLandMineGrassYOffset`) so it is camouflaged among grass blades!
  for (let i = 0; i < activeOrdnanceDevices.length; i++) {
    const ord = activeOrdnanceDevices[i];
    const vis = evaluateGrassChunkVisibilityFactor(ord.pos.x, ord.pos.z, viewerX, viewerZ);
    ord.mesh.visible = vis.visible;
    if (vis.visible) {
      const baseScale =
        ord.kind === 'cluster_bomb' ? 1.45 : ord.kind === 'land_mine' ? 1.3 : 1.25;
      ord.mesh.scale.setScalar(baseScale * vis.scaleFactor);
      if (ord.kind === 'land_mine' && ord.isGrounded) {
        const gMask = evaluateLyoGrassMask(ord.pos.x, ord.pos.z);
        ord.mesh.position.y = ord.pos.y + computeLandMineGrassYOffset(gMask);
      }
    }
  }

  // 4. Enemy Characters (`team === 'red'`): hide outside 21.0m grass chunk radius (including floating salute/HP sprite & stun mesh)
  //    with smooth scale transition at the inner edge (18.9m..21.0m)
  for (let i = 0; i < buddyUnits.length; i++) {
    const b = buddyUnits[i];
    if (!b.alive) continue;
    if (b.team !== 'red') {
      b.bodyGroup.scale.setScalar(1);
      continue;
    }
    // If riding inside an enemy vehicle, keep character hidden inside the vehicle
    if (tanks.some((v) => v.hp > 0 && v.occupiedByAiId === b.id)) {
      b.root.visible = false;
      b.saluteSign.sprite.visible = false;
      continue;
    }
    const vis = evaluateGrassChunkVisibilityFactor(b.x, b.z, viewerX, viewerZ);
    b.root.visible = vis.visible;
    if (!vis.visible) {
      b.saluteSign.sprite.visible = false;
      if (b.stunMesh) b.stunMesh.visible = false;
    } else {
      b.bodyGroup.scale.setScalar(vis.scaleFactor);
    }
  }

  // 5. Enemy Vehicles (`team === 'red'` — Tank, Dump Truck, Fighter Plane):
  //    hide outside 21.0m grass chunk radius with smooth scale transition at the inner edge (18.9m..21.0m)
  for (let i = 0; i < tanks.length; i++) {
    const v = tanks[i];
    if (v.hp <= 0) continue;
    if (v.team !== 'red') {
      v.bodyGroup.scale.setScalar(1);
      continue;
    }
    const vis = evaluateGrassChunkVisibilityFactor(v.x, v.z, viewerX, viewerZ);
    v.root.visible = vis.visible;
    if (!vis.visible) {
      if (v.stunMesh) v.stunMesh.visible = false;
    } else {
      v.bodyGroup.scale.setScalar(vis.scaleFactor);
    }
  }
}
