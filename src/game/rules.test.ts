import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REA_CONSTANTS,
  stepCriticalDampedSpring3D,
  computeTankSpeedStep,
  stepTurretYaw,
  isPowerCoreReady,
  evaluateStackingPadRecipe,
  chooseNextPadSlotIndex,
  getBuildOrderAllowedSlots,
  resolveCursorCommandTarget,
  BUDDY_CLASSES,
  getPropCollisionSpec,
  resolveSolidCollision2D,
  resolveSolidObbCollision2D,
  pointInObb2D,
  computePushableImpulse2D,
  shouldShatterBreakableProp,
  canTriggerCollisionCooldown,
  shouldPlayMoverCollisionSound,
  computeCollisionAudioParams,
  evaluateLyoFireballState,
  evaluateLyoSmokePuffState,
  computeMultiStageExplosionSchedule,
  DUMP_TRUCK_MAX_CRATES,
  classifyDumpTruckMeshIsland,
  canLoadCrateIntoDumpTruck,
  evaluateDumpTruckHydraulicCycle,
  stepDumpTruckWheeledPhysics,
  stepMilitaryBaseBoomBarrier,
  stepBuddyJumpPhysics,
  evaluateBuddyMeleeStrike,
  MAX_CHARACTERS_PER_COMMANDER,
  canCommanderBuildCharacter,
  getNextOwnedBuddyForSwap,
  canStartMatchmaking4v4,
  createMatchmaking4v4State,
  hotJoinReplaceAiCommander,
  evaluateBuiltBuddySmartAiDecision,
  AStarBinaryHeap,
  computeManhattanHeuristic,
  computeOctileHeuristic,
  createAStarNavGrid,
  rasterizeObbObstacleToNavGrid,
  rasterizeCircleObstacleToNavGrid,
  findPathAStar,
  evaluateLyoHitReactionPose,
  evaluateLyoStunEffectState,
  evaluateLyoTankShotRecoilPose,
  evaluateLyoEmissiveHitFlash,
  RAYCAST_MAX_DISTANCE,
  RAYCAST_LAYERS,
  RaycastCollider3D,
  castMuzzleRaycast3D,
  getWeaponProjectileVisualSpec,
  DEFAULT_BULLET_LANE_POOL_SIZE,
  POOL_PEAK_CAPACITIES,
  createFixedObjectPool,
  simulatePooledVsUnpooledBulletLane,
  resolveSolidCratePush2D,
  resolveCrateVsCrateCollision2D,
  CITY_TRAM_SPEC,
  sampleCityTramTrackAtDistance,
  evaluateCityTramConsistState,
  INDIVIDUAL_BASE_LEVEL_SPECS,
  BASE_SKIN_THEMES,
  BASE_GARDEN_PRESETS,
  createIndividualCommanderBasesState,
  applyCommanderBaseUpgrade,
  isTeamAllBasesDestroyed,
  canUnitBoardCityTramAtAnyPoint,
  computeCityTramDisembarkPosition,
  canUnitEnterCommanderBaseGate,
  stepCommanderSlidingGate,
  TEAM_BUDDIES_WEAPON_DESPAWN_SEC,
  TEAM_BUDDIES_DESPAWN_BLINK_WINDOW_SEC,
  TEAM_BUDDIES_CRAFTED_WEAPON_DESPAWN_SEC,
  TEAM_BUDDIES_STACKING_PATTERNS,
  TEAM_BUDDIES_CRATE_SCHEMES,
  evaluateTeamBuddiesDeathDrops,
  evaluateDroppedItemDespawnState,
  evaluateCrateDestructionDrop,
  evaluateSplashDamageOnDroppedItem,
  computeStackingPadWeaponPopOutTrajectory,
  getBuddyWeaponTierRank,
  canUnitLootGroundWeapon,
  doesCraftedEntityDespawnByTimer,
  canBuddyUnitRespawnAtBase,
  canPadSlotsBirthNewBuddy,
  isTeamEliminatedInDeathmatch,
  evaluateTeamBuddiesDeathmatchWinCondition,
  KIOSK_BUILD_PRIORITY_RECIPES,
  getHologramSlotHexColor,
  chooseNextPadSlotIndexForHologram,
  getRemainingNeededCrateKindsForHologram,
  evaluatePadHologramState,
  selectSmartCrateForAiHarvester,
  getCommanderBaseGoldUpgradeSpecs,
  applyCommanderBaseGoldUpgrade,
  KIOSK_CRATE_AIRDROP_SHOP,
  purchaseCrateAirdropWithGold,
  evaluateCommandCenterRadarSpec,
  worldCoordToRadarPercent,
  isPointVisibleOnCommandCenterRadar,
} from './rules';
import { evaluateRoadNetworkSdf } from './planetCurvature';
import {
  computeExplosionDucking,
  getTacticalAudioSpec,
  computeSpatialAudioGain,
  isListenerInsideBasePerimeter,
  computeBuildBoxAudioGain,
} from './audio';

test('REA constants match extracted longhoang-lyo.com values and low-angle horizon chase camera', () => {
  assert.equal(REA_CONSTANTS.camera.fov, 42);
  assert.deepEqual(REA_CONSTANTS.camera.chaseOffset, { x: 0, y: 5.2, z: 12.5 });
  assert.equal(REA_CONSTANTS.camera.chaseLookAtYOffset, 2.4);
  assert.deepEqual(REA_CONSTANTS.camera.defaultAngleOffset, { x: 4, y: 14, z: 8 });
  assert.equal(REA_CONSTANTS.physics.drive.speed, 8.0);
  assert.equal(REA_CONSTANTS.physics.drive.boostMultiplier, 1.9);
  assert.equal(REA_CONSTANTS.physics.cannon.projectileSpeed, 55.0);
  assert.equal(REA_CONSTANTS.shadersAndLighting.outline.strokeWidth, 0.018);
  assert.equal(REA_CONSTANTS.shadersAndLighting.outline.strokeColor, '#17110f');
});

test('computeTankSpeedStep accelerates on boost and decays 10x faster on release', () => {
  const boosted = computeTankSpeedStep(8.0, true, 0.5);
  assert.ok(boosted > 8.0 && boosted <= 15.2);

  const maxed = computeTankSpeedStep(8.0, true, 2.0);
  assert.equal(maxed, 15.2);

  const decayed = computeTankSpeedStep(15.2, false, 0.05);
  assert.ok(decayed < 15.2 && decayed >= 8.0);
});

test('stepCriticalDampedSpring3D converges smoothly toward target and snaps beyond 6m', () => {
  const step1 = stepCriticalDampedSpring3D(
    { x: 0, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    8.0,
    0.016,
  );
  assert.ok(step1.position.x > 0 && step1.position.x < 2);
  assert.ok(step1.velocity.x > 0);

  // Beyond 6m (distanceSq > 36), snaps directly to target
  const snapped = stepCriticalDampedSpring3D(
    { x: 0, y: 0, z: 0 },
    { x: 10, y: 0, z: 0 },
    { x: 5, y: 0, z: 0 },
    8.0,
    0.016,
  );
  assert.equal(snapped.position.x, 10);
  assert.equal(snapped.velocity.x, 0);
});

test('stepTurretYaw interpolates across shortest angle wrap', () => {
  const next = stepTurretYaw(0, Math.PI / 2, 0.016);
  assert.ok(next > 0 && next < Math.PI / 2);
});

test('isPowerCoreReady triggers when all 4 factory parts are collected', () => {
  assert.equal(isPowerCoreReady(3, 4), false);
  assert.equal(isPowerCoreReady(4, 4), true);
});

test('evaluateStackingPadRecipe evaluates 1..8 crate stacks, Merged Crates, and Super Crate upgrade', () => {
  const singleRed = evaluateStackingPadRecipe([
    'red',
    'empty',
    'empty',
    'empty',
    'empty',
    'empty',
    'empty',
    'empty',
  ]);
  assert.equal(singleRed.totalCrates, 1);
  assert.equal(singleRed.isMerged, false);
  assert.equal(singleRed.isSuper, false);
  assert.equal(singleRed.shapeKey, '1x1x1');
  assert.equal(singleRed.category, 'lite_weapon');

  const verticalBuddySuper = evaluateStackingPadRecipe([
    'red',
    'empty',
    'empty',
    'empty',
    'super',
    'empty',
    'empty',
    'empty',
  ]);
  assert.equal(verticalBuddySuper.totalCrates, 2);
  assert.equal(verticalBuddySuper.isMerged, true);
  assert.equal(verticalBuddySuper.isSuper, true);
  assert.equal(verticalBuddySuper.shapeKey, '1x1x2');
  assert.equal(verticalBuddySuper.category, 'buddy_t1');
  assert.equal(verticalBuddySuper.spawnType, 'buddy');

  const fullCubeSuperTank = evaluateStackingPadRecipe([
    'red',
    'red',
    'red',
    'red',
    'red',
    'red',
    'red',
    'super',
  ]);
  assert.equal(fullCubeSuperTank.totalCrates, 8);
  assert.equal(fullCubeSuperTank.isMerged, true);
  assert.equal(fullCubeSuperTank.isSuper, true);
  assert.equal(fullCubeSuperTank.shapeKey, '2x2x2');
  assert.equal(fullCubeSuperTank.outputName, 'Tyrant Tank');
});

test('BUDDY_CLASSES defines all 7 Team Buddies classes with Ninja Katana crate slicer', () => {
  assert.equal(Object.keys(BUDDY_CLASSES).length, 7);
  assert.equal(BUDDY_CLASSES.Ninja.canSliceMergedCrates, true);
  assert.equal(BUDDY_CLASSES.Cyborg.vehicleResistant, true);
  assert.equal(BUDDY_CLASSES.SuperBuddie.canFly, true);
});

test('chooseNextPadSlotIndex strictly enforces [Q] build order slots and stops when pattern is full', () => {
  const oneCrate = ['red', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'] as const;
  assert.equal(chooseNextPadSlotIndex(oneCrate, '1x1x1'), -1);
  assert.equal(chooseNextPadSlotIndex(oneCrate, '2x1x1'), 1);
  assert.equal(chooseNextPadSlotIndex(oneCrate, '1x1x2'), 4);
  assert.equal(chooseNextPadSlotIndex(oneCrate, '2x2x1'), 1);
  assert.deepEqual(getBuildOrderAllowedSlots('2x1x2'), [0, 1, 4, 5]);
});

test('resolveCursorCommandTarget maps cursor crosshair onto Crate, Enemy, Base, or Tank orders', () => {
  const baseInput = {
    crates: [{ x: 0, z: 0 }],
    enemies: [{ x: 2, z: -15 }],
    emptyTanks: [{ x: -4, z: 14 }],
    blueBase: { x: 0, z: 22, padX: -6.2, padZ: 16.5 },
    redBase: { x: 0, z: -22, padX: 6.2, padZ: -16.5 },
    currentCommand: 'HARVEST' as const,
  };

  assert.equal(
    resolveCursorCommandTarget({ ...baseInput, cursorX: 0.5, cursorZ: 0.5 }).command,
    'HARVEST',
  );
  assert.equal(
    resolveCursorCommandTarget({ ...baseInput, cursorX: 2.2, cursorZ: -14.8 }).command,
    'ATTACK',
  );
  assert.equal(
    resolveCursorCommandTarget({ ...baseInput, cursorX: 0, cursorZ: 21 }).command,
    'DEFEND',
  );
  assert.equal(
    resolveCursorCommandTarget({ ...baseInput, cursorX: -4, cursorZ: 14 }).command,
    'MOUNT',
  );
});

test('getPropCollisionSpec classifies solid, pushable, and breakable Lyo props accurately', () => {
  const giantTank = getPropCollisionSpec('giant_tank', 1.0);
  assert.equal(giantTank.category, 'solid');
  assert.equal(giantTank.materialTag, 'metal');

  const tree = getPropCollisionSpec('tree_purple', 1.0);
  assert.equal(tree.category, 'solid');
  assert.equal(tree.materialTag, 'tree');

  const wheelbarrow = getPropCollisionSpec('wheelbarrow', 1.0);
  assert.equal(wheelbarrow.category, 'pushable');
  assert.equal(wheelbarrow.materialTag, 'metal');

  const barricade = getPropCollisionSpec('barricade', 1.0);
  assert.equal(barricade.category, 'pushable');
  assert.equal(barricade.materialTag, 'wood');
  assert.equal(barricade.destructible, true);

  const barrel = getPropCollisionSpec('explosive_barrel', 1.0);
  assert.equal(barrel.category, 'breakable');
  assert.equal(barrel.destructible, true);
});

test('resolveSolidCollision2D prevents penetration, slides along tangent, and bounces velocity', () => {
  const res = resolveSolidCollision2D(
    1.2,
    0,
    -10,
    4,
    0.8,
    0,
    0,
    1.0,
    0.4,
  );
  assert.equal(res.collided, true);
  // Pushed outside minDist (0.8 + 1.0 = 1.8)
  assert.ok(Math.hypot(res.x, res.z) >= 1.8);
  // Normal velocity reflected positive, tangential velocity preserved with slight slide friction
  assert.ok(res.vx > 0);
  assert.ok(res.vz > 3.0);
  assert.ok(res.impactSpeed >= 10);
});

test('computePushableImpulse2D transfers momentum and angular impulse to pushable props', () => {
  const res = computePushableImpulse2D(
    0,
    0,
    12,
    0,
    1.4,
    12,
    1.8,
    0.2,
    0,
    0,
    0.9,
    2.0,
    0.5,
  );
  assert.equal(res.collided, true);
  assert.ok(res.propVx > 8);
  assert.ok(res.impactSpeed > 10);
  assert.notEqual(res.angularImpulse, 0);
});

test('shouldShatterBreakableProp and canTriggerCollisionCooldown enforce shatter & 100ms cooldown', () => {
  assert.equal(shouldShatterBreakableProp('barricade', 4.0, true, 25), false);
  assert.equal(shouldShatterBreakableProp('barricade', 11.5, true, 25), true);
  assert.equal(shouldShatterBreakableProp('explosive_barrel', 8.0, true, 18), true);

  assert.equal(canTriggerCollisionCooldown(undefined, 1.0, 0.1), true);
  assert.equal(canTriggerCollisionCooldown(1.0, 1.05, 0.1), false);
  assert.equal(canTriggerCollisionCooldown(1.0, 1.12, 0.1), true);

  const audioLow = computeCollisionAudioParams(1.5, 0.5);
  const audioHigh = computeCollisionAudioParams(14.0, 0.5);
  assert.ok(audioHigh.volume > audioLow.volume);
  assert.ok(audioLow.playbackRate >= 0.9 && audioHigh.playbackRate <= 1.15);

  // Character on foot (`isVehicle = false`) stays silent on large/hard static objects (`isSmallPushable = false`),
  // and ONLY plays collision audio when pushing/sliding small movable objects (`isSmallPushable = true`)
  assert.equal(shouldPlayMoverCollisionSound(false, false, true, 5.0, 0.8), false);
  assert.equal(shouldPlayMoverCollisionSound(false, true, true, 2.5, 0.65), true);
  assert.equal(shouldPlayMoverCollisionSound(true, false, true, 5.0, 0.8), true);
});

test('evaluateLyoFireballState and evaluateLyoSmokePuffState match Lyo toon color ramps and expansion', () => {
  const fbStart = evaluateLyoFireballState(0.0, 0.42, 1.0);
  const fbMid = evaluateLyoFireballState(0.15, 0.42, 1.0);
  const fbEnd = evaluateLyoFireballState(0.42, 0.42, 1.0);
  assert.equal(fbStart.colorHex, '#fff7c2');
  assert.ok(fbMid.radiusScale > fbStart.radiusScale * 2.5);
  assert.equal(fbEnd.colorHex, '#d92b2b');
  assert.equal(fbEnd.opacity, 0);

  const smokeStart = evaluateLyoSmokePuffState(0.0);
  const smokeEnd = evaluateLyoSmokePuffState(1.0);
  assert.equal(smokeStart.colorHex, '#ff7b00');
  assert.equal(smokeEnd.colorHex, '#3a3f4d');
  assert.equal(smokeEnd.opacity, 0);

  const schedule = computeMultiStageExplosionSchedule(4, 2.5);
  assert.equal(schedule.length, 4);
  assert.equal(schedule[0].delaySec, 0);
  assert.ok(schedule[3].delaySec > schedule[0].delaySec);
  assert.ok(schedule[3].scale > schedule[0].scale);
});

test('classifyDumpTruckMeshIsland removes concrete pipes and separates hydraulic vessel, tailgate, and 4 wheels', () => {
  // 3 Concrete pipes inside the cargo bed (tris=280)
  assert.equal(
    classifyDumpTruckMeshIsland(280, -0.69, 0.7, 0.4, 1.56, 1.89, 3.06),
    'pipe_remove',
  );
  assert.equal(
    classifyDumpTruckMeshIsland(280, -0.68, 0.71, -0.74, 0.42, 2.13, 3.3),
    'pipe_remove',
  );
  assert.equal(
    classifyDumpTruckMeshIsland(280, -0.7, 0.69, -0.36, 0.8, 1.01, 2.18),
    'pipe_remove',
  );

  // Main black dump vessel (tris=490) & rear tailgate (tris=26)
  assert.equal(
    classifyDumpTruckMeshIsland(490, -1.2, 1.2, -1.01, 1.09, -0.02, 4.26),
    'vessel',
  );
  assert.equal(
    classifyDumpTruckMeshIsland(26, -1.11, 1.11, 0.03, 1.03, 0.0, 0.2),
    'tailgate',
  );

  // 4 Rotating Wheels & Truck Cab
  assert.equal(
    classifyDumpTruckMeshIsland(1004, 0.82, 1.35, -2.04, -0.82, 4.17, 5.39),
    'wheel_fl',
  );
  assert.equal(
    classifyDumpTruckMeshIsland(1004, -1.35, -0.83, -2.04, -0.82, 0.68, 1.9),
    'wheel_rr',
  );
  assert.equal(
    classifyDumpTruckMeshIsland(432, -1.17, 1.16, -1.47, 0.89, 3.9, 6.46),
    'chassis',
  );
});

test('canLoadCrateIntoDumpTruck enforces 4-crate limit, blocks loading during hydraulic dump, and requires manual character loading one-by-one', () => {
  assert.equal(DUMP_TRUCK_MAX_CRATES, 4);
  assert.equal(canLoadCrateIntoDumpTruck(0, false, true), true);
  assert.equal(canLoadCrateIntoDumpTruck(3, false, true), true);
  assert.equal(canLoadCrateIntoDumpTruck(4, false, true), false);
  assert.equal(canLoadCrateIntoDumpTruck(2, true, true), false);
  // Automatic truck drive-over scoop is disabled (character must load one-by-one):
  assert.equal(canLoadCrateIntoDumpTruck(0, false, false), false);
});

test('evaluateDumpTruckHydraulicCycle animates lifting, peak crate release, and lowering back to idle', () => {
  const idle = evaluateDumpTruckHydraulicCycle(0, 1.45);
  assert.equal(idle.phase, 'idle');
  assert.equal(idle.vesselTiltRad, 0);

  const lifting = evaluateDumpTruckHydraulicCycle(0.3, 1.45);
  assert.equal(lifting.phase, 'lifting');
  assert.ok(lifting.vesselTiltRad > 0.2 && lifting.vesselTiltRad < 0.76);
  assert.ok(lifting.pistonExtension > 0.3);
  assert.equal(lifting.shouldReleaseCrates, false);

  const dumping = evaluateDumpTruckHydraulicCycle(0.7, 1.45);
  assert.equal(dumping.phase, 'dumping');
  assert.ok(dumping.vesselTiltRad >= 0.72);
  assert.ok(dumping.tailgateOpenRad > 0.7);
  assert.equal(dumping.shouldReleaseCrates, true);

  const lowering = evaluateDumpTruckHydraulicCycle(1.15, 1.45);
  assert.equal(lowering.phase, 'lowering');
  assert.ok(lowering.vesselTiltRad > 0 && lowering.vesselTiltRad < 0.6);

  const done = evaluateDumpTruckHydraulicCycle(1.45, 1.45);
  assert.equal(done.phase, 'idle');
  assert.equal(done.vesselTiltRad, 0);
  assert.equal(done.finished, true);
});

test('stepDumpTruckWheeledPhysics uses Ackermann wheeled steering (no tank pivot spin when stationary, curves only when rolling)', () => {
  // 1. Stationary truck: pressing steer turns front wheels (steerAngle > 0), but hullYaw does NOT spin in place!
  const stationaryTurn = stepDumpTruckWheeledPhysics(
    { forwardSpeed: 0, steerAngle: 0, hullYaw: 0 },
    { throttle: 0, steer: 1, boost: false },
    0.05,
  );
  assert.ok(stationaryTurn.steerAngle > 0.1, 'Front wheels should turn left');
  assert.equal(stationaryTurn.yawRate, 0, 'Stationary truck must not pivot-spin in place like a tank');
  assert.equal(stationaryTurn.hullYaw, 0, 'Hull yaw must remain 0 when stationary');

  // 2. Rolling forward + steering left: curves smoothly with positive yawRate and squat pitch
  const rollingForward = stepDumpTruckWheeledPhysics(
    { forwardSpeed: 8.5, steerAngle: 0.4, hullYaw: 0 },
    { throttle: 1, steer: 1, boost: false },
    0.05,
  );
  assert.ok(rollingForward.forwardSpeed > 8.5, 'Should accelerate forward');
  assert.ok(rollingForward.yawRate > 0.5, 'Should turn left along Ackermann arc while moving forward');
  assert.ok(rollingForward.hullYaw > 0, 'Hull yaw should advance while rolling');
  assert.ok(rollingForward.bodyPitchRad < 0, 'Accelerating should squat rear suspension');

  // 3. Coasting when throttle = 0: smoothly decelerates by rolling resistance instead of instant stop
  const coasting = stepDumpTruckWheeledPhysics(
    { forwardSpeed: 10.0, steerAngle: 0.25, hullYaw: 0.2 },
    { throttle: 0, steer: 0, boost: false },
    0.05,
  );
  assert.ok(coasting.forwardSpeed > 9.5 && coasting.forwardSpeed < 10.0, 'Should coast smoothly on tires');
  assert.ok(coasting.steerAngle < 0.25, 'Front wheels should self-center when steer is released');

  // 4. Reversing + steering left: inverts yawRate naturally like a real wheeled truck backing up
  const reversing = stepDumpTruckWheeledPhysics(
    { forwardSpeed: -4.5, steerAngle: 0.4, hullYaw: 0 },
    { throttle: -1, steer: 1, boost: false },
    0.05,
  );
  assert.ok(reversing.yawRate < -0.3, 'Reversing with left steer should swing nose right (negative yawRate)');
});

test('stepMilitaryBaseBoomBarrier opens to 90 degrees when a unit is within 8m of the gate and closes when clear', () => {
  // 1. Unit far away (12m > 8m): barrier stays closed at 0 rad
  const closed = stepMilitaryBaseBoomBarrier(0, 12.0, 0.05);
  assert.equal(closed.isOpen, false);
  assert.equal(closed.angleRad, 0);

  // 2. Unit approaches within 5.5m (< 8m): barrier smoothly lifts upward toward 90 deg (Math.PI / 2)
  let angle = 0;
  for (let i = 0; i < 30; i++) {
    const step = stepMilitaryBaseBoomBarrier(angle, 5.5, 0.05);
    assert.equal(step.isOpen, true);
    angle = step.angleRad;
  }
  assert.ok(angle > 1.5, 'Boom barrier should reach near 90 degrees when unit stays within 8m');

  // 3. Unit leaves (14m > 8m): barrier smoothly lowers back toward 0 rad
  const lowering = stepMilitaryBaseBoomBarrier(angle, 14.0, 0.1);
  assert.equal(lowering.isOpen, false);
  assert.ok(lowering.angleRad < angle, 'Boom barrier should lower when no unit is within 8m');
});

test('stepBuddyJumpPhysics launches character upward on jump, scales with class/crate, and lands cleanly', () => {
  // 1. Trigger jump from ground
  const launch = stepBuddyJumpPhysics(0, 0, true, true, 1.0, false, 0.05);
  assert.equal(launch.justJumped, true);
  assert.equal(launch.isGrounded, false);
  assert.ok(launch.jumpOffset > 0.35, 'Character should lift off the ground immediately');
  assert.ok(launch.vy > 7.5, 'Vertical velocity should be positive on jump');

  // 2. Carrying a crate reduces initial jump impulse slightly (0.86x)
  const crateLaunch = stepBuddyJumpPhysics(0, 0, true, true, 1.0, true, 0.05);
  assert.ok(crateLaunch.jumpOffset < launch.jumpOffset, 'Carrying a crate should slightly lower jump height');

  // 3. Simulate full jump arc until touchdown
  let offset = launch.jumpOffset;
  let vy = launch.vy;
  let grounded: boolean = launch.isGrounded;
  let peakHeight = offset;
  let landed = false;
  for (let i = 0; i < 40; i++) {
    const step = stepBuddyJumpPhysics(offset, vy, grounded, false, 1.0, false, 0.03);
    offset = step.jumpOffset;
    vy = step.vy;
    grounded = step.isGrounded;
    if (offset > peakHeight) peakHeight = offset;
    if (step.justLanded) {
      landed = true;
      break;
    }
  }
  assert.ok(peakHeight > 1.5 && peakHeight < 2.2, `Expected peak jump height ~1.77m, got ${peakHeight}`);
  assert.equal(landed, true, 'Character should land back on the ground');
  assert.equal(offset, 0);
  assert.equal(grounded, true);
});

test('evaluateBuddyMeleeStrike resolves Team Buddies unarmed punches and front kicks with knockback', () => {
  // Character at (0, 0) facing East (yaw = 0 -> fwd = (+1, 0))
  // 1. Unarmed punch against enemy 1.8m in front
  const punchHit = evaluateBuddyMeleeStrike(0, 0, 0, 1.8, 0.2, 0.65, 'punch');
  assert.equal(punchHit.hit, true);
  assert.equal(punchHit.damage, 8);
  assert.ok(punchHit.knockbackVx > 6.5, 'Punch should knock target forward along facing direction');

  // 2. Unarmed punch misses target behind character (-1.6m)
  const punchBehind = evaluateBuddyMeleeStrike(0, 0, 0, -1.6, 0, 0.65, 'punch');
  assert.equal(punchBehind.hit, false);

  // 3. Team Buddies front kick punts crate 2.2m in front with strong forward velocity & upward hop
  const kickCrate = evaluateBuddyMeleeStrike(0, 0, 0, 2.2, 0, 0.65, 'kick');
  assert.equal(kickCrate.hit, true);
  assert.equal(kickCrate.damage, 14);
  assert.ok(kickCrate.knockbackVx > 15.0, 'Kick should launch crate at high speed');
  assert.ok(kickCrate.upwardHopVy > 4.5, 'Kick should impart upward hop impulse');
});

test('evaluateStackingPadRecipe supports Skyshield Turret (2x1x1 Rare), Dump Truck (2x2x1), and Legend Fighter Plane (2x2x2 Legend)', () => {
  // 2x1x1 with Rare ('super') crate -> Skyshield 35mm Turret
  const skyshieldRecipe = evaluateStackingPadRecipe([
    'red',
    'super',
    'empty',
    'empty',
    'empty',
    'empty',
    'empty',
    'empty',
  ]);
  assert.equal(skyshieldRecipe.shapeKey, '2x1x1');
  assert.equal(skyshieldRecipe.spawnType, 'skyshield');
  assert.equal(skyshieldRecipe.outputName, 'Skyshield 35mm Turret');

  // 2x2x1 (4 flat crates) -> Lyo Dump Truck
  const dumpTruckRecipe = evaluateStackingPadRecipe([
    'red',
    'red',
    'red',
    'red',
    'empty',
    'empty',
    'empty',
    'empty',
  ]);
  assert.equal(dumpTruckRecipe.shapeKey, '2x2x1');
  assert.equal(dumpTruckRecipe.spawnType, 'truck');
  assert.equal(dumpTruckRecipe.outputName, 'Lyo Dump Truck');

  // 2x2x2 with Legend ('legend') crate -> Lyo Fighter Plane
  const legendPlaneRecipe = evaluateStackingPadRecipe([
    'red',
    'red',
    'red',
    'red',
    'red',
    'red',
    'super',
    'legend',
  ]);
  assert.equal(legendPlaneRecipe.shapeKey, '2x2x2');
  assert.equal(legendPlaneRecipe.isLegend, true);
  assert.equal(legendPlaneRecipe.spawnType, 'plane');
  assert.equal(legendPlaneRecipe.outputName, 'Lyo Fighter Plane');
});

test('getNextOwnedBuddyForSwap strictly swaps ONLY among characters built/owned by the same player (max 4 per commander)', () => {
  assert.equal(MAX_CHARACTERS_PER_COMMANDER, 4);
  assert.equal(canCommanderBuildCharacter(3), true);
  assert.equal(canCommanderBuildCharacter(4), false);

  const squad = [
    { id: 'blue-p1-0', team: 'blue' as const, ownerCommanderId: 0, hp: 100 },
    { id: 'blue-p2-0', team: 'blue' as const, ownerCommanderId: 1, hp: 100 },
    { id: 'blue-p1-1', team: 'blue' as const, ownerCommanderId: 0, hp: 100 },
    { id: 'blue-p3-0', team: 'blue' as const, ownerCommanderId: 2, hp: 100 },
    { id: 'blue-p1-dead', team: 'blue' as const, ownerCommanderId: 0, hp: 0 },
  ];

  // Player 1 (commanderId = 0) pressing [Tab] must ONLY cycle between blue-p1-0 and blue-p1-1, never hijacking P2 or P3!
  const swap1 = getNextOwnedBuddyForSwap(squad, 'blue', 0, 'blue-p1-0');
  assert.equal(swap1?.id, 'blue-p1-1');

  const swap2 = getNextOwnedBuddyForSwap(squad, 'blue', 0, 'blue-p1-1');
  assert.equal(swap2?.id, 'blue-p1-0');
});

test('4v4 Online Matchmaking starts at min 2v2 (4 players) with AI bots and supports live Hot-Join AI replacement', () => {
  assert.equal(canStartMatchmaking4v4(1, 2), false);
  assert.equal(canStartMatchmaking4v4(2, 2), true);

  const lobby = createMatchmaking4v4State(2, 2);
  assert.equal(lobby.matchStarted, true);
  assert.equal(lobby.blueCommanders.filter((c) => c.controller === 'human').length, 2);
  assert.equal(lobby.blueCommanders.filter((c) => c.controller === 'ai').length, 2);
  assert.equal(lobby.redCommanders.filter((c) => c.controller === 'human').length, 2);
  assert.equal(lobby.redCommanders.filter((c) => c.controller === 'ai').length, 2);

  // Hot-join a new human player into Blue team -> immediately replaces P3 [AI Bot] (commanderId = 2)
  const hot1 = hotJoinReplaceAiCommander(lobby, 'blue', 42.5);
  assert.equal(hot1.replacedSlot?.team, 'blue');
  assert.equal(hot1.replacedSlot?.commanderId, 2);
  assert.equal(hot1.replacedSlot?.controller, 'human');
  assert.equal(
    hot1.updatedState.blueCommanders.filter((c) => c.controller === 'human').length,
    3,
  );
  assert.equal(
    hot1.updatedState.blueCommanders.filter((c) => c.controller === 'ai').length,
    1,
  );
});

test('evaluateBuiltBuddySmartAiDecision prioritizes delivering to owner pad, crafting, healing, and unarmed progression', () => {
  // 1. Carrying a crate -> deliver to owner's personal Stacking Pad
  const deliver = evaluateBuiltBuddySmartAiDecision({
    buddyClass: 'Infuntry',
    weaponId: 'unarmed',
    carryingCrate: true,
    hp: 100,
    maxHp: 100,
    commandMode: 'HARVEST',
    ownerBuildOrder: 'AUTO',
    ownerPadHasSpace: true,
    ownerPadReadyToCraft: false,
    ownerIsAiCommander: true,
    ownerAliveBuddyCount: 1,
    ownerHasBuiltTurret: false,
    ownerHasBuiltVehicle: false,
    woundedAllyDist: null,
    nearestEnemyDist: 30,
    nearestFreeCrateDist: 10,
    nearestGroundWeaponDist: null,
    nearestEmptyVehicleDist: null,
  });
  assert.equal(deliver.action, 'DELIVER_TO_OWNER_PAD');
  assert.equal(deliver.recommendedBuildOrder, '1x1x1');

  // 2. Medic near wounded ally -> heals ally
  const medicHeal = evaluateBuiltBuddySmartAiDecision({
    buddyClass: 'Medic',
    weaponId: 'pistol',
    carryingCrate: false,
    hp: 110,
    maxHp: 110,
    commandMode: 'HARVEST',
    ownerBuildOrder: '1x1x2',
    ownerPadHasSpace: true,
    ownerPadReadyToCraft: false,
    ownerIsAiCommander: false,
    ownerAliveBuddyCount: 2,
    ownerHasBuiltTurret: false,
    ownerHasBuiltVehicle: false,
    woundedAllyDist: 8.5,
    nearestEnemyDist: 35,
    nearestFreeCrateDist: 12,
    nearestGroundWeaponDist: null,
    nearestEmptyVehicleDist: null,
  });
  assert.equal(medicHeal.action, 'HEAL_WOUNDED_ALLY');
});

test('getPropCollisionSpec covers all newly integrated Harbor, Construction, Base, and Power Plant GLB props', () => {
  assert.equal(getPropCollisionSpec('forklift', 1.0).category, 'solid');
  assert.equal(getPropCollisionSpec('tank_1b', 1.0).category, 'solid');
  assert.equal(getPropCollisionSpec('pipe_cluster_1b', 1.0).category, 'solid');
  assert.equal(getPropCollisionSpec('giant_pipe_1b', 1.0).category, 'solid');
  assert.equal(getPropCollisionSpec('concrete_pipe', 1.0).category, 'solid');
  assert.equal(getPropCollisionSpec('h_beam', 1.0).category, 'solid');
  assert.equal(getPropCollisionSpec('concrete_fence_1b', 1.0).destructible, true);
  assert.equal(getPropCollisionSpec('barrel_1c', 1.0).category, 'pushable');
  assert.equal(getPropCollisionSpec('fuel_cell', 1.0).category, 'pushable');
  assert.equal(getPropCollisionSpec('circuit_module', 1.0).category, 'pushable');
  assert.equal(getPropCollisionSpec('pallet_1a', 1.0).category, 'none');
  assert.equal(getPropCollisionSpec('pallet_1a', 1.0).materialTag, 'wood');
});

test('resolveSolidObbCollision2D and pointInObb2D accurately resolve rotated rectangular building, container, and vehicle hull collisions', () => {
  // 1. Exterior hit on +X face of an unrotated OBB (halfX = 5, halfZ = 3)
  const hitFace = resolveSolidObbCollision2D(5.8, 0.5, -6.0, 1.0, 1.5, 0, 0, 5.0, 3.0, 0, 0.25);
  assert.equal(hitFace.collided, true);
  assert.ok(Math.abs(hitFace.x - 6.5) < 0.005);
  assert.ok(Math.abs(hitFace.normalX - 1.0) < 1e-6);
  assert.ok(hitFace.vx > 0);

  // 2. Rotated OBB (rotY = Math.PI / 2 swaps world X/Z extents so local halfZ = 3.0 lies along world X)
  const hitRot = resolveSolidObbCollision2D(3.8, 0.0, -5.0, 0.0, 1.2, 0, 0, 5.0, 3.0, Math.PI / 2, 0.25);
  assert.equal(hitRot.collided, true);
  assert.ok(Math.abs(hitRot.x - 4.2) < 0.005);

  // 3. Point inside OBB check for projectile collisions
  assert.equal(pointInObb2D(2.5, 4.5, 0, 0, 5.0, 3.0, Math.PI / 2, 0.2), true);
  assert.equal(pointInObb2D(3.5, 0.0, 0, 0, 5.0, 3.0, Math.PI / 2, 0.2), false);
});

test('A* pathfinding uses binary heap with tie-breaking towards lower h, Manhattan (4-way) & Octile (8-way) heuristics, and expands >=40% fewer tiles than blind search', () => {
  // 1. Binary heap orders by lowest f = g + h, breaking ties on f towards lower h
  const heap = new AStarBinaryHeap();
  heap.push({ idx: 1, g: 4, h: 6, f: 10 });
  heap.push({ idx: 2, g: 7, h: 3, f: 10 }); // Same f = 10, lower h = 3 -> must pop first!
  heap.push({ idx: 3, g: 2, h: 5, f: 7 });  // Lowest f = 7 -> pops very first!

  assert.equal(heap.pop()?.idx, 3);
  assert.equal(heap.pop()?.idx, 2, 'Tie on f = 10 must be broken towards lower h (h = 3 before h = 6)');
  assert.equal(heap.pop()?.idx, 1);

  // 2. Manhattan (4-way) and Octile (8-way) heuristics never overestimate true grid distance
  assert.equal(computeManhattanHeuristic(2, 3, 7, 9), 11);
  const octile = computeOctileHeuristic(0, 0, 3, 4);
  assert.ok(Math.abs(octile - (4 + (Math.SQRT2 - 1) * 3)) < 1e-6);

  // 3. Maze with perimeter wall & gate: A* reconstructs optimal shortest path from parent links
  //    and expands >40% fewer tiles than a blind search!
  const grid = createAStarNavGrid(-30, 30, -30, 30, 1.5); // 40x40 = 1600 tiles
  // Build a wall from x = -30 to x = +10 across z = 0 so the only gate opening is at x > +10
  rasterizeObbObstacleToNavGrid(grid, -10.0, 0.0, 20.0, 0.75, 0, 0.45);
  rasterizeCircleObstacleToNavGrid(grid, 14.0, -7.5, 2.2, 0.35);

  const path4Way = findPathAStar(grid, -12, -15, -12, 15, { allowDiagonal: false });
  assert.equal(path4Way.reachedGoal, true, '4-way Manhattan A* must find path around wall through gate');
  assert.ok(path4Way.waypoints.length > 15);

  const path8Way = findPathAStar(grid, -12, -15, -12, 15, { allowDiagonal: true });
  assert.equal(path8Way.reachedGoal, true, '8-way Octile A* must find path around wall through gate');
  assert.ok(
    path8Way.totalCost < path4Way.totalCost,
    `8-way Octile path cost (${path8Way.totalCost.toFixed(2)}) should be shorter than 4-way Manhattan cost (${path4Way.totalCost.toFixed(2)})`,
  );
  // Verify intermediate waypoints pass around the wall through the gate at x > 10.0
  const gatePassWaypoint = path8Way.waypoints.find((p) => Math.abs(p.z) < 2.0);
  assert.ok(gatePassWaypoint && gatePassWaypoint.x > 10.0, 'Path must route through the open gate at x > 10.0');

  // Verify A* heuristic steering expands significantly fewer tiles than unguided search
  assert.ok(
    path8Way.expandedCount < 650,
    `Expected A* to expand far fewer tiles than blind search on 1600-tile grid, expanded ${path8Way.expandedCount}`,
  );
});

test('Large structures (turbine, crane, buildings, giant tanks/pipes) never wobble/jiggle on shot while small dynamic props use REA shootImpulse', () => {
  const unshakeableLargeTypes = [
    'turbine',
    'crane',
    'chimney',
    'giant_tank',
    'giant_pipe',
    'giant_pipe_1b',
    'pipe_cluster',
    'pipe_cluster_1b',
    'tank_1a',
    'tank_1b',
    'forklift',
    'h_beam',
    'concrete_pipe',
    'dump_truck',
    'power_core',
    'shipping_container',
    'concrete_fence',
    'concrete_fence_1b',
    'blue_hq',
    'red_hq',
    'blue_barracks',
    'blue_hangar',
  ] as const;

  for (const propType of unshakeableLargeTypes) {
    const spec = getPropCollisionSpec(propType);
    assert.equal(spec.canJiggleOnHit, false, `${propType} must NOT jiggle/wobble when shot or collided`);
    assert.equal(spec.shootImpulse, 0, `${propType} must have shootImpulse === 0`);
  }

  // Dynamic small/medium props match REA extracted shootImpulse values (10, 6, 5, 4) and allow hit jiggle
  assert.equal(getPropCollisionSpec('wheelbarrow').shootImpulse, 10);
  assert.equal(getPropCollisionSpec('wheelbarrow').canJiggleOnHit, true);
  assert.equal(getPropCollisionSpec('pallet_1a').shootImpulse, 6);
  assert.equal(getPropCollisionSpec('barrel_1c').shootImpulse, 5);
  assert.equal(getPropCollisionSpec('barricade').shootImpulse, 5);
  assert.equal(getPropCollisionSpec('crate_wood').shootImpulse, 5);
  assert.equal(getPropCollisionSpec('traffic_cone').shootImpulse, 4);
  assert.equal(getPropCollisionSpec('traffic_cone').canJiggleOnHit, true);
  assert.equal(getPropCollisionSpec('recycle_bin').shootImpulse, 4);
  assert.equal(getPropCollisionSpec('explosive_barrel').canJiggleOnHit, true);
});

test('REA hit-reaction pose, stun star spin, 4-part tank recoil, emissive flash, and explosion audio ducking match longhoang-lyo.com formulas', () => {
  // 1. Directional hit reaction: peak at t = 0.10s (timer = 0.50s out of 0.60s)
  const playerPeak = evaluateLyoHitReactionPose(0.50, 0.60, 0, 1, true);
  const enemyPeak = evaluateLyoHitReactionPose(0.50, 0.60, 0, 1, false);
  assert.ok(Math.abs(playerPeak.hopY - 0.05) < 1e-4);
  assert.ok(Math.abs(enemyPeak.hopY - 0.10) < 1e-4);
  assert.ok(Math.abs(enemyPeak.rotX) > Math.abs(playerPeak.rotX));

  // 2. StunEffect: 1.5s duration, 2 full turns (4*PI rad), pop-in/shrink-out scale
  const stunMid = evaluateLyoStunEffectState(0.75, 1.5);
  assert.equal(stunMid.active, true);
  assert.equal(stunMid.scale, 1.0);
  assert.ok(Math.abs(stunMid.rotationZ - Math.PI * 2) < 1e-4);
  assert.equal(evaluateLyoStunEffectState(0, 1.5).active, false);

  // 3. 4-part tank recoil pose
  const recoilPeak = evaluateLyoTankShotRecoilPose(0.20, 0.24);
  assert.ok(recoilPeak.turretSlideBack > 0.14);
  assert.ok(recoilPeak.barrelSlideBack > 0.14);
  assert.ok(recoilPeak.bodyLiftY > 0.04);
  assert.ok(recoilPeak.cameraKick > 0.10);

  // 4. Emissive yellow hit flash (quadratic decay over 0.15s)
  assert.equal(evaluateLyoEmissiveHitFlash(0.15, 0.15), 1.0);
  assert.ok(Math.abs(evaluateLyoEmissiveHitFlash(0.075, 0.15) - 0.25) < 1e-6);

  // 5. Multi-explosion audio ducking within 350ms window (1.0 -> 0.85 -> 0.72 -> 0.60)
  const d1 = computeExplosionDucking(1000, []);
  assert.equal(d1.duckingGain, 1.0);
  const d2 = computeExplosionDucking(1100, d1.updatedTimestampsMs);
  assert.equal(d2.duckingGain, 0.85);
  const d3 = computeExplosionDucking(1200, d2.updatedTimestampsMs);
  assert.equal(d3.duckingGain, 0.72);
  const d4 = computeExplosionDucking(1300, d3.updatedTimestampsMs);
  assert.equal(d4.duckingGain, 0.60);
});

test('castMuzzleRaycast3D casts up to 100 units, skips shooter via layer mask, picks closest hit with point & surface normal, and locks onto enemy character, vehicle, or Skyshield', () => {
  assert.equal(RAYCAST_MAX_DISTANCE, 100.0);
  assert.equal(RAYCAST_LAYERS.DEFAULT_MUZZLE_MASK & RAYCAST_LAYERS.SHOOTER, 0);

  const origin = { x: 0, y: 1.5, z: 0 };
  const dir = { x: 1, y: 0, z: 0 };

  const colliders: RaycastCollider3D[] = [
    // 1. Shooter at t = 0..1 (MUST be skipped by layerMask & shooterId!)
    {
      id: 'player_1',
      layer: RAYCAST_LAYERS.SHOOTER,
      targetKind: 'enemy_character',
      label: 'Shooter',
      shape: 'cylinder',
      center: { x: 0.5, y: 1.5, z: 0 },
      radius: 1.0,
      halfExtents: { x: 1, y: 1.2, z: 1 },
    },
    // 2. Enemy Character at x = 15 (radius 1 -> hit at x = 14, normal = (-1, 0, 0))
    {
      id: 'enemy_commando',
      layer: RAYCAST_LAYERS.ENEMY_CHARACTER,
      targetKind: 'enemy_character',
      label: 'Enemy Commando',
      shape: 'cylinder',
      center: { x: 15, y: 1.5, z: 0 },
      radius: 1.0,
      halfExtents: { x: 1.0, y: 1.2, z: 1.0 },
    },
    // 3. Vehicle OBB farther behind at x = 30 (should lose to closer Enemy Character at x = 15)
    {
      id: 'veh_tank_2',
      layer: RAYCAST_LAYERS.VEHICLE,
      targetKind: 'vehicle',
      label: 'Lyo Battle Tank',
      shape: 'obb',
      center: { x: 30, y: 1.5, z: 0 },
      halfExtents: { x: 2.5, y: 1.4, z: 1.7 },
      rotY: 0,
    },
    // 4. Skyshield Turret at x = 110 (> 100 maxDistance -> out of range!)
    {
      id: 'skyshield_far',
      layer: RAYCAST_LAYERS.SKYSHIELD,
      targetKind: 'skyshield',
      label: 'Far Skyshield',
      shape: 'cylinder',
      center: { x: 110, y: 2.5, z: 0 },
      radius: 2.0,
      halfExtents: { x: 2.0, y: 2.8, z: 2.0 },
    },
  ];

  // Case A: Closest hit is Enemy Character at x = 14 (shooter at x = 0.5 is skipped!)
  const hitEnemy = castMuzzleRaycast3D(origin, dir, colliders, {
    maxDistance: 100,
    layerMask: RAYCAST_LAYERS.DEFAULT_MUZZLE_MASK,
    shooterId: 'player_1',
  });
  assert.equal(hitEnemy.hit, true);
  assert.equal(hitEnemy.colliderId, 'enemy_commando');
  assert.equal(hitEnemy.targetKind, 'enemy_character');
  assert.equal(hitEnemy.isTargetLocked, true, 'Must lock onto enemy character');
  assert.ok(Math.abs(hitEnemy.distance - 14.0) < 1e-4);
  assert.ok(Math.abs(hitEnemy.point.x - 14.0) < 1e-4);
  assert.ok(Math.abs(hitEnemy.normal.x - -1.0) < 1e-4);

  // Case B: Remove enemy -> closest hit is Vehicle OBB at x = 27.5 (30 - 2.5) with normal (-1, 0, 0) & Target Lock
  const hitVehicle = castMuzzleRaycast3D(
    origin,
    dir,
    colliders.filter((c) => c.id !== 'enemy_commando'),
  );
  assert.equal(hitVehicle.hit, true);
  assert.equal(hitVehicle.colliderId, 'veh_tank_2');
  assert.equal(hitVehicle.targetKind, 'vehicle');
  assert.equal(hitVehicle.isTargetLocked, true, 'Must lock onto vehicle');
  assert.ok(Math.abs(hitVehicle.distance - 27.5) < 1e-4);
  assert.ok(Math.abs(hitVehicle.normal.x - -1.0) < 1e-4);

  // Case C: Skyshield Turret within 100 units locks on, while Skyshield at 110 units is beyond maxDistance = 100
  const missFar = castMuzzleRaycast3D(
    origin,
    dir,
    colliders.filter((c) => c.id === 'skyshield_far'),
  );
  assert.equal(missFar.hit, false);
  assert.equal(missFar.distance, 100);
  assert.equal(missFar.isTargetLocked, false);

  const hitSkyshield = castMuzzleRaycast3D(origin, dir, [
    {
      id: 'skyshield_red_0',
      layer: RAYCAST_LAYERS.SKYSHIELD,
      targetKind: 'skyshield',
      team: 'red',
      label: 'Skyshield 35mm Turret',
      shape: 'cylinder',
      center: { x: 42, y: 2.5, z: 0 },
      radius: 2.0,
      halfExtents: { x: 2.0, y: 2.8, z: 2.0 },
    },
  ]);
  assert.equal(hitSkyshield.hit, true);
  assert.equal(hitSkyshield.targetKind, 'skyshield');
  assert.equal(hitSkyshield.isTargetLocked, true, 'Must lock onto enemy Red Skyshield turret');
  assert.ok(Math.abs(hitSkyshield.distance - 40.0) < 1e-4);

  // Case D: Friendly ('blue') Skyshields, friendly vehicles, and friendly Buddy units are NEVER locked onto!
  const friendlyIgnored = castMuzzleRaycast3D(
    origin,
    dir,
    [
      {
        id: 'skyshield_blue_0',
        layer: RAYCAST_LAYERS.SKYSHIELD,
        targetKind: 'skyshield',
        team: 'blue',
        label: 'Friendly Blue Skyshield',
        shape: 'cylinder',
        center: { x: 10, y: 2.5, z: 0 },
        radius: 2.0,
        halfExtents: { x: 2.0, y: 2.8, z: 2.0 },
      },
      {
        id: 'ally_buddy_2',
        layer: RAYCAST_LAYERS.ENEMY_CHARACTER,
        targetKind: 'enemy_character',
        team: 'blue',
        label: 'Friendly Blue Buddy',
        shape: 'cylinder',
        center: { x: 18, y: 1.5, z: 0 },
        radius: 1.0,
        halfExtents: { x: 1.0, y: 1.2, z: 1.0 },
      },
      {
        id: 'ally_tank_1',
        layer: RAYCAST_LAYERS.VEHICLE,
        targetKind: 'vehicle',
        team: 'blue',
        label: 'Friendly Blue Tank',
        shape: 'obb',
        center: { x: 25, y: 1.5, z: 0 },
        halfExtents: { x: 2.5, y: 1.4, z: 1.7 },
        rotY: 0,
      },
    ],
    { shooterTeam: 'blue' },
  );
  assert.equal(friendlyIgnored.hit, false, 'Must skip friendly Skyshield, friendly Buddy, and friendly vehicle');
  assert.equal(friendlyIgnored.isTargetLocked, false, 'Must NEVER lock onto friendly team targets');
});

test('Modern Stylized 3D Tactical Arcade multi-layer Web Audio synthesis spec matches Skyshield, Fighter Jet BRRRT, Bazooka, Explosion, Firearm, and Master Bus requirements', () => {
  const spec = getTacticalAudioSpec();

  // 1. Skyshield Anti-Drone System (C-RAM / Rapid AA Turret)
  assert.equal(spec.skyshield.radarLockChirpStartHz, 1400);
  assert.equal(spec.skyshield.radarLockChirpEndHz, 1800);
  assert.equal(spec.skyshield.radarLockChirpDurationSec, 0.04);
  assert.equal(spec.skyshield.radarLockChirpRepeats, 2);
  assert.equal(spec.skyshield.servoStartHz, 120);
  assert.equal(spec.skyshield.servoEndHz, 220);
  assert.ok(spec.skyshield.burstIntervalMs >= 35 && spec.skyshield.burstIntervalMs <= 45);
  assert.equal(spec.skyshield.shotPunchStartHz, 260);
  assert.equal(spec.skyshield.shotPunchEndHz, 70);
  assert.equal(spec.skyshield.shotPunchDurationSec, 0.03);
  assert.equal(spec.skyshield.shotNoiseBandpassHz, 1400);
  assert.equal(spec.skyshield.shotNoiseQ, 3.0);
  assert.equal(spec.skyshield.shotNoiseDurationSec, 0.035);
  assert.equal(spec.skyshield.flakSubStartHz, 110);
  assert.equal(spec.skyshield.flakSubEndHz, 40);
  assert.equal(spec.skyshield.flakSubDurationSec, 0.12);
  assert.equal(spec.skyshield.flakSnapBandpassHz, 900);

  // 2. Fighter Jet Strafe & Rotary Cannon "BRRRT"
  assert.ok(spec.fighterJet.lfoRateHz >= 55 && spec.fighterJet.lfoRateHz <= 65);
  assert.equal(spec.fighterJet.coreOscHz, 130);
  assert.equal(spec.fighterJet.noiseBandpassHz, 650);
  assert.equal(spec.fighterJet.noiseQ, 2.0);
  assert.ok(spec.fighterJet.burstDurationSec >= 0.35 && spec.fighterJet.burstDurationSec <= 0.5);
  assert.equal(spec.fighterJet.dopplerStartHz, 250);
  assert.equal(spec.fighterJet.dopplerPeakHz, 900);
  assert.equal(spec.fighterJet.dopplerEndHz, 200);

  // 3. Bazooka Launcher
  assert.equal(spec.bazookaLaunch.subStartHz, 180);
  assert.equal(spec.bazookaLaunch.subEndHz, 45);
  assert.equal(spec.bazookaLaunch.subDurationSec, 0.15);
  assert.equal(spec.bazookaLaunch.whooshStartHz, 1200);
  assert.equal(spec.bazookaLaunch.whooshEndHz, 300);
  assert.equal(spec.bazookaLaunch.whooshQ, 2.5);

  // 4. Bazooka & Tank Projectile Explosions
  assert.equal(spec.tacticalExplosion.subStartHz, 90);
  assert.equal(spec.tacticalExplosion.subEndHz, 25);
  assert.equal(spec.tacticalExplosion.durationSec, 0.45);
  assert.equal(spec.tacticalExplosion.rumbleLowPassStartHz, 800);
  assert.equal(spec.tacticalExplosion.rumbleLowPassEndHz, 80);
  assert.equal(spec.tacticalExplosion.usesSoftClipWaveShaper, true);

  // 5. Pistol & Assault Rifle
  assert.equal(spec.firearm.punchStartHz, 300);
  assert.equal(spec.firearm.punchEndHz, 60);
  assert.equal(spec.firearm.punchDurationSec, 0.05);
  assert.equal(spec.firearm.noiseDurationSec, 0.06);
  assert.equal(spec.firearm.noiseLowPassHz, 1800);

  // 6. Master Audio Bus
  assert.equal(spec.masterBus.lowPassCutoffHz, 4500);
});

test('Build box / stacking pad SFX and distant world sounds are strictly muted (gain === 0) when player is outside the base', () => {
  const blueHqX = 0.0;
  const blueHqZ = 86.0;
  const bluePad0X = -16.5;
  const bluePad0Z = 75.5;
  const redHqX = 0.0;
  const redHqZ = -86.0;
  const redPad0X = 16.5;
  const redPad0Z = -75.5;

  // 1. Player outside both bases (e.g. center of map at (0, 0) or outside Blue base gate at (0, 52)):
  //    Build box sounds from Blue pads and Red pads MUST be 100% silent (gain === 0)!
  assert.equal(isListenerInsideBasePerimeter(0, 0, blueHqX, blueHqZ), false);
  assert.equal(isListenerInsideBasePerimeter(0, 52, blueHqX, blueHqZ), false);
  assert.equal(
    computeBuildBoxAudioGain(0, 0, bluePad0X, bluePad0Z, blueHqX, blueHqZ, false),
    0,
  );
  assert.equal(
    computeBuildBoxAudioGain(0, 52, bluePad0X, bluePad0Z, blueHqX, blueHqZ, true),
    0,
  );
  assert.equal(
    computeBuildBoxAudioGain(0, 75.5, redPad0X, redPad0Z, redHqX, redHqZ, false),
    0,
  );

  // 2. Player inside Blue base standing right next to their own pad (-16.5, 75.5): full gain = 1.0
  assert.equal(isListenerInsideBasePerimeter(-16.5, 75.5, blueHqX, blueHqZ), true);
  assert.equal(
    computeBuildBoxAudioGain(-16.5, 75.5, bluePad0X, bluePad0Z, blueHqX, blueHqZ, true),
    1.0,
  );

  // 3. Player inside Blue base at Pad 0 (-16.5, 75.5), while AI Commander 3 crafts at far Pad 3 (+16.5, 75.5 -> 33m away > 16m):
  //    Distant AI pad even inside the same base is muted (gain === 0), and nearby AI pad is attenuated (<= 0.45)
  assert.equal(
    computeBuildBoxAudioGain(-16.5, 75.5, 16.5, 75.5, blueHqX, blueHqZ, false),
    0,
  );
  const nearbyAiPadGain = computeBuildBoxAudioGain(-8.0, 75.5, -5.5, 75.5, blueHqX, blueHqZ, false);
  assert.ok(nearbyAiPadGain > 0 && nearbyAiPadGain <= 0.45);

  // 4. Generic 3D spatial audio distance attenuation (quadratic roll-off and strict cutoff beyond maxDistance)
  assert.equal(computeSpatialAudioGain(0, 0, 2, 0, 20, 4), 1.0);
  assert.equal(computeSpatialAudioGain(0, 0, 20, 0, 20, 4), 0.0);
  assert.equal(computeSpatialAudioGain(0, 0, 35, 0, 20, 4), 0.0);
  const midGain = computeSpatialAudioGain(0, 0, 12, 0, 20, 4); // halfway between 4 and 20 -> (1 - 0.5)^2 = 0.25
  assert.ok(Math.abs(midGain - 0.25) < 1e-6);
});

test('getWeaponProjectileVisualSpec sizes every projectile strictly smaller than its weapon barrel bore and scales monotonically from Pistol to Tank Cannon', () => {
  const pistol = getWeaponProjectileVisualSpec('LyoPistol');
  const rifle = getWeaponProjectileVisualSpec('LyoAssaultRifle');
  const planeGatling = getWeaponProjectileVisualSpec('PlaneGatling');
  const skyshield = getWeaponProjectileVisualSpec('Skyshield35mm');
  const bazooka = getWeaponProjectileVisualSpec('Bazooka');
  const tankCannon = getWeaponProjectileVisualSpec('TankCannon');

  // 1. Every projectile's cross-sectional diameter must fit inside its weapon's barrel outer diameter
  for (const spec of [pistol, rifle, planeGatling, skyshield, bazooka, tankCannon]) {
    assert.ok(spec.diameter > 0 && spec.diameter < spec.barrelOuterDiameter);
    assert.ok(spec.length > spec.diameter);
  }

  // 2. Monotonic caliber & length scaling from smallest handheld weapon to largest heavy cannon
  assert.ok(pistol.diameter < rifle.diameter);
  assert.ok(rifle.diameter < planeGatling.diameter);
  assert.ok(planeGatling.diameter < skyshield.diameter);
  assert.ok(skyshield.diameter < bazooka.diameter);
  assert.ok(bazooka.diameter < tankCannon.diameter);

  assert.ok(pistol.length < rifle.length);
  assert.ok(rifle.length < planeGatling.length);
  assert.ok(planeGatling.length < skyshield.length);
  assert.ok(skyshield.length < bazooka.length);
  assert.ok(bazooka.length < tankCannon.length);

  // 3. Correct 3D GLB shell template mapping
  assert.equal(pistol.shellKind, 'fodder');
  assert.equal(rifle.shellKind, 'fodder');
  assert.equal(planeGatling.shellKind, 'fodder');
  assert.equal(skyshield.shellKind, 'player');
  assert.equal(bazooka.shellKind, 'boss');
  assert.equal(tankCannon.shellKind, 'player');
});

test('createFixedObjectPool preallocates peak count up front, resets fields on spawn, marks inactive on death without destroying, recycles 14 slots, and logs a warning on exhaustion', () => {
  assert.equal(DEFAULT_BULLET_LANE_POOL_SIZE, 14);
  assert.equal(POOL_PEAK_CAPACITIES.bulletLane, 14);
  assert.ok(POOL_PEAK_CAPACITIES.bullets >= 14);

  // 1. Verify 14-slot pooled lane recycles the exact same 14 preallocated instances with 0 runtime allocations
  const sim = simulatePooledVsUnpooledBulletLane(140, DEFAULT_BULLET_LANE_POOL_SIZE);
  assert.equal(sim.poolCapacity, 14);
  assert.equal(sim.pooledPreallocatedSlots, 14);
  assert.equal(sim.pooledRuntimeAllocations, 0);
  assert.equal(sim.pooledGarbageDiscarded, 0);
  assert.equal(sim.pooledGcPauseStalls, 0);
  assert.equal(sim.pooledUniqueSlotsUsed, 14);
  assert.equal(sim.pooledRecycledSpawns, 126);
  assert.equal(sim.pooledExhaustionWarnings, 0);
  assert.equal(sim.unpooledAllocations, 140);
  assert.equal(sim.unpooledGarbageDiscarded, 140);
  assert.ok(sim.unpooledGcPauseStalls >= 10);

  // 2. Verify lifecycle: preallocate up front, reset on spawn, mark inactive on death, warn on exhaustion
  interface TestParticle {
    id: number;
    active: boolean;
    x: number;
    life: number;
    visible: boolean;
  }

  let createCalls = 0;
  const warnings: string[] = [];
  const particlePool = createFixedObjectPool<TestParticle>({
    name: 'TestParticles',
    peakCapacity: 3,
    createSlot: (index) => {
      createCalls++;
      return { id: index, active: false, x: 99, life: 99, visible: true };
    },
    resetSlot: (slot) => {
      slot.x = 0;
      slot.life = 1.0;
      slot.visible = true;
    },
    deactivateSlot: (slot) => {
      slot.life = 0;
      slot.visible = false;
    },
    onWarnExhausted: (msg) => {
      warnings.push(msg);
    },
  });

  // Preallocated all 3 slots up front and marked them inactive/hidden
  assert.equal(createCalls, 3);
  assert.equal(particlePool.capacity, 3);
  assert.equal(particlePool.activeCount, 0);
  assert.ok(particlePool.slots.every((s) => !s.active && !s.visible));

  const p0 = particlePool.acquire((s) => {
    s.x = 10;
  });
  const p1 = particlePool.acquire((s) => {
    s.x = 20;
  });
  const p2 = particlePool.acquire((s) => {
    s.x = 30;
  });
  assert.ok(p0 && p1 && p2);
  assert.equal(particlePool.activeCount, 3);
  assert.equal(createCalls, 3); // Zero new allocations on spawn!
  assert.equal(p0.x, 10);
  assert.equal(p0.life, 1.0);
  assert.equal(p0.visible, true);

  // Pool exhaustion: 4th acquire while all 3 are active must log a warning and return null
  const pOverflow = particlePool.acquire();
  assert.equal(pOverflow, null);
  assert.equal(particlePool.exhaustionWarnings, 1);
  assert.equal(warnings.length, 1);
  assert.ok(warnings[0].includes('[ObjectPool:TestParticles] Pool exhausted!'));

  // Death: release marks slot inactive and hides it without destroying the object reference
  particlePool.release(p1);
  assert.equal(p1.active, false);
  assert.equal(p1.visible, false);
  assert.equal(p1.life, 0);
  assert.equal(particlePool.activeCount, 2);

  // Next spawn reuses the exact same `p1` object instance and resets its fields!
  const pReused = particlePool.acquire();
  assert.equal(pReused, p1);
  assert.equal(pReused?.active, true);
  assert.equal(pReused?.x, 0); // Reset by resetSlot!
  assert.equal(pReused?.life, 1.0);
  assert.equal(pReused?.visible, true);
  assert.equal(createCalls, 3); // Still 3 total objects ever created!
});

test('resolveSolidCratePush2D and resolveCrateVsCrateCollision2D enforce rigid solid-box collision without jelly deformation', () => {
  // 1. Pushing the flat front face (-Z) of a grounded solid crate straight along +Z:
  //    must separate mover and crate rigidly, slide crate forward along +Z, keep 0 spin for center push, and keep scale (1, 1, 1)
  const centerPush = resolveSolidCratePush2D(
    0,
    -1.05,
    0,
    6.5,
    0.55,
    2.2,
    0,
    0,
    0,
    0,
    0,
    0.68,
    1.85,
    0.22,
  );
  assert.equal(centerPush.collided, true);
  assert.ok(centerPush.crateZ > 0, 'Crate is pushed forward along +Z');
  assert.ok(centerPush.moverZ < -1.05, 'Mover is separated outside the solid crate face');
  assert.ok(centerPush.crateVz > 3.5, 'Crate receives solid forward sliding velocity');
  assert.equal(centerPush.angularImpulse, 0, 'Center-of-face push slides crate straight without spinning');
  assert.equal(centerPush.scaleX, 1);
  assert.equal(centerPush.scaleY, 1);
  assert.equal(centerPush.scaleZ, 1);

  // 2. Pushing a corner of the solid crate imparts realistic rigid-body angular impulse while keeping scale (1, 1, 1)
  const cornerPush = resolveSolidCratePush2D(
    0.58,
    -1.05,
    0,
    6.5,
    0.55,
    2.2,
    0,
    0,
    0,
    0,
    0,
    0.68,
    1.85,
    0.22,
  );
  assert.equal(cornerPush.collided, true);
  assert.ok(Math.abs(cornerPush.angularImpulse) > 0.2, 'Off-center corner push rotates the rigid box');
  assert.equal(cornerPush.scaleX, 1);
  assert.equal(cornerPush.scaleY, 1);
  assert.equal(cornerPush.scaleZ, 1);

  // 3. Thrown or pushed crate striking another grounded crate separates both boxes and transfers momentum
  const crateHit = resolveCrateVsCrateCollision2D(0, 0, 9.5, 0, 1.1, 0, 0, 0, 1.34, 0.34);
  assert.equal(crateHit.collided, true);
  assert.ok(crateHit.bx - crateHit.ax >= 1.34, 'Crates are separated so they never overlap');
  assert.ok(crateHit.bvx > 5.0, 'Struck crate is knocked forward by the thrown/pushed crate');
});

test('evaluateCityTramConsistState keeps enlarged 1.25x 2-car articulated tram (car1, joint, car2 & all 4 corners) inside the asphalt road around every turn', () => {
  assert.equal(CITY_TRAM_SPEC.carCount, 2);
  // Enlarged 1.25x proportional to standing Buddy character:
  assert.equal(CITY_TRAM_SPEC.carLength, 9.00);
  assert.equal(CITY_TRAM_SPEC.carWidth, 3.58);
  assert.equal(CITY_TRAM_SPEC.carHeight, 4.42);
  const initial = evaluateCityTramConsistState(0);
  const totalLen = initial.totalTrackLength;
  assert.ok(totalLen > 350 && totalLen < 500, `Closed tram loop length should be ~410m, got ${totalLen}`);

  const halfLen = CITY_TRAM_SPEC.carLength * 0.5;
  const halfWid = CITY_TRAM_SPEC.carWidth * 0.5;
  let maxArticulationRad = 0;
  let maxBogieSteerRad = 0;

  // Sample every 0.5m along the entire 360-degree closed road loop
  for (let d = 0; d < totalLen; d += 0.5) {
    const trk = sampleCityTramTrackAtDistance(d);
    assert.ok(
      evaluateRoadNetworkSdf(trk.x, trk.z) < -1.5,
      `Track centerline at d=${d} (${trk.x.toFixed(2)}, ${trk.z.toFixed(2)}) must stay deep inside road`,
    );

    const state = evaluateCityTramConsistState(d);
    maxArticulationRad = Math.max(maxArticulationRad, Math.abs(state.joint.articulationAngle));
    maxBogieSteerRad = Math.max(maxBogieSteerRad, Math.abs(state.car1.frontBogieYaw));

    // Verify curve-pinned couplers: car1.rearCoupler and car2.frontCoupler lie directly on the smooth curve
    // (0 lateral shear / never kinks or breaks when turning!)
    const trkFrontCoupler = sampleCityTramTrackAtDistance(d - halfLen);
    const trkRearCoupler = sampleCityTramTrackAtDistance(d - halfLen - CITY_TRAM_SPEC.jointLength);
    assert.ok(
      Math.hypot(state.car1.rearCouplerX - trkFrontCoupler.x, state.car1.rearCouplerZ - trkFrontCoupler.z) < 1e-4,
      `Car 1 rear coupler must be pinned directly to the road curve at d=${d}`,
    );
    assert.ok(
      Math.hypot(state.car2.frontCouplerX - trkRearCoupler.x, state.car2.frontCouplerZ - trkRearCoupler.z) < 1e-4,
      `Car 2 front coupler must be pinned directly to the road curve at d=${d}`,
    );

    // Joint must remain tightly coupled between Car 1 rear coupler and Car 2 front coupler
    assert.ok(
      state.joint.spanLength > 0.85 && state.joint.spanLength < 1.85,
      `Accordion joint span (${state.joint.spanLength.toFixed(2)}m) must stay coupled at d=${d}`,
    );
    assert.ok(
      evaluateRoadNetworkSdf(state.joint.x, state.joint.z) < -1.2,
      `Articulation joint at d=${d} must stay inside road`,
    );

    // Check both Car 1 and Car 2 centers, bogies, and all 4 physical body corners
    for (const car of [state.car1, state.car2]) {
      assert.ok(evaluateRoadNetworkSdf(car.x, car.z) < -1.0, `Car center must stay inside road at d=${d}`);
      assert.ok(
        evaluateRoadNetworkSdf(car.frontBogieX, car.frontBogieZ) < -1.4,
        `Front bogie must stay inside road at d=${d}`,
      );
      assert.ok(
        evaluateRoadNetworkSdf(car.rearBogieX, car.rearBogieZ) < -1.4,
        `Rear bogie must stay inside road at d=${d}`,
      );

      const rightX = -car.forwardZ;
      const rightZ = car.forwardX;
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const cornerX = car.x + car.forwardX * (sx * halfLen) + rightX * (sz * halfWid);
          const cornerZ = car.z + car.forwardZ * (sx * halfLen) + rightZ * (sz * halfWid);
          const sdf = evaluateRoadNetworkSdf(cornerX, cornerZ);
          assert.ok(
            sdf < 0.35,
            `Car corner (${cornerX.toFixed(2)}, ${cornerZ.toFixed(2)}) at d=${d} must remain inside road corridor (sdf=${sdf.toFixed(2)})`,
          );
        }
      }
    }
  }

  assert.ok(
    maxArticulationRad > 0.35,
    `2-car consist must articulate significantly around road bends (maxArticulationRad=${maxArticulationRad.toFixed(2)})`,
  );
  assert.ok(
    maxBogieSteerRad > 0.15,
    `Car bogies must pivot to follow curved rails (maxBogieSteerRad=${maxBogieSteerRad.toFixed(2)})`,
  );
});

test('4v4 Individual Commander Base Complex supports 4 lined-up base plots per team, Level 1->2->3 building & iron fence upgrades, Helipad & Parking build, and skin/garden customization', () => {
  const blueBases = createIndividualCommanderBasesState('blue');
  const redBases = createIndividualCommanderBasesState('red');
  assert.equal(blueBases.length, 4);
  assert.equal(redBases.length, 4);

  // 4 bases lined up along X = [-45, -15, +15, +45] for Blue (South) and [+45, +15, -15, -45] for Red (North)
  assert.deepEqual(
    blueBases.map((b) => b.plotCenterX),
    [-45, -15, 15, 45],
  );
  assert.deepEqual(
    redBases.map((b) => b.plotCenterX),
    [45, 15, -15, -45],
  );

  const b0 = blueBases[0];
  assert.equal(b0.buildingLevel, 1);
  assert.equal(b0.buildingHp, INDIVIDUAL_BASE_LEVEL_SPECS.buildingMaxHpByLevel[0]);
  assert.equal(b0.fenceLevel, 1);
  assert.equal(b0.fenceHp, INDIVIDUAL_BASE_LEVEL_SPECS.fenceTotalMaxHpByLevel[0]);
  assert.equal(b0.hasHelipad, false);
  assert.equal(b0.hasParkingBay, false);

  // 1. Upgrade Building Level 1 -> Level 2 (cost >= 2 crates) -> Level 3 Command Center
  const notEnough = applyCommanderBaseUpgrade(b0, 'upgrade_building', 1);
  assert.equal(notEnough.upgraded, false);

  const upBld2 = applyCommanderBaseUpgrade(b0, 'upgrade_building', 2);
  assert.equal(upBld2.upgraded, true);
  assert.equal(b0.buildingLevel, 2);
  assert.equal(b0.buildingMaxHp, 1000);
  assert.equal(b0.buildingHp, 1000);

  const upBld3 = applyCommanderBaseUpgrade(b0, 'upgrade_building', 4);
  assert.equal(upBld3.upgraded, true);
  assert.equal(b0.buildingLevel, 3);
  assert.equal(b0.buildingMaxHp, 1800);
  assert.equal(b0.buildingHp, 1800);

  // 2. Upgrade Iron Fence Level 1 -> Level 2 -> Level 3
  const upFence2 = applyCommanderBaseUpgrade(b0, 'upgrade_fence', 2);
  assert.equal(upFence2.upgraded, true);
  assert.equal(b0.fenceLevel, 2);
  assert.equal(b0.fenceMaxHp, 1400);

  const upFence3 = applyCommanderBaseUpgrade(b0, 'upgrade_fence', 4);
  assert.equal(upFence3.upgraded, true);
  assert.equal(b0.fenceLevel, 3);
  assert.equal(b0.fenceMaxHp, 2800);

  // 3. Build Vehicle Parking Bay & Helipad
  const builtParking = applyCommanderBaseUpgrade(b0, 'build_parking', 2);
  assert.equal(builtParking.upgraded, true);
  assert.equal(b0.hasParkingBay, true);

  const builtHelipad = applyCommanderBaseUpgrade(b0, 'build_helipad', 4);
  assert.equal(builtHelipad.upgraded, true);
  assert.equal(b0.hasHelipad, true);

  // 4. Verify Skin Themes & Garden Presets catalog and Team Elimination rule
  assert.equal(Object.keys(BASE_SKIN_THEMES).length, 4);
  assert.equal(BASE_GARDEN_PRESETS.length, 4);
  assert.equal(isTeamAllBasesDestroyed(blueBases), false);
  for (const base of blueBases) {
    assert.equal(base.hasSkyshield, true, 'All commander bases start with a pre-installed Skyshield');
    base.destroyed = true;
    base.buildingHp = 0;
  }
  assert.equal(isTeamAllBasesDestroyed(blueBases), true);
});

test('City Tram supports boarding anywhere along its route and disembarking anywhere beside the car', () => {
  const tramState = evaluateCityTramConsistState(120);
  // Standing next to Car 1
  const nearCar1 = canUnitBoardCityTramAtAnyPoint(
    tramState.car1.x + 1.5,
    tramState.car1.z + 1.2,
    tramState,
    2.8,
  );
  assert.equal(nearCar1.canBoard, true);
  assert.equal(nearCar1.carIndex, 0);

  // Standing next to Car 2
  const nearCar2 = canUnitBoardCityTramAtAnyPoint(
    tramState.car2.x - 1.2,
    tramState.car2.z + 1.0,
    tramState,
    2.8,
  );
  assert.equal(nearCar2.canBoard, true);
  assert.equal(nearCar2.carIndex, 1);

  // Far away cannot board
  const farAway = canUnitBoardCityTramAtAnyPoint(0, 0, tramState, 2.8);
  assert.equal(farAway.canBoard, false);

  // Disembark position places player safely outside the car width
  const disembark = computeCityTramDisembarkPosition(tramState.car1, 1);
  const distFromCarCenter = Math.hypot(
    disembark.x - tramState.car1.x,
    disembark.z - tramState.car1.z,
  );
  assert.ok(
    distFromCarCenter > CITY_TRAM_SPEC.carWidth * 0.5 + 0.8,
    'Disembarked player lands safely outside the tram car body',
  );
});

test('Commander Base Automatic Sliding Gate allows ONLY the plot owner and their built characters to enter', () => {
  // Owner of Blue Plot #0 (ownerCommanderId === 0, team === 'blue') can enter Blue Plot #0
  assert.equal(canUnitEnterCommanderBaseGate('blue', 0, 'blue', 0), true);
  // Allied Commander #1 or their characters CANNOT enter Blue Plot #0's sliding gate
  assert.equal(canUnitEnterCommanderBaseGate('blue', 1, 'blue', 0), false);
  assert.equal(canUnitEnterCommanderBaseGate('blue', 2, 'blue', 0), false);
  // Enemy Red Commander #0 CANNOT enter Blue Plot #0's sliding gate
  assert.equal(canUnitEnterCommanderBaseGate('red', 0, 'blue', 0), false);

  // Sliding gate animation opens smoothly when authorized unit is within trigger radius (7.5m)
  let slide = 0;
  for (let i = 0; i < 20; i++) {
    slide = stepCommanderSlidingGate(slide, 3.0, 0.05, 7.5).slideRatio;
  }
  assert.equal(slide, 1, 'Sliding gate opens completely when authorized unit approaches');

  // Sliding gate closes smoothly when no authorized unit is near
  for (let i = 0; i < 25; i++) {
    slide = stepCommanderSlidingGate(slide, 25.0, 0.05, 7.5).slideRatio;
  }
  assert.equal(slide, 0, 'Sliding gate closes completely when authorized unit leaves');
});

test('Team Buddies (PS1) death drop mechanics: primary weapon with remaining ammo, coins, carried items, and NO corpse medkits', () => {
  // 1. Enemy killed while holding Bazooka ('rocket', 7 ammo left), carrying a blue ('super') crate overhead, a cluster bomb, and a time bomb
  const drops = evaluateTeamBuddiesDeathDrops({
    weaponId: 'rocket',
    ammo: 7,
    carryingCrate: 'super',
    secondaryItem: 'cluster_bomb',
    secondaryCount: 2,
    missionItem: 'time_bomb',
    isEnemyKill: true,
    classId: 'Commando',
    killedByChainExplosion: false,
  });

  // Never drops a medkit from a corpse
  assert.equal(
    drops.some((d) => d.kind === 'health'),
    false,
    'Dead characters NEVER drop a Health Pack / Medkit',
  );

  // Primary weapon drop retains exact remainingAmmo (7) and despawn timer
  const weaponDrop = drops.find((d) => d.kind === 'weapon');
  assert.ok(weaponDrop, 'Primary weapon drops on death');
  assert.equal(weaponDrop.weaponId, 'rocket');
  assert.equal(weaponDrop.remainingAmmo, 7);
  assert.equal(weaponDrop.despawnTimerSec, TEAM_BUDDIES_WEAPON_DESPAWN_SEC);
  assert.ok(weaponDrop.vy > 5, 'Primary weapon bounces upward into the air');

  // Enemy kill drops Gold and Silver Coins
  const goldCoin = drops.find((d) => d.kind === 'coin_gold');
  const silverCoin = drops.find((d) => d.kind === 'coin_silver');
  assert.ok(goldCoin && goldCoin.scoreValue === 250, 'Enemy kill drops Gold Coin');
  assert.ok(silverCoin && silverCoin.scoreValue === 100, 'Heavy enemy kill also drops Silver Coin');

  // Carried overhead crate drops intact when not killed by chain explosion
  const crateDrop = drops.find((d) => d.kind === 'crate');
  assert.ok(crateDrop, 'Carried crate is thrown to the ground intact');
  assert.equal(crateDrop.crateKind, 'super');

  // Carried secondary grenade & mission object drop intact
  const secDrop = drops.find((d) => d.kind === 'secondary');
  assert.ok(secDrop && secDrop.secondaryId === 'cluster_bomb');
  assert.equal(secDrop.secondaryCount, 2);
  const missionDrop = drops.find((d) => d.kind === 'mission_item');
  assert.ok(missionDrop && missionDrop.missionItemId === 'time_bomb');

  // 2. If killed by a chain explosion, carried crate is destroyed instead of dropping intact
  const chainDrops = evaluateTeamBuddiesDeathDrops({
    weaponId: 'rifle',
    ammo: 19,
    carryingCrate: 'red',
    secondaryItem: 'none',
    missionItem: 'none',
    isEnemyKill: false,
    killedByChainExplosion: true,
  });
  assert.equal(
    chainDrops.some((d) => d.kind === 'crate'),
    false,
    'Carried crate is destroyed when killed by chain explosion',
  );
  assert.equal(
    chainDrops.some((d) => d.kind === 'coin_gold' || d.kind === 'coin_silver'),
    false,
    'Friendly death does not award enemy kill coins',
  );
});

test('Team Buddies (PS1) despawn timer blinks rapidly before disappearing, medical crates drop Medkits, and splash damage destroys drops', () => {
  // 1. Despawn timer & rapid blink window
  const freshState = evaluateDroppedItemDespawnState(
    10.0,
    TEAM_BUDDIES_WEAPON_DESPAWN_SEC,
    TEAM_BUDDIES_DESPAWN_BLINK_WINDOW_SEC,
  );
  assert.equal(freshState.expired, false);
  assert.equal(freshState.isBlinking, false);
  assert.equal(freshState.visible, true);

  const blinkingState = evaluateDroppedItemDespawnState(
    2.1,
    TEAM_BUDDIES_WEAPON_DESPAWN_SEC,
    TEAM_BUDDIES_DESPAWN_BLINK_WINDOW_SEC,
  );
  assert.equal(blinkingState.expired, false);
  assert.equal(blinkingState.isBlinking, true);

  const expiredState = evaluateDroppedItemDespawnState(
    0,
    TEAM_BUDDIES_WEAPON_DESPAWN_SEC,
    TEAM_BUDDIES_DESPAWN_BLINK_WINDOW_SEC,
  );
  assert.equal(expiredState.expired, true);
  assert.equal(expiredState.visible, false);

  // 2. Medkits ONLY come from white red-cross medical crates ('medical'), while Purple ('legend') crates drop Super Weapons
  assert.equal(evaluateCrateDestructionDrop('medical').dropKind, 'health');
  assert.equal(evaluateCrateDestructionDrop('medical').healAmount, 35);
  assert.equal(evaluateCrateDestructionDrop('red').dropKind, 'ammo');
  assert.equal(evaluateCrateDestructionDrop('super').dropKind, 'ammo');
  assert.equal(evaluateCrateDestructionDrop('legend').dropKind, 'weapon');
  assert.equal(evaluateCrateDestructionDrop('legend').isPurpleSuperWeapon, true);

  // 3. Dropped weapons & crates are vulnerable to follow-up splash damage (Bazooka / Tank / Barrel blast)
  const splashHit = evaluateSplashDamageOnDroppedItem(11.2, 10.5, 10, 10, 6.5, 55, 18);
  assert.equal(splashHit.hit, true);
  assert.equal(splashHit.destroyed, true, 'Close follow-up blast destroys dropped weapon/crate');
  assert.equal(splashHit.nextHp, 0);
  assert.ok(Math.hypot(splashHit.knockbackVx, splashHit.knockbackVz) > 6.0);
});

test('Team Buddies (PS1) 2x2x2 Stacking Pad patterns, Crate Schemes, Color Upgrade Tiers, and Odd-Count Breakdown (3, 5, 7 crates)', () => {
  // 1. Verify all 6 canonical Stacking Pad pattern categories and 4 World Crate Schemes exist
  assert.equal(Object.keys(TEAM_BUDDIES_STACKING_PATTERNS).length, 6);
  assert.equal(Object.keys(TEAM_BUDDIES_CRATE_SCHEMES).length, 4);
  assert.equal(TEAM_BUDDIES_STACKING_PATTERNS['1x1x1'].categoryLabel, 'Senjata Ringan (Tier 1)');
  assert.equal(TEAM_BUDDIES_STACKING_PATTERNS['2x1x1'].categoryLabel, 'Senjata Menengah (Tier 2)');
  assert.equal(TEAM_BUDDIES_STACKING_PATTERNS['1x1x2'].categoryLabel, 'Unit Pasukan (Buddy)');
  assert.equal(TEAM_BUDDIES_STACKING_PATTERNS['2x2x1'].categoryLabel, 'Senjata Berat / Turret (Tier 3)');
  assert.equal(TEAM_BUDDIES_STACKING_PATTERNS['2x1x2'].categoryLabel, 'Kendaraan Ringan');
  assert.equal(TEAM_BUDDIES_STACKING_PATTERNS['2x2x2'].categoryLabel, 'Kendaraan Berat & Pesawat');

  // 2. 1 Blue Crate ('super') -> Super Shotgun (Peluru Menyebar & Memantul) with hasBouncingSpread = true
  const oneBlue = evaluateStackingPadRecipe([
    'super',
    'empty',
    'empty',
    'empty',
    'empty',
    'empty',
    'empty',
    'empty',
  ]);
  assert.equal(oneBlue.shapeKey, '1x1x1');
  assert.equal(oneBlue.hasBouncingSpread, true);
  assert.ok(oneBlue.crateSchemeVariantName.includes('Super Shotgun'));

  // 3. 2 Vertical Blue Crates ('1x1x2') -> Super Buddy (Commando / Robo-Buddy with 2x HP & 2x Speed)
  const twoBlueVertical = evaluateStackingPadRecipe([
    'super',
    'empty',
    'empty',
    'empty',
    'super',
    'empty',
    'empty',
    'empty',
  ]);
  assert.equal(twoBlueVertical.shapeKey, '1x1x2');
  assert.equal(twoBlueVertical.buddyStatMultiplier?.hpMultiplier, 2.0);
  assert.equal(twoBlueVertical.buddyStatMultiplier?.speedMultiplier, 2.0);

  // 4. 8 Blue Crates ('2x2x2') -> Super Tank (Mammoth / Tyrant Tank with 2.2x armor)
  const eightBlue = evaluateStackingPadRecipe([
    'super',
    'super',
    'super',
    'super',
    'super',
    'super',
    'super',
    'super',
  ]);
  assert.equal(eightBlue.shapeKey, '2x2x2');
  assert.equal(eightBlue.vehicleStatMultiplier?.seats, 2);
  assert.equal(eightBlue.vehicleStatMultiplier?.armorMultiplier, 2.2);

  // 5. Odd-Count Breakdown (Jumlah Tanggung: 3, 5, and 7 crates) -> Nearest lower pattern + leftover small weapon drops!
  const oddThree = evaluateStackingPadRecipe([
    'red',
    'red',
    'super',
    'empty',
    'empty',
    'empty',
    'empty',
    'empty',
  ]);
  assert.equal(oddThree.totalCrates, 3);
  assert.equal(oddThree.isOddStackCount, true);
  assert.equal(oddThree.basePatternCratesUsed, 2);
  assert.equal(oddThree.leftoverWeaponDropsCount, 1);
  assert.equal(oddThree.leftoverWeaponDrops[0].hasBouncingSpread, true);

  const oddFive = evaluateStackingPadRecipe([
    'red',
    'red',
    'red',
    'red',
    'legend',
    'empty',
    'empty',
    'empty',
  ]);
  assert.equal(oddFive.totalCrates, 5);
  assert.equal(oddFive.isOddStackCount, true);
  assert.equal(oddFive.basePatternCratesUsed, 4);
  assert.equal(oddFive.leftoverWeaponDropsCount, 1);
  assert.equal(oddFive.leftoverWeaponDrops[0].isMassDestructionSuperWeapon, true);

  const oddSeven = evaluateStackingPadRecipe([
    'red',
    'red',
    'red',
    'red',
    'red',
    'super',
    'red',
    'empty',
  ]);
  assert.equal(oddSeven.totalCrates, 7);
  assert.equal(oddSeven.isOddStackCount, true);
  assert.equal(oddSeven.basePatternCratesUsed, 4);
  assert.equal(oddSeven.leftoverWeaponDropsCount, 3);
});

test('Team Buddies (PS1) Crafted Ground Weapon Lifecycle: Physics Pop-out, AI Auto-Loot & Tier Upgrade, Enemy Stealing (No Team-Lock), 15-20s Despawn vs Permanent Vehicles/Buddies, and Splash Destruction', () => {
  // 1. Physics Pop-out (`Terpental ke Sekitar Pad`): Weapon pops out of the 2x2 pad center and lands around the pad perimeter border (2.4m..3.4m)
  const pop = computeStackingPadWeaponPopOutTrajectory(-18, 62, 0, 1, 1);
  assert.ok(pop.vy > 5.5, 'Crafted weapon pops upward out of the Stacking Pad');
  assert.ok(
    pop.landingDistFromPadCenter >= 2.4 && pop.landingDistFromPadCenter <= 3.4,
    `Expected landing distance around pad perimeter [2.4..3.4m], got ${pop.landingDistFromPadCenter}`,
  );

  // 2. AI Auto-Loot (`Diambil Otomatis oleh AI Tim`): AI holding Tier 1 Pistol upgrades automatically to Tier 3 Bazooka lying near the pad
  const upgradeCheck = canUnitLootGroundWeapon(
    'blue',
    'pistol',
    'Uzi / Shotgun',
    'rocket',
    'Bazooka / Assault Rifle',
    90,
  );
  assert.equal(upgradeCheck.canLoot, true);
  assert.equal(upgradeCheck.isUpgrade, true);
  assert.ok(upgradeCheck.groundTier > upgradeCheck.currentTier);

  const aiUpgradeDecision = evaluateBuiltBuddySmartAiDecision({
    buddyClass: 'Infuntry',
    weaponId: 'pistol',
    carryingCrate: false,
    hp: 100,
    maxHp: 100,
    commandMode: 'HARVEST',
    ownerBuildOrder: '2x1x1',
    ownerPadHasSpace: true,
    ownerPadReadyToCraft: false,
    ownerIsAiCommander: false,
    ownerAliveBuddyCount: 2,
    ownerHasBuiltTurret: true,
    ownerHasBuiltVehicle: false,
    woundedAllyDist: null,
    nearestEnemyDist: 35,
    nearestFreeCrateDist: 18,
    nearestGroundWeaponDist: 8.5,
    nearestEmptyVehicleDist: null,
    canUpgradeFromGroundWeapon: upgradeCheck.isUpgrade,
  });
  assert.equal(
    aiUpgradeDecision.action,
    'EQUIP_GROUND_WEAPON',
    'AI Buddy holding lower-tier weapon automatically runs to loot higher-tier crafted weapon',
  );

  // 3. Vulnerable to Enemy Stealing (`Rentan Dicuri Lawan` — No Team-Lock): Enemy Red unit can steal Blue-crafted weapon
  const enemyStealCheck = canUnitLootGroundWeapon(
    'red',
    'unarmed',
    'Tangan Kosong',
    'rocket',
    'Nuclear Launcher',
    0,
  );
  assert.equal(enemyStealCheck.teamLocked, false, 'Ground weapons have NO team-lock');
  assert.equal(enemyStealCheck.canLoot, true, 'Infiltrating enemy can steal crafted weapon from pad border');
  assert.equal(getBuddyWeaponTierRank('rocket', 'Nuclear Launcher'), 4);

  // 4. Despawn Timer (15–20s for Weapons) vs Permanent Vehicles & Buddies
  assert.ok(
    TEAM_BUDDIES_CRAFTED_WEAPON_DESPAWN_SEC >= 15 && TEAM_BUDDIES_CRAFTED_WEAPON_DESPAWN_SEC <= 20,
    'Crafted weapon despawn timer is within 15–20 seconds (18.0s)',
  );
  assert.equal(doesCraftedEntityDespawnByTimer('weapon').despawnsByTime, true);
  assert.equal(doesCraftedEntityDespawnByTimer('weapon').despawnTimerSec, 18.0);
  assert.equal(doesCraftedEntityDespawnByTimer('buddy').despawnsByTime, false);
  assert.equal(doesCraftedEntityDespawnByTimer('tank').despawnsByTime, false);
  assert.equal(doesCraftedEntityDespawnByTimer('light_vehicle').despawnsByTime, false);
  assert.equal(doesCraftedEntityDespawnByTimer('plane').despawnsByTime, false);

  // 5. Splash Damage Destruction (`Hancur Terkena Serangan Area`): Enemy shell hitting near pad border blows up idle crafted weapon
  const padSplash = evaluateSplashDamageOnDroppedItem(
    pop.landingX,
    pop.landingZ,
    pop.landingX + 1.1,
    pop.landingZ - 0.8,
    6.5,
    60,
    18,
  );
  assert.equal(padSplash.hit, true);
  assert.equal(padSplash.destroyed, true, 'Idle crafted weapon beside pad explodes when hit by enemy splash damage');
});

test('Team Buddies (PS1) Deathmatch Win Conditions: Base/HQ Destruction & Total Squad Wipeout with No Respawn or Crates', () => {
  // 1. Starter unit vs Crafted Buddy respawn rules
  assert.equal(canBuddyUnitRespawnAtBase(true, false, 400), true, 'Starter unit can respawn while its base stands');
  assert.equal(canBuddyUnitRespawnAtBase(true, true, 0), false, 'Starter unit cannot respawn once its base is destroyed');
  assert.equal(
    canBuddyUnitRespawnAtBase(false, false, 400),
    false,
    'Crafted extra Buddy does not auto-respawn when killed (must be crafted again from crates)',
  );

  // 2. Pad slots check for birthing a new Buddy (1x1x2 or 2x1x2)
  assert.equal(
    canPadSlotsBirthNewBuddy(['red', 'empty', 'empty', 'empty', 'red', 'empty', 'empty', 'empty']),
    true,
    '2 vertical crates (1x1x2) can birth a new Buddy',
  );
  assert.equal(
    canPadSlotsBirthNewBuddy(['red', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty']),
    false,
    '1 crate cannot birth a new Buddy',
  );

  // 3. Win Condition A (`base_destroyed`): Enemy Base HP reaches 0 or all 4 Commander Bases destroyed
  const healthyBlueBases = createIndividualCommanderBasesState('blue');
  const destroyedRedBases = createIndividualCommanderBasesState('red').map((b) => ({
    ...b,
    destroyed: true,
    buildingHp: 0,
  }));
  const emptyPads = [
    ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'] as const,
  ].map((arr) => [...arr]);

  const baseDestroyedWin = evaluateTeamBuddiesDeathmatchWinCondition(
    {
      team: 'blue',
      baseHp: 1800,
      commanderBases: healthyBlueBases,
      aliveUnitCount: 3,
      respawnableUnitCount: 1,
      padSlotsList: emptyPads,
      freeFieldCrateCount: 4,
    },
    {
      team: 'red',
      baseHp: 400,
      commanderBases: destroyedRedBases,
      aliveUnitCount: 2,
      respawnableUnitCount: 0,
      padSlotsList: emptyPads,
      freeFieldCrateCount: 4,
    },
  );
  assert.equal(baseDestroyedWin.isGameOver, true);
  assert.equal(baseDestroyedWin.outcome, 'victory');
  assert.equal(baseDestroyedWin.winningTeam, 'blue');
  assert.equal(baseDestroyedWin.reason, 'base_destroyed');

  // 4. Win Condition B (`squad_wiped_no_respawn_or_crates`): All enemy units wiped out, 0 respawnable units, and no crates to birth a new Buddy
  const intactRedBases = createIndividualCommanderBasesState('red');
  const squadWipedWin = evaluateTeamBuddiesDeathmatchWinCondition(
    {
      team: 'blue',
      baseHp: 1500,
      commanderBases: healthyBlueBases,
      aliveUnitCount: 2,
      respawnableUnitCount: 0,
      padSlotsList: emptyPads,
      freeFieldCrateCount: 0,
    },
    {
      team: 'red',
      baseHp: 900,
      commanderBases: intactRedBases,
      aliveUnitCount: 0,
      respawnableUnitCount: 0,
      padSlotsList: emptyPads,
      freeFieldCrateCount: 0,
    },
  );
  assert.equal(squadWipedWin.isGameOver, true);
  assert.equal(squadWipedWin.outcome, 'victory');
  assert.equal(squadWipedWin.winningTeam, 'blue');
  assert.equal(squadWipedWin.reason, 'squad_wiped_no_respawn_or_crates');

  // 5. Not eliminated if a starter unit is waiting to respawn at an intact base
  const stillRespawning = isTeamEliminatedInDeathmatch({
    team: 'red',
    baseHp: 900,
    commanderBases: intactRedBases,
    aliveUnitCount: 0,
    respawnableUnitCount: 1,
    padSlotsList: emptyPads,
    freeFieldCrateCount: 0,
  });
  assert.equal(stillRespawning.eliminated, false);
});

test('Self-Service Tactical Kiosk: Multi-Color Pad Hologram Slot Matching, Base Gold Upgrades & Crate Airdrop Shop', () => {
  // 1. Multi-color hologram slot hex mapping (Red #ff4d3d, Blue #00d2ff, Gold #ffd700)
  assert.equal(getHologramSlotHexColor('red'), 0xff4d3d);
  assert.equal(getHologramSlotHexColor('super'), 0x00d2ff);
  assert.equal(getHologramSlotHexColor('legend'), 0xffd700);

  // 2. When a mixed-color recipe like Laser Gun (1 Red + 1 Blue on 2x1x1) or Lyo Plane (7 Red/Blue + 1 Legend on 2x2x2) is selected,
  //    throwing a crate fills the slot whose hologram color matches the crate kind first!
  const planeHologram = KIOSK_BUILD_PRIORITY_RECIPES.lyo_plane.slotHologramColors;
  const slots: ('empty' | 'red' | 'super' | 'legend')[] = [
    'empty',
    'empty',
    'empty',
    'empty',
    'empty',
    'empty',
    'empty',
    'empty',
  ];
  // Throwing a Legend (Gold) crate first should immediately go into slot 6 (the first Gold hologram slot in lyo_plane)!
  const legendSlotIdx = chooseNextPadSlotIndexForHologram(slots, planeHologram, 'legend', '2x2x2');
  assert.equal(legendSlotIdx, 6, 'Legend crate jumps directly to the first Gold hologram slot (#6)');
  slots[legendSlotIdx] = 'legend';

  // Throwing a Rare (Blue) crate next should go into the first Blue hologram slot (#4)
  const superSlotIdx = chooseNextPadSlotIndexForHologram(slots, planeHologram, 'super', '2x2x2');
  assert.equal(superSlotIdx, 4, 'Super crate jumps to the first Blue hologram slot (#4)');
  slots[superSlotIdx] = 'super';

  // Throwing a Common (Red) crate goes into the first Red hologram slot (#0)
  const redSlotIdx = chooseNextPadSlotIndexForHologram(slots, planeHologram, 'red', '2x2x2');
  assert.equal(redSlotIdx, 0, 'Red crate fills the first Red hologram slot (#0)');

  // 3. Base Upgrade (Command Center + Fence) with expensive Warzone Gold
  const bases = createIndividualCommanderBasesState('blue');
  const myBase = bases[0];
  assert.equal(myBase.buildingLevel, 1);
  assert.equal(myBase.fenceLevel, 1);

  const specsLv1 = getCommanderBaseGoldUpgradeSpecs(myBase);
  assert.equal(specsLv1.upgrade_base_combo.costGold, 1200);

  // Insufficient gold fails cleanly
  const failUpgrade = applyCommanderBaseGoldUpgrade(myBase, 'upgrade_base_combo', 500);
  assert.equal(failUpgrade.upgraded, false);
  assert.equal(myBase.buildingLevel, 1);

  // Upgrading Command Center + Fence with 1500 Gold succeeds and deducts 1200 Gold
  const okUpgradeLv2 = applyCommanderBaseGoldUpgrade(myBase, 'upgrade_base_combo', 1500);
  assert.equal(okUpgradeLv2.upgraded, true);
  assert.equal(okUpgradeLv2.nextGold, 300);
  assert.equal(myBase.buildingLevel, 2);
  assert.equal(myBase.fenceLevel, 2);
  assert.equal(myBase.buildingMaxHp, 1000);
  assert.equal(myBase.fenceMaxHp, 1400);

  // 4. Purchasing Crates by Rarity with Gold triggers Airdrop
  assert.equal(KIOSK_CRATE_AIRDROP_SHOP.red.costGold, 150);
  assert.equal(KIOSK_CRATE_AIRDROP_SHOP.super.costGold, 350);
  assert.equal(KIOSK_CRATE_AIRDROP_SHOP.legend.costGold, 750);
  assert.equal(KIOSK_CRATE_AIRDROP_SHOP.medical.costGold, 200);

  const buyRare = purchaseCrateAirdropWithGold('super', 500);
  assert.equal(buyRare.purchased, true);
  assert.equal(buyRare.airdropCrateKind, 'super');
  assert.equal(buyRare.nextGold, 150);

  const buyLegendFail = purchaseCrateAirdropWithGold('legend', 150);
  assert.equal(buyLegendFail.purchased, false);
  assert.equal(buyLegendFail.airdropCrateKind, null);

  // 5. Smart AI Harvester Crate Selection: NEVER picks 'medical' crates or random wrong-colored crates!
  const infantryHolo = KIOSK_BUILD_PRIORITY_RECIPES.buddy_infantry.slotHologramColors; // Needs 2 'red' crates
  const emptySlots: ('empty' | 'red' | 'super' | 'legend')[] = [
    'empty',
    'empty',
    'empty',
    'empty',
    'empty',
    'empty',
    'empty',
    'empty',
  ];
  const fieldCrates = [
    { id: 1, x: 2, z: 0, kind: 'medical' as const, state: 'grounded' }, // Very close (2m), MUST be ignored!
    { id: 2, x: 4, z: 0, kind: 'legend' as const, state: 'grounded' },  // Close (4m), wrong color for Infantry!
    { id: 3, x: 5, z: 0, kind: 'super' as const, state: 'grounded' },   // Close (5m), wrong color for Infantry!
    { id: 4, x: 18, z: 0, kind: 'red' as const, state: 'grounded' },    // 18m away, exact match ('red')!
  ];

  const pickForInfantry = selectSmartCrateForAiHarvester(
    0,
    0,
    fieldCrates,
    emptySlots,
    infantryHolo,
    [],
    true,
  );
  assert.equal(
    pickForInfantry.selectedCrate?.id,
    4,
    'AI must skip closer medical/legend/super crates and pick the required red crate (#4)',
  );

  // 6. Teammate In-Flight Coordination: For Super Commando (1 'super' + 1 'red'), if Teammate #1 is already carrying 'super',
  //    Teammate #2 strictly picks 'red' instead of grabbing a duplicate 'super'!
  const commandoHolo = KIOSK_BUILD_PRIORITY_RECIPES.buddy_commando.slotHologramColors; // ['super', ..., 'red', ...]
  const pickForSecondBuddy = selectSmartCrateForAiHarvester(
    0,
    0,
    fieldCrates,
    emptySlots,
    commandoHolo,
    ['super'],
    true,
  );
  assert.deepEqual(pickForSecondBuddy.neededColors, ['red']);
  assert.equal(
    pickForSecondBuddy.selectedCrate?.id,
    4,
    'Second AI Buddy must fetch the remaining needed red crate (#4) when a teammate is already carrying super',
  );

  // 7. Hologram Disappears Once Build Target Is Fulfilled or Crafted (`evaluatePadHologramState`):
  //    a) Active 1-crate Super Shotgun target ('assault_plasma') at 0/1 crates shows slot 0 ('super') hologram and outer pattern box:
  const holoBeforeFill = evaluatePadHologramState(
    true,
    true,
    'assault_plasma',
    emptySlots,
  );
  assert.equal(holoBeforeFill.isActive, true);
  assert.equal(holoBeforeFill.isFulfilled, false);
  assert.equal(holoBeforeFill.showPatternOutlineBox, true);
  assert.equal(holoBeforeFill.slotGhostColors[0], 'super');

  //    b) Once slot 0 is filled with 'super' (1/1 crates fulfilled), the hologram disappears completely:
  const filledShotgunSlots: ('empty' | 'red' | 'super' | 'legend')[] = [
    'super',
    'empty',
    'empty',
    'empty',
    'empty',
    'empty',
    'empty',
    'empty',
  ];
  const holoWhenFilled = evaluatePadHologramState(
    true,
    true,
    'assault_plasma',
    filledShotgunSlots,
  );
  assert.equal(holoWhenFilled.isFulfilled, true);
  assert.equal(holoWhenFilled.showPatternOutlineBox, false);
  assert.deepEqual(holoWhenFilled.slotGhostColors, emptySlots);

  //    c) After crafting resets `useCustomHologramRecipe = false` on the emptied pad (0/1 crates),
  //       the hologram stays hidden (`showPatternOutlineBox = false`, all `slotGhostColors = 'empty'`)!
  const holoAfterCraft = evaluatePadHologramState(
    true,
    false,
    'assault_plasma',
    emptySlots,
  );
  assert.equal(holoAfterCraft.isActive, false);
  assert.equal(holoAfterCraft.showPatternOutlineBox, false);
  assert.deepEqual(holoAfterCraft.slotGhostColors, emptySlots);

  // 8. Command Center Level Radar Coverage & Minimap Calibration:
  const radarLv1 = evaluateCommandCenterRadarSpec(1);
  const radarLv2 = evaluateCommandCenterRadarSpec(2);
  const radarLv3 = evaluateCommandCenterRadarSpec(3);
  assert.ok(radarLv1.baseRadarRadius < radarLv2.baseRadarRadius);
  assert.ok(radarLv2.baseRadarRadius < radarLv3.baseRadarRadius);
  assert.equal(radarLv1.fullMapUnlocked, false);
  assert.equal(radarLv3.fullMapUnlocked, true);

  const centerPct = worldCoordToRadarPercent(0, 0);
  assert.equal(centerPct.leftPct, 50);
  assert.equal(centerPct.topPct, 50);

  // At Lv.1, an enemy inside Red Base (0, -81.7) is hidden when player is at Blue Base (-45, 75),
  // but becomes visible once Command Center is upgraded to Lv.3:
  assert.equal(
    isPointVisibleOnCommandCenterRadar(0, -81.7, false, 1, 0, 81.7, -45, 75),
    false,
  );
  assert.equal(
    isPointVisibleOnCommandCenterRadar(0, -81.7, false, 3, 0, 81.7, -45, 75),
    true,
  );
});















