import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  REA_CONSTANTS,
  LIGHTING_PRESETS,
  LightingPresetKey,
  stepCriticalDampedSpring3D,
  computeTankSpeedStep,
  stepTurretYaw,
  clamp,
  Vec3,
  CrateSlotType,
  evaluateStackingPadRecipe,
  chooseNextPadSlotIndex,
  BuildOrderTarget,
  BUILD_ORDER_SPECS,
  resolveCursorCommandTarget,
  BUDDY_CLASSES,
  BuddyClassId,
  TeamCommandMode,
  ColliderCategory,
  CollisionMaterialTag,
  getPropCollisionSpec,
  resolveSolidCollision2D,
  resolveSolidObbCollision2D,
  pointInObb2D,
  computePushableImpulse2D,
  shouldShatterBreakableProp,
  canTriggerCollisionCooldown,
  shouldPlayMoverCollisionSound,
  DUMP_TRUCK_MAX_CRATES,
  canLoadCrateIntoDumpTruck,
  evaluateDumpTruckHydraulicCycle,
  stepDumpTruckWheeledPhysics,
  UNIFIED_WORLD_CRATE_SIZE,
  JUMP_BUFFER_DURATION_SEC,
  stepBuddyJumpPhysics,
  stepBuddyJumpPhysicsWithBuffer,
  PLAYER_INVINCIBILITY_DURATION_SEC,
  stepPlayerInvincibilityState,
  applyPlayerDamageWithInvincibilityAndKnockback,
  evaluateBuddyMeleeStrike,
  MAX_CHARACTERS_PER_COMMANDER,
  COMMANDERS_PER_TEAM,
  canCommanderBuildCharacter,
  getNextOwnedBuddyForSwap,
  Matchmaking4v4State,
  createMatchmaking4v4State,
  hotJoinReplaceAiCommander,
  evaluateBuiltBuddySmartAiDecision,
  AStarNavGrid,
  createAStarNavGrid,
  rasterizeCircleObstacleToNavGrid,
  rasterizeObbObstacleToNavGrid,
  findPathAStar,
  evaluateLyoHitReactionPose,
  evaluateLyoStunEffectState,
  RAYCAST_LAYERS,
  RAYCAST_MAX_DISTANCE,
  RaycastCollider3D,
  MuzzleRaycastResult,
  castMuzzleRaycast3D,
  getWeaponProjectileVisualSpec,
  createFixedObjectPool,
  POOL_PEAK_CAPACITIES,
  resolveSolidCratePush2D,
  resolveCrateVsCrateCollision2D,
  CITY_TRAM_SPEC,
  BaseSkinThemeId,
  BaseGardenPresetId,
  BASE_SKIN_THEMES,
  BASE_GARDEN_PRESETS,
  IndividualCommanderBaseState,
  createIndividualCommanderBasesState,
  applyCommanderBaseUpgrade,
  canUnitBoardCityTramAtAnyPoint,
  computeCityTramDisembarkPosition,
  canUnitEnterCommanderBaseGate,
  BuddySecondaryItemId,
  BuddyMissionItemId,
  WorldCrateKind,
  TeamBuddiesDropItemKind,
  TEAM_BUDDIES_WEAPON_DESPAWN_SEC,
  TEAM_BUDDIES_CRAFTED_WEAPON_DESPAWN_SEC,
  evaluateTeamBuddiesDeathDrops,
  evaluateDroppedItemDespawnState,
  evaluateCrateDestructionDrop,
  evaluateSplashDamageOnDroppedItem,
  computeStackingPadWeaponPopOutTrajectory,
  getBuddyWeaponTierRank,
  canUnitLootGroundWeapon,
  canBuddyUnitRespawnAtBase,
  evaluateTeamBuddiesDeathmatchWinCondition,
  KioskBuildPriorityRecipeId,
  PadSlotHologramPattern,
  KIOSK_BUILD_PRIORITY_RECIPES,
  getHologramSlotHexColor,
  chooseNextPadSlotIndexForHologram,
  getRemainingNeededCrateKindsForHologram,
  evaluatePadHologramState,
  MAX_KIOSK_BUILD_QUEUE,
  enqueueKioskBuildRecipe,
  removeKioskBuildQueueAtIndex,
  advanceKioskBuildQueueOnCraft,
  isCrateInsideOtherOrEnemyBase,
  selectSmartCrateForAiHarvester,
  KioskSideHologramModelKind,
  evaluateKioskSideHologramDisplay,
  evaluatePadCancelKickShatterDrops,
  isUnitInPersonalCommandCenterArea,
  KioskBaseGoldUpgradeId,
  applyCommanderBaseGoldUpgrade,
  purchaseCrateAirdropWithGold,
  computeLandMineGrassYOffset,
  isPointVisibleOnCommandCenterRadar,
  evaluateNuclearLauncherAccess,
  evaluateClusterBombAccess,
  NuclearStrikePhase,
  NuclearStrikeSequenceState,
  createInitialNuclearStrikeState,
  beginNuclearStrikeTargeting,
  updateNuclearStrikeTargetCursor,
  confirmNuclearStrikeTargetAndLaunch,
  stepNuclearStrikeSequence,
  computeNuclearStrikeCameraPose,
  SUPPLY_DROP_LOCATIONS,
  SupplyDropScheduleState,
  createInitialSupplyDropScheduleState,
  stepSupplyDropSchedule,
  canDamageWorldCrate,
  evaluateSpecialMetallicCratePadBoost,
  formatBuddyRoleUiLabel,
  stepFollowerSmoothYaw,
  evaluateAutonomousFollowerEscortStep,
  evaluateLyoTankShotRecoilPose,
  isTankClimbableProp,
  evaluateTankClimbableObstacleElevation,
  evaluateAiRangedCombatStandoffBehavior,
  MAX_HANDHELD_WEAPON_SLOTS,
  HandheldWeaponSlotId,
  TacticalSecondarySlotId,
  resolveHandheldWeaponSlotSpec,
  createInitialBuddyTacticalLoadout,
  equipOrSwapDroppedWeaponInLoadout,
  selectHandheldWeaponInLoadout,
  consumeActiveWeaponAmmoOnShot,
  refillLoadoutAmmoFromSource,
  addTacticalSecondaryToLoadout,
  consumeTacticalSecondaryInLoadout,
  getVisibleHudWeaponAndTacticalBadges,
  WARZONE_EXPLOSIVE_BARREL_DROP_INTERVAL_SEC,
  MAX_ACTIVE_WARZONE_EXPLOSIVE_BARRELS,
  stepWarzoneExplosiveBarrelDropTimer,
} from './buddiesBlitzRules';
import {
  evaluateOuterEmbankmentSdf,
  evaluateRoadNetworkSdf,
  evaluateNwLakeSdf,
  evaluateSeHarborSdf,
  evaluateLyoGrassMask,
} from './planetCurvature';
import {
  soundEngine,
  computeSpatialAudioGain,
  computeBuildBoxAudioGain,
} from './audio';
import {
  loadAllRealLyoAssets,
  createLyoInfiniteGrassSystem,
  createTolanCurvedPlanetEnvironment,
  applyPlanetCurvatureToObject,
  computePlanetYOffset,
  getTerrainElevation,
  wrapPlanetCoord,
  getPlanetShortestDelta,
  getPlanetShortestDistance,
  PLANET_CURVATURE_STRENGTH,
  applyTerrainSculptBrush,
  resetTerrainSculptGrid,
  serializeTerrainSculptGrid,
  restoreTerrainSculptGrid,
  populateRealLyoTreeFromGlb,
  populateRealLyoTankFromGlb,
  populateRealLyoDumpTruckFromGlb,
  stepLyoDumpTruckAnimation,
  syncLyoDumpTruckCargoVisuals,
  populateRealLyoCrateBoxFromGlb,
  buildProceduralLyoPlane,
  stepLyoPlaneAnimation,
  buildProceduralRobloxBuddyAvatar,
  updateCharacterWeaponStance,
  RobloxBuddyRig,
  LyoWeaponId,
  stepLyoTankTracks,
  spawnRealLyoPropFromGlb,
  stepRealLyoPropsAnimation,
  getLyoDefaultLightDirection,
  LoadedLyoAssets,
  LyoWindUniforms,
  createLyoExplosionSystem,
  createLyoStunEffectMesh,
  buildMilitaryBaseMasterplan,
  syncMilitaryBasePlotsVisuals,
  stepMilitaryBaseMasterplanAnimation,
  populateMilitaryBaseGardenTreesFromGlb,
  getSharedFallbackFoliageMaskTexture,
  buildProceduralSkyshieldTurret,
  getBaseSkyshieldTurrets,
  SkyshieldTurretController,
  buildRealLyoBulletTemplates,
  Lyo3dBulletTemplates,
  createProceduralCityTramConsist,
  bakeStaticGroupMeshes,
  buildCraftedWeaponPickupMesh,
  buildTeamBuddiesDropPickupMesh,
  buildSelfServiceTacticalKioskMesh,
  buildProceduralNuclearMissileMesh,
  buildProceduralNuclearLauncherTurret,
  NuclearLauncherTurretRig,
} from './buddiesBlitzShadersAndAssets';
import {
  GameState,
  PlayMode,
  EditorToolId,
  PlacedMapProp,
  ArenaMapLayout,
  RadarDot,
  FloatingWorldPrompt,
  HudSnapshot,
  BuddiesBlitzArenaProps,
  FactoryPlaygroundCanvasProps,
  WorldCrate,
  WorldPickup,
  DestructibleTree,
  ActiveMapPropPhysics,
  DebrisChunk3D,
  TankVehicle,
  BuddyUnit,
  Projectile,
  ExplosionParticle,
  ActiveLaserBeam3D,
  ActiveOrdnanceDevice3D,
  StaticWorldStructureObb,
  BUILD_ORDER_CYCLE,
  COMMAND_CYCLE,
  BLUE_BUDDY_ROTATION,
} from './buddiesBlitzTypes';
import {
  evaluatePlayerCommandCenterRadarAndMinimapDots,
  applyGrassChunkSyncedFogOfWar3D,
} from './buddiesBlitzMinimap';
import {
  buildArenaNavGrids,
  computeUnitAStarSteeringDirection,
  evaluateSquadAiUnitPerceptionAndDecision,
  getCommanderDefendStationCoords,
} from './buddiesBlitzSquadAi';
import {
  createGroundLockAuraTexture,
  createHudLockReticleTexture,
  computePlayerMuzzleAndAimDirection,
  buildArenaRaycastColliders,
} from './buddiesBlitzCombat';
import {
  MAP_STORAGE_KEY,
  buildTeamBaseQuadrant,
  DEFAULT_ARENA_MAP_LAYOUT,
  cloneDefaultLayout,
  loadSavedArenaLayout,
  getPropBaseHeight,
  createBillboardSign,
  buildStaticWorldStructuresList,
} from './buddiesBlitzWorldBuilder';

export type {
  GameState,
  PlayMode,
  EditorToolId,
  PlacedMapProp,
  ArenaMapLayout,
  RadarDot,
  FloatingWorldPrompt,
  HudSnapshot,
  BuddiesBlitzArenaProps,
  FactoryPlaygroundCanvasProps,
};
export {
  MAP_STORAGE_KEY,
  buildTeamBaseQuadrant,
  DEFAULT_ARENA_MAP_LAYOUT,
};

export const BuddiesBlitzArena: React.FC<BuddiesBlitzArenaProps> = ({
  gameState,
  playMode,
  editorTool,
  editorBrushRadius = 10,
  lightingPreset,
  cameraFovMode,
  resetTrigger,
  onHudUpdate,
  onGameOver,
  onTogglePause,
  onMapSaved,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const gameStateRef = useRef<GameState>(gameState);
  const playModeRef = useRef<PlayMode>(playMode);
  const editorToolRef = useRef<EditorToolId>(editorTool);
  const editorBrushRadiusRef = useRef<number>(editorBrushRadius);
  const lightingPresetRef = useRef<LightingPresetKey>(lightingPreset);
  const cameraFovModeRef = useRef<'webgl35' | 'roblox18'>(cameraFovMode);

  const applyLightingRef = useRef<((preset: LightingPresetKey) => void) | null>(null);
  const applyFovModeRef = useRef<((mode: 'webgl35' | 'roblox18') => void) | null>(null);
  const applyPlayModeRef = useRef<((mode: PlayMode) => void) | null>(null);
  const resetArenaRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    playModeRef.current = playMode;
    if (applyPlayModeRef.current) {
      applyPlayModeRef.current(playMode);
    }
  }, [playMode]);

  useEffect(() => {
    editorToolRef.current = editorTool;
  }, [editorTool]);

  useEffect(() => {
    editorBrushRadiusRef.current = editorBrushRadius;
  }, [editorBrushRadius]);

  useEffect(() => {
    lightingPresetRef.current = lightingPreset;
    if (applyLightingRef.current) {
      applyLightingRef.current(lightingPreset);
    }
  }, [lightingPreset]);

  useEffect(() => {
    cameraFovModeRef.current = cameraFovMode;
    if (applyFovModeRef.current) {
      applyFovModeRef.current(cameraFovMode);
    }
  }, [cameraFovMode]);

  useEffect(() => {
    if (resetTrigger > 0 && resetArenaRef.current) {
      resetArenaRef.current();
    }
  }, [resetTrigger]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Renderer & Software-WebGL Adaptation
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });

    const gl = renderer.getContext();
    const debugRenderInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererName = debugRenderInfo
      ? String(gl.getParameter(debugRenderInfo.UNMASKED_RENDERER_WEBGL) || '')
      : '';
    const isSoftwareGl = /SwiftShader|llvmpipe|Software|Mesa OffScreen/i.test(rendererName);

    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    // Enable real-time shadow maps so tree canopies, Lyo Tank, Lyo Plane, and spinning turbine.glb blades cast crisp shadows!
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;

    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Direct 60 FPS DOM Overlay for Contextual Floating Prompts (Static Anchor, No Bobbing, No Jitter, Zero React Re-render)
    const promptOverlay = document.createElement('div');
    promptOverlay.setAttribute('aria-label', 'Contextual 3D Floating Prompts Direct DOM');
    promptOverlay.style.position = 'fixed';
    promptOverlay.style.inset = '0';
    promptOverlay.style.pointerEvents = 'none';
    promptOverlay.style.zIndex = '25';
    promptOverlay.style.overflow = 'hidden';
    container.appendChild(promptOverlay);

    const createPromptButton = (htmlContent: string, title: string, actionDetail?: string) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.tabIndex = -1;
      btn.title = title;
      btn.setAttribute('aria-label', title);
      btn.style.position = 'absolute';
      btn.style.left = '0px';
      btn.style.top = '0px';
      btn.style.margin = '0';
      btn.style.padding = '0';
      btn.style.border = 'none';
      btn.style.background = 'transparent';
      btn.style.outline = 'none';
      btn.style.cursor = 'pointer';
      btn.style.pointerEvents = 'auto';
      btn.style.userSelect = 'none';
      btn.style.display = 'none';
      btn.style.willChange = 'transform';
      btn.style.transition = 'none';
      btn.innerHTML = htmlContent;
      if (actionDetail) {
        btn.onclick = (e) => {
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('buddy-action', { detail: actionDetail }));
        };
      }
      promptOverlay.appendChild(btn);
      return btn;
    };

    const POLYGON_ICON_HTML = `<svg viewBox="0 0 64 64" style="width:24px; height:24px; filter:drop-shadow(0 1.5px 3px rgba(0,0,0,0.35)); display:block; pointer-events:none;" aria-hidden="true"><polygon points="15,10 46,5 60,22 60,48 45,60 18,57 5,40" fill="#ffffff" /><polygon points="18,14 45,9 57,24 57,46 44,56 20,53 9,39" fill="#14161d" /><polygon points="22,20 44,16 54,27 54,44 43,53 22,50 14,38" fill="#ffffff" /><circle cx="34.5" cy="34.5" r="7.5" fill="#14161d" /></svg>`;
    const HAND_ICON_HTML = `<span style="font-size:18px; line-height:1; filter:drop-shadow(0 1.5px 0 #14161d) drop-shadow(0 0 1px #ffffff); display:inline-block; user-select:none; pointer-events:none;">✋</span>`;

    const kioskPromptBtn = createPromptButton(POLYGON_ICON_HTML, 'KIOSK [B]');
    kioskPromptBtn.onclick = (e) => {
      e.stopPropagation();
      soundEngine.playUiClick();
      emitHudImmediately();
      window.dispatchEvent(new CustomEvent('toggle-kiosk-ui'));
    };
    const cratePromptBtn = createPromptButton(HAND_ICON_HTML, 'AMBIL [E]', 'pickupOrThrow');
    const padCraftPromptBtn = createPromptButton(POLYGON_ICON_HTML, 'TENDANG BATAL [F]', 'kickOrCraft');
    const padDepositPromptBtn = createPromptButton(HAND_ICON_HTML, 'ISI PAD [E]', 'pickupOrThrow');

    let isKioskPromptActive = false;
    let activeCratePromptId: number | null = null;
    let isPadCraftPromptActive = false;
    let isPadDepositPromptActive = false;
    let isKioskModalOpenCanvas = false;

    const onKioskUiToggled = () => { isKioskModalOpenCanvas = !isKioskModalOpenCanvas; };
    const onKioskUiClosed = () => { isKioskModalOpenCanvas = false; };
    window.addEventListener('toggle-kiosk-ui', onKioskUiToggled);
    window.addEventListener('close-kiosk-ui', onKioskUiClosed);
    let updateDirectDomPrompts: () => void = () => {};

    // 2. Scene, Camera & Authentic Long Hoang (Lyo) Warm Afternoon Sun Lighting
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#8cdcf0');
    scene.fog = new THREE.FogExp2('#8cdcf0', 0.0012);

    const camera = new THREE.PerspectiveCamera(
      REA_CONSTANTS.camera.fov,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      REA_CONSTANTS.camera.near,
      REA_CONSTANTS.camera.far,
    );

    const hemiLight = new THREE.HemisphereLight('#fffdf0', '#3d7068', 1.2);
    scene.add(hemiLight);

    // Extracted Lyo Sun Spherical Angles: phi = 0.63, theta = 0.72, radius = 50 -> warm afternoon light (#ffe6b1)
    const lyoSunOffset = getLyoDefaultLightDirection().multiplyScalar(52);
    const dirLight = new THREE.DirectionalLight('#ffe6b1', 2.05);
    dirLight.position.copy(lyoSunOffset);
    dirLight.castShadow = true;
    const shadowMapRes = isSoftwareGl ? 1024 : 2048;
    dirLight.shadow.mapSize.set(shadowMapRes, shadowMapRes);
    const d = 54;
    dirLight.shadow.camera.near = 2;
    dirLight.shadow.camera.far = 160;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0004;
    scene.add(dirLight);
    scene.add(dirLight.target);

    const applyLightingPreset = (presetKey: LightingPresetKey) => {
      if (presetKey === 'day') {
        dirLight.color.set('#ffe6b1');
        dirLight.intensity = 2.05;
        hemiLight.color.set('#fffdf0');
        hemiLight.groundColor.set('#3d7068');
        scene.background = new THREE.Color('#8cdcf0');
        if (scene.fog instanceof THREE.FogExp2) {
          scene.fog.color.set('#8cdcf0');
          scene.fog.density = 0.0011;
        }
        return;
      }
      const p = LIGHTING_PRESETS[presetKey] || LIGHTING_PRESETS.day;
      dirLight.color.set(p.lightColor);
      dirLight.intensity = p.lightIntensity;
      hemiLight.groundColor.set(p.shadowColor);
      hemiLight.color.set(p.revealColor);
      const bgCol = new THREE.Color(p.shadowColor).lerp(new THREE.Color(p.fogColorA), 0.35);
      scene.background = bgCol;
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.copy(bgCol);
      }
    };
    applyLightingRef.current = applyLightingPreset;
    applyLightingPreset(lightingPresetRef.current);

    const applyFovMode = (mode: 'webgl35' | 'roblox18') => {
      camera.fov = mode === 'roblox18' ? REA_CONSTANTS.camera.robloxPseudoOrthoFov : REA_CONSTANTS.camera.fov;
      camera.updateProjectionMatrix();
    };
    applyFovModeRef.current = applyFovMode;

    // 3. Cel-Shaded Materials & Hard Black Ink Outlines (#17110f)
    const toonSteps = new Uint8Array([105, 200, 255]);
    const toonGradientMap = new THREE.DataTexture(toonSteps, 3, 1, THREE.RedFormat);
    toonGradientMap.minFilter = THREE.NearestFilter;
    toonGradientMap.magFilter = THREE.NearestFilter;
    toonGradientMap.needsUpdate = true;

    const makeToonMat = (hex: number | string) =>
      new THREE.MeshToonMaterial({
        color: hex,
        gradientMap: toonGradientMap,
      });

    const inkOutlineMat = new THREE.MeshBasicMaterial({
      color: 0x12121e,
      side: THREE.BackSide,
    });
    const flashWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const frozenIceMat = makeToonMat(0x80e5ff);

    const matDirtBorder = makeToonMat('#c28348');
    const matRedCrate = makeToonMat('#ff3b30');
    const matSuperCrate = makeToonMat('#00d2ff');
    const matLegendCrate = makeToonMat('#ffd700');
    const matSilverMetallicCrate = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.92,
      roughness: 0.14,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.18,
    });
    const matGoldMetallicCrate = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.94,
      roughness: 0.12,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.24,
    });
    const getCrateFallbackMaterial = (kind: WorldCrateKind): THREE.Material =>
      kind === 'medical'
        ? matWhite
        : kind === 'gold_metallic'
          ? matGoldMetallicCrate
          : kind === 'silver_metallic'
            ? matSilverMetallicCrate
            : kind === 'legend'
              ? matLegendCrate
              : kind === 'super'
                ? matSuperCrate
                : matRedCrate;
    const matBlueTeam = makeToonMat('#2979ff');
    const matRedTeam = makeToonMat('#ff3b30');
    const matTankHighlight = makeToonMat('#b8ff3c');
    const matYellow = makeToonMat('#ffbe18');
    const matDarkSteel = makeToonMat('#222533');
    const matWhite = makeToonMat('#faf7f5');
    const matSkin = makeToonMat('#ffd19a');

    const addOutlinedPart = (
      parent: THREE.Object3D,
      geo: THREE.BufferGeometry,
      mat: THREE.Material,
      pos: [number, number, number],
      rot: [number, number, number] = [0, 0, 0],
      outlineScale = 1.08,
      castShadow = true,
    ): THREE.Mesh => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos[0], pos[1], pos[2]);
      mesh.rotation.set(rot[0], rot[1], rot[2]);
      mesh.frustumCulled = true;
      mesh.castShadow = castShadow;
      mesh.receiveShadow = true;
      mesh.userData.baseMaterial = mat;

      const outline = new THREE.Mesh(geo, inkOutlineMat);
      outline.scale.setScalar(outlineScale);
      outline.frustumCulled = true;
      mesh.add(outline);

      parent.add(mesh);
      return mesh;
    };

    const shadowDiscGeo = new THREE.CircleGeometry(1.1, 18);
    shadowDiscGeo.rotateX(-Math.PI / 2);
    const shadowDiscMat = new THREE.MeshBasicMaterial({
      color: 0x12121e,
      transparent: true,
      opacity: 0.0,
      visible: false,
      depthWrite: false,
    });

    // =========================================================================
    // 4. TOLAN'S WORLD CURVED PLANET ENVIRONMENT, PONDS, FLORA & SKY SUNBEAMS
    // =========================================================================
    const windUniforms: LyoWindUniforms = {
      uTime: { value: 0 },
      uWindPhase: { value: 0 },
      uWindDirection: { value: new THREE.Vector2(0.7071, 0.7071) },
      uWindStrength: { value: 0.32 },
      uWindGust: { value: 0.0 },
      uLightDirection: { value: getLyoDefaultLightDirection() },
      uLightColor: { value: new THREE.Color('#fff4c8') },
      uShadowColor: { value: new THREE.Color('#3b6e52') },
      uPlanetPivot: { value: new THREE.Vector3(0, 0, 12.5) },
      uCurvatureStrength: { value: PLANET_CURVATURE_STRENGTH },
    };

    const tolanPlanetEnv = createTolanCurvedPlanetEnvironment(scene, windUniforms, isSoftwareGl);

    // 4A. Modern Urban Street Tram (100% Low-Floor LRV — 1 Rangkaian 2 Gerbong) circulating the road network
    const cityTram = createProceduralCityTramConsist(scene, windUniforms, isSoftwareGl);
    let cityTramDistance = 328.0; // Starts entering the South Collector Road curve right in front of Blue Base!
    cityTram.update(cityTramDistance, 0, 0, 0, 0);

    // Drop Zone Circles removed ("oh ya drop box itu random di area warzone hapus saja lingkaran dropzone itu")
    const buildDropZonePad = (x: number, z: number, _colorMat: THREE.Material) => {
      const g = new THREE.Group();
      g.position.set(x, 0.06, z);
      g.visible = false;
      return g;
    };
    const centerDropZoneGroup = buildDropZonePad(0, 0, matRedCrate);
    const westSuperDropZoneGroup = buildDropZonePad(-53.5, 0.0, matSuperCrate);
    const eastSuperDropZoneGroup = buildDropZonePad(60.0, 0.0, matSuperCrate);

    // 4A-2. Dynamic Supply Drop Ground Beacon Ring (Central Oasis & Harbor Dock)
    const supplyDropBeaconGroup = new THREE.Group();
    const supplyBeaconOuterRingGeo = new THREE.RingGeometry(3.4, 4.1, 36);
    supplyBeaconOuterRingGeo.rotateX(-Math.PI / 2);
    const supplyBeaconOuterRingMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const supplyBeaconOuterRing = new THREE.Mesh(supplyBeaconOuterRingGeo, supplyBeaconOuterRingMat);
    supplyDropBeaconGroup.add(supplyBeaconOuterRing);

    const supplyBeaconInnerDiscGeo = new THREE.RingGeometry(1.1, 1.55, 28);
    supplyBeaconInnerDiscGeo.rotateX(-Math.PI / 2);
    const supplyBeaconInnerDiscMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const supplyBeaconInnerRing = new THREE.Mesh(supplyBeaconInnerDiscGeo, supplyBeaconInnerDiscMat);
    supplyDropBeaconGroup.add(supplyBeaconInnerRing);

    const supplyBeaconBeamGeo = new THREE.CylinderGeometry(0.32, 1.25, 16.0, 16, 1, true);
    const supplyBeaconBeamMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.26,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const supplyBeaconBeam = new THREE.Mesh(supplyBeaconBeamGeo, supplyBeaconBeamMat);
    supplyBeaconBeam.position.y = 8.0;
    supplyDropBeaconGroup.add(supplyBeaconBeam);
    supplyDropBeaconGroup.visible = false;
    scene.add(supplyDropBeaconGroup);

    // =========================================================================
    // 4B. CURVED PLANET INFINITE GRASS + FLOATING DANDELION SEEDS SHADER
    // =========================================================================
    const lyoGrassSystem = createLyoInfiniteGrassSystem(scene, windUniforms, isSoftwareGl);
    let loadedLyoAssets: LoadedLyoAssets | null = null;
    const realPropsGroup = new THREE.Group();
    realPropsGroup.name = 'RealLyoFactoryProps';
    scene.add(realPropsGroup);

    // 3D Map Editor Placement Cursor Ring on Ground
    const editorCursorGroup = new THREE.Group();
    editorCursorGroup.name = 'MapEditorCursor';
    editorCursorGroup.visible = playModeRef.current === 'editor';
    const cursorOuterRing = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 1.85, 28),
      new THREE.MeshBasicMaterial({ color: 0xb4ff39, side: THREE.DoubleSide }),
    );
    cursorOuterRing.rotation.x = -Math.PI / 2;
    cursorOuterRing.position.y = 0.12;
    editorCursorGroup.add(cursorOuterRing);

    const cursorDirArrow = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.18, 1.9),
      new THREE.MeshBasicMaterial({ color: 0x00d2ff }),
    );
    cursorDirArrow.position.set(0, 0.16, 0.95);
    editorCursorGroup.add(cursorDirArrow);
    scene.add(editorCursorGroup);

    // =========================================================================
    // 5. TWO 1:1 SYMMETRIC 4-PLOT BASE COMPLEXES (BLUE SOUTH vs RED NORTH)
    //    + COMPACT 4-COLUMN (2x2) STACKING PAD IN EACH INDIVIDUAL BASE PLOT
    // =========================================================================
    const buildSingleStackingPadMesh = (
      team: 'blue' | 'red',
      padX: number,
      padZ: number,
      commanderIdx: number,
    ) => {
      const teamMat = team === 'blue' ? matBlueTeam : matRedTeam;
      const baseYaw = team === 'blue' ? 0 : Math.PI;
      const padGroup = new THREE.Group();
      padGroup.position.set(padX, 0.04, padZ);
      padGroup.rotation.y = baseYaw;
      scene.add(padGroup);

      // Compact 4.2m x 4.2m 4-Column (2x2) Stacking Pad ("buat ini kembali 4 kolom saja agar tidak banyak makan tempat di base")
      const padStaticGroup = new THREE.Group();
      padGroup.add(padStaticGroup);
      addOutlinedPart(padStaticGroup, new THREE.BoxGeometry(4.2, 0.18, 4.2), matDarkSteel, [0, 0.09, 0], [0, 0, 0], 1.05, false);

      const tileOffsets: [number, number][] = [
        [-0.95, -0.95],
        [0.95, -0.95],
        [-0.95, 0.95],
        [0.95, 0.95],
      ];
      tileOffsets.forEach(([tx, tz]) => {
        const tile = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 1.7), teamMat);
        tile.position.set(tx, 0.24, tz);
        padStaticGroup.add(tile);
        const arrow = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.85), matWhite);
        arrow.position.set(tx, 0.28, tz);
        padStaticGroup.add(arrow);
      });

      // 1:1 KAI Self-Service Ticketing Kiosk + Digital Luggage Scale Platform placed flush against the perimeter fence
      // with generous clear distance from the Crate Pad so placing crates is unobstructed!
      bakeStaticGroupMeshes(padStaticGroup);

      const kioskMesh = buildSelfServiceTacticalKioskMesh(windUniforms, isSoftwareGl);
      kioskMesh.position.set(1.22, 0.0, -6.48);
      kioskMesh.rotation.y = -Math.PI / 2;
      padGroup.add(kioskMesh);
      padGroup.updateMatrixWorld(true);

      const mergedCage = new THREE.Mesh(
        new THREE.BoxGeometry(3.85, 2.95, 3.85),
        new THREE.MeshBasicMaterial({ color: 0xb4ff39, wireframe: true, transparent: true, opacity: 0.7 }),
      );
      mergedCage.position.set(0, 1.65, 0);
      mergedCage.visible = false;
      padGroup.add(mergedCage);

      const ghostPatternBox = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({
          color: 0x00d2ff,
          wireframe: true,
          transparent: true,
          opacity: 0.85,
        }),
      );
      ghostPatternBox.visible = team === 'blue' && commanderIdx === 0;
      padGroup.add(ghostPatternBox);

      const slotMeshes: THREE.Group[] = [];
      const ghostSlotMeshes: THREE.Mesh[] = [];
      const slotGeo = new THREE.BoxGeometry(
        UNIFIED_WORLD_CRATE_SIZE,
        UNIFIED_WORLD_CRATE_SIZE,
        UNIFIED_WORLD_CRATE_SIZE,
      );
      const ghostSlotGeo = new THREE.BoxGeometry(
        UNIFIED_WORLD_CRATE_SIZE,
        UNIFIED_WORLD_CRATE_SIZE,
        UNIFIED_WORLD_CRATE_SIZE,
      );
      const ghostCoreGeo = new THREE.BoxGeometry(
        UNIFIED_WORLD_CRATE_SIZE - 0.08,
        UNIFIED_WORLD_CRATE_SIZE - 0.08,
        UNIFIED_WORLD_CRATE_SIZE - 0.08,
      );

      for (let i = 0; i < 8; i++) {
        const layer = i < 4 ? 0 : 1;
        const [tx, tz] = tileOffsets[i % 4];
        const slotY = 0.93 + layer * UNIFIED_WORLD_CRATE_SIZE;
        const slotGrp = new THREE.Group();
        slotGrp.position.set(tx, slotY, tz);
        slotGrp.visible = false;
        addOutlinedPart(slotGrp, slotGeo, matRedCrate, [0, 0, 0], [0, 0, 0], 1.07, true);
        populateRealLyoCrateBoxFromGlb(
          slotGrp,
          'red',
          loadedLyoAssets,
          windUniforms,
          isSoftwareGl,
          UNIFIED_WORLD_CRATE_SIZE,
        );
        padGroup.add(slotGrp);
        slotMeshes.push(slotGrp);

        // Each hologram slot has its own independent wireframe material + translucent glowing core
        // so the Crate Pad can display multi-color crate combinations (Red / Blue / Gold)!
        const slotWireMat = new THREE.MeshBasicMaterial({
          color: 0xff4d3d,
          wireframe: true,
          transparent: true,
          opacity: 0.88,
        });
        const slotCoreMat = new THREE.MeshBasicMaterial({
          color: 0xff4d3d,
          transparent: true,
          opacity: 0.22,
          depthWrite: false,
        });
        const gm = new THREE.Mesh(ghostSlotGeo, slotWireMat);
        gm.position.set(tx, slotY, tz);
        gm.visible = false;
        const coreMesh = new THREE.Mesh(ghostCoreGeo, slotCoreMat);
        gm.add(coreMesh);
        gm.userData.coreMat = slotCoreMat;
        padGroup.add(gm);
        ghostSlotMeshes.push(gm);
      }

      const padSign = createBillboardSign(5.4, 1.35);
      padSign.sprite.position.set(0, 4.5, 0);
      padGroup.add(padSign.sprite);

      const kioskHoloSign = createBillboardSign(3.6, 0.98);
      kioskHoloSign.sprite.position.set(-0.65, 4.35, 0.28);
      kioskMesh.add(kioskHoloSign.sprite);

      return {
        commanderIdx,
        padGroup,
        kioskMesh,
        kioskHoloSign,
        padX,
        padZ,
        worldX: padX,
        worldZ: padZ,
        slotMeshes,
        ghostSlotMeshes,
        ghostPatternBox,
        mergedCage,
        padSign,
      };
    };

    const buildBaseHqAndPad = (team: 'blue' | 'red', hqX: number, hqZ: number, _padX: number, _padZ: number) => {
      const sign = team === 'blue' ? 1 : -1;
      const baseYaw = team === 'blue' ? Math.PI / 2 : -Math.PI / 2;
      const baseGroup = new THREE.Group();
      baseGroup.position.set(hqX, 0, hqZ);
      baseGroup.rotation.y = baseYaw;
      scene.add(baseGroup);

      buildMilitaryBaseMasterplan(baseGroup, team, windUniforms, isSoftwareGl);

      const hpSign = createBillboardSign(5.5, 1.35);
      hpSign.sprite.position.set(-1.8, 8.8, -1.2);
      baseGroup.add(hpSign.sprite);

      // Build 4 Compact 2x2 Stacking Pads (Pad P1..P4) flush against the right fence (relZ = +7.3) of the 4 Individual Base Plots at x = sign * [-37.7, -7.7, +22.3, +52.3], z = sign * 77.8
      const padOffsetsX = [-37.7, -7.7, 22.3, 52.3];
      const commanderPads = padOffsetsX.map((ox, idx) =>
        buildSingleStackingPadMesh(team, hqX + sign * ox, hqZ - sign * 8.2, idx),
      );
      const primaryPad = commanderPads[0];

      return {
        baseGroup,
        hpSign,
        commanderPads,
        padGroup: primaryPad.padGroup,
        kioskMesh: primaryPad.kioskMesh,
        hqX,
        hqZ,
        padX: primaryPad.padX,
        padZ: primaryPad.padZ,
        slotMeshes: primaryPad.slotMeshes,
        ghostSlotMeshes: primaryPad.ghostSlotMeshes,
        ghostPatternBox: primaryPad.ghostPatternBox,
        mergedCage: primaryPad.mergedCage,
        padSign: primaryPad.padSign,
      };
    };

    const blueBase = buildBaseHqAndPad('blue', 0.0, 86.0, -37.7, 77.8);
    const redBase = buildBaseHqAndPad('red', 0.0, -86.0, 37.7, -77.8);

    const INTERACT_ENTER_RADIUS = 2.6;
    const INTERACT_EXIT_RADIUS = 2.9;
    const scratchKioskWorldPos = new THREE.Vector3();
    const getBlueKioskWorldCenter = (padIdx = 0): THREE.Vector3 => {
      const pad = blueBase.commanderPads[padIdx] ?? blueBase.commanderPads[0];
      pad.kioskMesh.updateWorldMatrix(true, false);
      return pad.kioskMesh.getWorldPosition(scratchKioskWorldPos);
    };

    // =========================================================================
    // 6. MAP LAYOUT STATE & REAL .GLB PROP / TREE BUILDER (8-10 UNIT TALL TREES!)
    // =========================================================================
    const loadSavedLayout = (): ArenaMapLayout => loadSavedArenaLayout();

    let currentMapLayout: ArenaMapLayout = loadSavedLayout();
    const trees: DestructibleTree[] = [];
    const activeMapProps: ActiveMapPropPhysics[] = [];
    let navGridDirty = true;
    let cachedFootNavGrid: AStarNavGrid | null = null;
    let cachedVehicleNavGrid: AStarNavGrid | null = null;
    const collisionCooldownMap = new Map<string, number>();
    let nextEntityId = 500;
    let editorRotY = 0;
    let editorScale = 1.0;

    const registerMapPropPhysics = (prop: PlacedMapProp, wrapper: THREE.Group) => {
      const spec = getPropCollisionSpec(prop.kind, prop.scale);
      if (spec.category === 'none') return;
      activeMapProps.push({
        id: prop.id,
        kind: prop.kind,
        wrapper,
        x: prop.x,
        z: prop.z,
        vx: 0,
        vz: 0,
        rotY: prop.rotY,
        rotVelY: 0,
        scale: prop.scale,
        category: spec.category,
        materialTag: spec.materialTag,
        radius: spec.radius,
        halfX: spec.halfX,
        halfZ: spec.halfZ,
        heightY: getPropBaseHeight(prop.kind) * prop.scale,
        mass: spec.mass,
        restitution: spec.restitution,
        destructible: spec.destructible,
        hp: spec.maxHp,
        maxHp: spec.maxHp,
        shootImpulse: spec.shootImpulse,
        canJiggleOnHit: spec.canJiggleOnHit,
        alive: true,
        jiggleTimer: 0,
        jiggleDirX: 0,
        jiggleDirZ: 1,
      });
    };

    const spawnSingleMapProp = (prop: PlacedMapProp) => {
      if (prop.kind === 'tree_purple' || prop.kind === 'tree_gold') {
        const isPurple = prop.kind === 'tree_purple';
        const grp = new THREE.Group();
        grp.position.set(prop.x, 0, prop.z);
        grp.rotation.y = prop.rotY;
        grp.userData.baseRotY = prop.rotY;
        const shadow = new THREE.Mesh(shadowDiscGeo, shadowDiscMat);
        shadow.name = 'ContactShadowDisc';
        shadow.position.y = 0.02;
        shadow.scale.setScalar(2.35 * prop.scale);
        grp.add(shadow);
        scene.add(grp);

        populateRealLyoTreeFromGlb(
          grp,
          loadedLyoAssets
            ? isPurple
              ? loadedLyoAssets.tree1bGltf.scene
              : loadedLyoAssets.tree1aGltf.scene
            : null,
          isPurple,
          loadedLyoAssets ? loadedLyoAssets.treeFoliageTex : getSharedFallbackFoliageMaskTexture(),
          windUniforms,
          isSoftwareGl,
          prop.scale,
        );

        trees.push({
          id: nextEntityId++,
          propId: prop.id,
          isPurple,
          scale: prop.scale,
          mesh: grp,
          x: prop.x,
          z: prop.z,
          hp: 45,
          maxHp: 45,
          alive: true,
          hitFlashTimer: 0,
          jiggleTimer: 0,
          jiggleIntensity: 0,
          jiggleDirX: 0,
          jiggleDirZ: 1,
        });
        return;
      }

      if (prop.kind === 'river_rock') {
        const rockGrp = new THREE.Group();
        const sc = prop.scale;
        const stoneGeo = new THREE.SphereGeometry(0.68, 12, 10);
        const mainRock = new THREE.Mesh(
          stoneGeo,
          new THREE.MeshToonMaterial({ color: '#7b8d7e' }),
        );
        mainRock.scale.set(1.28 * sc, 0.74 * sc, 1.08 * sc);
        mainRock.position.y = 0.24 * sc;
        mainRock.frustumCulled = true;
        rockGrp.add(mainRock);

        const mossCap = new THREE.Mesh(
          stoneGeo,
          new THREE.MeshToonMaterial({ color: '#82cc59' }),
        );
        mossCap.scale.set(0.96 * sc, 0.4 * sc, 0.84 * sc);
        mossCap.position.set(0, 0.5 * sc, 0);
        mossCap.frustumCulled = true;
        rockGrp.add(mossCap);

        const sidePebble = new THREE.Mesh(
          stoneGeo,
          new THREE.MeshToonMaterial({ color: '#5f7063' }),
        );
        sidePebble.scale.set(0.62 * sc, 0.46 * sc, 0.58 * sc);
        sidePebble.position.set(0.65 * sc, 0.14 * sc, 0.32 * sc);
        sidePebble.frustumCulled = true;
        rockGrp.add(sidePebble);

        bakeStaticGroupMeshes(rockGrp, { minShadowCasterSpan: 0.45 });
        rockGrp.position.set(prop.x, getTerrainElevation(prop.x, prop.z), prop.z);
        rockGrp.rotation.y = prop.rotY;
        rockGrp.userData.propId = prop.id;
        rockGrp.userData.worldX = prop.x;
        rockGrp.userData.worldZ = prop.z;
        rockGrp.userData.baseRotY = prop.rotY;
        realPropsGroup.add(rockGrp);
        registerMapPropPhysics(prop, rockGrp);
        return;
      }

      if (prop.kind === 'flower_cluster') {
        const cluster = new THREE.Group();
        const sc = prop.scale;
        const stemGeo = new THREE.CylinderGeometry(0.032, 0.038, 0.28, 5);
        const blossomGeo = new THREE.CylinderGeometry(0.2, 0.12, 0.08, 7);
        const centerGeo = new THREE.SphereGeometry(0.085, 6, 6);
        const stemMat = new THREE.MeshToonMaterial({ color: '#4ca854' });
        const centerMat = new THREE.MeshBasicMaterial({ color: '#fff6a1' });
        const colors = ['#2998ff', '#ffe033', '#ff70c6'];
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2;
          const rad = i === 0 ? 0.05 : 0.4 + (i % 2) * 0.24;
          const bx = Math.cos(ang) * rad;
          const bz = Math.sin(ang) * rad;
          const h = 0.24 + (i % 3) * 0.07;

          const stem = new THREE.Mesh(stemGeo, stemMat);
          stem.position.set(bx, h * 0.5, bz);
          stem.frustumCulled = true;
          cluster.add(stem);

          const head = new THREE.Mesh(
            blossomGeo,
            new THREE.MeshBasicMaterial({ color: colors[(prop.id + i) % colors.length] }),
          );
          head.position.set(bx, h, bz);
          head.frustumCulled = true;
          cluster.add(head);

          const center = new THREE.Mesh(centerGeo, centerMat);
          center.position.set(bx, h + 0.05, bz);
          center.frustumCulled = true;
          cluster.add(center);
        }
        bakeStaticGroupMeshes(cluster, { minShadowCasterSpan: 0.45 });
        cluster.scale.setScalar(sc);
        cluster.position.set(prop.x, getTerrainElevation(prop.x, prop.z), prop.z);
        cluster.rotation.y = prop.rotY;
        cluster.userData.propId = prop.id;
        cluster.userData.worldX = prop.x;
        cluster.userData.worldZ = prop.z;
        cluster.userData.baseRotY = prop.rotY;
        realPropsGroup.add(cluster);
        return;
      }

      // In Sandbox / Match mode, any 'dump_truck' placed on the map becomes a real drivable Dump Truck vehicle!
      if (prop.kind === 'dump_truck' && playModeRef.current !== 'editor') {
        const existingTruck = tanks.find(
          (v) => v.vehicleKind === 'truck' && (v.mapPropId === prop.id || Math.hypot(v.x - prop.x, v.z - prop.z) < 2.2),
        );
        if (!existingTruck) {
          const truckTeam = prop.x <= 0 ? 'blue' : 'red';
          const mapTruck = createLyoDumpTruckVehicle(prop.x, prop.z, truckTeam, prop.rotY);
          mapTruck.mapPropId = prop.id;
          tanks.push(mapTruck);
        }
        return;
      }

      if (!loadedLyoAssets) {
        const placeholderWrapper = new THREE.Group();
        placeholderWrapper.position.set(prop.x, 0, prop.z);
        placeholderWrapper.rotation.y = prop.rotY;
        placeholderWrapper.userData.propId = prop.id;
        placeholderWrapper.userData.worldX = prop.x;
        placeholderWrapper.userData.worldZ = prop.z;
        placeholderWrapper.userData.baseRotY = prop.rotY;
        realPropsGroup.add(placeholderWrapper);
        registerMapPropPhysics(prop, placeholderWrapper);
        return;
      }
      const gltfMap: Record<
        Exclude<PlacedMapProp['kind'], 'tree_purple' | 'tree_gold' | 'river_rock' | 'flower_cluster'>,
        typeof loadedLyoAssets.turbineGltf
      > = {
        turbine: loadedLyoAssets.turbineGltf,
        power_core: loadedLyoAssets.powerCoreGltf,
        concrete_fence: loadedLyoAssets.concreteFenceGltf,
        barricade: loadedLyoAssets.barricadeGltf,
        explosive_barrel: loadedLyoAssets.explosiveBarrelGltf,
        hydrant: loadedLyoAssets.hydrantGltf,
        lamppost_1a: loadedLyoAssets.lamppost1aGltf,
        lamppost_1b: loadedLyoAssets.lamppost1bGltf,
        bench: loadedLyoAssets.benchGltf,
        chimney: loadedLyoAssets.chimneyGltf,
        giant_tank: loadedLyoAssets.giantTankGltf,
        dump_truck: loadedLyoAssets.dumpTruckGltf,
        crane: loadedLyoAssets.craneGltf,
        recycle_bin: loadedLyoAssets.recycleBinGltf,
        traffic_cone: loadedLyoAssets.trafficConeGltf,
        wheelbarrow: loadedLyoAssets.wheelbarrowGltf,
        tank_1a: loadedLyoAssets.tank1aGltf,
        tank_1b: loadedLyoAssets.tank1bGltf,
        pipe_cluster: loadedLyoAssets.pipeCluster1aGltf,
        pipe_cluster_1b: loadedLyoAssets.pipeCluster1bGltf,
        giant_pipe: loadedLyoAssets.giantPipe1aGltf,
        giant_pipe_1b: loadedLyoAssets.giantPipe1bGltf,
        concrete_fence_1b: loadedLyoAssets.concreteFence1bGltf,
        concrete_pipe: loadedLyoAssets.concretePipeGltf,
        barrel_1c: loadedLyoAssets.barrel1cGltf,
        pallet_1a: loadedLyoAssets.pallet1aGltf,
        h_beam: loadedLyoAssets.hBeamGltf,
        forklift: loadedLyoAssets.forkliftGltf,
        fuel_cell: loadedLyoAssets.fuelGltf,
        circuit_module: loadedLyoAssets.circuitGltf,
      };
      const targetGltf = gltfMap[prop.kind];
      const baseH = getPropBaseHeight(prop.kind) * prop.scale;
      const wrapper = spawnRealLyoPropFromGlb(
        realPropsGroup,
        targetGltf,
        prop.x,
        prop.z,
        prop.rotY,
        baseH,
        windUniforms,
        isSoftwareGl,
      );
      if (wrapper) {
        wrapper.userData.propId = prop.id;
        wrapper.userData.worldX = prop.x;
        wrapper.userData.worldZ = prop.z;
        wrapper.userData.baseRotY = prop.rotY;
        registerMapPropPhysics(prop, wrapper);
      }
    };

    const rebuildMapFromLayout = (layout: ArenaMapLayout) => {
      // 1. Reposition Blue HQ, 4 Blue Stacking Pads, Red HQ, 4 Red Stacking Pads, and Central Drop Zone
      blueBase.hqX = layout.blueHq.x;
      blueBase.hqZ = layout.blueHq.z;
      blueBase.baseGroup.position.set(layout.blueHq.x, 0, layout.blueHq.z);
      blueBase.baseGroup.rotation.y = Math.PI / 2;

      const padOffsetsX = [-37.7, -7.7, 22.3, 52.3];
      blueBase.commanderPads.forEach((cp, idx) => {
        cp.padX = layout.blueHq.x + padOffsetsX[idx];
        cp.padZ = layout.blueHq.z - 8.2;
        cp.worldX = cp.padX;
        cp.worldZ = cp.padZ;
        cp.padGroup.position.set(cp.padX, 0.04, cp.padZ);
        cp.padGroup.rotation.y = 0;
      });
      blueBase.padX = blueBase.commanderPads[0].padX;
      blueBase.padZ = blueBase.commanderPads[0].padZ;

      redBase.hqX = layout.redHq.x;
      redBase.hqZ = layout.redHq.z;
      redBase.baseGroup.position.set(layout.redHq.x, 0, layout.redHq.z);
      redBase.baseGroup.rotation.y = -Math.PI / 2;

      redBase.commanderPads.forEach((cp, idx) => {
        cp.padX = layout.redHq.x - padOffsetsX[idx];
        cp.padZ = layout.redHq.z + 8.2;
        cp.worldX = cp.padX;
        cp.worldZ = cp.padZ;
        cp.padGroup.position.set(cp.padX, 0.04, cp.padZ);
        cp.padGroup.rotation.y = Math.PI;
      });
      redBase.padX = redBase.commanderPads[0].padX;
      redBase.padZ = redBase.commanderPads[0].padZ;

      centerDropZoneGroup.position.set(layout.centerDropZone.x, 0.06, layout.centerDropZone.z);

      // 2. Clear existing trees & props (and any unmounted map-prop dump trucks if in editor mode)
      trees.forEach((t) => scene.remove(t.mesh));
      trees.length = 0;
      activeMapProps.length = 0;
      for (let i = realPropsGroup.children.length - 1; i >= 0; i--) {
        realPropsGroup.remove(realPropsGroup.children[i]);
      }
      if (playModeRef.current === 'editor') {
        for (let i = tanks.length - 1; i >= 0; i--) {
          if (tanks[i].mapPropId !== undefined && tanks[i] !== mountedTank) {
            scene.remove(tanks[i].root);
            tanks.splice(i, 1);
          }
        }
      }

      // 3. Spawn all trees & props from layout
      layout.props.forEach((p) => spawnSingleMapProp(p));
      navGridDirty = true;
    };

    // =========================================================================
    // 7. BUILDER FOR CHIBI/BLOCKY TEAM BUDDIES CHARACTERS & REAL .GLB LYO TANKS
    // =========================================================================
    const createBuddyCharacterUnit = (
      team: 'blue' | 'red',
      isPlayer: boolean,
      classId: BuddyClassId,
      spawnX: number,
      spawnZ: number,
      ownerCommanderId = 0,
      startUnarmed = true,
      isStarterCommanderUnit = true,
    ): BuddyUnit => {
      const root = new THREE.Group();
      root.position.set(spawnX, 0, spawnZ);
      scene.add(root);

      const shadow = new THREE.Mesh(shadowDiscGeo, shadowDiscMat);
      shadow.position.y = 0.02;
      shadow.scale.setScalar(0.8);
      root.add(shadow);

      const ringMat = new THREE.MeshBasicMaterial({
        color: isPlayer ? 0xb4ff39 : team === 'blue' ? 0x2979ff : 0xff3b30,
      });
      const teamRing = new THREE.Mesh(new THREE.RingGeometry(0.68, 0.92, 24), ringMat);
      teamRing.rotation.x = -Math.PI / 2;
      teamRing.position.y = 0.04;
      root.add(teamRing);

      const bodyGroup = new THREE.Group();
      bodyGroup.scale.setScalar(1.16);
      root.add(bodyGroup);

      const rig = buildProceduralRobloxBuddyAvatar(
        bodyGroup,
        team,
        windUniforms,
        isSoftwareGl,
        false,
      );
      const {
        headMesh,
        leftArmPivot,
        rightArmPivot,
        leftLegPivot,
        rightLegPivot,
        weaponMesh,
      } = rig;
      headMesh.userData.defaultMat = headMesh.material;

      // Overhead Carried 3D Crate (visible when carrying a crate above the head; inverse-scaled by 1/1.16 so world size is 1:1 UNIFIED_WORLD_CRATE_SIZE!)
      const overheadCrateGroup = new THREE.Group();
      overheadCrateGroup.position.set(0, 2.58, 0);
      overheadCrateGroup.scale.setScalar(1 / 1.16);
      overheadCrateGroup.visible = false;
      bodyGroup.add(overheadCrateGroup);
      const overheadCrateBox = addOutlinedPart(
        overheadCrateGroup,
        new THREE.BoxGeometry(
          UNIFIED_WORLD_CRATE_SIZE,
          UNIFIED_WORLD_CRATE_SIZE,
          UNIFIED_WORLD_CRATE_SIZE,
        ),
        matRedCrate,
        [0, 0, 0],
      );
      populateRealLyoCrateBoxFromGlb(
        overheadCrateGroup,
        'red',
        loadedLyoAssets,
        windUniforms,
        isSoftwareGl,
        UNIFIED_WORLD_CRATE_SIZE,
      );

      // Overhead AI Salute Sign (pops up above AI Buddy head when [V] command is issued!)
      const saluteSign = createBillboardSign(3.4, 0.92);
      saluteSign.sprite.position.set(0, 3.1, 0);
      saluteSign.sprite.visible = false;
      root.add(saluteSign.sprite);

      const stunMesh = createLyoStunEffectMesh();
      stunMesh.position.set(0, 2.55, 0);
      bodyGroup.add(stunMesh);

      const initialWeaponId: LyoWeaponId = startUnarmed
        ? 'unarmed'
        : classId === 'Commando' || classId === 'Cyborg' || classId === 'SuperBuddie'
        ? 'bazooka'
        : classId === 'Infuntry' || classId === 'Stealthy'
        ? 'rifle'
        : 'pistol';
      const initialWeaponName =
        initialWeaponId === 'unarmed'
          ? 'Tangan Kosong (Tinju)'
          : initialWeaponId === 'bazooka'
          ? 'LyoRocketLauncher'
          : initialWeaponId === 'rifle'
          ? 'LyoAssaultRifle'
          : 'LyoPistol';
      const initialSecondaryItem: BuddySecondaryItemId = startUnarmed
        ? 'none'
        : classId === 'Stealthy' || classId === 'Ninja'
          ? 'land_mine'
          : 'hand_grenade';
      const initialSecondaryCount = initialSecondaryItem === 'none' ? 0 : 2;
      const initialAmmo = initialWeaponId === 'unarmed' ? 0 : initialWeaponId === 'bazooka' ? 18 : 120;
      const tacticalLoadout = createInitialBuddyTacticalLoadout(
        initialWeaponId,
        initialAmmo,
        initialSecondaryItem,
        initialSecondaryCount,
      );
      updateCharacterWeaponStance(rig, initialWeaponId, 0, false, false, 0, 0);

      return {
        id: nextEntityId++,
        team,
        ownerCommanderId,
        isStarterCommanderUnit,
        isPlayer,
        classId,
        root,
        bodyGroup,
        rig,
        headMesh,
        leftArmPivot,
        rightArmPivot,
        leftLegPivot,
        rightLegPivot,
        weaponMesh,
        overheadCrateGroup,
        overheadCrateBox,
        saluteSign,
        teamRing,
        x: spawnX,
        y: 0,
        z: spawnZ,
        vx: 0,
        vy: 0,
        vz: 0,
        jumpOffset: 0,
        isGrounded: true,
        jumpBufferTimer: 0,
        invincibilityTimer: 0,
        yaw: team === 'blue' ? Math.PI / 2 : -Math.PI / 2,
        hp: 30,
        maxHp: 30,
        weaponId: initialWeaponId,
        weaponName: initialWeaponName,
        weaponRecoil: 0,
        punchTimer: 0,
        punchHand: 'right',
        kickTimer: 0,
        ammo: initialAmmo,
        carryingCrate: 'none',
        secondaryItem: initialSecondaryItem,
        secondaryCount: initialSecondaryCount,
        tacticalLoadout,
        missionItem: 'none',
        walkCycle: 0,
        shootCooldown: 0,
        hitFlashTimer: 0,
        hitReactionTimer: 0,
        hitReactionDirX: 0,
        hitReactionDirZ: 1,
        stunTimer: 0,
        stunMesh,
        isFrozen: false,
        frozenTimer: 0,
        saluteTimer: 0,
        aiTargetCrateId: null,
        assignedRole: team === 'blue' && ownerCommanderId === 0 ? teamCommand : 'HARVEST',
        followerReactionTimer: 0,
        followerIdleLookTimer: 1.5,
        followerIdleLookYaw: team === 'blue' ? Math.PI / 2 : -Math.PI / 2,
        followerStrafeTimer: 0.8,
        followerStrafeSign: 1,
        alive: true,
        respawnTimer: 0,
      };
    };

    const createLyoTankVehicle = (spawnX: number, spawnZ: number, isSuper: boolean, team: 'blue' | 'red'): TankVehicle => {
      const root = new THREE.Group();
      root.position.set(spawnX, 0, spawnZ);
      scene.add(root);

      const tankScale = isSuper ? 2.75 : 2.45;
      const shadow = new THREE.Mesh(shadowDiscGeo, shadowDiscMat);
      shadow.position.y = 0.02;
      shadow.scale.set(3.4, 3.0, 1);
      root.add(shadow);

      const bodyGroup = new THREE.Group();
      root.add(bodyGroup);

      const stunMesh = createLyoStunEffectMesh();
      stunMesh.position.set(0, 2.95, 0);
      bodyGroup.add(stunMesh);

      const turretGroup = new THREE.Group();
      turretGroup.position.set(-0.03 * tankScale, 0.82 * tankScale, 0);
      bodyGroup.add(turretGroup);

      // Open-Top Rider Mesh (Visible ONLY when a Buddy is mounted inside the Tank!)
      const riderGroup = new THREE.Group();
      riderGroup.visible = false;
      turretGroup.add(riderGroup);
      const tankRiderAvatar = new THREE.Group();
      tankRiderAvatar.position.set(-0.12, -0.24, 0);
      tankRiderAvatar.rotation.y = Math.PI / 2;
      tankRiderAvatar.scale.setScalar(0.86);
      riderGroup.add(tankRiderAvatar);
      buildProceduralRobloxBuddyAvatar(tankRiderAvatar, team, windUniforms, isSoftwareGl, true);

      const barrelGroup = new THREE.Group();
      barrelGroup.position.set(1.15 * tankScale, 0.21 * tankScale, 0);
      turretGroup.add(barrelGroup);

      const muzzleFlash = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xb8ff3c }),
      );
      muzzleFlash.position.set(0.28 * tankScale, 0.04 * tankScale, 0);
      muzzleFlash.visible = false;
      barrelGroup.add(muzzleFlash);

      // Populate immediately from real player.glb + player-track.json if loaded
      if (loadedLyoAssets) {
        populateRealLyoTankFromGlb(
          bodyGroup,
          turretGroup,
          barrelGroup,
          riderGroup,
          muzzleFlash,
          loadedLyoAssets.playerGltf.scene,
          loadedLyoAssets.playerTrackPoints,
          windUniforms,
          isSuper,
          isSoftwareGl,
        );
      }

      return {
        id: nextEntityId++,
        vehicleKind: 'tank',
        isSuper,
        team,
        root,
        bodyGroup,
        turretGroup,
        barrelGroup,
        riderGroup,
        muzzleFlash,
        x: spawnX,
        z: spawnZ,
        vx: 0,
        vz: 0,
        hullYaw: -Math.PI / 2,
        turretYaw: -Math.PI / 2,
        currentDriveSpeed: REA_CONSTANTS.physics.drive.speed,
        recoilTimer: 0,
        hp: isSuper ? 60 : 40,
        maxHp: isSuper ? 60 : 40,
        storedCrates: [],
        occupiedByPlayer: false,
        occupiedByAiId: null,
        hitFlashTimer: 0,
        hitReactionTimer: 0,
        hitReactionDirX: 0,
        hitReactionDirZ: 1,
        stunTimer: 0,
        stunMesh,
        lowHpSmokeTimer: 0,
      };
    };

    const createLyoPlaneVehicle = (spawnX: number, spawnZ: number, team: 'blue' | 'red'): TankVehicle => {
      const root = new THREE.Group();
      root.position.set(spawnX, 0, spawnZ);
      scene.add(root);

      const shadow = new THREE.Mesh(shadowDiscGeo, shadowDiscMat);
      shadow.name = 'ContactShadowDisc';
      shadow.position.y = 0.02;
      shadow.scale.set(3.6, 3.2, 1);
      root.add(shadow);

      const bodyGroup = new THREE.Group();
      root.add(bodyGroup);

      const stunMesh = createLyoStunEffectMesh();
      stunMesh.position.set(0, 2.45, 0);
      bodyGroup.add(stunMesh);

      const turretGroup = new THREE.Group();
      bodyGroup.add(turretGroup);

      // Open-Cockpit Pilot Rider Mesh (Visible when a Buddy is piloting the LyoPlane!)
      const riderGroup = new THREE.Group();
      riderGroup.visible = false;
      turretGroup.add(riderGroup);
      const planeRiderAvatar = new THREE.Group();
      planeRiderAvatar.position.set(-0.12, -0.22, 0);
      planeRiderAvatar.rotation.y = Math.PI / 2;
      planeRiderAvatar.scale.setScalar(0.84);
      riderGroup.add(planeRiderAvatar);
      buildProceduralRobloxBuddyAvatar(planeRiderAvatar, team, windUniforms, isSoftwareGl, true);

      const barrelGroup = new THREE.Group();
      turretGroup.add(barrelGroup);

      const muzzleFlash = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xb8ff3c }),
      );
      muzzleFlash.visible = false;
      barrelGroup.add(muzzleFlash);

      buildProceduralLyoPlane(
        bodyGroup,
        turretGroup,
        barrelGroup,
        riderGroup,
        muzzleFlash,
        windUniforms,
        isSoftwareGl,
      );
      // Initialize plane parked on the ground (altitude = 0) facing NORTH (+Math.PI / 2) up the road!
      bodyGroup.rotation.y = Math.PI / 2;
      stepLyoPlaneAnimation(bodyGroup, 0.016, 0, 0, 0, false, 0, 0);

      return {
        id: nextEntityId++,
        vehicleKind: 'plane',
        isSuper: false,
        team,
        root,
        bodyGroup,
        turretGroup,
        barrelGroup,
        riderGroup,
        muzzleFlash,
        x: spawnX,
        z: spawnZ,
        vx: 0,
        vz: 0,
        hullYaw: Math.PI / 2,
        turretYaw: 0,
        currentDriveSpeed: REA_CONSTANTS.physics.drive.speed * 1.35,
        altitude: 0,
        targetAltitude: 0,
        verticalSpeed: 0,
        forwardSpeed: 0,
        recoilTimer: 0,
        hp: 50,
        maxHp: 50,
        storedCrates: [],
        occupiedByPlayer: false,
        occupiedByAiId: null,
        hitFlashTimer: 0,
        hitReactionTimer: 0,
        hitReactionDirX: 0,
        hitReactionDirZ: 1,
        stunTimer: 0,
        stunMesh,
        lowHpSmokeTimer: 0,
      };
    };

    const createLyoDumpTruckVehicle = (
      spawnX: number,
      spawnZ: number,
      team: 'blue' | 'red',
      initialYaw = 0.65,
    ): TankVehicle => {
      const root = new THREE.Group();
      root.position.set(spawnX, getTerrainElevation(spawnX, spawnZ), spawnZ);
      scene.add(root);

      const shadow = new THREE.Mesh(shadowDiscGeo, shadowDiscMat);
      shadow.name = 'ContactShadowDisc';
      shadow.position.y = 0.02;
      shadow.scale.set(3.8, 2.8, 1);
      root.add(shadow);

      const bodyGroup = new THREE.Group();
      bodyGroup.rotation.y = initialYaw;
      root.add(bodyGroup);

      const stunMesh = createLyoStunEffectMesh();
      stunMesh.position.set(0, 3.15, 0);
      bodyGroup.add(stunMesh);

      const turretGroup = new THREE.Group();
      bodyGroup.add(turretGroup);

      // Hidden Driver Container inside the HT-88 Dump Truck Cab (driver is never visible inside the enclosed cab so the head never clips through the roof)
      const riderGroup = new THREE.Group();
      riderGroup.visible = false;
      turretGroup.add(riderGroup);

      const barrelGroup = new THREE.Group();
      turretGroup.add(barrelGroup);

      const muzzleFlash = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xb8ff3c }),
      );
      muzzleFlash.visible = false;
      barrelGroup.add(muzzleFlash);

      populateRealLyoDumpTruckFromGlb(
        bodyGroup,
        turretGroup,
        riderGroup,
        loadedLyoAssets,
        windUniforms,
        isSoftwareGl,
      );
      syncLyoDumpTruckCargoVisuals(bodyGroup, []);

      return {
        id: nextEntityId++,
        vehicleKind: 'truck',
        isSuper: false,
        team,
        root,
        bodyGroup,
        turretGroup,
        barrelGroup,
        riderGroup,
        muzzleFlash,
        x: spawnX,
        z: spawnZ,
        vx: 0,
        vz: 0,
        hullYaw: initialYaw,
        turretYaw: 0,
        currentDriveSpeed: REA_CONSTANTS.physics.drive.speed * 1.04,
        dumpAnimTimer: 0,
        dumpReleasedInCycle: false,
        dumpTargetMode: 'ground',
        recoilTimer: 0,
        hp: 55,
        maxHp: 55,
        storedCrates: [],
        occupiedByPlayer: false,
        occupiedByAiId: null,
        hitFlashTimer: 0,
        hitReactionTimer: 0,
        hitReactionDirX: 0,
        hitReactionDirZ: 1,
        stunTimer: 0,
        stunMesh,
        lowHpSmokeTimer: 0,
      };
    };

    // =========================================================================
    // 8. WORLD STATE: CRATES, PICKUPS, BUDDIES, TANKS, BASE HP & STACKING PADS
    // =========================================================================
    const worldCrates: WorldCrate[] = [];
    const worldPickups: WorldPickup[] = [];
    const buddyUnits: BuddyUnit[] = [];
    const tanks: TankVehicle[] = [];

    rebuildMapFromLayout(currentMapLayout);

    // Load all real extracted Lyo .glb models & .ktx2 textures via GLTFLoader + DRACOLoader + KTX2Loader
    let isDisposed = false;
    loadAllRealLyoAssets(renderer)
      .then((assets) => {
        if (isDisposed) return;
        loadedLyoAssets = assets;
        document.body.dataset.assetsLoaded = 'true';

        // 1. Rebuild all trees (8-10 units tall with lush canopies), courtyard garden trees & real .glb props from currentMapLayout
        rebuildMapFromLayout(currentMapLayout);
        populateMilitaryBaseGardenTreesFromGlb(blueBase.baseGroup, assets, windUniforms, isSoftwareGl);
        populateMilitaryBaseGardenTreesFromGlb(redBase.baseGroup, assets, windUniforms, isSoftwareGl);

        // 2. Populate any active Tanks & Dump Trucks with real player.glb or dump-truck.glb (without concrete pipes!)
        tanks.forEach((t) => {
          if (t.vehicleKind === 'plane') return;
          if (t.vehicleKind === 'truck') {
            populateRealLyoDumpTruckFromGlb(
              t.bodyGroup,
              t.turretGroup,
              t.riderGroup,
              assets,
              windUniforms,
              isSoftwareGl,
            );
            syncLyoDumpTruckCargoVisuals(t.bodyGroup, t.storedCrates);
            return;
          }
          populateRealLyoTankFromGlb(
            t.bodyGroup,
            t.turretGroup,
            t.barrelGroup,
            t.riderGroup,
            t.muzzleFlash,
            assets.playerGltf.scene,
            assets.playerTrackPoints,
            windUniforms,
            t.isSuper,
            isSoftwareGl,
          );
        });

        // 3. Populate all active Dropped Crates, Overhead Carried Crates, and Pad Slots with real Long Hoang wooden-box.glb & metal-box-1a.glb!
        worldCrates.forEach((c) => {
          populateRealLyoCrateBoxFromGlb(
            c.boxVisualGroup,
            c.kind,
            assets,
            windUniforms,
            isSoftwareGl,
            UNIFIED_WORLD_CRATE_SIZE,
          );
        });
        buddyUnits.forEach((b) => {
          if (b.carryingCrate !== 'none') {
            populateRealLyoCrateBoxFromGlb(
              b.overheadCrateGroup,
              b.carryingCrate,
              assets,
              windUniforms,
              isSoftwareGl,
              UNIFIED_WORLD_CRATE_SIZE,
            );
          }
        });
        syncPadVisuals(blueBase, bluePadSlots, 'BLUE', blueBaseHp);
        syncPadVisuals(redBase, redPadSlots, 'RED', redBaseHp);

        // 4. Populate Projectile Pool with Real 3D Bullet Shells from bullet.glb (Bullet_Boss, Bullet_Player, Bullet_Fodder)
        const bulletTemplates: Lyo3dBulletTemplates | null = buildRealLyoBulletTemplates(
          assets.bulletGltf,
          windUniforms,
        );
        if (bulletTemplates) {
          for (const p of projectiles) {
            const bossShell = bulletTemplates.bossShell.clone(true);
            const playerShell = bulletTemplates.playerShell.clone(true);
            const fodderShell = bulletTemplates.fodderShell.clone(true);
            bossShell.visible = false;
            playerShell.visible = false;
            fodderShell.visible = false;
            p.mesh.add(bossShell);
            p.mesh.add(playerShell);
            p.mesh.add(fodderShell);
            p.bossShell = bossShell;
            p.playerShell = playerShell;
            p.fodderShell = fodderShell;
            p.has3dShells = true;
          }
        }

        // Optional ?tank=1 or ?truck=1 inspection flag
        if (window.location.search.includes('tank=1') && tanks.length === 0) {
          tanks.push(createLyoTankVehicle(3.8, 12.2, false, 'blue'));
        }
      })
      .catch((err) => {
        console.error('Failed to load real Lyo GLB assets:', err);
      });

    // 1. Clean Zero-Prebuilt Start: All 4 Stacking Pads per Base start completely empty (0/8 crates)
    const createEmptyPadSlots = (): CrateSlotType[] => [
      'empty',
      'empty',
      'empty',
      'empty',
      'empty',
      'empty',
      'empty',
      'empty',
    ];
    let bluePadSlotsList: CrateSlotType[][] = [
      createEmptyPadSlots(),
      createEmptyPadSlots(),
      createEmptyPadSlots(),
      createEmptyPadSlots(),
    ];
    let redPadSlotsList: CrateSlotType[][] = [
      createEmptyPadSlots(),
      createEmptyPadSlots(),
      createEmptyPadSlots(),
      createEmptyPadSlots(),
    ];
    let bluePadSlots: CrateSlotType[] = bluePadSlotsList[0];
    let redPadSlots: CrateSlotType[] = redPadSlotsList[0];
    const aiBuildOrders: BuildOrderTarget[] = ['1x1x2', '2x2x1', '2x1x1', '2x2x2'];
    let matchmakingState: Matchmaking4v4State = createMatchmaking4v4State(2, 2);
    let blueCommanderBases: IndividualCommanderBaseState[] = createIndividualCommanderBasesState('blue');
    let redCommanderBases: IndividualCommanderBaseState[] = createIndividualCommanderBasesState('red');
    let buildOrder: BuildOrderTarget = '1x1x2';
    let activePriorityRecipe: KioskBuildPriorityRecipeId = 'buddy_infantry';
    let blueBuildQueue: KioskBuildPriorityRecipeId[] = ['buddy_infantry'];
    let useCustomHologramRecipe = true;
    let gold = 1500;
    let kioskStatusMessage: string | null = null;
    let kioskStatusTimer = 0;
    let warzoneGoldSpawnTimer = 0;
    let warzoneExplosiveBarrelSpawnTimer = 0;
    let supplyDropSchedule: SupplyDropScheduleState = createInitialSupplyDropScheduleState();
    let supplyDropBeaconLingeringTimer = 0;
    let teamCommand: TeamCommandMode = 'HARVEST';
    let blueBaseHp = 2000;
    let redBaseHp = 2000;
    let score = 0;
    let bestScore = 0;
    let enemiesDefeated = 0;
    let blueBuddyClassIdx = 0;
    let mountedTank: TankVehicle | null = null;
    let ridingTramCarIdx: 0 | 1 | null = null;
    let crateSpawnTimer = 0;
    let superCrateSpawnTimer = 0;
    let legendCrateSpawnTimer = 0;
    let medicalCrateSpawnTimer = 0;
    let redCraftTimer = 0;

    // Pick a random open Warzone coordinate (outside Oasis Lake & roads) for random Warzone Drop Boxes
    const pickRandomWarzoneDropCoord = (): { x: number; z: number } => {
      for (let attempt = 0; attempt < 16; attempt++) {
        const rx = -62.0 + Math.random() * 126.0; // x in [-62.0, +64.0] across the expanded Warzone
        const rz = -42.0 + Math.random() * 84.0; // z in [-42.0, +42.0]
        if (evaluateNwLakeSdf(rx, rz) > 2.5 && evaluateRoadNetworkSdf(rx, rz) > 1.2) {
          return { x: Number(rx.toFixed(2)), z: Number(rz.toFixed(2)) };
        }
      }
      return {
        x: Number(((Math.random() - 0.5) * 32.0).toFixed(2)),
        z: Number(((Math.random() - 0.5) * 32.0).toFixed(2)),
      };
    };

    const syncSingleCommanderPadVisual = (
      padMeshObj: ReturnType<typeof buildSingleStackingPadMesh>,
      slots: CrateSlotType[],
      isBlue: boolean,
      commanderIdx: number,
      activeOrder: BuildOrderTarget,
    ) => {
      const ev = evaluateStackingPadRecipe(slots);
      const orderSpec = BUILD_ORDER_SPECS[activeOrder];
      const isLocalPlayerPad = isBlue && commanderIdx === 0;
      const plotState = (isBlue ? blueCommanderBases : redCommanderBases)[commanderIdx];
      const holoState = evaluatePadHologramState(
        isLocalPlayerPad,
        useCustomHologramRecipe,
        activePriorityRecipe,
        slots,
      );

      if (holoState.showPatternOutlineBox) {
        padMeshObj.ghostPatternBox.visible = true;
        padMeshObj.ghostPatternBox.scale.set(
          orderSpec.ghostBoxSize[0],
          orderSpec.ghostBoxSize[1],
          orderSpec.ghostBoxSize[2],
        );
        padMeshObj.ghostPatternBox.position.set(
          orderSpec.ghostBoxCenter[0],
          orderSpec.ghostBoxCenter[1],
          orderSpec.ghostBoxCenter[2],
        );
      } else {
        padMeshObj.ghostPatternBox.visible = false;
      }

      for (let i = 0; i < 8; i++) {
        const s = slots[i];
        const slotGrp = padMeshObj.slotMeshes[i];
        const ghostMesh = padMeshObj.ghostSlotMeshes[i];
        const requiredSlotKind: CrateSlotType = holoState.slotGhostColors[i];
        const isAllowedInPattern = requiredSlotKind !== 'empty';

        if (s === 'empty') {
          slotGrp.visible = false;
          ghostMesh.visible = isAllowedInPattern;
          if (isAllowedInPattern) {
            const holoHex = getHologramSlotHexColor(requiredSlotKind);
            (ghostMesh.material as THREE.MeshBasicMaterial).color.setHex(holoHex);
            const coreMat = ghostMesh.userData.coreMat as THREE.MeshBasicMaterial | undefined;
            if (coreMat) {
              coreMat.color.setHex(holoHex);
            }
          }
        } else {
          slotGrp.visible = true;
          if (slotGrp.userData.lyoBoxKind !== s) {
            populateRealLyoCrateBoxFromGlb(
              slotGrp,
              s,
              loadedLyoAssets,
              windUniforms,
              isSoftwareGl,
              UNIFIED_WORLD_CRATE_SIZE,
            );
          }
          ghostMesh.visible = false;
        }
      }

      padMeshObj.mergedCage.visible = ev.isMerged;
      const activeRecipeSpec =
        isLocalPlayerPad && useCustomHologramRecipe
          ? KIOSK_BUILD_PRIORITY_RECIPES[activePriorityRecipe]
          : null;
      const targetMax = activeRecipeSpec ? activeRecipeSpec.targetCrates : orderSpec.targetCrates;
      const activeLabel = activeRecipeSpec ? activeRecipeSpec.name : orderSpec.label;
      const cmdSlot = (isBlue ? matchmakingState.blueCommanders : matchmakingState.redCommanders)[commanderIdx];
      const bLv = plotState ? `LV.${plotState.buildingLevel}` : 'LV.1';
      const fLv = plotState ? `PAGAR LV.${plotState.fenceLevel}` : 'PAGAR LV.1';
      const slotTag = cmdSlot
        ? `BASE ${ isBlue ? 'P' : 'R' }${commanderIdx + 1} (${bLv} · ${fLv})`
        : `BASE ${ isBlue ? 'P' : 'R' }${commanderIdx + 1}`;
      const isBaseUpgradeOrder =
        activeOrder === 'upgrade_building' ||
        activeOrder === 'upgrade_fence' ||
        activeOrder === 'build_parking' ||
        activeOrder === 'build_helipad';
      padMeshObj.padSign.updateText(
        ev.totalCrates === 0
          ? isLocalPlayerPad
            ? useCustomHologramRecipe
              ? `BASE P1 (${bLv}) [B/Q] ${activeLabel.toUpperCase()}`
              : `BASE P1 (${bLv}) · PILIH TARGET [B/Q]`
            : slotTag
          : `${slotTag} · ${isBaseUpgradeOrder ? orderSpec.label.toUpperCase() : ev.outputName.toUpperCase()}`,
        ev.totalCrates === 0
          ? isLocalPlayerPad && !useCustomHologramRecipe
            ? `PILIH RESEP DI KIOSK [B] · [E] ISI PAD`
            : `0/${targetMax} PETI · [B] KIOSK · [E] ISI PAD`
          : `[F] TENDANG BATAL (${ev.totalCrates}/${targetMax} PETI) · [B] KIOSK`,
        ev.legendCount > 0 ? '#ffd700' : ev.isSuper ? '#00d2ff' : '#b4ff39',
        clamp(ev.totalCrates / Math.max(1, targetMax), 0, 1),
      );

      // Update Kiosk Side Platform 3D Hologram Shape + Progress Counter ("misal 1/5")
      const kioskHoloState = evaluateKioskSideHologramDisplay(
        isLocalPlayerPad ? useCustomHologramRecipe : false,
        activePriorityRecipe,
        activeOrder,
        slots,
        isLocalPlayerPad ? blueBuildQueue : [],
      );
      const sideHolo = padMeshObj.kioskMesh?.userData?.sideHologram as
        | {
            holoRoot: THREE.Group;
            holoTurntable: THREE.Group;
            holoModels: Record<KioskSideHologramModelKind, THREE.Group>;
            holoSolidMat: THREE.MeshBasicMaterial;
            holoWireMat: THREE.MeshBasicMaterial;
            holoRingMat: THREE.MeshBasicMaterial;
            holoBeamMat: THREE.MeshBasicMaterial;
            activeModelKind: KioskSideHologramModelKind;
          }
        | undefined;
      if (sideHolo) {
        sideHolo.holoRoot.visible = kioskHoloState.visible;
        for (const [mKey, mGrp] of Object.entries(sideHolo.holoModels)) {
          mGrp.visible = mKey === kioskHoloState.modelKind;
        }
        sideHolo.activeModelKind = kioskHoloState.modelKind;
        sideHolo.holoSolidMat.color.setHex(kioskHoloState.hologramColorInt);
        sideHolo.holoWireMat.color.setHex(kioskHoloState.hologramColorInt);
        sideHolo.holoRingMat.color.setHex(kioskHoloState.hologramColorInt);
        sideHolo.holoBeamMat.color.setHex(kioskHoloState.hologramColorInt);
      }
      if (padMeshObj.kioskHoloSign) {
        padMeshObj.kioskHoloSign.updateText(
          kioskHoloState.titleText,
          kioskHoloState.subtitleText,
          kioskHoloState.hologramHexColor,
          kioskHoloState.progressRatio,
        );
      }
    };

    const syncPadVisuals = (
      baseObj: ReturnType<typeof buildBaseHqAndPad>,
      slots: CrateSlotType[],
      teamLabel: string,
      hp: number,
    ) => {
      const isBlue = teamLabel === 'BLUE';
      if (isBlue) {
        bluePadSlotsList[0] = slots;
        bluePadSlots = bluePadSlotsList[0];
      } else {
        redPadSlotsList[0] = slots;
        redPadSlots = redPadSlotsList[0];
      }
      const slotsList = isBlue ? bluePadSlotsList : redPadSlotsList;
      baseObj.commanderPads.forEach((cp, idx) => {
        const orderForPad = isBlue && idx === 0 ? buildOrder : aiBuildOrders[idx % aiBuildOrders.length];
        syncSingleCommanderPadVisual(cp, slotsList[idx], isBlue, idx, orderForPad);
      });
      syncMilitaryBasePlotsVisuals(
        baseObj.baseGroup,
        isBlue ? blueCommanderBases : redCommanderBases,
        isBlue ? 'blue' : 'red',
      );
      baseObj.hpSign.updateText(
        `${teamLabel} COMPLEX (4 BASES)`,
        `${hp} TOTAL HP`,
        isBlue ? '#00d2ff' : '#ff3b30',
        clamp(hp / 2000, 0, 1),
      );
    };

    const spawnWorldCrate = (
      kind: WorldCrateKind,
      x: number,
      z: number,
      startGrounded = false,
      forceSpawn = startGrounded,
    ): WorldCrate | null => {
      const isSpecialMetallic = kind === 'silver_metallic' || kind === 'gold_metallic';
      if (!isSpecialMetallic && !forceSpawn && !startGrounded && worldCrates.length >= 38) {
        return null;
      }
      const wx = wrapPlanetCoord(x);
      const wz = wrapPlanetCoord(z);
      const groundY = getTerrainElevation(wx, wz) + 0.66;
      const g = new THREE.Group();
      const startY = startGrounded ? groundY : groundY + 16 + Math.random() * 4;
      g.position.set(wx, startY, wz);
      scene.add(g);

      const boxVisualGroup = new THREE.Group();
      g.add(boxVisualGroup);

      addOutlinedPart(
        boxVisualGroup,
        new THREE.BoxGeometry(
          UNIFIED_WORLD_CRATE_SIZE,
          UNIFIED_WORLD_CRATE_SIZE,
          UNIFIED_WORLD_CRATE_SIZE,
        ),
        getCrateFallbackMaterial(kind),
        [0, 0, 0],
      );
      populateRealLyoCrateBoxFromGlb(
        boxVisualGroup,
        kind,
        loadedLyoAssets,
        windUniforms,
        isSoftwareGl,
        UNIFIED_WORLD_CRATE_SIZE,
      );

      // White Parachute dome while falling
      const chuteGeo = new THREE.SphereGeometry(1.15, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const parachuteMesh = new THREE.Mesh(chuteGeo, matWhite);
      parachuteMesh.position.set(0, 1.6, 0);
      parachuteMesh.visible = !startGrounded;
      g.add(parachuteMesh);

      const createdCrate: WorldCrate = {
        id: nextEntityId++,
        kind,
        indestructible: isSpecialMetallic,
        mesh: g,
        boxVisualGroup,
        parachuteMesh,
        x: wx,
        y: startY,
        z: wz,
        vx: 0,
        vy: 0,
        vz: 0,
        rotY: 0,
        rotVelY: 0,
        hp: isSpecialMetallic ? 999999 : kind === 'legend' ? 45 : kind === 'super' ? 35 : 22,
        state: startGrounded ? 'grounded' : 'falling',
        carrierId: null,
        squashTimer: 0,
      };
      worldCrates.push(createdCrate);
      return createdCrate;
    };

    interface SpawnWorldPickupOptions {
      weaponId?: 'pistol' | 'rifle' | 'rocket';
      vx?: number;
      vy?: number;
      vz?: number;
      remainingAmmo?: number;
      secondaryId?: Exclude<BuddySecondaryItemId, 'none'>;
      secondaryCount?: number;
      missionItemId?: Exclude<BuddyMissionItemId, 'none'>;
      scoreValue?: number;
      healAmount?: number;
      hp?: number;
      isFromDeathDrop?: boolean;
      despawnTimerSec?: number;
    }

    const spawnWorldPickup = (
      kind: WorldPickup['kind'],
      weaponName: string,
      x: number,
      z: number,
      options?: SpawnWorldPickupOptions,
    ) => {
      const wx = wrapPlanetCoord(x);
      const wz = wrapPlanetCoord(z);
      const baseY = getTerrainElevation(wx, wz) + 0.75;
      const startY = (options?.vy ?? 0) > 0 ? baseY + 0.35 : baseY;
      const g = new THREE.Group();
      g.position.set(wx, startY, wz);
      scene.add(g);

      if (
        kind === 'coin_gold' ||
        kind === 'coin_silver' ||
        kind === 'secondary' ||
        kind === 'mission_item' ||
        kind === 'health'
      ) {
        const subId = options?.secondaryId ?? options?.missionItemId;
        const dropModel = buildTeamBuddiesDropPickupMesh(kind, subId, windUniforms, isSoftwareGl);
        g.add(dropModel);
      } else if (kind === 'ammo') {
        addOutlinedPart(g, new THREE.BoxGeometry(0.75, 0.55, 0.55), matYellow, [0, 0, 0]);
      } else if (kind === 'powerup') {
        addOutlinedPart(g, new THREE.IcosahedronGeometry(0.62, 0), matTankHighlight, [0, 0, 0]);
      } else {
        // 3D Crafted or Dropped Weapon Pickup on a glowing pedestal displaying the actual 3D weapon model!
        addOutlinedPart(g, new THREE.CylinderGeometry(0.7, 0.8, 0.16, 12), matYellow, [0, -0.55, 0]);
        const weaponModel = buildCraftedWeaponPickupMesh(weaponName, windUniforms, isSoftwareGl);
        g.add(weaponModel);
      }

      const totalLife =
        options?.despawnTimerSec ??
        (options?.isFromDeathDrop
          ? TEAM_BUDDIES_WEAPON_DESPAWN_SEC
          : kind === 'weapon'
          ? TEAM_BUDDIES_CRAFTED_WEAPON_DESPAWN_SEC
          : 0);

      worldPickups.push({
        id: nextEntityId++,
        kind,
        weaponName,
        mesh: g,
        x: wx,
        y: startY,
        z: wz,
        vx: options?.vx ?? 0,
        vy: options?.vy ?? 0,
        vz: options?.vz ?? 0,
        bobPhase: Math.random() * Math.PI * 2,
        collected: false,
        remainingAmmo: options?.remainingAmmo,
        secondaryId: options?.secondaryId,
        secondaryCount: options?.secondaryCount,
        missionItemId: options?.missionItemId,
        scoreValue: options?.scoreValue,
        healAmount: options?.healAmount,
        hp: options?.hp ?? 18,
        isFromDeathDrop: Boolean(options?.isFromDeathDrop || totalLife > 0),
        lifeRemainingSec: totalLife > 0 ? totalLife : 999999,
        totalLifeSec: totalLife,
      });
    };

    const syncUnitFieldsFromLoadout = (u: BuddyUnit) => {
      const ld = u.tacticalLoadout;
      if (ld.activeWeaponSlotId === 'unarmed' || ld.handheldWeapons.length === 0) {
        u.weaponId = 'unarmed';
        u.weaponName = 'Tangan Kosong (Tinju)';
        u.ammo = 0;
      } else {
        const activeSlot =
          ld.handheldWeapons.find((w) => w.slotId === ld.activeWeaponSlotId && w.ammo > 0) ??
          ld.handheldWeapons.find((w) => w.ammo > 0);
        if (activeSlot) {
          ld.activeWeaponSlotId = activeSlot.slotId;
          u.weaponId = activeSlot.slotId;
          u.weaponName = activeSlot.weaponName;
          u.ammo = activeSlot.ammo;
        } else {
          ld.activeWeaponSlotId = 'unarmed';
          u.weaponId = 'unarmed';
          u.weaponName = 'Tangan Kosong (Tinju)';
          u.ammo = 0;
        }
      }
      if (ld.clusterBombCount > 0) {
        u.secondaryItem = 'cluster_bomb';
        u.secondaryCount = ld.clusterBombCount;
      } else if (ld.grenadeCount > 0) {
        u.secondaryItem = 'hand_grenade';
        u.secondaryCount = ld.grenadeCount;
      } else if (ld.landMineCount > 0) {
        u.secondaryItem = 'land_mine';
        u.secondaryCount = ld.landMineCount;
      } else {
        u.secondaryItem = 'none';
        u.secondaryCount = 0;
      }
    };

    const spawnWarzoneExplosiveBarrel = (x: number, z: number, startGrounded = false) => {
      const wx = wrapPlanetCoord(x);
      const wz = wrapPlanetCoord(z);
      const propId = nextEntityId++;
      const rotY = Math.random() * Math.PI * 2;
      const baseH = getPropBaseHeight('explosive_barrel');

      let wrapper: THREE.Group | null = null;
      if (loadedLyoAssets?.explosiveBarrelGltf) {
        wrapper = spawnRealLyoPropFromGlb(
          realPropsGroup,
          loadedLyoAssets.explosiveBarrelGltf,
          wx,
          wz,
          rotY,
          baseH,
          windUniforms,
          isSoftwareGl,
        );
      }
      if (!wrapper) {
        wrapper = new THREE.Group();
        addOutlinedPart(
          wrapper,
          new THREE.CylinderGeometry(0.46, 0.46, 1.18, 12),
          new THREE.MeshToonMaterial({ color: '#e11d48' }),
          [0, 0.59, 0],
        );
        addOutlinedPart(
          wrapper,
          new THREE.CylinderGeometry(0.48, 0.48, 0.22, 12),
          matYellow,
          [0, 0.62, 0],
        );
        wrapper.position.set(wx, getTerrainElevation(wx, wz), wz);
        wrapper.rotation.y = rotY;
        realPropsGroup.add(wrapper);
      }

      const startAlt = startGrounded ? 0 : 18.5;
      wrapper.userData.propId = propId;
      wrapper.userData.worldX = wx;
      wrapper.userData.worldZ = wz;
      wrapper.userData.baseRotY = rotY;
      wrapper.userData.dropAltitudeY = startAlt;

      const parachuteMesh = new THREE.Mesh(
        new THREE.ConeGeometry(1.15, 0.72, 10, 1, true),
        new THREE.MeshToonMaterial({ color: '#ff3b30', side: THREE.DoubleSide }),
      );
      parachuteMesh.position.y = 2.05;
      parachuteMesh.rotation.x = Math.PI;
      parachuteMesh.visible = !startGrounded;
      wrapper.add(parachuteMesh);

      const colSpec = getPropCollisionSpec('explosive_barrel', 1.0);
      activeMapProps.push({
        id: propId,
        kind: 'explosive_barrel',
        wrapper,
        x: wx,
        z: wz,
        vx: 0,
        vz: 0,
        rotY,
        rotVelY: 0,
        scale: 1.0,
        category: colSpec.category,
        materialTag: colSpec.materialTag,
        radius: colSpec.radius,
        heightY: 1.5,
        mass: colSpec.mass,
        restitution: colSpec.restitution,
        destructible: colSpec.destructible,
        hp: colSpec.maxHp,
        maxHp: colSpec.maxHp,
        shootImpulse: colSpec.shootImpulse,
        canJiggleOnHit: colSpec.canJiggleOnHit,
        alive: true,
        jiggleTimer: 0,
        jiggleDirX: 0,
        jiggleDirZ: 1,
        isWarzoneDropBarrel: true,
        fallingFromSky: !startGrounded,
        y: getTerrainElevation(wx, wz) + startAlt,
        vy: startGrounded ? 0 : -8.5,
        parachuteMesh,
      });
    };

    /**
     * Team Buddies (PS1) Battlefield Death Item Drop Handler:
     * - Drops held Primary Weapon with its exact `remainingAmmo` (bouncing onto the ground)
     * - Drops Gold / Silver Coins + Ammo Refill Pack when an enemy is killed
     * - Refills player's carried weapon ammo upon enemy defeat
     * - Throws any carried overhead Crate, Secondary Grenade/Bomb/Mine, or Mission Object intact onto the ground
     * - NEVER drops a Medkit from a corpse (`Tidak Ada Drop Medkit dari Mayat`)!
     */
    const handleBuddyDeathDrops = (victim: BuddyUnit, killedByChainExplosion = false) => {
      if (victim.team === 'red' && playerUnit && playerUnit.alive) {
        playerUnit.tacticalLoadout = refillLoadoutAmmoFromSource(
          playerUnit.tacticalLoadout,
          'enemy_kill',
        );
        syncUnitFieldsFromLoadout(playerUnit);
      }

      const drops = evaluateTeamBuddiesDeathDrops({
        weaponId:
          victim.weaponId === 'bazooka'
            ? 'rocket'
            : victim.weaponId === 'rifle'
              ? 'rifle'
              : victim.weaponId === 'pistol'
                ? 'pistol'
                : 'unarmed',
        ammo: victim.ammo,
        carryingCrate: victim.carryingCrate,
        secondaryItem: victim.secondaryItem,
        secondaryCount: victim.secondaryCount,
        missionItem: victim.missionItem,
        isEnemyKill: victim.team === 'red',
        classId: victim.classId,
        killedByChainExplosion,
      });

      // Clear carried items from the fallen character
      victim.carryingCrate = 'none';
      victim.overheadCrateGroup.visible = false;
      victim.secondaryItem = 'none';
      victim.secondaryCount = 0;
      victim.missionItem = 'none';

      for (const d of drops) {
        const dropX = wrapPlanetCoord(victim.x + d.offsetX);
        const dropZ = wrapPlanetCoord(victim.z + d.offsetZ);
        if (d.kind === 'crate' && d.crateKind) {
          spawnWorldCrate(d.crateKind, dropX, dropZ, true);
          const droppedCrate = worldCrates[worldCrates.length - 1];
          if (droppedCrate) {
            droppedCrate.vx = d.vx;
            droppedCrate.vy = d.vy;
            droppedCrate.vz = d.vz;
            droppedCrate.rotVelY = (Math.random() - 0.5) * 6.5;
            droppedCrate.hp = d.hp;
          }
        } else if (d.kind !== 'crate') {
          spawnWorldPickup(d.kind, d.label, dropX, dropZ, {
            vx: d.vx,
            vy: d.vy,
            vz: d.vz,
            remainingAmmo: d.remainingAmmo,
            secondaryId: d.secondaryId,
            secondaryCount: d.secondaryCount,
            missionItemId: d.missionItemId,
            scoreValue: d.scoreValue,
            hp: d.hp,
            isFromDeathDrop: d.despawnTimerSec > 0,
            despawnTimerSec: d.despawnTimerSec,
          });
        }
      }

      if (victim.team === 'red' && !killedByChainExplosion) {
        spawnWorldPickup(
          'ammo',
          'AMMO PACK (+40 PELURU)',
          wrapPlanetCoord(victim.x + (Math.random() - 0.5) * 1.4),
          wrapPlanetCoord(victim.z + (Math.random() - 0.5) * 1.4),
          {
            vx: (Math.random() - 0.5) * 2.8,
            vy: 4.8,
            vz: (Math.random() - 0.5) * 2.8,
            remainingAmmo: 40,
          },
        );
        if (Math.random() < 0.55) {
          const dropGrenade = Math.random() < 0.55;
          spawnWorldPickup(
            'secondary',
            dropGrenade ? 'HG-04 Frag Grenade' : 'TM-89 Land Mine',
            wrapPlanetCoord(victim.x + (Math.random() - 0.5) * 1.6),
            wrapPlanetCoord(victim.z + (Math.random() - 0.5) * 1.6),
            {
              secondaryId: dropGrenade ? 'hand_grenade' : 'land_mine',
              secondaryCount: 2,
              vx: (Math.random() - 0.5) * 2.8,
              vy: 4.9,
              vz: (Math.random() - 0.5) * 2.8,
            },
          );
        }
      }
    };

    const rewardPlayerOnCrateDestroyed = (cx: number, cz: number) => {
      if (playerUnit && playerUnit.alive) {
        playerUnit.tacticalLoadout = refillLoadoutAmmoFromSource(
          playerUnit.tacticalLoadout,
          'crate_destroy',
        );
        syncUnitFieldsFromLoadout(playerUnit);
      }
      spawnWorldPickup(
        'ammo',
        'AMMO PACK (+40 PELURU)',
        wrapPlanetCoord(cx + (Math.random() - 0.5) * 1.1),
        wrapPlanetCoord(cz + (Math.random() - 0.5) * 1.1),
        {
          vx: (Math.random() - 0.5) * 2.6,
          vy: 4.8,
          vz: (Math.random() - 0.5) * 2.6,
          remainingAmmo: 40,
        },
      );
      if (Math.random() < 0.45) {
        const dropGrenade = Math.random() < 0.55;
        spawnWorldPickup(
          'secondary',
          dropGrenade ? 'HG-04 Frag Grenade' : 'TM-89 Land Mine',
          wrapPlanetCoord(cx + (Math.random() - 0.5) * 1.3),
          wrapPlanetCoord(cz + (Math.random() - 0.5) * 1.3),
          {
            secondaryId: dropGrenade ? 'hand_grenade' : 'land_mine',
            secondaryCount: 2,
            vx: (Math.random() - 0.5) * 2.8,
            vy: 5.0,
            vz: (Math.random() - 0.5) * 2.8,
          },
        );
      }
    };

    // Player Buddy (Commander 0 / P1) + Dynamic Mode Switching (SANDBOX = NO NPCs, EDITOR = NO NPCs, MATCH = 4v4 WITH AI)
    let playerUnit = createBuddyCharacterUnit('blue', true, 'Infuntry', -16.5, 71.0, 0, true);
    buddyUnits.push(playerUnit);

    const clearAllNonPlayerNpcs = () => {
      for (let i = buddyUnits.length - 1; i >= 0; i--) {
        const b = buddyUnits[i];
        if (!b.isPlayer) {
          for (const t of tanks) {
            if (t.occupiedByAiId === b.id) {
              t.occupiedByAiId = null;
              if (!t.occupiedByPlayer) t.riderGroup.visible = false;
            }
          }
          scene.remove(b.root);
          buddyUnits.splice(i, 1);
        }
      }
    };

    const ensureMatchAiSquadsSpawned = () => {
      // Spawn 1 starting character per other Blue Commander (P2, P3, P4 -> commanderId = 1, 2, 3) in front of their personal Stacking Pad
      const blueClasses: BuddyClassId[] = ['Infuntry', 'Ninja', 'Medic', 'Commando'];
      for (let cmdId = 1; cmdId < COMMANDERS_PER_TEAM; cmdId++) {
        const hasCmdUnit = buddyUnits.some(
          (b) => b.team === 'blue' && b.ownerCommanderId === cmdId && b.alive,
        );
        if (!hasCmdUnit) {
          const pad = blueBase.commanderPads[cmdId];
          buddyUnits.push(
            createBuddyCharacterUnit(
              'blue',
              false,
              blueClasses[cmdId % blueClasses.length],
              pad.padX - 3.6,
              pad.padZ - 2.8,
              cmdId,
              false,
            ),
          );
        }
      }
      // Spawn 1 starting character per Red Commander (R1..R4 -> commanderId = 0, 1, 2, 3) in front of their personal Stacking Pad
      const redClasses: BuddyClassId[] = ['Infuntry', 'Commando', 'Ninja', 'Medic'];
      for (let cmdId = 0; cmdId < COMMANDERS_PER_TEAM; cmdId++) {
        const hasRedCmdUnit = buddyUnits.some(
          (b) => b.team === 'red' && b.ownerCommanderId === cmdId && b.alive,
        );
        if (!hasRedCmdUnit) {
          const pad = redBase.commanderPads[cmdId];
          buddyUnits.push(
            createBuddyCharacterUnit(
              'red',
              false,
              redClasses[cmdId % redClasses.length],
              pad.padX + 3.6,
              pad.padZ + 2.8,
              cmdId,
              false,
            ),
          );
        }
      }
    };

    let matchGameOverTriggered = false;

    const spawnInitialSquadsAndObjects = () => {
      // Clear any old dynamic meshes
      worldCrates.forEach((c) => scene.remove(c.mesh));
      worldCrates.length = 0;
      worldPickups.forEach((p) => scene.remove(p.mesh));
      worldPickups.length = 0;
      buddyUnits.forEach((b) => scene.remove(b.root));
      buddyUnits.length = 0;
      tanks.forEach((t) => scene.remove(t.root));
      tanks.length = 0;
      for (let bi = activeMapProps.length - 1; bi >= 0; bi--) {
        if (activeMapProps[bi].isWarzoneDropBarrel) {
          realPropsGroup.remove(activeMapProps[bi].wrapper);
          activeMapProps.splice(bi, 1);
        }
      }
      warzoneExplosiveBarrelSpawnTimer = 0;
      collisionCooldownMap.clear();

      // 1. Clean Zero-Prebuilt Start: All 4 Stacking Pads per Base start at 0/8 crates, and 4v4 Matchmaking starts with 2 Human + 2 AI per team
      bluePadSlotsList = [
        createEmptyPadSlots(),
        createEmptyPadSlots(),
        createEmptyPadSlots(),
        createEmptyPadSlots(),
      ];
      redPadSlotsList = [
        createEmptyPadSlots(),
        createEmptyPadSlots(),
        createEmptyPadSlots(),
        createEmptyPadSlots(),
      ];
      bluePadSlots = bluePadSlotsList[0];
      redPadSlots = redPadSlotsList[0];
      matchmakingState = createMatchmaking4v4State(2, 2);
      blueCommanderBases = createIndividualCommanderBasesState('blue');
      redCommanderBases = createIndividualCommanderBasesState('red');
      blueBaseHp = 2000;
      redBaseHp = 2000;
      matchGameOverTriggered = false;
      score = 0;
      gold = playModeRef.current === 'sandbox' ? 2500 : 1200;
      activePriorityRecipe = 'buddy_infantry';
      blueBuildQueue = ['buddy_infantry'];
      useCustomHologramRecipe = true;
      kioskStatusMessage = null;
      kioskStatusTimer = 0;
      supplyDropSchedule = createInitialSupplyDropScheduleState();
      supplyDropBeaconLingeringTimer = 0;
      supplyDropBeaconGroup.visible = false;
      enemiesDefeated = 0;
      mountedTank = null;
      ridingTramCarIdx = null;

      // 2. Pre-installed Skyshield Turrets at Game Start ("pada awal game skysheald sudah terpasang jika sky sheald hancur maka pemain harus membuild nya dan seterusnya")
      for (const bGroup of [blueBase.baseGroup, redBase.baseGroup]) {
        const turrets = getBaseSkyshieldTurrets(bGroup);
        turrets.forEach((st) => {
          st.isBuilt = true;
          st.maxHp = 280;
          st.hp = 280;
          st.root.visible = true;
        });
      }

      // 3. Main Player Character (Commander 0 / P1) starts UNARMED ('unarmed') in the open courtyard beside Personal Stacking Pad P1
      playerUnit = createBuddyCharacterUnit(
        'blue',
        true,
        'Infuntry',
        blueBase.commanderPads[0].padX - 3.6,
        blueBase.commanderPads[0].padZ - 2.8,
        0,
        true,
      );
      buddyUnits.push(playerUnit);

      // 4. Zero-Prebuilt Start for Vehicles: NO Tank, NO Dump Truck, and NO Plane are pre-spawned at match start!
      //    (Only spawn a showcase plane if ?planeview=1 is used for 4-view turnaround inspection)
      const isPlaneShowcase =
        typeof window !== 'undefined' &&
        Boolean(new URLSearchParams(window.location.search).get('planeview'));
      if (isPlaneShowcase) {
        tanks.push(createLyoPlaneVehicle(-33.0, 76.8, 'blue'));
      }

      // 5. ONLY spawn Allied & Enemy 4v4 Commander Squads if playMode === 'match'!
      if (playModeRef.current === 'match') {
        ensureMatchAiSquadsSpawned();
      }

      // 6. Initial Common ('red'), Rare ('super'), Legend ('legend'), and White Medical ('medical') Crates
      for (const sign of [1, -1] as const) {
        spawnWorldCrate('red', sign * -46.8, sign * 68.5, true);
        spawnWorldCrate('red', sign * -43.2, sign * 68.5, true);
        spawnWorldCrate('super', sign * -15.0, sign * 68.5, true);
        spawnWorldCrate('red', sign * 15.0, sign * 68.5, true);
        spawnWorldCrate('legend', sign * 45.0, sign * 68.5, true);
        spawnWorldCrate('medical', sign * -28.0, sign * 58.0, true);
      }
      const isOverviewQuery =
        typeof window !== 'undefined' &&
        (new URLSearchParams(window.location.search).get('fullmap') === '1' ||
          Boolean(new URLSearchParams(window.location.search).get('planeview')));
      if (!isOverviewQuery) {
        for (const initKind of ['red', 'red', 'super', 'super', 'legend', 'medical'] as const) {
          const dropSpot = pickRandomWarzoneDropCoord();
          spawnWorldCrate(initKind, dropSpot.x, dropSpot.z, false);
        }
        for (let gi = 0; gi < 6; gi++) {
          const goldSpot = pickRandomWarzoneDropCoord();
          const isGold = gi % 3 !== 2;
          spawnWorldPickup(
            isGold ? 'coin_gold' : 'coin_silver',
            isGold ? 'EMAS WARZONE (+250G)' : 'PERAK WARZONE (+100G)',
            goldSpot.x,
            goldSpot.z,
            { scoreValue: isGold ? 250 : 100, vy: 3.5 },
          );
        }
        // Spawn initial chaotic Warzone Explosive Barrels (some grounded, some parachuting down!)
        for (let bi = 0; bi < 5; bi++) {
          const barrelSpot = pickRandomWarzoneDropCoord();
          spawnWarzoneExplosiveBarrel(barrelSpot.x, barrelSpot.z, bi < 2);
        }
      }

      trees.forEach((t) => {
        t.alive = true;
        t.hp = t.maxHp;
        t.jiggleTimer = 0;
        t.jiggleIntensity = 0;
        t.mesh.visible = true;
      });

      // Reset any pushed or shattered map props back to their saved layout positions
      for (const mp of activeMapProps) {
        if (mp.isWarzoneDropBarrel) continue;
        const orig = currentMapLayout.props.find((p) => p.id === mp.id);
        if (orig) {
          mp.x = orig.x;
          mp.z = orig.z;
          mp.rotY = orig.rotY;
          mp.wrapper.userData.worldX = orig.x;
          mp.wrapper.userData.worldZ = orig.z;
          mp.wrapper.userData.baseRotY = orig.rotY;
        }
        mp.vx = 0;
        mp.vz = 0;
        mp.rotVelY = 0;
        mp.hp = mp.maxHp;
        mp.alive = true;
        mp.jiggleTimer = 0;
        mp.wrapper.visible = true;
      }

      syncPadVisuals(blueBase, bluePadSlots, 'BLUE', blueBaseHp);
      syncPadVisuals(redBase, redPadSlots, 'RED', redBaseHp);
    };

    spawnInitialSquadsAndObjects();

    // =========================================================================
    // 9. PREALLOCATED OBJECT POOLS FOR BULLETS, EXPLOSION PARTICLES & DEBRIS
    //    - Preallocates the peak count up front
    //    - Takes an inactive instance and resets its fields on spawn
    //    - Marks it inactive on death instead of destroying it (zero GC pauses)
    //    - Logs a warning if any pool ever runs out of preallocated slots
    // =========================================================================
    // Unit 1x1x1 bounding sphere (radius = 0.5) so slot.mesh.scale.set(diameter, diameter, length)
    // sets the exact weapon-proportional caliber (X, Y) and length (Z) in world meters!
    const projGeo = new THREE.SphereGeometry(0.5, 10, 10);
    const playerProjMat = new THREE.MeshBasicMaterial({ color: 0xb8ff3c });
    const iceProjMat = new THREE.MeshBasicMaterial({ color: 0x00d2ff });
    const enemyProjMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
    const hiddenCarrierProjMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    const scratchSpawnOrigin = new THREE.Vector3();
    const scratchSpawnDir = new THREE.Vector3();
    const scratchExplosionPos = new THREE.Vector3();
    const scratchHitBurstDir = new THREE.Vector3();

    const projectilePool = createFixedObjectPool<Projectile>({
      name: 'Bullets',
      peakCapacity: POOL_PEAK_CAPACITIES.bullets,
      createSlot: () => {
        const m = new THREE.Mesh(projGeo, playerProjMat);
        m.visible = false;
        scene.add(m);
        return {
          active: false,
          isPlayerTeam: true,
          weaponType: 'LyoPistol',
          mesh: m,
          pos: new THREE.Vector3(),
          vel: new THREE.Vector3(),
          life: 0,
          damage: 8,
        };
      },
      resetSlot: (slot) => {
        slot.isPlayerTeam = true;
        slot.weaponType = 'LyoPistol';
        slot.pos.set(0, 0, 0);
        slot.vel.set(0, 0, 0);
        slot.life = 1.25;
        slot.damage = 8;
        if (slot.bossShell) slot.bossShell.visible = false;
        if (slot.playerShell) slot.playerShell.visible = false;
        if (slot.fodderShell) slot.fodderShell.visible = false;
        if (slot.nukeShell) slot.nukeShell.visible = false;
        slot.mesh.visible = true;
      },
      deactivateSlot: (slot) => {
        slot.life = 0;
        slot.vel.set(0, 0, 0);
        if (slot.bossShell) slot.bossShell.visible = false;
        if (slot.playerShell) slot.playerShell.visible = false;
        if (slot.fodderShell) slot.fodderShell.visible = false;
        if (slot.nukeShell) slot.nukeShell.visible = false;
        slot.mesh.visible = false;
      },
    });
    const projectiles = projectilePool.slots;

    const activeNuclearLaunchers: NuclearLauncherTurretRig[] = [];
    let nukeStrikeState: NuclearStrikeSequenceState = createInitialNuclearStrikeState();
    let nukeLastMouseNdc = { x: 0, y: 0 };
    let emitHudImmediately: () => void = () => {};

    // 3D Tactical Nuclear Target Reticle (visible on the zoomed-out map during `nukeStrikeState.phase === 'targeting'`)
    const nukeTargetReticleGroup = new THREE.Group();
    nukeTargetReticleGroup.name = 'NuclearTargetReticle3D';
    nukeTargetReticleGroup.visible = false;
    {
      const outerRingMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const outerBlastRing = new THREE.Mesh(new THREE.RingGeometry(10.5, 11.4, 48), outerRingMat);
      outerBlastRing.rotation.x = -Math.PI / 2;
      outerBlastRing.position.y = 0.14;
      nukeTargetReticleGroup.add(outerBlastRing);

      const midRingMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const midLockRing = new THREE.Mesh(new THREE.RingGeometry(3.8, 4.45, 36), midRingMat);
      midLockRing.rotation.x = -Math.PI / 2;
      midLockRing.position.y = 0.18;
      midLockRing.name = 'MidLockRing';
      nukeTargetReticleGroup.add(midLockRing);

      const crossGeo = new THREE.PlaneGeometry(9.6, 0.36);
      const crossH = new THREE.Mesh(crossGeo, midRingMat);
      crossH.rotation.x = -Math.PI / 2;
      crossH.position.y = 0.2;
      nukeTargetReticleGroup.add(crossH);

      const crossV = new THREE.Mesh(crossGeo, midRingMat);
      crossV.rotation.x = -Math.PI / 2;
      crossV.rotation.z = Math.PI / 2;
      crossV.position.y = 0.2;
      nukeTargetReticleGroup.add(crossV);

      const centerCoreMat = new THREE.MeshBasicMaterial({
        color: 0xff3b30,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const centerDisc = new THREE.Mesh(new THREE.CircleGeometry(1.15, 24), centerCoreMat);
      centerDisc.rotation.x = -Math.PI / 2;
      centerDisc.position.y = 0.22;
      nukeTargetReticleGroup.add(centerDisc);

      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xff4d3d,
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
      });
      const laserPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.95, 42, 16, 1, true), beamMat);
      laserPillar.position.y = 21.0;
      nukeTargetReticleGroup.add(laserPillar);
    }
    scene.add(nukeTargetReticleGroup);

    // Dedicated 3D Cinematic Flying Rocket (`MLRS-MK5 'ATLAS' Nuke Rocket`) for Phase 2 (`tracking_rocket`)
    const nukeCinematicRocketGroup = new THREE.Group();
    nukeCinematicRocketGroup.name = 'NuclearCinematicRocket3D';
    nukeCinematicRocketGroup.visible = false;
    {
      const nukeBody = buildProceduralNuclearMissileMesh(windUniforms, isSoftwareGl);
      nukeBody.scale.setScalar(2.1);
      nukeCinematicRocketGroup.add(nukeBody);

      const plumeMat = new THREE.MeshBasicMaterial({
        color: 0xffa726,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
      });
      const plumeCone = new THREE.Mesh(new THREE.ConeGeometry(0.48, 2.6, 14), plumeMat);
      plumeCone.rotation.x = -Math.PI / 2;
      plumeCone.position.set(0, 0, -2.1);
      plumeCone.name = 'RocketExhaustPlume';
      nukeCinematicRocketGroup.add(plumeCone);
    }
    scene.add(nukeCinematicRocketGroup);

    const activeLaserBeams: ActiveLaserBeam3D[] = [];
    const activeOrdnanceDevices: ActiveOrdnanceDevice3D[] = [];
    let planeClusterBombCooldown = 0;

    const fireProjectile = (
      isPlayerTeam: boolean,
      weaponType: string,
      origin: THREE.Vector3,
      dir: THREE.Vector3,
      speed: number,
      damage: number,
    ) => {
      projectilePool.acquire((slot) => {
        slot.isPlayerTeam = isPlayerTeam;
        slot.weaponType = weaponType;
        slot.pos.copy(origin);
        slot.vel.copy(dir).normalize().multiplyScalar(speed);
        slot.life = weaponType === 'NuclearMissile' ? 4.8 : 1.25;
        slot.damage = damage;

        const visSpec = getWeaponProjectileVisualSpec(weaponType);
        if (weaponType === 'NuclearMissile') {
          if (!slot.nukeShell) {
            const nukeMesh = buildProceduralNuclearMissileMesh(windUniforms, isSoftwareGl);
            nukeMesh.scale.setScalar(1.35);
            slot.mesh.add(nukeMesh);
            slot.nukeShell = nukeMesh;
          }
          slot.mesh.material = hiddenCarrierProjMat;
          if (slot.bossShell) slot.bossShell.visible = false;
          if (slot.playerShell) slot.playerShell.visible = false;
          if (slot.fodderShell) slot.fodderShell.visible = false;
          slot.nukeShell.visible = true;
          slot.mesh.scale.set(1, 1, 1);
        } else if (slot.has3dShells && slot.bossShell && slot.playerShell && slot.fodderShell) {
          slot.mesh.material = hiddenCarrierProjMat;
          slot.bossShell.visible = visSpec.shellKind === 'boss';
          slot.playerShell.visible = visSpec.shellKind === 'player';
          slot.fodderShell.visible = visSpec.shellKind === 'fodder';
          if (slot.nukeShell) slot.nukeShell.visible = false;
          slot.mesh.scale.set(visSpec.diameter, visSpec.diameter, visSpec.length);
        } else {
          if (slot.nukeShell) slot.nukeShell.visible = false;
          slot.mesh.material = !isPlayerTeam
            ? enemyProjMat
            : weaponType === 'Ice Gun' || weaponType === 'LyoLaserGun'
            ? iceProjMat
            : playerProjMat;
          slot.mesh.scale.set(visSpec.diameter, visSpec.diameter, visSpec.length);
        }
        slot.mesh.position.copy(origin);
        slot.mesh.lookAt(
          origin.x + slot.vel.x,
          origin.y + slot.vel.y,
          origin.z + slot.vel.z,
        );
      });
    };

    const expGeo = new THREE.SphereGeometry(0.32, 8, 8);
    const explosionParticlePool = createFixedObjectPool<ExplosionParticle>({
      name: 'ExplosionParticles',
      peakCapacity: POOL_PEAK_CAPACITIES.explosionParticles,
      createSlot: (i) => {
        const mat = new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0xfec83e : 0xb4ff39,
          transparent: true,
          opacity: 1,
        });
        const m = new THREE.Mesh(expGeo, mat);
        m.visible = false;
        scene.add(m);
        return {
          active: false,
          mesh: m,
          vel: new THREE.Vector3(),
          life: 0,
          maxLife: 0.45,
        };
      },
      resetSlot: (ep) => {
        ep.life = 0;
        ep.maxLife = 0.45;
        ep.vel.set(0, 0, 0);
        (ep.mesh.material as THREE.MeshBasicMaterial).opacity = 1;
        ep.mesh.visible = true;
      },
      deactivateSlot: (ep) => {
        ep.life = 0;
        ep.vel.set(0, 0, 0);
        ep.mesh.visible = false;
      },
    });
    const explosionParticles = explosionParticlePool.slots;

    // 3D Debris Chunks Pool (Wood Planks, Concrete Blocks & Metal Fragments with Black Ink Outlines!)
    const debrisBoxGeo = new THREE.BoxGeometry(0.48, 0.16, 0.28);
    const debrisChunkPool = createFixedObjectPool<DebrisChunk3D>({
      name: 'DebrisChunks3D',
      peakCapacity: POOL_PEAK_CAPACITIES.debrisChunks,
      createSlot: () => {
        const mat = makeToonMat('#d69a56');
        const mesh = new THREE.Mesh(debrisBoxGeo, mat);
        mesh.castShadow = false;
        mesh.receiveShadow = true;
        mesh.visible = false;
        const outline = new THREE.Mesh(debrisBoxGeo, inkOutlineMat);
        outline.scale.setScalar(1.1);
        mesh.add(outline);
        scene.add(mesh);
        return {
          active: false,
          mesh,
          mat,
          pos: new THREE.Vector3(),
          vel: new THREE.Vector3(),
          rotVel: new THREE.Vector3(),
          life: 0,
          maxLife: 2.2,
          baseScale: new THREE.Vector3(1, 1, 1),
        };
      },
      resetSlot: (dc) => {
        dc.life = 0;
        dc.maxLife = 2.2;
        dc.pos.set(0, 0, 0);
        dc.vel.set(0, 0, 0);
        dc.rotVel.set(0, 0, 0);
        dc.baseScale.set(1, 1, 1);
        dc.mesh.visible = true;
      },
      deactivateSlot: (dc) => {
        dc.life = 0;
        dc.vel.set(0, 0, 0);
        dc.rotVel.set(0, 0, 0);
        dc.mesh.visible = false;
      },
    });
    const debrisChunks = debrisChunkPool.slots;

    const spawnDebrisChunks = (
      x: number,
      y: number,
      z: number,
      materialKind: 'wood' | 'concrete' | 'metal',
      count = 12,
      biasVx = 0,
      biasVz = 0,
    ) => {
      const palette =
        materialKind === 'wood'
          ? [0xd99b52, 0xb87638, 0xe8b574, 0x8c5322]
          : materialKind === 'concrete'
          ? [0x8b959e, 0x6c757d, 0xaab2b8, 0x525a61]
          : [0xff453a, 0x2b2d3c, 0xff9f0a, 0x636675];

      for (let spawned = 0; spawned < count; spawned++) {
        const dc = debrisChunkPool.acquire((slot) => {
          slot.maxLife = 1.65 + Math.random() * 0.85;
          slot.mat.color.setHex(palette[spawned % palette.length]);

          if (materialKind === 'wood') {
            // Elongated wood planks & splinters
            slot.baseScale.set(0.85 + Math.random() * 0.75, 0.45 + Math.random() * 0.35, 0.65 + Math.random() * 0.5);
          } else if (materialKind === 'concrete') {
            // Chunky concrete/brick blocks
            slot.baseScale.set(0.75 + Math.random() * 0.6, 0.85 + Math.random() * 0.65, 0.75 + Math.random() * 0.6);
          } else {
            // Bent barrel metal plates
            slot.baseScale.set(0.8 + Math.random() * 0.65, 0.35 + Math.random() * 0.3, 0.8 + Math.random() * 0.65);
          }
          slot.mesh.scale.copy(slot.baseScale);
          slot.pos.set(
            x + (Math.random() - 0.5) * 0.65,
            Math.max(0.25, y + Math.random() * 0.85),
            z + (Math.random() - 0.5) * 0.65,
          );
          slot.mesh.position.copy(slot.pos);
          slot.mesh.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI,
          );

          const ang = Math.random() * Math.PI * 2;
          const outSpd = 3.2 + Math.random() * 6.8;
          slot.vel.set(
            Math.cos(ang) * outSpd + biasVx * 0.45,
            5.2 + Math.random() * 6.5,
            Math.sin(ang) * outSpd + biasVz * 0.45,
          );
          slot.rotVel.set(
            (Math.random() - 0.5) * 16,
            (Math.random() - 0.5) * 16,
            (Math.random() - 0.5) * 16,
          );
        });
        if (!dc) break;
      }
    };

    // 5-Layer Original Long Hoang (Lyo) Toon Explosion & Muzzle Flash System
    const lyoExplosionSystem = createLyoExplosionSystem(scene, getTerrainElevation, {
      stampGrassShockwave: (wx, wz, radius, strength) => {
        lyoGrassSystem.stampExplosionShockwave(wx, wz, radius, strength);
      },
      onSpawnDebris: (wx, wy, wz, matKind, count) => {
        spawnDebrisChunks(wx, wy, wz, matKind, count);
      },
    });

    const spawnCollisionContactParticles = (
      x: number,
      y: number,
      z: number,
      normalX: number,
      normalZ: number,
      materialTag: CollisionMaterialTag,
      impactSpeed: number,
    ) => {
      const count = clamp(Math.round(3 + impactSpeed * 0.65), 3, 12);
      const baseAngle = Math.atan2(normalZ, normalX);
      for (let spawned = 0; spawned < count; spawned++) {
        const ep = explosionParticlePool.acquire((slot) => {
          slot.maxLife = 0.24 + Math.random() * 0.22;
          slot.mesh.position.set(
            x + (Math.random() - 0.5) * 0.25,
            y + 0.35 + Math.random() * 0.45,
            z + (Math.random() - 0.5) * 0.25,
          );
          slot.mesh.scale.setScalar(0.42 + Math.random() * 0.55);
          const mat = slot.mesh.material as THREE.MeshBasicMaterial;
          if (materialTag === 'metal') {
            mat.color.setHex(spawned % 2 === 0 ? 0xffa822 : 0xfff078);
          } else if (materialTag === 'tree') {
            mat.color.setHex(spawned % 2 === 0 ? 0x8be24b : 0xb57cff);
          } else if (materialTag === 'wood') {
            mat.color.setHex(spawned % 2 === 0 ? 0xdba05e : 0xf2c98a);
          } else {
            mat.color.setHex(spawned % 2 === 0 ? 0xd6a868 : 0xb5bec6);
          }
          const ang = baseAngle + (Math.random() - 0.5) * 1.35;
          const spd = (2.5 + Math.random() * 4.5) * clamp(impactSpeed / 6.0, 0.6, 1.7);
          slot.vel.set(Math.cos(ang) * spd, 2.4 + Math.random() * 4.2, Math.sin(ang) * spd);
        });
        if (!ep) break;
      }
    };

    const spawnBurstParticles = (x: number, y: number, z: number, count = 12) => {
      const terrainY = getTerrainElevation(x, z);
      for (let spawned = 0; spawned < count; spawned++) {
        const ep = explosionParticlePool.acquire((slot) => {
          slot.maxLife = 0.35 + Math.random() * 0.25;
          slot.mesh.position.set(x, terrainY + y, z);
          slot.mesh.scale.setScalar(0.7 + Math.random() * 0.8);
          (slot.mesh.material as THREE.MeshBasicMaterial).color.setHex(
            spawned % 2 === 0 ? 0xfec83e : 0xb4ff39,
          );
          const angle = Math.random() * Math.PI * 2;
          const spd = 3 + Math.random() * 7;
          slot.vel.set(Math.cos(angle) * spd, 4 + Math.random() * 6, Math.sin(angle) * spd);
        });
        if (!ep) break;
      }
    };

    // Directional Muzzle Sparks & Bazooka Rear Exhaust Backblast Spawner
    const spawnDirectionalSparks = (
      x: number,
      y: number,
      z: number,
      dirX: number,
      dirZ: number,
      count = 10,
      baseSpeed = 12,
      spread = 0.55,
    ) => {
      const baseAngle = Math.atan2(dirZ, dirX);
      for (let spawned = 0; spawned < count; spawned++) {
        const ep = explosionParticlePool.acquire((slot) => {
          slot.maxLife = 0.22 + Math.random() * 0.22;
          slot.mesh.position.set(
            x + (Math.random() - 0.5) * 0.2,
            y + (Math.random() - 0.5) * 0.2,
            z + (Math.random() - 0.5) * 0.2,
          );
          slot.mesh.scale.setScalar(0.45 + Math.random() * 0.65);
          (slot.mesh.material as THREE.MeshBasicMaterial).color.setHex(
            spawned % 2 === 0 ? 0xff9922 : 0xffe866,
          );
          const ang = baseAngle + (Math.random() - 0.5) * spread;
          const spd = baseSpeed * (0.65 + Math.random() * 0.7);
          slot.vel.set(Math.cos(ang) * spd, 1.5 + (Math.random() - 0.3) * 4.5, Math.sin(ang) * spd);
        });
        if (!ep) break;
      }
    };

    // Target Fire / Thermal Ignition Particle Spawner (for LG-88 Laser Gun target hits & Cluster Bomb / Incendiary blasts)
    const FIRE_PARTICLE_COLORS = [0xff2a00, 0xff5e00, 0xff9500, 0xffe600];
    const spawnTargetFireParticles = (
      x: number,
      y: number,
      z: number,
      count = 14,
      spreadRadius = 0.48,
    ) => {
      for (let i = 0; i < count; i++) {
        const ep = explosionParticlePool.acquire((slot) => {
          slot.maxLife = 0.34 + Math.random() * 0.28;
          const ang = Math.random() * Math.PI * 2;
          const r = Math.random() * spreadRadius;
          slot.mesh.position.set(
            x + Math.cos(ang) * r,
            y + 0.12 + Math.random() * 0.45,
            z + Math.sin(ang) * r,
          );
          slot.mesh.scale.setScalar(0.52 + Math.random() * 0.72);
          (slot.mesh.material as THREE.MeshBasicMaterial).color.setHex(
            FIRE_PARTICLE_COLORS[i % FIRE_PARTICLE_COLORS.length],
          );
          // High upward buoyancy velocity so flames flicker and rise on the target
          const horizSpd = 0.8 + Math.random() * 2.2;
          slot.vel.set(
            Math.cos(ang) * horizSpd,
            5.8 + Math.random() * 5.2,
            Math.sin(ang) * horizSpd,
          );
        });
        if (!ep) break;
      }
    };

    // 3D Coherent Photon Laser Beam Spawner (stretches from LG-88 muzzle to target impact point + ignites target with fire particles)
    const laserOuterCylGeo = new THREE.CylinderGeometry(0.11, 0.11, 1.0, 10, 1, true);
    const laserCoreCylGeo = new THREE.CylinderGeometry(0.042, 0.042, 1.0, 8, 1, true);
    const laserHitSphereGeo = new THREE.SphereGeometry(0.26, 10, 10);
    const laserUpAxis = new THREE.Vector3(0, 1, 0);
    const spawnLaserBeamEffect = (startPos: THREE.Vector3, endPos: THREE.Vector3) => {
      const delta = new THREE.Vector3().subVectors(endPos, startPos);
      const dist = Math.max(0.5, delta.length());
      const mid = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
      const dir = delta.clone().divideScalar(dist);

      const group = new THREE.Group();
      const outerMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.98,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const outerBeam = new THREE.Mesh(laserOuterCylGeo, outerMat);
      outerBeam.scale.set(1, dist, 1);
      outerBeam.position.copy(mid);
      outerBeam.quaternion.setFromUnitVectors(laserUpAxis, dir);
      group.add(outerBeam);

      const coreBeam = new THREE.Mesh(laserCoreCylGeo, coreMat);
      coreBeam.scale.set(1, dist, 1);
      coreBeam.position.copy(mid);
      coreBeam.quaternion.setFromUnitVectors(laserUpAxis, dir);
      group.add(coreBeam);

      const hitFlare = new THREE.Mesh(laserHitSphereGeo, outerMat);
      hitFlare.position.copy(endPos);
      group.add(hitFlare);

      scene.add(group);
      activeLaserBeams.push({
        group,
        outerMat,
        coreMat,
        life: 0,
        maxLife: 0.16,
      });
    };

    // TITAN-6 Rotary Gatling Ejected Brass Shell Casings + Hot Barrel Sparks
    const spawnGatlingBrassAndSparks = (
      muzzleX: number,
      muzzleY: number,
      muzzleZ: number,
      fwdX: number,
      fwdZ: number,
      rightX: number,
      rightZ: number,
    ) => {
      spawnDirectionalSparks(muzzleX, muzzleY, muzzleZ, fwdX, fwdZ, 12, 18, 0.62);
      // Eject 2 glinting brass 7.62mm shell casings to the right of the TITAN-6 receiver
      for (let i = 0; i < 2; i++) {
        debrisChunkPool.acquire((slot) => {
          slot.maxLife = 0.65 + Math.random() * 0.35;
          slot.mat.color.setHex(i === 0 ? 0xfacc15 : 0xeab308);
          slot.baseScale.set(0.16, 0.08, 0.28);
          slot.mesh.scale.copy(slot.baseScale);
          slot.pos.set(
            muzzleX - fwdX * 0.55 + rightX * 0.22,
            muzzleY + 0.04,
            muzzleZ - fwdZ * 0.55 + rightZ * 0.22,
          );
          slot.mesh.position.copy(slot.pos);
          const ejectSpd = 3.4 + Math.random() * 2.4;
          slot.vel.set(
            rightX * ejectSpd - fwdX * (0.6 + Math.random() * 0.8),
            3.2 + Math.random() * 2.2,
            rightZ * ejectSpd - fwdZ * (0.6 + Math.random() * 0.8),
          );
          slot.rotVel.set(
            (Math.random() - 0.5) * 24,
            (Math.random() - 0.5) * 24,
            (Math.random() - 0.5) * 24,
          );
        });
      }
    };

    // Preallocated Pool of 220 Ground Tank Track Tread Marks (left & right caterpillar ruts in grass/dirt)
    interface TankTrackMark {
      active: boolean;
      mesh: THREE.Mesh;
      mat: THREE.MeshBasicMaterial;
      life: number;
      maxLife: number;
    }
    const trackMarkGeo = new THREE.BoxGeometry(0.42, 0.04, 0.84);
    const tankTrackMarkPool = createFixedObjectPool<TankTrackMark>({
      name: 'TankTrackMarks',
      peakCapacity: POOL_PEAK_CAPACITIES.tankTrackMarks,
      createSlot: () => {
        const mat = new THREE.MeshBasicMaterial({
          color: 0x12360c,
          transparent: true,
          opacity: 0.82,
        });
        const m = new THREE.Mesh(trackMarkGeo, mat);
        m.visible = false;
        scene.add(m);
        return {
          active: false,
          mesh: m,
          mat,
          life: 0,
          maxLife: 16.0,
        };
      },
      resetSlot: (tm) => {
        tm.life = 0;
        tm.maxLife = 16.0;
        tm.mat.opacity = 0.82;
        tm.mesh.visible = true;
      },
      deactivateSlot: (tm) => {
        tm.life = 0;
        tm.mesh.visible = false;
      },
    });
    const tankTrackMarks = tankTrackMarkPool.slots;

    const spawnSingleTreadMark = (wx: number, wz: number, yaw: number) => {
      tankTrackMarkPool.acquire((slot) => {
        const wrappedX = wrapPlanetCoord(wx);
        const wrappedZ = wrapPlanetCoord(wz);
        const onRoad = evaluateRoadNetworkSdf(wrappedX, wrappedZ) < 0;
        slot.mat.color.setHex(onRoad ? 0x5c3818 : 0x10330b);
        slot.mesh.position.set(wrappedX, onRoad ? 0.064 : 0.085, wrappedZ);
        slot.mesh.rotation.set(0, yaw, 0);
      });
    };

    const tankTreadDistAccum = new Map<number, number>();
    const recordTankMovementAndTracks = (
      tank: TankVehicle,
      prevX: number,
      prevZ: number,
      prevYaw: number,
    ) => {
      const dx = getPlanetShortestDelta(tank.x, prevX);
      const dz = getPlanetShortestDelta(tank.z, prevZ);
      const fwdX = Math.cos(tank.hullYaw);
      const fwdZ = -Math.sin(tank.hullYaw);
      const fwdMove = dx * fwdX + dz * fwdZ;
      const yawDelta = tank.hullYaw - prevYaw;
      const deltaLeft = fwdMove - yawDelta * 1.45;
      const deltaRight = fwdMove + yawDelta * 1.45;

      // 1. Revolve the 18-segment left & right caterpillar tracks and spin all 8 wheels!
      stepLyoTankTracks(tank.bodyGroup, deltaLeft, deltaRight);

      // 2. Stamp dual track ruts into the 3D grass field & spawn ground tread decals
      const stepDist = Math.hypot(dx, dz) + Math.abs(yawDelta) * 1.1;
      if (stepDist > 0.008) {
        const halfTrackW = tank.isSuper ? 1.54 : 1.38;
        const rightX = Math.sin(tank.hullYaw);
        const rightZ = Math.cos(tank.hullYaw);
        const leftX = tank.x - rightX * halfTrackW;
        const leftZ = tank.z - rightZ * halfTrackW;
        const rgtX = tank.x + rightX * halfTrackW;
        const rgtZ = tank.z + rightZ * halfTrackW;

        // Stamp grass crushing under both caterpillar tracks when moving
        if (stepDist > 0.03) {
          lyoGrassSystem.stampTankTracks(leftX, leftZ, rgtX, rgtZ);
        }

        if (tank.vehicleKind !== 'truck') {
          const prevAcc = tankTreadDistAccum.get(tank.id) || 0;
          const nextAcc = prevAcc + stepDist;
          if (nextAcc >= 0.46) {
            tankTreadDistAccum.set(tank.id, nextAcc % 0.46);
            spawnSingleTreadMark(leftX, leftZ, tank.hullYaw);
            spawnSingleTreadMark(rgtX, rgtZ, tank.hullYaw);
          } else {
            tankTreadDistAccum.set(tank.id, nextAcc);
          }
        }
      }
    };

    // Dynamic Mode Switch Handler (Sandbox <-> Map Editor <-> Run Match With AI)
    const editorPan = { x: 0, z: 2.0 };
    let editorZoom = 1.0;

    applyPlayModeRef.current = (nextMode: PlayMode) => {
      editorCursorGroup.visible = nextMode === 'editor';
      matchGameOverTriggered = false;
      // Mark all active projectiles inactive on mode switch instead of destroying them
      projectilePool.releaseAll();

      if (nextMode === 'match') {
        ensureMatchAiSquadsSpawned();
      } else {
        // Sandbox or Editor: immediately remove all AI NPCs and reset Base HP so bases are safe
        clearAllNonPlayerNpcs();
        blueBaseHp = 2000;
        redBaseHp = 2000;
        syncPadVisuals(blueBase, bluePadSlots, 'BLUE', blueBaseHp);
        syncPadVisuals(redBase, redPadSlots, 'RED', redBaseHp);
      }

      if (nextMode === 'editor') {
        editorPan.x = 0;
        editorPan.z = 1.5;
      }
    };

    // =========================================================================
    // 10. INTERACTION HANDLERS:
    //     [E] PICKUP / THROW CRATE TO 2x2x2 PAD (STRICTLY WITHIN [Q] GHOST SLOTS)
    //     [F] KICK OPEN CRATE OR CRAFT STACKING PAD (WEAPON / AI BUDDY / LYO TANK)
    //     [G] MOUNT / DISMOUNT OPEN-TOP LYO TANK
    //     [Q] CYCLE BUILD ORDER GHOST WIREFRAME · [V] CURSOR AI COMMAND + SALUTE
    // =========================================================================
    const getPlayerAudioListenerPos = (): { x: number; z: number } => {
      if (mountedTank) {
        return { x: mountedTank.x, z: mountedTank.z };
      }
      return { x: playerUnit.x, z: playerUnit.z };
    };

    const playSpatialSoundAt = (
      sourceX: number,
      sourceZ: number,
      maxDistance: number,
      refDistance: number,
      fn: () => void,
    ): void => {
      const listener = getPlayerAudioListenerPos();
      const gain = computeSpatialAudioGain(
        listener.x,
        listener.z,
        sourceX,
        sourceZ,
        maxDistance,
        refDistance,
      );
      soundEngine.withSpatialGain(gain, fn);
    };

    const playBuildBoxSoundAtPad = (
      team: 'blue' | 'red',
      padX: number,
      padZ: number,
      isPlayerAction: boolean,
      fn: () => void,
    ): void => {
      const listener = getPlayerAudioListenerPos();
      const baseObj = team === 'blue' ? blueBase : redBase;
      const gain = computeBuildBoxAudioGain(
        listener.x,
        listener.z,
        padX,
        padZ,
        baseObj.hqX,
        baseObj.hqZ,
        isPlayerAction,
      );
      soundEngine.withSpatialGain(gain, fn);
    };

    const addCrateToPadSlots = (
      team: 'blue' | 'red',
      kind: WorldCrateKind,
      commanderIdx = 0,
      strictColorOnly = false,
    ): boolean => {
      if (kind === 'medical') return false;
      const slotsList = team === 'blue' ? bluePadSlotsList : redPadSlotsList;
      const isPlayerMainPad = team === 'blue' && commanderIdx === 0;

      // Special Indestructible Supply Drop Metallic Box Instant Full Boost!
      if (kind === 'silver_metallic' || kind === 'gold_metallic') {
        const specialBoost = evaluateSpecialMetallicCratePadBoost(kind);
        slotsList[commanderIdx] = [...specialBoost.filledSlots];
        if (isPlayerMainPad) {
          buildOrder = specialBoost.buildOrder;
          useCustomHologramRecipe = false;
        } else {
          aiBuildOrders[commanderIdx % aiBuildOrders.length] = specialBoost.buildOrder;
        }
        if (team === 'blue') {
          gold += specialBoost.bonusGold;
          score += specialBoost.bonusScore;
          kioskStatusMessage = specialBoost.rewardLabel;
          kioskStatusTimer = 5.5;
          if (playerUnit && playerUnit.alive) {
            playerUnit.saluteTimer = 2.6;
            playerUnit.saluteSign.updateText(
              kind === 'gold_metallic' ? 'SHINY GOLD BOX BOOST!' : 'SILVER BOX BOOST!',
              `+${specialBoost.bonusGold}G & INSTANT OVERPOWER CRAFT!`,
              kind === 'gold_metallic' ? '#facc15' : '#38bdf8',
              1,
            );
            playerUnit.saluteSign.sprite.visible = true;
          }
          syncPadVisuals(blueBase, bluePadSlotsList[0], 'BLUE', blueBaseHp);
        } else {
          syncPadVisuals(redBase, redPadSlotsList[0], 'RED', redBaseHp);
        }
        craftFromCommanderPad(team, commanderIdx, isPlayerMainPad);
        if (kind === 'silver_metallic' && worldPickups.length > 0) {
          const latestPickup = worldPickups[worldPickups.length - 1];
          if (latestPickup && latestPickup.kind === 'weapon') {
            latestPickup.weaponName =
              specialBoost.overpowerWeaponName ?? 'LG-88 Photon Lance (Overpower Tier)';
            latestPickup.remainingAmmo = 180;
          }
        }
        return true;
      }

      const slots = slotsList[commanderIdx] || slotsList[0];
      const activePattern: BuildOrderTarget = isPlayerMainPad
        ? useCustomHologramRecipe
          ? buildOrder
          : 'AUTO'
        : aiBuildOrders[commanderIdx % aiBuildOrders.length];
      let nextIdx =
        isPlayerMainPad && useCustomHologramRecipe && KIOSK_BUILD_PRIORITY_RECIPES[activePriorityRecipe]
          ? chooseNextPadSlotIndexForHologram(
              slots,
              KIOSK_BUILD_PRIORITY_RECIPES[activePriorityRecipe].slotHologramColors,
              kind,
              buildOrder,
              strictColorOnly,
            )
          : chooseNextPadSlotIndex(slots, activePattern);
      if (nextIdx === -1 && isPlayerMainPad && !strictColorOnly) {
        nextIdx = chooseNextPadSlotIndex(slots, 'AUTO');
      }
      if (nextIdx === -1) return false;
      slots[nextIdx] = kind;
      if (team === 'blue') {
        syncPadVisuals(blueBase, bluePadSlotsList[0], 'BLUE', blueBaseHp);
        // Auto-Burst & Continuous Queue Build: when the active hologram target on Blue Pad P1 is fulfilled,
        // the stacked boxes burst and craft the item automatically without needing to be kicked ([F])!
        const isHoloFulfilled =
          useCustomHologramRecipe &&
          evaluatePadHologramState(true, useCustomHologramRecipe, activePriorityRecipe, slots)
            .isFulfilled;
        const isManualOrderFulfilled =
          !useCustomHologramRecipe &&
          buildOrder !== 'AUTO' &&
          evaluateStackingPadRecipe(slots).totalCrates >=
            (BUILD_ORDER_SPECS[buildOrder]?.targetCrates ?? 8);
        if (isPlayerMainPad && (isHoloFulfilled || isManualOrderFulfilled)) {
          craftFromCommanderPad('blue', 0, true);
        }
      } else {
        syncPadVisuals(redBase, redPadSlotsList[0], 'RED', redBaseHp);
      }
      return true;
    };

    const startDumpTruckHydraulicUnload = (
      truck: TankVehicle,
      preferredMode?: 'pad' | 'ground',
    ) => {
      if ((truck.dumpAnimTimer ?? 0) > 0) return;
      const distToPad = getPlanetShortestDistance(truck.x, truck.z, blueBase.padX, blueBase.padZ);
      truck.dumpTargetMode =
        preferredMode ?? (distToPad <= 9.5 ? 'pad' : 'ground');
      truck.dumpAnimTimer = 0.001;
      truck.dumpReleasedInCycle = truck.storedCrates.length === 0;
      soundEngine.playHydraulicLift();
    };

    const handlePlayerPickupOrThrowCrate = () => {
      if (mountedTank) {
        if (mountedTank.vehicleKind === 'truck') {
          if ((mountedTank.dumpAnimTimer ?? 0) > 0) return;
          // Pressing [E] inside the Dump Truck operates the hydraulic dump bed to unload crates
          // (Trucks no longer auto-scoop crates from the ground — the character must load crates one-by-one on foot!)
          startDumpTruckHydraulicUnload(
            mountedTank,
            mountedTank.storedCrates.length > 0 ? undefined : 'ground',
          );
          return;
        }

        if (mountedTank.storedCrates.length > 0) {
          const distToPad = getPlanetShortestDistance(mountedTank.x, mountedTank.z, blueBase.padX, blueBase.padZ);
          if (distToPad <= 9.0) {
            while (mountedTank.storedCrates.length > 0) {
              const cKind = mountedTank.storedCrates[0];
              if (!addCrateToPadSlots('blue', cKind, 0)) break;
              mountedTank.storedCrates.shift();
            }
            soundEngine.playPickup();
            return;
          }
        }
        return;
      }

      if (!playerUnit.alive || ridingTramCarIdx !== null) return;

      // Case A: Already carrying a crate above head -> Load 1 crate into nearby Dump Truck, or Throw toward Stacking Pad / forward!
      if (playerUnit.carryingCrate !== 'none') {
        const carriedKind = playerUnit.carryingCrate;
        const fwdX = Math.cos(playerUnit.yaw);
        const fwdZ = -Math.sin(playerUnit.yaw);
        const throwX = wrapPlanetCoord(playerUnit.x + fwdX * 2.4);
        const throwZ = wrapPlanetCoord(playerUnit.z + fwdZ * 2.4);

        // Priority 1: Manual One-by-One Loading into nearest Dump Truck Vessel (within 2.9m)!
        let targetTruck: TankVehicle | null = null;
        let bestTruckDist = INTERACT_EXIT_RADIUS;
        for (const v of tanks) {
          if (
            v.vehicleKind === 'truck' &&
            v.hp > 0 &&
            canLoadCrateIntoDumpTruck(v.storedCrates.length, (v.dumpAnimTimer ?? 0) > 0, true)
          ) {
            const rearX = wrapPlanetCoord(v.x - Math.cos(v.hullYaw) * 1.45);
            const rearZ = wrapPlanetCoord(v.z + Math.sin(v.hullYaw) * 1.45);
            const dPlayer = Math.min(
              getPlanetShortestDistance(playerUnit.x, playerUnit.z, v.x, v.z),
              getPlanetShortestDistance(playerUnit.x, playerUnit.z, rearX, rearZ),
            );
            const dThrow = Math.min(
              getPlanetShortestDistance(throwX, throwZ, v.x, v.z),
              getPlanetShortestDistance(throwX, throwZ, rearX, rearZ),
            );
            const effDist = Math.min(dPlayer, dThrow);
            if (effDist <= bestTruckDist) {
              bestTruckDist = effDist;
              targetTruck = v;
            }
          }
        }

        if (targetTruck && carriedKind !== 'medical') {
          playerUnit.carryingCrate = 'none';
          playerUnit.overheadCrateGroup.visible = false;
          targetTruck.storedCrates.push(carriedKind);
          syncLyoDumpTruckCargoVisuals(targetTruck.bodyGroup, targetTruck.storedCrates);
          spawnBurstParticles(targetTruck.x, 1.85, targetTruck.z, 10);
          soundEngine.playPickup();
          return;
        }

        playerUnit.carryingCrate = 'none';
        playerUnit.overheadCrateGroup.visible = false;
        soundEngine.playCrateThrow();

        const distToBluePad = getPlanetShortestDistance(playerUnit.x, playerUnit.z, blueBase.padX, blueBase.padZ);
        if (isPadDepositPromptActive || distToBluePad <= INTERACT_EXIT_RADIUS) {
          if (addCrateToPadSlots('blue', carriedKind, 0)) {
            score += carriedKind === 'legend' ? 95 : carriedKind === 'super' ? 60 : 30;
            spawnBurstParticles(blueBase.padX, 1.8, blueBase.padZ, 10);
            soundEngine.playPickup();
            return;
          }
        }

        // Otherwise throw crate forward onto the ground with momentum (never lost to worldCrates cap or wall clipping)
        let launchX = wrapPlanetCoord(playerUnit.x + fwdX * 0.95);
        let launchZ = wrapPlanetCoord(playerUnit.z + fwdZ * 0.95);
        const throwCheckObbs = getStaticWorldStructures();
        for (let oi = 0; oi < throwCheckObbs.length; oi++) {
          const obb = throwCheckObbs[oi];
          if (pointInObb2D(launchX, launchZ, obb.x, obb.z, obb.halfX, obb.halfZ, obb.rotY, 0.72)) {
            launchX = playerUnit.x;
            launchZ = playerUnit.z;
            break;
          }
        }
        const thrownCrate = spawnWorldCrate(carriedKind, launchX, launchZ, true, true);
        if (thrownCrate) {
          const groundY = getTerrainElevation(launchX, launchZ) + 0.66;
          thrownCrate.y = groundY + 1.15;
          thrownCrate.mesh.position.set(launchX, thrownCrate.y, launchZ);
          thrownCrate.rotY = playerUnit.yaw;
          thrownCrate.mesh.rotation.y = thrownCrate.rotY;
          thrownCrate.vx = fwdX * 10.6 + playerUnit.vx * 0.35;
          thrownCrate.vz = fwdZ * 10.6 + playerUnit.vz * 0.35;
          thrownCrate.vy = 4.2;
          thrownCrate.rotVelY = (Math.random() - 0.5) * 2.4;
          thrownCrate.squashTimer = 0;
          thrownCrate.mesh.scale.set(1, 1, 1);
          thrownCrate.mesh.visible = true;
        }
        return;
      }

      // Case B: Not carrying -> Find nearest grounded crate within 2.9m and lift it overhead!
      let nearestCrate: WorldCrate | null = null;
      let bestDist = INTERACT_EXIT_RADIUS;
      for (const c of worldCrates) {
        if (c.state === 'grounded' || c.state === 'falling') {
          const d = getPlanetShortestDistance(c.x, c.z, playerUnit.x, playerUnit.z);
          if (d <= bestDist) {
            bestDist = d;
            nearestCrate = c;
          }
        }
      }

      if (nearestCrate) {
        playerUnit.carryingCrate = nearestCrate.kind;
        if (playerUnit.overheadCrateGroup.userData.lyoBoxKind !== nearestCrate.kind) {
          populateRealLyoCrateBoxFromGlb(
            playerUnit.overheadCrateGroup,
            nearestCrate.kind,
            loadedLyoAssets,
            windUniforms,
            isSoftwareGl,
            UNIFIED_WORLD_CRATE_SIZE,
          );
        } else {
          playerUnit.overheadCrateBox.material = getCrateFallbackMaterial(nearestCrate.kind);
        }
        playerUnit.overheadCrateGroup.visible = true;
        scene.remove(nearestCrate.mesh);
        const idx = worldCrates.indexOf(nearestCrate);
        if (idx !== -1) worldCrates.splice(idx, 1);
        soundEngine.playPickup();
        return;
      }

      // Case B.2: Standing beside the Self-Service Tactical Kiosk (icon active or dist <= 2.9m) -> Open Tactical Kiosk UI!
      const kioskWorldPos = getBlueKioskWorldCenter(0);
      const distToKiosk = getPlanetShortestDistance(
        playerUnit.x,
        playerUnit.z,
        kioskWorldPos.x,
        kioskWorldPos.z,
      );
      if (isKioskPromptActive || distToKiosk <= INTERACT_EXIT_RADIUS) {
        soundEngine.playUiClick();
        emitHudImmediately();
        window.dispatchEvent(new CustomEvent('toggle-kiosk-ui'));
        return;
      }

      // Case C: Standing in the West Lobby Safe Zone Plaza (x in [-104.5, -75.0], |z| <= 38) -> Interact with the 2 Artisanal Kiosks & Pergola Pavilion!
      if (playerUnit.x <= -75.0 && playerUnit.x >= -104.5 && Math.abs(playerUnit.z) <= 38.0) {
        const skinCycle: BaseSkinThemeId[] = ['military_standard', 'cyber_neon', 'desert_ops', 'royal_gold'];
        const gardenCycle: BaseGardenPresetId[] = ['sakura_grove', 'zen_rock', 'golden_park', 'tactical_plaza'];
        const myBase = blueCommanderBases[0];
        if (playerUnit.z < -13.8) {
          const nextSkin = skinCycle[(skinCycle.indexOf(myBase.skinTheme) + 1) % skinCycle.length];
          myBase.skinTheme = nextSkin;
          playerUnit.saluteTimer = 2.0;
          playerUnit.saluteSign.updateText('KIOSK 1: SKIN RUMAH', BASE_SKIN_THEMES[nextSkin].name.toUpperCase(), '#38bdf8', 1);
          playerUnit.saluteSign.sprite.visible = true;
        } else if (playerUnit.z > 2.0) {
          const nextGarden = gardenCycle[(gardenCycle.indexOf(myBase.gardenPreset) + 1) % gardenCycle.length];
          myBase.gardenPreset = nextGarden;
          const gardenSpec = BASE_GARDEN_PRESETS.find((g) => g.id === nextGarden) || BASE_GARDEN_PRESETS[0];
          playerUnit.saluteTimer = 2.0;
          playerUnit.saluteSign.updateText('PAVILION: TAMAN BASE', gardenSpec.name.toUpperCase(), '#4ade80', 1);
          playerUnit.saluteSign.sprite.visible = true;
        } else {
          const nextSkin = skinCycle[(skinCycle.indexOf(myBase.skinTheme) + 1) % skinCycle.length];
          myBase.skinTheme = nextSkin;
          myBase.fenceHp = myBase.fenceMaxHp;
          playerUnit.saluteTimer = 2.0;
          playerUnit.saluteSign.updateText('KIOSK 2: SKIN PAGAR', `${BASE_SKIN_THEMES[nextSkin].name.toUpperCase()} + FULL HP`, '#facc15', 1);
          playerUnit.saluteSign.sprite.visible = true;
        }
        soundEngine.playPowerCore();
        spawnBurstParticles(playerUnit.x, 2.2, playerUnit.z, 16);
        syncPadVisuals(blueBase, bluePadSlots, 'BLUE', blueBaseHp);
      }
    };

    const ensureBlueNuclearLauncherDeployed = (): NuclearLauncherTurretRig => {
      let nl = activeNuclearLaunchers.find((n) => n.team === 'blue');
      if (!nl) {
        nl = buildProceduralNuclearLauncherTurret(windUniforms, isSoftwareGl, 'blue');
        const nlX = wrapPlanetCoord(blueBase.padX - 6.2);
        const nlZ = wrapPlanetCoord(blueBase.padZ - 5.4);
        nl.root.position.set(nlX, getTerrainElevation(nlX, nlZ), nlZ);
        scene.add(nl.root);
        activeNuclearLaunchers.push(nl);
        spawnBurstParticles(nlX, 2.6, nlZ, 26);
      }
      return nl;
    };

    const craftFromCommanderPad = (
      team: 'blue' | 'red',
      commanderIdx = 0,
      isPlayerAction = false,
    ): boolean => {
      const isBlue = team === 'blue';
      const sign = isBlue ? 1 : -1;
      const baseObj = isBlue ? blueBase : redBase;
      const commanderBases = isBlue ? blueCommanderBases : redCommanderBases;
      const plotBase = commanderBases[commanderIdx] || commanderBases[0];
      if (plotBase && plotBase.destroyed) return false;

      const slotsList = isBlue ? bluePadSlotsList : redPadSlotsList;
      const slots = slotsList[commanderIdx] || slotsList[0];
      const padEval = evaluateStackingPadRecipe(slots);
      if (padEval.totalCrates === 0) return false;

      const activeOrder: BuildOrderTarget =
        isBlue && commanderIdx === 0 ? buildOrder : aiBuildOrders[commanderIdx % aiBuildOrders.length];

      const padMeshObj = baseObj.commanderPads[commanderIdx] || baseObj.commanderPads[0];
      playBuildBoxSoundAtPad(team, padMeshObj.padX, padMeshObj.padZ, isPlayerAction, () => {
        soundEngine.playBuildBoxCraft(!isPlayerAction);
      });
      spawnBurstParticles(padMeshObj.padX, 2.0, padMeshObj.padZ, 18);
      spawnDebrisChunks(
        padMeshObj.padX,
        1.15,
        padMeshObj.padZ,
        padEval.isSuper ? 'metal' : 'wood',
        10,
      );
      scratchExplosionPos.set(padMeshObj.padX, 1.15, padMeshObj.padZ);
      lyoExplosionSystem.spawnLyoExplosion(scratchExplosionPos, 0.78, 'crate');

      const advanceBluePlayerBuildQueue = () => {
        if (!isBlue || commanderIdx !== 0) return;
        const qAdv = advanceKioskBuildQueueOnCraft(blueBuildQueue);
        blueBuildQueue = qAdv.queue;
        if (qAdv.hasMoreQueued && qAdv.nextActiveRecipe) {
          activePriorityRecipe = qAdv.nextActiveRecipe;
          useCustomHologramRecipe = true;
          const nextSpec = KIOSK_BUILD_PRIORITY_RECIPES[activePriorityRecipe];
          if (nextSpec) {
            buildOrder = nextSpec.buildOrder;
            kioskStatusMessage = `SELESAI! LANJUT ANTRIAN (${blueBuildQueue.length}/${MAX_KIOSK_BUILD_QUEUE}): ${nextSpec.name.toUpperCase()}`;
            kioskStatusTimer = 4.5;
          }
        } else {
          useCustomHologramRecipe = false;
        }
      };

      // Handle Base Upgrade & Facility Build Orders ('upgrade_building', 'upgrade_fence', 'build_parking', 'build_helipad')
      if (
        activeOrder === 'upgrade_building' ||
        activeOrder === 'upgrade_fence' ||
        activeOrder === 'build_parking' ||
        activeOrder === 'build_helipad'
      ) {
        const upgRes = applyCommanderBaseUpgrade(plotBase, activeOrder, padEval.totalCrates);
        if (!upgRes.upgraded) return false;
        if (isBlue) {
          blueBaseHp = blueCommanderBases.reduce((acc, b) => acc + b.buildingHp, 0);
          score += 320;
        } else {
          redBaseHp = redCommanderBases.reduce((acc, b) => acc + b.buildingHp, 0);
        }
        slotsList[commanderIdx] = createEmptyPadSlots();
        advanceBluePlayerBuildQueue();
        if (isBlue) {
          bluePadSlots = bluePadSlotsList[0];
          syncPadVisuals(blueBase, bluePadSlots, 'BLUE', blueBaseHp);
          emitHudImmediately();
        } else {
          redPadSlots = redPadSlotsList[0];
          syncPadVisuals(redBase, redPadSlots, 'RED', redBaseHp);
        }
        return true;
      }

      const spawnX = wrapPlanetCoord(padMeshObj.padX - sign * 3.4);
      const spawnZ = wrapPlanetCoord(padMeshObj.padZ - sign * 2.2);

      // Personal Helipad (relZ = -5.6, lx = 6.8, opposite Crate Pad) & Roofless Vehicle Parking Bay (relZ = -5.6, lx = 13.8, opposite Kiosk)
      // Both face RIGHT (+relZ / +X for Blue Base) across toward the Kiosk & central exit driveway!
      const heliX = wrapPlanetCoord(padMeshObj.padX - sign * 12.9);
      const heliZ = wrapPlanetCoord(padMeshObj.padZ + sign * 1.4);
      const bayX = wrapPlanetCoord(padMeshObj.padX - sign * 12.9);
      const bayZ = wrapPlanetCoord(padMeshObj.padZ - sign * 5.6);
      const bayParallelYaw = isBlue ? 0 : Math.PI;
      const customBlueRecipe: KioskBuildPriorityRecipeId | null =
        isBlue && commanderIdx === 0 && useCustomHologramRecipe ? activePriorityRecipe : null;

      if (customBlueRecipe === 'nuclear_launcher') {
        ensureBlueNuclearLauncherDeployed();
        score += 500;
        kioskStatusMessage =
          "MLRS-MK5 'ATLAS' NUCLEAR LAUNCHER SELESAI DIRAKIT! TEKAN [N] ATAU [E] DI LAUNCHER UNTUK TARGET!";
        kioskStatusTimer = 5.0;
      } else if (
        customBlueRecipe === 'hand_grenade' ||
        customBlueRecipe === 'land_mine' ||
        customBlueRecipe === 'cluster_bomb'
      ) {
        if (playerUnit && playerUnit.alive) {
          if (customBlueRecipe === 'hand_grenade' || customBlueRecipe === 'land_mine') {
            playerUnit.tacticalLoadout = addTacticalSecondaryToLoadout(
              playerUnit.tacticalLoadout,
              customBlueRecipe,
              3,
            );
            syncUnitFieldsFromLoadout(playerUnit);
          } else {
            playerUnit.secondaryItem = customBlueRecipe;
            playerUnit.secondaryCount = Math.min(
              9,
              (playerUnit.secondaryItem === customBlueRecipe ? playerUnit.secondaryCount : 0) + 3,
            );
          }
        }
        const popSec = computeStackingPadWeaponPopOutTrajectory(
          padMeshObj.padX,
          padMeshObj.padZ,
          0,
          1,
          sign,
        );
        spawnWorldPickup(
          'secondary',
          customBlueRecipe === 'hand_grenade'
            ? 'HG-04 Frag Grenade'
            : customBlueRecipe === 'land_mine'
              ? 'TM-89 Land Mine'
              : 'CB-24 Cluster Bomb',
          popSec.startX,
          popSec.startZ,
          {
            secondaryId: customBlueRecipe,
            secondaryCount: 3,
            vx: popSec.vx,
            vy: popSec.vy,
            vz: popSec.vz,
            despawnTimerSec: TEAM_BUDDIES_CRAFTED_WEAPON_DESPAWN_SEC,
          },
        );
        score += 180;
      } else if (customBlueRecipe === 'laser_gun' || customBlueRecipe === 'gatling_mortar') {
        const isGat = customBlueRecipe === 'gatling_mortar';
        const popSpecial = computeStackingPadWeaponPopOutTrajectory(
          padMeshObj.padX,
          padMeshObj.padZ,
          0,
          1,
          sign,
        );
        spawnWorldPickup(
          'weapon',
          isGat ? 'TITAN-6 Rotary Gatling' : 'LG-88 Photon Lance',
          popSpecial.startX,
          popSpecial.startZ,
          {
            weaponId: 'rifle',
            remainingAmmo: isGat ? 240 : 140,
            vx: popSpecial.vx,
            vy: popSpecial.vy,
            vz: popSpecial.vz,
            despawnTimerSec: TEAM_BUDDIES_CRAFTED_WEAPON_DESPAWN_SEC,
          },
        );
        score += isGat ? 320 : 220;
      } else if (padEval.spawnType === 'plane') {
        // 8 Crates (2x2x2) with Legend Crate -> Auto-build Helipad in Plot & Spawn Pesawat Pengebom / Lyo Fighter Plane facing RIGHT!
        plotBase.hasHelipad = true;
        const newPlane = createLyoPlaneVehicle(heliX, heliZ, team);
        newPlane.maxHp = 620;
        newPlane.hp = 620;
        newPlane.hullYaw = bayParallelYaw;
        newPlane.bodyGroup.rotation.y = newPlane.hullYaw;
        tanks.push(newPlane);
        spawnBurstParticles(heliX, 2.2, heliZ, 22);
        if (isBlue) score += 650;
      } else if (padEval.spawnType === 'tank') {
        // 8 Crates (2x2x2) -> Heavy Tank (2 Kursi) or Super Tank (Laser / Mammoth Tyrant Tank with 2.2x Armor when Blue Crates used)!
        plotBase.hasParkingBay = true;
        const newTank = createLyoTankVehicle(bayX, bayZ, padEval.isSuper, team);
        const armorMult = padEval.vehicleStatMultiplier?.armorMultiplier ?? (padEval.isSuper ? 2.2 : 1.0);
        newTank.maxHp = Math.round(260 * armorMult);
        newTank.hp = newTank.maxHp;
        newTank.hullYaw = bayParallelYaw;
        newTank.turretYaw = bayParallelYaw;
        newTank.bodyGroup.rotation.y = newTank.hullYaw;
        newTank.turretGroup.rotation.y = 0;
        tanks.push(newTank);
        spawnBurstParticles(bayX, 2.0, bayZ, 20);
        if (isBlue) score += padEval.isSuper ? 500 : 350;
      } else if (padEval.spawnType === 'truck') {
        // 4 Flat Crates (2x2x1) -> Senjata Berat / Auto-Turret (Tier 3) + Drivable Lyo Dump Truck!
        plotBase.hasParkingBay = true;
        const newTruck = createLyoDumpTruckVehicle(bayX, bayZ, team, bayParallelYaw);
        if (padEval.isSuper) {
          newTruck.maxHp = 480;
          newTruck.hp = 480;
        }
        tanks.push(newTruck);
        // Also pop out Tier 3 Heavy Weapon (Gatling Gun / Homing Missile Launcher) to the pad perimeter border!
        const tier3WeaponLabel = padEval.isSuper
          ? 'Homing Missile Launcher (Tier 3 Super)'
          : 'Gatling Gun / Mortar (Tier 3)';
        const pop3 = computeStackingPadWeaponPopOutTrajectory(
          padMeshObj.padX,
          padMeshObj.padZ,
          0,
          1,
          sign,
        );
        spawnWorldPickup('weapon', tier3WeaponLabel, pop3.startX, pop3.startZ, {
          weaponId: padEval.isSuper ? 'rocket' : 'rifle',
          remainingAmmo: 160,
          vx: pop3.vx,
          vy: pop3.vy,
          vz: pop3.vz,
          despawnTimerSec: TEAM_BUDDIES_CRAFTED_WEAPON_DESPAWN_SEC,
        });
        spawnBurstParticles(bayX, 2.0, bayZ, 18);
        if (isBlue) score += 280;
      } else if (padEval.spawnType === 'skyshield') {
        // 2 Horizontal Crates (2x1x1) with Blue/Purple -> Rebuild/Repair Skyshield 35mm Turret + Pop out Medium Tier-2 Super Weapon to pad border!
        const turrets = getBaseSkyshieldTurrets(baseObj.baseGroup);
        const ownTurret = turrets[commanderIdx % Math.max(1, turrets.length)];
        const targetTurret =
          ownTurret && !ownTurret.isBuilt
            ? ownTurret
            : turrets.find((st) => !st.isBuilt) || ownTurret;
        if (targetTurret) {
          targetTurret.isBuilt = true;
          targetTurret.maxHp = padEval.isLegend ? 420 : 320;
          targetTurret.hp = targetTurret.maxHp;
          targetTurret.root.visible = true;
          const tIdx = turrets.indexOf(targetTurret);
          const teamBases = isBlue ? blueCommanderBases : redCommanderBases;
          if (tIdx >= 0 && teamBases[tIdx]) {
            teamBases[tIdx].hasSkyshield = true;
          }
          plotBase.hasSkyshield = true;
          const twx = isBlue ? baseObj.hqX + targetTurret.localZ : baseObj.hqX - targetTurret.localZ;
          const twz = isBlue ? baseObj.hqZ - targetTurret.localX : baseObj.hqZ + targetTurret.localX;
          spawnBurstParticles(twx, 3.2, twz, 24);
        }
        const popSky = computeStackingPadWeaponPopOutTrajectory(
          padMeshObj.padX,
          padMeshObj.padZ,
          0,
          1,
          sign,
        );
        spawnWorldPickup(
          'weapon',
          padEval.isLegend ? 'Ion Cannon Rifle (Tier 2 Legend)' : 'Laser Gun / Super Bazooka (Tier 2)',
          popSky.startX,
          popSky.startZ,
          {
            weaponId: 'rocket',
            remainingAmmo: 60,
            vx: popSky.vx,
            vy: popSky.vy,
            vz: popSky.vz,
            despawnTimerSec: TEAM_BUDDIES_CRAFTED_WEAPON_DESPAWN_SEC,
          },
        );
        if (isBlue) score += 320;
      } else if (padEval.spawnType === 'buddy') {
        // 2 Vertical (1x1x2 -> Unit Pasukan / Super Buddy 2x HP & Speed) or 4 Vertical (2x1x2 -> Kendaraan Ringan Mini-Tank 1 Kursi + Super Unit)
        if (padEval.shapeKey === '2x1x2') {
          // 4 Vertical Wall Crates (2x1x2) -> Spawn Kendaraan Ringan: Agile 1-Seat Mini-Tank (or Super Laser Mini-Tank with Blue crates)!
          plotBase.hasParkingBay = true;
          const miniTank = createLyoTankVehicle(bayX, bayZ, padEval.isSuper, team);
          miniTank.bodyGroup.scale.multiplyScalar(0.8);
          miniTank.maxHp = padEval.isSuper ? 320 : 180;
          miniTank.hp = miniTank.maxHp;
          miniTank.hullYaw = bayParallelYaw;
          miniTank.turretYaw = bayParallelYaw;
          miniTank.bodyGroup.rotation.y = miniTank.hullYaw;
          miniTank.turretGroup.rotation.y = 0;
          tanks.push(miniTank);
          spawnBurstParticles(bayX, 1.8, bayZ, 16);
        }
        const ownedAlive = buddyUnits.filter(
          (b) => b.team === team && b.alive && b.ownerCommanderId === commanderIdx,
        );
        if (canCommanderBuildCharacter(ownedAlive.length, MAX_CHARACTERS_PER_COMMANDER)) {
          let chosenClass: BuddyClassId = BLUE_BUDDY_ROTATION[blueBuddyClassIdx % BLUE_BUDDY_ROTATION.length];
          blueBuddyClassIdx++;
          if (isBlue && commanderIdx === 0 && useCustomHologramRecipe) {
            if (activePriorityRecipe === 'buddy_ninja') chosenClass = 'Ninja';
            else if (activePriorityRecipe === 'buddy_infantry') chosenClass = 'Infuntry';
            else if (activePriorityRecipe === 'buddy_commando') chosenClass = 'Commando';
            else if (activePriorityRecipe === 'buddy_super_wall') chosenClass = 'SuperBuddie';
          } else if (padEval.category === 'buddy_t2') {
            chosenClass = padEval.isSuper ? 'SuperBuddie' : 'Cyborg';
          } else if (padEval.isLegend) {
            chosenClass = 'Ninja';
          } else if (padEval.isSuper) {
            chosenClass = 'Commando';
          }
          const newBuddy = createBuddyCharacterUnit(
            team,
            false,
            chosenClass,
            wrapPlanetCoord(spawnX + (Math.random() - 0.5) * 2),
            wrapPlanetCoord(spawnZ + (Math.random() - 0.5) * 2),
            commanderIdx,
            false,
            false,
          );
          // Team Buddies Upgrade Tier: Vertical stack of 2 Blue ('super') crates births a Super Buddy with 2x HP (200+ HP)!
          if (padEval.isSuper) {
            const hpMult = padEval.buddyStatMultiplier?.hpMultiplier ?? 2.0;
            newBuddy.maxHp = Math.max(200, Math.round(100 * hpMult));
            newBuddy.hp = newBuddy.maxHp;
            newBuddy.weaponId = padEval.isLegend ? 'bazooka' : 'rifle';
            newBuddy.weaponName = padEval.isLegend
              ? 'Nuclear Launcher (Super Weapon)'
              : 'Super Shotgun (Spread + Bounce)';
            newBuddy.ammo = 160;
          }
          buddyUnits.push(newBuddy);
          if (isBlue) score += 220;
        } else {
          // Commander already has 4/4 characters -> Heal & upgrade weapons of all 4 owned characters!
          ownedAlive.forEach((ob) => {
            if (padEval.isSuper) {
              ob.maxHp = Math.max(ob.maxHp, 200);
            }
            ob.hp = ob.maxHp;
            const upgWeaponName = padEval.isSuper ? 'LyoRocketLauncher' : 'LyoAssaultRifle';
            ob.tacticalLoadout = equipOrSwapDroppedWeaponInLoadout(
              ob.tacticalLoadout,
              upgWeaponName,
              240,
            ).updatedLoadout;
            syncUnitFieldsFromLoadout(ob);
          });
          if (isBlue) score += 180;
        }
      } else {
        // 1x1x1 (Senjata Ringan Tier 1) or 2x1x1 (Senjata Menengah Tier 2):
        // Team Buddies Physics Pop-out (`Terpental ke Sekitar Pad`): Weapon pops out from the Stacking Pad
        // and lands around the pad perimeter border so the pad is immediately free to stack crates again!
        const wName = padEval.crateSchemeVariantName || padEval.outputName;
        const mappedWeaponId: 'pistol' | 'rifle' | 'rocket' =
          padEval.weaponId === 'rocket'
            ? 'rocket'
            : padEval.weaponId === 'rifle'
            ? 'rifle'
            : 'pistol';
        const popMain = computeStackingPadWeaponPopOutTrajectory(
          padMeshObj.padX,
          padMeshObj.padZ,
          0,
          1 + (padEval.leftoverWeaponDrops?.length ?? 0),
          sign,
        );
        spawnWorldPickup('weapon', wName, popMain.startX, popMain.startZ, {
          weaponId: mappedWeaponId,
          remainingAmmo: padEval.isLegend ? 24 : padEval.isSuper ? 120 : 90,
          vx: popMain.vx,
          vy: popMain.vy,
          vz: popMain.vz,
          despawnTimerSec: TEAM_BUDDIES_CRAFTED_WEAPON_DESPAWN_SEC,
        });
        if (isBlue) score += 140;
      }

      // Team Buddies Odd-Stack Breakdown (`Catatan Mekanis: Jumlah Tanggung 3, 5, 6, atau 7 Peti`):
      // Excess crates beyond the nearest valid lower pattern (1, 2, or 4 crates) pop out around the pad perimeter border!
      if (padEval.leftoverWeaponDrops && padEval.leftoverWeaponDrops.length > 0) {
        const totalPopCount = 1 + padEval.leftoverWeaponDrops.length;
        padEval.leftoverWeaponDrops.forEach((leftover, idx) => {
          const popExtra = computeStackingPadWeaponPopOutTrajectory(
            padMeshObj.padX,
            padMeshObj.padZ,
            idx + 1,
            totalPopCount,
            sign,
          );
          spawnWorldPickup('weapon', leftover.outputName, popExtra.startX, popExtra.startZ, {
            weaponId: leftover.weaponId,
            remainingAmmo: leftover.isLegend ? 16 : leftover.isSuper ? 80 : 60,
            vx: popExtra.vx,
            vy: popExtra.vy,
            vz: popExtra.vz,
            despawnTimerSec: TEAM_BUDDIES_CRAFTED_WEAPON_DESPAWN_SEC,
          });
        });
        if (isPlayerAction && playerUnit) {
          playerUnit.saluteTimer = 2.0;
          playerUnit.saluteSign.updateText(
            `STACK TANGGUNG (${padEval.totalCrates} PETI)`,
            `${padEval.outputName.toUpperCase()} + ${padEval.leftoverWeaponDrops.length} SENJATA DROP!`,
            '#facc15',
            1,
          );
          playerUnit.saluteSign.sprite.visible = true;
        }
      }

      slotsList[commanderIdx] = createEmptyPadSlots();
      advanceBluePlayerBuildQueue();
      if (isBlue) {
        bluePadSlots = bluePadSlotsList[0];
        syncPadVisuals(blueBase, bluePadSlots, 'BLUE', blueBaseHp);
        emitHudImmediately();
      } else {
        redPadSlots = redPadSlotsList[0];
        syncPadVisuals(redBase, redPadSlots, 'RED', redBaseHp);
      }
      return true;
    };

    const craftFromBluePad = () => craftFromCommanderPad('blue', 0, true);

    const disembarkFromCityTram = () => {
      if (ridingTramCarIdx === null) return false;
      const tramNow = cityTram.getState();
      const carPose = ridingTramCarIdx === 0 ? tramNow.car1 : tramNow.car2;
      const rightExit = computeCityTramDisembarkPosition(carPose, 1);
      const leftExit = computeCityTramDisembarkPosition(carPose, -1);
      const isRightSafe =
        evaluateOuterEmbankmentSdf(rightExit.x, rightExit.z) < -1.0 &&
        evaluateNwLakeSdf(rightExit.x, rightExit.z) > 0.3 &&
        evaluateSeHarborSdf(rightExit.x, rightExit.z).waterSdf > 0.3;
      const chosenExit = isRightSafe ? rightExit : leftExit;
      soundEngine.playUiClick();
      soundEngine.updateVehicleMovementLoop(0, false, false);
      playerUnit.x = wrapPlanetCoord(chosenExit.x);
      playerUnit.z = wrapPlanetCoord(chosenExit.z);
      playerUnit.vx = 0;
      playerUnit.vz = 0;
      playerUnit.root.position.set(
        playerUnit.x,
        getTerrainElevation(playerUnit.x, playerUnit.z),
        playerUnit.z,
      );
      playerUnit.root.visible = true;
      playerUnit.saluteTimer = 1.25;
      playerUnit.saluteSign.updateText('TURUN DARI TREM!', 'SIAP TEMPUR', '#00d2ff', 1);
      playerUnit.saluteSign.sprite.visible = true;
      ridingTramCarIdx = null;
      return true;
    };

    const handlePlayerJump = () => {
      if (ridingTramCarIdx !== null) {
        disembarkFromCityTram();
        return;
      }
      if (mountedTank || !playerUnit || !playerUnit.alive) return;
      // Set jump input buffer to 0.1s; if already grounded on this frame, fire immediately and reset buffer to 0
      playerUnit.jumpBufferTimer = JUMP_BUFFER_DURATION_SEC;
      const spec = BUDDY_CLASSES[playerUnit.classId];
      const jumpStep = stepBuddyJumpPhysicsWithBuffer(
        playerUnit.jumpOffset,
        playerUnit.vy,
        playerUnit.isGrounded,
        playerUnit.jumpBufferTimer,
        true,
        spec.jumpMultiplier,
        playerUnit.carryingCrate !== 'none',
        0,
      );
      playerUnit.jumpBufferTimer = jumpStep.jumpBufferTimer;
      if (jumpStep.justJumped) {
        playerUnit.jumpOffset = jumpStep.jumpOffset;
        playerUnit.vy = jumpStep.vy;
        playerUnit.isGrounded = false;
        soundEngine.playJump();
        const groundY = getTerrainElevation(playerUnit.x, playerUnit.z);
        spawnBurstParticles(playerUnit.x, groundY + 0.18, playerUnit.z, 6);
      }
    };

    const performBuddyMeleeAttack = (attacker: BuddyUnit, kind: 'punch' | 'kick'): boolean => {
      if (!attacker.alive) return false;

      const listener = getPlayerAudioListenerPos();
      const meleeAudioGain = attacker.isPlayer
        ? 1.0
        : computeSpatialAudioGain(listener.x, listener.z, attacker.x, attacker.z, 18.0, 4.0) * 0.65;
      const playMeleeAudio = (fn: () => void) => {
        soundEngine.withSpatialGain(meleeAudioGain, fn);
      };

      if (kind === 'punch') {
        attacker.punchHand = attacker.punchHand === 'right' ? 'left' : 'right';
        attacker.punchTimer = 0.24;
        attacker.shootCooldown = 0.25;
      } else {
        attacker.kickTimer = 0.34;
      }

      const fwdX = Math.cos(attacker.yaw);
      const fwdZ = -Math.sin(attacker.yaw);
      const strikeWorldX = wrapPlanetCoord(attacker.x + fwdX * 1.15);
      const strikeWorldZ = wrapPlanetCoord(attacker.z + fwdZ * 1.15);
      const strikeGroundY = getTerrainElevation(strikeWorldX, strikeWorldZ) + attacker.jumpOffset;

      let hitAny = false;
      let hitCrate = false;

      // 1. Check Grounded Crates (Team Buddies Kick punts crates across the field; repeated hits smash open into pickups!)
      for (let ci = worldCrates.length - 1; ci >= 0; ci--) {
        const c = worldCrates[ci];
        if (c.state !== 'grounded') continue;
        const strike = evaluateBuddyMeleeStrike(
          attacker.x,
          attacker.z,
          attacker.yaw,
          c.x,
          c.z,
          0.85,
          kind,
        );
        if (!strike.hit) continue;

        hitAny = true;
        hitCrate = true;
        c.squashTimer = 0;
        c.mesh.scale.set(1, 1, 1);
        if (canDamageWorldCrate(c)) {
          c.hp -= kind === 'kick' ? 6 : 8;
        }

        if (canDamageWorldCrate(c) && c.hp <= 0) {
          playMeleeAudio(() => {
            soundEngine.playWoodBreak(10.5);
            soundEngine.playBarrelExplosion();
          });
          lyoExplosionSystem.spawnLyoExplosion(
            new THREE.Vector3(c.x, getTerrainElevation(c.x, c.z) + 0.55, c.z),
            0.72,
            'crate',
          );
          spawnDebrisChunks(
            c.x,
            0.55,
            c.z,
            c.kind === 'super' ? 'metal' : 'wood',
            11,
            fwdX * 3.2,
            fwdZ * 3.2,
          );
          spawnBurstParticles(c.x, 0.9, c.z, 10);
          const crateDrop = evaluateCrateDestructionDrop(c.kind);
          spawnWorldPickup(crateDrop.dropKind, crateDrop.label, c.x, c.z, {
            weaponId: crateDrop.weaponId,
            remainingAmmo: crateDrop.remainingAmmo,
            vy: crateDrop.isPurpleSuperWeapon ? 6.8 : 5.4,
          });
          rewardPlayerOnCrateDestroyed(c.x, c.z);
          scene.remove(c.mesh);
          worldCrates.splice(ci, 1);
        } else {
          const mult = kind === 'kick' ? 1.0 : 0.62;
          c.vx = strike.knockbackVx * mult;
          c.vz = strike.knockbackVz * mult;
          c.vy = Math.max(c.vy, strike.upwardHopVy);
          c.rotVelY = (Math.random() - 0.5) * (kind === 'kick' ? 10.5 : 6.5);
          playMeleeAudio(() => {
            if (c.kind === 'super' || !canDamageWorldCrate(c)) {
              soundEngine.playMetalImpact(kind === 'kick' ? 10.5 : 7.5);
            } else {
              soundEngine.playWoodHit(kind === 'kick' ? 10.5 : 7.5);
            }
          });
          spawnBurstParticles(c.x, c.y + 0.35, c.z, kind === 'kick' ? 8 : 5);
        }
      }

      // 2. Check Enemy / Other Buddy Characters (Melee Damage + Knockback + Mid-Air Launch on Kick!)
      for (const other of buddyUnits) {
        if (!other.alive || other === attacker || other.team === attacker.team) continue;
        if (other.isPlayer && (mountedTank || ridingTramCarIdx !== null)) continue;
        const strike = evaluateBuddyMeleeStrike(
          attacker.x,
          attacker.z,
          attacker.yaw,
          other.x,
          other.z,
          0.88,
          kind,
        );
        if (!strike.hit) continue;

        hitAny = true;
        if (other.isPlayer) {
          const iFrameRes = applyPlayerDamageWithInvincibilityAndKnockback({
            hp: other.hp,
            invincibilityTimer: other.invincibilityTimer ?? 0,
            x: other.x,
            z: other.z,
            vx: other.vx,
            vz: other.vz,
            vy: other.vy,
            damage: strike.damage,
            sourceX: attacker.x,
            sourceZ: attacker.z,
            facingYaw: other.yaw,
            invincibilityDurationSec: PLAYER_INVINCIBILITY_DURATION_SEC,
          });
          if (!iFrameRes.damageApplied) {
            continue;
          }
          other.hp = iFrameRes.hp;
          other.invincibilityTimer = iFrameRes.invincibilityTimer;
          other.vx = iFrameRes.vx;
          other.vz = iFrameRes.vz;
          other.vy = iFrameRes.vy;
          other.jumpOffset = Math.max(other.jumpOffset, 0.08);
          other.isGrounded = false;
        } else {
          other.hp -= strike.damage;
          other.vx += strike.knockbackVx;
          other.vz += strike.knockbackVz;
        }
        other.hitFlashTimer = 0.15;
        other.hitReactionTimer = 0.60;
        other.hitReactionDirX = fwdX;
        other.hitReactionDirZ = fwdZ;
        if (kind === 'kick') {
          other.vy = Math.max(other.vy, strike.upwardHopVy * 0.85);
          other.jumpOffset = Math.max(other.jumpOffset, 0.12);
          other.isGrounded = false;
        }
        playMeleeAudio(() => {
          soundEngine.playEnemyHit();
        });
        spawnBurstParticles(other.x, other.y + 1.15, other.z, 10);

        if (other.hp <= 0) {
          other.alive = false;
          other.respawnTimer = 6.0;
          other.root.visible = false;
          playMeleeAudio(() => {
            soundEngine.playBarrelExplosion();
          });
          lyoExplosionSystem.spawnLyoExplosion(
            new THREE.Vector3(other.x, getTerrainElevation(other.x, other.z) + 0.85, other.z),
            0.85,
            'fodder',
          );
          spawnBurstParticles(other.x, 1.4, other.z, 16);
          handleBuddyDeathDrops(other, false);
          if (other.team === 'red') {
            enemiesDefeated++;
            score += 150;
            gold += 150;
          } else if (other.isPlayer) {
            const ownerPlot = blueCommanderBases[clamp(other.ownerCommanderId, 0, COMMANDERS_PER_TEAM - 1)];
            const canRespawnPlayer =
              playModeRef.current !== 'match' ||
              canBuddyUnitRespawnAtBase(
                other.isStarterCommanderUnit,
                ownerPlot?.destroyed ?? false,
                ownerPlot?.buildingHp ?? 400,
              );
            if (canRespawnPlayer) {
              other.alive = true;
              other.hp = other.maxHp;
              other.weaponId = 'unarmed';
              other.weaponName = 'Tangan Kosong (Tinju)';
              other.ammo = 0;
              other.x = blueBase.padX - 3.8;
              other.z = blueBase.padZ - 0.5;
              other.root.visible = true;
            } else {
              handleSwapBuddy();
            }
          }
          checkMatchDeathmatchWinCondition();
        }
      }

      // 3. Check Pushable & Breakable Map Props (Wheelbarrow, Barricade, Explosive Barrel, Concrete Fence, etc.)
      for (const mp of activeMapProps) {
        if (!mp.alive) continue;
        const strike = evaluateBuddyMeleeStrike(
          attacker.x,
          attacker.z,
          attacker.yaw,
          mp.x,
          mp.z,
          Math.max(0.75, mp.radius * 0.9),
          kind,
        );
        if (!strike.hit) continue;

        hitAny = true;
        if (mp.canJiggleOnHit) {
          mp.jiggleTimer = 0.35;
        }
        if (mp.category === 'pushable') {
          const massDiv = Math.max(0.65, mp.mass * 0.45);
          mp.vx += strike.knockbackVx / massDiv;
          mp.vz += strike.knockbackVz / massDiv;
          mp.rotVelY += (Math.random() - 0.5) * 9.0;
          playMeleeAudio(() => {
            soundEngine.playMaterialImpact(mp.materialTag, kind === 'kick' ? 10.0 : 7.5);
          });
          spawnCollisionContactParticles(
            strikeWorldX,
            strikeGroundY + 0.8,
            strikeWorldZ,
            -fwdX,
            -fwdZ,
            mp.materialTag,
            8.5,
          );
        } else if (mp.category === 'breakable' || (mp.category === 'solid' && mp.destructible)) {
          mp.hp -= strike.damage;
          if (mp.category !== 'solid') {
            mp.vx += strike.knockbackVx * 0.45;
            mp.vz += strike.knockbackVz * 0.45;
          }
          if (shouldShatterBreakableProp(mp.kind, 0, false, mp.hp)) {
            mp.alive = false;
            mp.wrapper.visible = false;
            score += 50;
            if (mp.kind === 'explosive_barrel') {
              triggerBarrelExplosion(mp.x, mp.z);
            } else if (mp.materialTag === 'wood') {
              playMeleeAudio(() => {
                soundEngine.playWoodBreak(11.5);
              });
              spawnDebrisChunks(mp.x, 0.55, mp.z, 'wood', 12, fwdX * 3.0, fwdZ * 3.0);
              spawnBurstParticles(mp.x, 0.9, mp.z, 10);
            } else {
              playMeleeAudio(() => {
                soundEngine.playHeavyThud(11.5, false);
              });
              spawnDebrisChunks(mp.x, 0.55, mp.z, 'concrete', 12, fwdX * 3.0, fwdZ * 3.0);
              spawnBurstParticles(mp.x, 0.9, mp.z, 10);
            }
          } else {
            playMeleeAudio(() => {
              soundEngine.playMaterialImpact(mp.materialTag, 8.5);
            });
            spawnCollisionContactParticles(
              strikeWorldX,
              strikeGroundY + 0.8,
              strikeWorldZ,
              -fwdX,
              -fwdZ,
              mp.materialTag,
              8.5,
            );
          }
        }
      }

      if (kind === 'punch') {
        playMeleeAudio(() => {
          soundEngine.playPunch(hitAny);
        });
        if (hitAny && attacker.isPlayer) {
          shakeTrauma = Math.min(1, shakeTrauma + 0.06);
        }
      } else {
        playMeleeAudio(() => {
          soundEngine.playKick(hitAny);
        });
        if (hitAny && attacker.isPlayer) {
          shakeTrauma = Math.min(1, shakeTrauma + 0.11);
        } else if (!hitAny) {
          spawnBurstParticles(strikeWorldX, strikeGroundY + 0.55, strikeWorldZ, 3);
        }
      }

      return hitCrate || hitAny;
    };

    const cancelAndShatterBluePadBuild = (): boolean => {
      const slots = bluePadSlotsList[0];
      const shatterRes = evaluatePadCancelKickShatterDrops(slots);
      if (!shatterRes.cancelled || shatterRes.shatteredCrateCount === 0) return false;

      const padEval = evaluateStackingPadRecipe(slots);
      soundEngine.playKick(true);
      soundEngine.playBuildBoxCraft(false);
      shakeTrauma = Math.min(1, shakeTrauma + 0.14);

      spawnBurstParticles(blueBase.padX, 1.85, blueBase.padZ, 22);
      spawnDebrisChunks(
        blueBase.padX,
        1.15,
        blueBase.padZ,
        padEval.isSuper ? 'metal' : 'wood',
        14,
      );
      scratchExplosionPos.set(blueBase.padX, 1.15, blueBase.padZ);
      lyoExplosionSystem.spawnLyoExplosion(scratchExplosionPos, 0.72, 'crate');

      // Pop out small items (Pistol, Granat, Medkit, Land Mine, Ammo, Coin) from the shattered boxes!
      for (let i = 0; i < shatterRes.drops.length; i++) {
        const drop = shatterRes.drops[i];
        const pop = computeStackingPadWeaponPopOutTrajectory(
          blueBase.padX,
          blueBase.padZ,
          i,
          shatterRes.drops.length,
          1,
        );
        spawnWorldPickup(drop.kind, drop.label, pop.startX, pop.startZ, {
          weaponId: drop.weaponId,
          remainingAmmo: drop.remainingAmmo,
          secondaryId: drop.secondaryId,
          secondaryCount: drop.secondaryCount,
          scoreValue: drop.coinValue,
          vx: pop.vx,
          vy: pop.vy,
          vz: pop.vz,
        });
      }

      // Clear pad slots and cancel the active build at the front of the queue
      bluePadSlotsList[0] = createEmptyPadSlots();
      bluePadSlots = bluePadSlotsList[0];
      if (blueBuildQueue.length > 0) {
        const qAdv = advanceKioskBuildQueueOnCraft(blueBuildQueue);
        blueBuildQueue = qAdv.queue;
        if (qAdv.hasMoreQueued && qAdv.nextActiveRecipe) {
          activePriorityRecipe = qAdv.nextActiveRecipe;
          useCustomHologramRecipe = true;
          const nextSpec = KIOSK_BUILD_PRIORITY_RECIPES[activePriorityRecipe];
          if (nextSpec) {
            buildOrder = nextSpec.buildOrder;
          }
        } else {
          useCustomHologramRecipe = false;
        }
      } else {
        useCustomHologramRecipe = false;
      }

      kioskStatusMessage =
        'BUILD DIBATALKAN! BOX DI PAD PECAH MENJADI ITEM KECIL (PISTOL, GRANAT, MEDKIT)!';
      kioskStatusTimer = 4.5;

      if (playerUnit && playerUnit.alive) {
        playerUnit.saluteTimer = 2.0;
        playerUnit.saluteSign.updateText(
          'BUILD DIBATALKAN!',
          'BOX PECAH JADI PISTOL / GRANAT / MEDKIT!',
          '#fb923c',
          1,
        );
        playerUnit.saluteSign.sprite.visible = true;
      }

      syncPadVisuals(blueBase, bluePadSlots, 'BLUE', blueBaseHp);
      emitHudImmediately();
      return true;
    };

    const handlePlayerKickOrCraft = () => {
      if (ridingTramCarIdx !== null) {
        disembarkFromCityTram();
        return;
      }
      const actorX = mountedTank ? mountedTank.x : playerUnit.x;
      const actorZ = mountedTank ? mountedTank.z : playerUnit.z;
      const distToPad = getPlanetShortestDistance(actorX, actorZ, blueBase.padX, blueBase.padZ);
      const padEval = evaluateStackingPadRecipe(bluePadSlots);
      const kioskWorldPos = getBlueKioskWorldCenter(0);
      const distToKiosk = getPlanetShortestDistance(actorX, actorZ, kioskWorldPos.x, kioskWorldPos.z);

      if (mountedTank) {
        if ((isPadCraftPromptActive || distToPad <= INTERACT_EXIT_RADIUS) && padEval.totalCrates > 0) {
          cancelAndShatterBluePadBuild();
        } else if (isKioskPromptActive || distToKiosk <= INTERACT_EXIT_RADIUS) {
          soundEngine.playUiClick();
          emitHudImmediately();
          window.dispatchEvent(new CustomEvent('toggle-kiosk-ui'));
        }
        return;
      }

      if (!playerUnit || !playerUnit.alive) return;

      // If Kiosk icon is active / within 2.9m and not kicking stacked boxes on the Pad, [F] opens Tactical Kiosk modal!
      if (
        (isKioskPromptActive || distToKiosk <= INTERACT_EXIT_RADIUS) &&
        !((isPadCraftPromptActive || distToPad <= INTERACT_EXIT_RADIUS) && padEval.totalCrates > 0)
      ) {
        soundEngine.playUiClick();
        emitHudImmediately();
        window.dispatchEvent(new CustomEvent('toggle-kiosk-ui'));
        return;
      }

      // Always execute the Team Buddies Front Leg Kick on foot!
      const hitTarget = performBuddyMeleeAttack(playerUnit, 'kick');

      // Kicking ([F]) stacked boxes on the Crate Pad cancels the build and shatters the boxes into small items (Pistol, Grenade, Medkit, etc.)!
      if (!hitTarget && (isPadCraftPromptActive || distToPad <= INTERACT_EXIT_RADIUS) && padEval.totalCrates > 0) {
        cancelAndShatterBluePadBuild();
      }
    };

    const handleToggleMountTank = () => {
      // Disembark anywhere if currently riding the City Tram!
      if (ridingTramCarIdx !== null) {
        disembarkFromCityTram();
        return;
      }

      // Dismount if currently riding a Tank
      if (mountedTank) {
        soundEngine.playUiClick();
        soundEngine.updateVehicleMovementLoop(0, false, false);
        mountedTank.occupiedByPlayer = false;
        mountedTank.riderGroup.visible = false;
        playerUnit.x = wrapPlanetCoord(mountedTank.x - 2.6);
        playerUnit.z = wrapPlanetCoord(mountedTank.z + 1.2);
        playerUnit.root.position.set(playerUnit.x, getTerrainElevation(playerUnit.x, playerUnit.z), playerUnit.z);
        playerUnit.root.visible = true;
        mountedTank = null;
        return;
      }

      // Otherwise check if near the 2-Car City Tram anywhere along its route OR near any Tank/Plane/Truck!
      if (!playerUnit.alive || ridingTramCarIdx !== null) return;
      const tramBoard = canUnitBoardCityTramAtAnyPoint(
        playerUnit.x,
        playerUnit.z,
        cityTram.getState(),
        3.2,
      );
      let nearestTank: TankVehicle | null = null;
      let bestDist = 7.8;
      for (const t of tanks) {
        if (!t.occupiedByPlayer && t.hp > 0) {
          const d = getPlanetShortestDistance(t.x, t.z, playerUnit.x, playerUnit.z);
          if (d < bestDist) {
            bestDist = d;
            nearestTank = t;
          }
        }
      }

      if (tramBoard.canBoard && (!nearestTank || tramBoard.distanceMeters < bestDist)) {
        soundEngine.playPickup();
        ridingTramCarIdx = tramBoard.carIndex;
        playerUnit.vx = 0;
        playerUnit.vz = 0;
        playerUnit.root.visible = true;
        playerUnit.overheadCrateGroup.visible = playerUnit.carryingCrate !== 'none';
        return;
      }

      if (nearestTank) {
        soundEngine.playPickup();
        if (nearestTank.occupiedByAiId !== null) {
          const aiRider = buddyUnits.find((b) => b.id === nearestTank!.occupiedByAiId);
          if (aiRider) {
            aiRider.x = wrapPlanetCoord(nearestTank.x + 2.4);
            aiRider.z = wrapPlanetCoord(nearestTank.z + 1.2);
            aiRider.root.visible = true;
          }
          nearestTank.occupiedByAiId = null;
        }
        if (
          nearestTank.vehicleKind !== 'truck' &&
          playerUnit.carryingCrate !== 'none' &&
          playerUnit.carryingCrate !== 'medical' &&
          canLoadCrateIntoDumpTruck(
            nearestTank.storedCrates.length,
            (nearestTank.dumpAnimTimer ?? 0) > 0,
            true,
          )
        ) {
          nearestTank.storedCrates.push(playerUnit.carryingCrate);
          playerUnit.carryingCrate = 'none';
          playerUnit.overheadCrateGroup.visible = false;
        }
        mountedTank = nearestTank;
        nearestTank.occupiedByPlayer = true;
        nearestTank.riderGroup.visible = nearestTank.vehicleKind !== 'truck';
        playerUnit.root.visible = false;
      }
    };

    const handleCycleBuildOrder = () => {
      soundEngine.playUiClick();
      const recipeKeys = Object.keys(KIOSK_BUILD_PRIORITY_RECIPES) as KioskBuildPriorityRecipeId[];
      const curRecipeIdx = recipeKeys.indexOf(activePriorityRecipe);
      const nextRecipeId = recipeKeys[(curRecipeIdx + 1) % recipeKeys.length];
      activePriorityRecipe = nextRecipeId;
      if (blueBuildQueue.length > 0) {
        blueBuildQueue = [nextRecipeId, ...blueBuildQueue.slice(1)];
      } else {
        blueBuildQueue = [nextRecipeId];
      }
      useCustomHologramRecipe = true;
      const recipeSpec = KIOSK_BUILD_PRIORITY_RECIPES[nextRecipeId];
      buildOrder = recipeSpec.buildOrder;

      // Repack any existing crates on Blue Pad P1 into the new color-coded hologram slots!
      const existingCrates = bluePadSlots.filter((s) => s !== 'empty') as ('red' | 'super' | 'legend')[];
      bluePadSlots = ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'];
      bluePadSlotsList[0] = bluePadSlots;
      for (const kind of existingCrates) {
        const slotIdx = chooseNextPadSlotIndexForHologram(
          bluePadSlots,
          recipeSpec.slotHologramColors,
          kind,
          buildOrder,
        );
        if (slotIdx !== -1) {
          bluePadSlots[slotIdx] = kind;
        } else {
          spawnWorldCrate(kind, blueBase.padX - 3.2, blueBase.padZ - 1.5, true);
        }
      }
      syncPadVisuals(blueBase, bluePadSlots, 'BLUE', blueBaseHp);
    };

    const triggerAlliedSalute = (saluteLabel: string) => {
      for (const b of buddyUnits) {
        if (b.team === 'blue' && !b.isPlayer && b.alive && b.ownerCommanderId === 0) {
          b.saluteTimer = 1.65;
          b.saluteSign.updateText('HORMAT!', saluteLabel, '#b8ff3c', 1);
          b.saluteSign.sprite.visible = true;
        }
      }
    };

    const syncSquadRoleWithTeamCommand = (
      nextCmd: TeamCommandMode,
      forceAllOwnedUnits: boolean,
    ) => {
      const myPlot = blueCommanderBases[0];
      for (const b of buddyUnits) {
        if (b.team === 'blue' && !b.isPlayer && b.alive && b.ownerCommanderId === 0) {
          const isStationedRadarDefender =
            b.assignedRole === 'DEFEND' &&
            myPlot &&
            isUnitInPersonalCommandCenterArea(b.x, b.z, myPlot);
          if (forceAllOwnedUnits || (!b.hasIndividualRoleAssigned && !isStationedRadarDefender)) {
            b.assignedRole = nextCmd;
          }
        }
      }
    };

    const handleCursorOrCycleTeamCommand = (useCursorTarget: boolean) => {
      soundEngine.playUiClick();
      const freeBlueTanks = tanks.filter(
        (t) => t.team === 'blue' && !t.occupiedByPlayer && t.occupiedByAiId === null && t.hp > 0,
      );

      if (useCursorTarget) {
        const res = resolveCursorCommandTarget({
          cursorX: aimWorldPoint.x,
          cursorZ: aimWorldPoint.z,
          crates: worldCrates.filter((c) => c.state === 'grounded' || c.state === 'falling'),
          enemies: buddyUnits.filter((b) => b.team === 'red' && b.alive),
          emptyTanks: freeBlueTanks,
          blueBase: { x: blueBase.hqX, z: blueBase.hqZ, padX: blueBase.padX, padZ: blueBase.padZ },
          redBase: { x: redBase.hqX, z: redBase.hqZ, padX: redBase.padX, padZ: redBase.padZ },
          currentCommand: teamCommand,
        });
        teamCommand = res.command;
        playerUnit.assignedRole = teamCommand;
        syncSquadRoleWithTeamCommand(teamCommand, true);
        triggerAlliedSalute(res.saluteLabel);
      } else {
        const idx = COMMAND_CYCLE.indexOf(teamCommand);
        teamCommand = COMMAND_CYCLE[(idx + 1) % COMMAND_CYCLE.length];
        playerUnit.assignedRole = teamCommand;
        syncSquadRoleWithTeamCommand(teamCommand, false);
        const roleUiLabel = formatBuddyRoleUiLabel(teamCommand).toUpperCase();
        playerUnit.saluteTimer = 1.65;
        playerUnit.saluteSign.updateText('PERAN UNIT', roleUiLabel, '#38bdf8', 1);
        playerUnit.saluteSign.sprite.visible = true;
        triggerAlliedSalute(roleUiLabel);
      }
    };

    /**
     * Evaluates the Team Buddies (PS1) Deathmatch Win Conditions in 'match' mode:
     * 1. Base/HQ Destruction (`base_destroyed`): Enemy main base HP <= 0 or all 4 Commander Spawn Bases destroyed.
     * 2. Total Squad Wipeout (`squad_wiped_no_respawn_or_crates`): All units dead, 0 respawnable units (bases destroyed / crafted units cannot auto-respawn), and insufficient crates to birth a new Buddy on the Stacking Pad.
     */
    const checkMatchDeathmatchWinCondition = () => {
      if (playModeRef.current !== 'match' || matchGameOverTriggered) return;

      const countTeamUnits = (team: 'blue' | 'red') => {
        const bases = team === 'blue' ? blueCommanderBases : redCommanderBases;
        let aliveUnitCount = 0;
        let respawnableUnitCount = 0;
        for (const u of buddyUnits) {
          if (u.team !== team) continue;
          if (u.alive) {
            aliveUnitCount++;
          } else {
            const ownerIdx = clamp(u.ownerCommanderId, 0, COMMANDERS_PER_TEAM - 1);
            const ownerPlot = bases[ownerIdx];
            if (
              ownerPlot &&
              canBuddyUnitRespawnAtBase(
                u.isStarterCommanderUnit,
                ownerPlot.destroyed,
                ownerPlot.buildingHp,
              )
            ) {
              respawnableUnitCount++;
            }
          }
        }
        return { aliveUnitCount, respawnableUnitCount };
      };

      const blueCounts = countTeamUnits('blue');
      const redCounts = countTeamUnits('red');
      const freeFieldCrateCount = worldCrates.filter(
        (c) =>
          (c.state === 'grounded' || c.state === 'falling' || c.state === 'carried') &&
          c.kind !== 'medical',
      ).length;

      const winCheck = evaluateTeamBuddiesDeathmatchWinCondition(
        {
          team: 'blue',
          baseHp: blueBaseHp,
          commanderBases: blueCommanderBases,
          aliveUnitCount: blueCounts.aliveUnitCount,
          respawnableUnitCount: blueCounts.respawnableUnitCount,
          padSlotsList: bluePadSlotsList,
          freeFieldCrateCount,
        },
        {
          team: 'red',
          baseHp: redBaseHp,
          commanderBases: redCommanderBases,
          aliveUnitCount: redCounts.aliveUnitCount,
          respawnableUnitCount: redCounts.respawnableUnitCount,
          padSlotsList: redPadSlotsList,
          freeFieldCrateCount,
        },
      );

      if (winCheck.isGameOver && winCheck.outcome) {
        matchGameOverTriggered = true;
        if (winCheck.outcome === 'victory') {
          soundEngine.playVictory();
          bestScore = Math.max(bestScore, score + 1000);
          onGameOver('victory', buildHudSnapshot('victory'));
        } else {
          soundEngine.playDefeat();
          onGameOver('defeat', buildHudSnapshot('defeat'));
        }
      }
    };

    const handleSwapBuddy = () => {
      if (mountedTank) return;
      const swapped = getNextOwnedBuddyForSwap(
        buddyUnits.map((b) => ({
          id: String(b.id),
          team: b.team,
          ownerCommanderId: b.ownerCommanderId,
          hp: b.alive ? b.hp : 0,
          unit: b,
        })),
        'blue',
        0,
        String(playerUnit.id),
      );
      const nextBuddy = swapped ? swapped.unit : null;
      if (!nextBuddy || nextBuddy.id === playerUnit.id) return;
      soundEngine.playUiClick();
      playerUnit.assignedRole = playerUnit.assignedRole ?? teamCommand;
      playerUnit.hasIndividualRoleAssigned = true;
      playerUnit.isPlayer = false;
      (playerUnit.teamRing.material as THREE.MeshBasicMaterial).color.setHex(0x2979ff);
      nextBuddy.isPlayer = true;
      (nextBuddy.teamRing.material as THREE.MeshBasicMaterial).color.setHex(0xb4ff39);
      playerUnit = nextBuddy;
      teamCommand = playerUnit.assignedRole ?? 'HARVEST';
      playerUnit.assignedRole = teamCommand;
      playerUnit.saluteTimer = 1.65;
      playerUnit.saluteSign.updateText(
        `AKTIF: ${playerUnit.classId.toUpperCase()}`,
        formatBuddyRoleUiLabel(teamCommand).toUpperCase(),
        '#b4ff39',
        1,
      );
      playerUnit.saluteSign.sprite.visible = true;
    };

    const handleHotJoinPlayer = () => {
      // Replace an AI Commander on Blue first, or Red if Blue is already 4/4 human!
      const blueHasAi = matchmakingState.blueCommanders.some((s) => s.controller === 'ai');
      const targetTeam: 'blue' | 'red' = blueHasAi ? 'blue' : 'red';
      const teamLabel = targetTeam === 'blue' ? 'BLUE' : 'RED';
      const existingHumans = (
        targetTeam === 'blue' ? matchmakingState.blueCommanders : matchmakingState.redCommanders
      ).filter((s) => s.controller === 'human').length;
      if (existingHumans >= COMMANDERS_PER_TEAM) return;
      const newPlayerName = `${teamLabel}_Player_${existingHumans + 1}`;
      const res = hotJoinReplaceAiCommander(matchmakingState, targetTeam, runElapsedSec, newPlayerName);
      if (res.replacedSlot !== null) {
        matchmakingState = res.updatedState;
        const replacedId = res.replacedSlot.commanderId;
        soundEngine.playPowerCore();
        syncPadVisuals(blueBase, bluePadSlots, 'BLUE', blueBaseHp);
        syncPadVisuals(redBase, redPadSlots, 'RED', redBaseHp);
        for (const b of buddyUnits) {
          if (b.team === targetTeam && b.ownerCommanderId === replacedId && b.alive) {
            b.saluteTimer = 2.2;
            b.saluteSign.updateText('PEMAIN JOIN!', `GANTIKAN AI P${replacedId + 1}`, '#38bdf8', 1);
            b.saluteSign.sprite.visible = true;
            spawnBurstParticles(b.x, 1.4, b.z, 14);
          }
        }
      }
    };

    const handleSelectTacticalWeapon = (weaponId: LyoWeaponId) => {
      if (!playerUnit || !playerUnit.alive) return;
      soundEngine.playUiClick();
      if (weaponId === 'unarmed') {
        playerUnit.tacticalLoadout = selectHandheldWeaponInLoadout(
          playerUnit.tacticalLoadout,
          'unarmed',
        );
      } else {
        const ownsWeapon = playerUnit.tacticalLoadout.handheldWeapons.some(
          (w) => w.slotId === weaponId,
        );
        if (!ownsWeapon) {
          return;
        }
        playerUnit.tacticalLoadout = selectHandheldWeaponInLoadout(
          playerUnit.tacticalLoadout,
          weaponId as HandheldWeaponSlotId,
        );
      }
      syncUnitFieldsFromLoadout(playerUnit);
      playerUnit.weaponRecoil = playerUnit.weaponId === 'unarmed' ? 0 : 0.38;
      updateCharacterWeaponStance(
        playerUnit.rig,
        playerUnit.weaponId,
        playerUnit.walkCycle,
        false,
        playerUnit.carryingCrate !== 'none',
        playerUnit.saluteTimer,
        playerUnit.weaponRecoil,
        playerUnit.punchTimer,
        playerUnit.punchHand,
        playerUnit.kickTimer,
        playerUnit.jumpOffset,
      );
      emitHudImmediately();
    };

    // =========================================================================
    // 10B. SANDBOX QUICK TEST ACTIONS & MAP EDITOR PLACEMENT HANDLERS
    // =========================================================================
    const handleSandboxQuickDropCrate = (kind: 'red' | 'super' | 'legend') => {
      soundEngine.playPickup();
      const actorX = mountedTank ? mountedTank.x : playerUnit.x;
      const actorZ = mountedTank ? mountedTank.z : playerUnit.z;
      const fwdX = mountedTank ? Math.cos(mountedTank.hullYaw) : Math.sin(playerUnit.yaw);
      const fwdZ = mountedTank ? -Math.sin(mountedTank.hullYaw) : Math.cos(playerUnit.yaw);
      const rightX = -fwdZ;
      const rightZ = fwdX;
      const sideOffset = kind === 'red' ? -1.35 : kind === 'super' ? 0 : 1.35;
      const dropX = wrapPlanetCoord(actorX + fwdX * 2.8 + rightX * sideOffset);
      const dropZ = wrapPlanetCoord(actorZ + fwdZ * 2.8 + rightZ * sideOffset);
      spawnWorldCrate(kind, dropX, dropZ, true);
      spawnBurstParticles(dropX, 1.0, dropZ, 8);
    };

    const handleSandboxQuickSpawnTank = () => {
      soundEngine.playPowerCore();
      const actorX = mountedTank ? mountedTank.x : playerUnit.x;
      const actorZ = mountedTank ? mountedTank.z : playerUnit.z;
      const fwdX = mountedTank ? Math.cos(mountedTank.hullYaw) : Math.sin(playerUnit.yaw);
      const fwdZ = mountedTank ? -Math.sin(mountedTank.hullYaw) : Math.cos(playerUnit.yaw);
      const spawnX = wrapPlanetCoord(actorX + fwdX * 3.8);
      const spawnZ = wrapPlanetCoord(actorZ + fwdZ * 3.8);
      const newTank = createLyoTankVehicle(spawnX, spawnZ, false, 'blue');
      tanks.push(newTank);
      spawnBurstParticles(spawnX, 1.6, spawnZ, 16);
    };

    const handleSandboxQuickSpawnPlane = () => {
      soundEngine.playPowerCore();
      const actorX = mountedTank ? mountedTank.x : playerUnit.x;
      const actorZ = mountedTank ? mountedTank.z : playerUnit.z;
      const fwdX = mountedTank ? Math.cos(mountedTank.hullYaw) : Math.sin(playerUnit.yaw);
      const fwdZ = mountedTank ? -Math.sin(mountedTank.hullYaw) : Math.cos(playerUnit.yaw);
      const spawnX = wrapPlanetCoord(actorX + fwdX * 3.8);
      const spawnZ = wrapPlanetCoord(actorZ + fwdZ * 3.8);
      const newPlane = createLyoPlaneVehicle(spawnX, spawnZ, 'blue');
      tanks.push(newPlane);
      spawnBurstParticles(spawnX, 2.0, spawnZ, 18);
    };

    const handleSandboxQuickSpawnTruck = () => {
      soundEngine.playPowerCore();
      const actorX = mountedTank ? mountedTank.x : playerUnit.x;
      const actorZ = mountedTank ? mountedTank.z : playerUnit.z;
      const actorYaw = mountedTank ? mountedTank.hullYaw : playerUnit.yaw;
      const fwdX = Math.cos(actorYaw);
      const fwdZ = -Math.sin(actorYaw);
      const spawnX = wrapPlanetCoord(actorX + fwdX * 2.8);
      const spawnZ = wrapPlanetCoord(actorZ + fwdZ * 2.8);
      const newTruck = createLyoDumpTruckVehicle(spawnX, spawnZ, 'blue', actorYaw);
      tanks.push(newTruck);
      spawnBurstParticles(spawnX, 1.8, spawnZ, 16);
    };

    // Deploy 3D Secondary Ordnance (CB-24 Cluster Bomb exclusively from Lyo Plane, HG-04 Frag Grenade, TM-89 Land Mine)
    const dropClusterBombFromPlane = (plane: TankVehicle) => {
      soundEngine.playBazookaLaunch();
      const alt = Math.max(4.5, plane.altitude ?? 8.5);
      const groundY = getTerrainElevation(plane.x, plane.z);
      const fwdX = Math.cos(plane.hullYaw);
      const fwdZ = -Math.sin(plane.hullYaw);
      const mesh = buildTeamBuddiesDropPickupMesh(
        'secondary',
        'cluster_bomb',
        windUniforms,
        isSoftwareGl,
      );
      mesh.scale.setScalar(1.45);
      const startPos = new THREE.Vector3(
        wrapPlanetCoord(plane.x + fwdX * 1.2),
        groundY + alt - 0.3,
        wrapPlanetCoord(plane.z + fwdZ * 1.2),
      );
      mesh.position.copy(startPos);
      mesh.rotation.y = plane.hullYaw;
      scene.add(mesh);
      activeOrdnanceDevices.push({
        kind: 'cluster_bomb',
        mesh,
        pos: startPos,
        vel: new THREE.Vector3(
          fwdX * Math.max(9.5, (plane.forwardSpeed ?? 10) * 0.95),
          -6.5,
          fwdZ * Math.max(9.5, (plane.forwardSpeed ?? 10) * 0.95),
        ),
        fuseTimer: 2.4,
        isGrounded: false,
      });
      kioskStatusMessage = 'CB-24 CLUSTER BOMB DIJATUHKAN DARI PESAWAT TEMPUR!';
      kioskStatusTimer = 3.5;
    };

    const handleUseTacticalSecondaryItem = (preferredKind?: TacticalSecondarySlotId) => {
      if (!playerUnit || !playerUnit.alive) return;
      const chosenKind: TacticalSecondarySlotId | 'none' =
        preferredKind &&
        ((preferredKind === 'hand_grenade' && playerUnit.tacticalLoadout.grenadeCount > 0) ||
          (preferredKind === 'land_mine' && playerUnit.tacticalLoadout.landMineCount > 0))
          ? preferredKind
          : playerUnit.tacticalLoadout.grenadeCount > 0
            ? 'hand_grenade'
            : playerUnit.tacticalLoadout.landMineCount > 0
              ? 'land_mine'
              : 'none';

      if (chosenKind === 'none') return;

      const cons = consumeTacticalSecondaryInLoadout(playerUnit.tacticalLoadout, chosenKind);
      if (!cons.consumed) return;
      playerUnit.tacticalLoadout = cons.updatedLoadout;
      syncUnitFieldsFromLoadout(playerUnit);

      const fwdX = Math.cos(playerUnit.yaw);
      const fwdZ = -Math.sin(playerUnit.yaw);
      const groundY = getTerrainElevation(playerUnit.x, playerUnit.z);

      if (chosenKind === 'hand_grenade') {
        soundEngine.playPickup();
        const mesh = buildTeamBuddiesDropPickupMesh(
          'secondary',
          'hand_grenade',
          windUniforms,
          isSoftwareGl,
        );
        mesh.scale.setScalar(1.25);
        const startPos = new THREE.Vector3(
          wrapPlanetCoord(playerUnit.x + fwdX * 1.1),
          groundY + 1.45,
          wrapPlanetCoord(playerUnit.z + fwdZ * 1.1),
        );
        mesh.position.copy(startPos);
        scene.add(mesh);
        activeOrdnanceDevices.push({
          kind: 'hand_grenade',
          mesh,
          pos: startPos,
          vel: new THREE.Vector3(fwdX * 12.5, 6.8, fwdZ * 12.5),
          fuseTimer: 1.65,
          isGrounded: false,
        });
      } else if (chosenKind === 'land_mine') {
        soundEngine.playPickup();
        const mesh = buildTeamBuddiesDropPickupMesh(
          'secondary',
          'land_mine',
          windUniforms,
          isSoftwareGl,
        );
        mesh.scale.setScalar(1.3);
        const mx = wrapPlanetCoord(playerUnit.x + fwdX * 1.6);
        const mz = wrapPlanetCoord(playerUnit.z + fwdZ * 1.6);
        const mineGrassOffsetY = computeLandMineGrassYOffset(evaluateLyoGrassMask(mx, mz));
        const startPos = new THREE.Vector3(
          mx,
          getTerrainElevation(mx, mz) + 0.05 + mineGrassOffsetY,
          mz,
        );
        mesh.position.copy(startPos);
        scene.add(mesh);
        activeOrdnanceDevices.push({
          kind: 'land_mine',
          mesh,
          pos: startPos,
          vel: new THREE.Vector3(0, 0, 0),
          fuseTimer: 18.0,
          isGrounded: true,
        });
      }
      emitHudImmediately();
    };

    const handleUseSecondaryOrdnance = () => {
      const secId = playerUnit?.secondaryItem ?? 'none';
      const isInPlane = Boolean(mountedTank && mountedTank.vehicleKind === 'plane');

      // If piloting the Lyo Plane, pressing [X] drops the CB-24 Cluster Bomb (if unlocked / equipped)
      if (isInPlane && mountedTank) {
        const bLv = blueCommanderBases[0]?.buildingLevel ?? 1;
        const clusterAccess = evaluateClusterBombAccess(bLv, true);
        if (!clusterAccess.allowedToBuild) {
          soundEngine.playHit();
          kioskStatusMessage = clusterAccess.statusMessage;
          kioskStatusTimer = 4.5;
          return;
        }
        dropClusterBombFromPlane(mountedTank);
        if (playerUnit.secondaryItem === 'cluster_bomb' && playerUnit.secondaryCount > 0) {
          playerUnit.secondaryCount = Math.max(0, playerUnit.secondaryCount - 1);
        }
        return;
      }

      if (!playerUnit || !playerUnit.alive) {
        return;
      }

      // STRICT RULE: CB-24 Cluster Bomb can ONLY be used by the Lyo Fighter Plane!
      if (
        secId === 'cluster_bomb' &&
        playerUnit.tacticalLoadout.grenadeCount <= 0 &&
        playerUnit.tacticalLoadout.landMineCount <= 0
      ) {
        soundEngine.playHit();
        playerUnit.saluteTimer = 2.8;
        playerUnit.saluteSign.updateText(
          'KHUSUS PESAWAT TEMPUR!',
          'CLUSTER BOMB HANYA BISA DIJATUHKAN DARI PESAWAT [G]!',
          '#ff9f0a',
          1,
        );
        playerUnit.saluteSign.sprite.visible = true;
        kioskStatusMessage =
          'KHUSUS PESAWAT! Naik ke Pesawat Tempur (Lyo Plane) [G] untuk menjatuhkan CB-24 Cluster Bomb!';
        kioskStatusTimer = 4.5;
        return;
      }

      handleUseTacticalSecondaryItem();
    };

    const handleSandboxUnlockBaseLv3 = () => {
      const plot0 = blueCommanderBases[0];
      if (plot0) {
        plot0.buildingLevel = 3;
        plot0.commandCenterLevel = 3;
        plot0.buildingMaxHp = 960;
        plot0.buildingHp = 960;
        plot0.fenceLevel = 3;
        plot0.fenceMaxHp = 680;
        plot0.fenceHp = 680;
        blueBaseHp = blueCommanderBases.reduce((acc, b) => acc + b.buildingHp, 0);
        syncPadVisuals(blueBase, bluePadSlots, 'BLUE', blueBaseHp);
      }
      soundEngine.playPowerCore();
      kioskStatusMessage =
        'COMMAND CENTER LV.3 TERBUKA! Nuclear Launcher & CB-24 Cluster Bomb Aktif!';
      kioskStatusTimer = 5.0;
    };

    const startNuclearStrikeTargetingMode = () => {
      const currentCmdLevel = blueCommanderBases[0]?.buildingLevel ?? 1;
      const nukeAccess = evaluateNuclearLauncherAccess(currentCmdLevel);
      if (!nukeAccess.allowed) {
        soundEngine.playHit();
        kioskStatusMessage = nukeAccess.statusMessage;
        kioskStatusTimer = 5.0;
        return;
      }

      const nl = ensureBlueNuclearLauncherDeployed();
      const nlX = nl.root.position.x;
      const nlZ = nl.root.position.z;
      const nlY = getTerrainElevation(nlX, nlZ);

      // Pick a smart initial target on the battlefield (nearest enemy tank/unit or central arena road toward Red Base)
      let defaultTargetX = 0;
      let defaultTargetZ = 18;
      let bestEnemyDist = 999;
      for (const t of tanks) {
        if (t.team === 'red' && t.hp > 0) {
          const d = Math.hypot(t.x - nlX, t.z - nlZ);
          if (d < bestEnemyDist) {
            bestEnemyDist = d;
            defaultTargetX = t.x;
            defaultTargetZ = t.z;
          }
        }
      }
      if (bestEnemyDist >= 999) {
        for (const b of buddyUnits) {
          if (b.team === 'red' && b.alive) {
            const d = Math.hypot(b.x - nlX, b.z - nlZ);
            if (d < bestEnemyDist) {
              bestEnemyDist = d;
              defaultTargetX = b.x;
              defaultTargetZ = b.z;
            }
          }
        }
      }

      const activeFocus = mountedTank ? mountedTank : playerUnit;
      const originPos: Vec3 = {
        x: activeFocus.x,
        y: getTerrainElevation(activeFocus.x, activeFocus.z) + 1.0,
        z: activeFocus.z,
      };
      const launchPos: Vec3 = {
        x: nlX,
        y: nlY + 2.35,
        z: nlZ,
      };
      const initialTargetPos: Vec3 = {
        x: defaultTargetX,
        y: getTerrainElevation(defaultTargetX, defaultTargetZ),
        z: defaultTargetZ,
      };

      nukeStrikeState = beginNuclearStrikeTargeting(originPos, launchPos, initialTargetPos);
      nukeLastMouseNdc = { x: mouseNdc.x, y: mouseNdc.y };
      nukeTargetReticleGroup.visible = true;
      nukeCinematicRocketGroup.visible = false;
      soundEngine.playPowerCore();
      window.dispatchEvent(new CustomEvent('close-kiosk-ui'));
      emitHudImmediately();
    };

    const confirmAndLaunchNuclearStrike = () => {
      if (nukeStrikeState.phase !== 'targeting') return;
      const nl = ensureBlueNuclearLauncherDeployed();
      const dx = nukeStrikeState.targetPos.x - nl.root.position.x;
      const dz = nukeStrikeState.targetPos.z - nl.root.position.z;
      const targetYaw = Math.atan2(dx, dz);
      nl.yawGroup.rotation.y = targetYaw;
      nl.pitchGroup.rotation.x = -0.58;

      nukeStrikeState = confirmNuclearStrikeTargetAndLaunch(nukeStrikeState);
      nukeTargetReticleGroup.visible = false;
      nukeCinematicRocketGroup.visible = true;

      const launchOrigin = new THREE.Vector3(
        nukeStrikeState.launchPos.x,
        nukeStrikeState.launchPos.y,
        nukeStrikeState.launchPos.z,
      );
      const launchDir = new THREE.Vector3(
        nukeStrikeState.rocketTangent.x,
        nukeStrikeState.rocketTangent.y,
        nukeStrikeState.rocketTangent.z,
      ).normalize();
      lyoExplosionSystem.spawnLyoMuzzleFlash(launchOrigin, launchDir, 1.85, 'bazooka');
      spawnBurstParticles(launchOrigin.x, launchOrigin.y, launchOrigin.z, 24);
      spawnTargetFireParticles(launchOrigin.x, launchOrigin.y, launchOrigin.z, 18, 1.25);
      soundEngine.playBazookaLaunch();
      kioskStatusMessage = "ROKET NUKLIR MLRS-MK5 'ATLAS' MELUNCUR KE TITIK TARGET!";
      kioskStatusTimer = 4.5;
      emitHudImmediately();
    };

    const triggerNuclearStrikeDetonation = (tx: number, ty: number, tz: number) => {
      nukeCinematicRocketGroup.visible = false;
      nukeTargetReticleGroup.visible = false;

      // 1. Primary HQ-scale Nuclear Fireball & Shockwave
      const impactCenter = new THREE.Vector3(tx, ty + 0.4, tz);
      lyoExplosionSystem.spawnLyoExplosion(impactCenter, 3.35, 'hq');

      // 2. Ring of 6 Secondary Nuclear Thermal Fireballs + Massive Rising Fire Column
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const rx = wrapPlanetCoord(tx + Math.cos(ang) * 4.8);
        const rz = wrapPlanetCoord(tz + Math.sin(ang) * 4.8);
        const ry = getTerrainElevation(rx, rz);
        lyoExplosionSystem.spawnLyoExplosion(new THREE.Vector3(rx, ry + 0.3, rz), 1.85, 'cannon');
      }
      spawnTargetFireParticles(tx, ty, tz, 48, 3.6);
      spawnBurstParticles(tx, ty + 1.8, tz, 46);
      spawnDirectionalSparks(tx, ty + 0.8, tz, 0, 1, 28, 22, 2.2);

      // 3. Thunderous Dual-Layer Nuclear Explosion Audio & Camera Shake
      soundEngine.playBarrelExplosion();
      soundEngine.playTacticalExplosion(2.85);
      shakeTrauma = 0.92;
      lyoGrassSystem.stampExplosionShockwave(tx, tz, 24.0, 1.0);

      // 4. Heavy 24m Radius Nuclear Blast Damage to Enemy Units, Vehicles, Props, Trees & Red Base
      const blastRadius = 24.0;
      for (const t of tanks) {
        if (t.team === 'blue' || t.hp <= 0) continue;
        const d = getPlanetShortestDistance(tx, tz, t.x, t.z);
        if (d <= blastRadius) {
          const dmg = Math.round(240 * (1 - (d / blastRadius) * 0.55));
          t.hp = Math.max(0, t.hp - dmg);
          t.hitFlashTimer = 0.45;
          if (t.hp <= 0) {
            lyoExplosionSystem.spawnLyoExplosion(new THREE.Vector3(t.x, ty + 1.0, t.z), 1.65, 'cannon');
          }
        }
      }
      for (const b of buddyUnits) {
        if (b.team === 'blue' || !b.alive) continue;
        const d = getPlanetShortestDistance(tx, tz, b.x, b.z);
        if (d <= blastRadius) {
          b.hp = 0;
          b.alive = false;
          b.respawnTimer = 8.0;
          b.root.visible = false;
          enemiesDefeated++;
          score += 250;
        }
      }
      for (const other of activeMapProps) {
        if (!other.alive) continue;
        const d = getPlanetShortestDistance(other.x, other.z, tx, tz);
        if (d < 16.0) {
          if (other.category === 'pushable' && d > 0.05) {
            const dx = getPlanetShortestDelta(other.x, tx) / d;
            const dz = getPlanetShortestDelta(other.z, tz) / d;
            const push = (1 - d / 16.0) * 18.0;
            other.vx += dx * push;
            other.vz += dz * push;
            other.rotVelY += (Math.random() - 0.5) * 12.0;
          } else if (other.category === 'breakable' || (other.category === 'solid' && other.destructible)) {
            other.alive = false;
            other.wrapper.visible = false;
          }
        }
      }
      if (getPlanetShortestDistance(tx, tz, redBase.hqX, redBase.hqZ) <= 28.0) {
        redBaseHp = Math.max(0, redBaseHp - 480);
        syncPadVisuals(redBase, redPadSlots, 'RED', redBaseHp);
      }
    };

    const handleEditorPlaceAtCursor = (worldX: number, worldZ: number) => {
      const tool = editorToolRef.current;
      const px = Math.round(wrapPlanetCoord(worldX) * 2) / 2;
      const pz = Math.round(wrapPlanetCoord(worldZ) * 2) / 2;

      if (tool === 'sculpt_raise' || tool === 'sculpt_lower' || tool === 'sculpt_flatten') {
        applyTerrainSculptBrush(px, pz, editorBrushRadiusRef.current, tool, 0.75);
        soundEngine.playUiClick();
        return;
      }

      soundEngine.playPickup();
      spawnBurstParticles(px, 1.2, pz, 8);

      if (tool === 'move_blue_hq') {
        currentMapLayout.blueHq = { x: px, z: pz };
        blueBase.hqX = px;
        blueBase.hqZ = pz;
        blueBase.baseGroup.position.set(px, 0, pz);
        return;
      }
      if (tool === 'move_blue_pad') {
        currentMapLayout.bluePad = { x: px, z: pz };
        blueBase.padX = px;
        blueBase.padZ = pz;
        blueBase.padGroup.position.set(px, 0.04, pz);
        return;
      }
      if (tool === 'move_red_hq') {
        currentMapLayout.redHq = { x: px, z: pz };
        redBase.hqX = px;
        redBase.hqZ = pz;
        redBase.baseGroup.position.set(px, 0, pz);
        return;
      }
      if (tool === 'move_red_pad') {
        currentMapLayout.redPad = { x: px, z: pz };
        redBase.padX = px;
        redBase.padZ = pz;
        redBase.padGroup.position.set(px, 0.04, pz);
        return;
      }
      if (tool === 'move_drop_zone') {
        currentMapLayout.centerDropZone = { x: px, z: pz };
        centerDropZoneGroup.position.set(px, 0.06, pz);
        return;
      }

      const newProp: PlacedMapProp = {
        id: nextEntityId++,
        kind: tool,
        x: px,
        z: pz,
        rotY: editorRotY,
        scale: editorScale,
      };
      currentMapLayout.props.push(newProp);
      spawnSingleMapProp(newProp);
    };

    const handleEditorDeleteNearest = (worldX: number, worldZ: number) => {
      let nearestIdx = -1;
      let bestDist = 4.8;
      currentMapLayout.props.forEach((p, idx) => {
        const d = getPlanetShortestDistance(p.x, p.z, worldX, worldZ);
        if (d < bestDist) {
          bestDist = d;
          nearestIdx = idx;
        }
      });
      if (nearestIdx === -1 && currentMapLayout.props.length > 0) {
        // Fallback if triggered via UI button: remove last placed object
        nearestIdx = currentMapLayout.props.length - 1;
      }
      if (nearestIdx !== -1) {
        const removed = currentMapLayout.props.splice(nearestIdx, 1)[0];
        soundEngine.playHit();
        spawnBurstParticles(removed.x, 1.2, removed.z, 8);
        rebuildMapFromLayout(currentMapLayout);
      }
    };

    const handleEditorClearAllProps = () => {
      soundEngine.playHit();
      currentMapLayout.props = [];
      rebuildMapFromLayout(currentMapLayout);
      if (onMapSaved) {
        onMapSaved('Semua Prop Dikosongkan (0 Objek)');
      }
    };

    const handleEditorRotate = () => {
      soundEngine.playUiClick();
      editorRotY = (editorRotY + Math.PI / 4) % (Math.PI * 2);
      // Also rotate nearest prop within 4.2m of cursor if hovering over one
      let nearest: PlacedMapProp | null = null;
      let bestDist = 4.2;
      for (const p of currentMapLayout.props) {
        const d = getPlanetShortestDistance(p.x, p.z, aimWorldPoint.x, aimWorldPoint.z);
        if (d < bestDist) {
          bestDist = d;
          nearest = p;
        }
      }
      if (nearest) {
        nearest.rotY = (nearest.rotY + Math.PI / 4) % (Math.PI * 2);
        rebuildMapFromLayout(currentMapLayout);
      }
    };

    const handleEditorScaleStep = (delta: number) => {
      soundEngine.playUiClick();
      editorScale = Math.round(clamp(editorScale + delta, 0.5, 2.5) * 100) / 100;
      let nearest: PlacedMapProp | null = null;
      let bestDist = 4.2;
      for (const p of currentMapLayout.props) {
        const d = getPlanetShortestDistance(p.x, p.z, aimWorldPoint.x, aimWorldPoint.z);
        if (d < bestDist) {
          bestDist = d;
          nearest = p;
        }
      }
      if (nearest) {
        nearest.scale = editorScale;
        rebuildMapFromLayout(currentMapLayout);
      }
    };

    const handleEditorSaveLayout = () => {
      soundEngine.playPowerCore();
      currentMapLayout.sculptData = serializeTerrainSculptGrid();
      try {
        localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify(currentMapLayout));
      } catch {
        // Ignore storage quota errors
      }
      if (onMapSaved) {
        onMapSaved(`Layout Tersimpan (${currentMapLayout.props.length} Objek)`);
      }
    };

    const handleEditorResetLayout = () => {
      soundEngine.playUiClick();
      resetTerrainSculptGrid();
      try {
        localStorage.removeItem(MAP_STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
      currentMapLayout = cloneDefaultLayout();
      rebuildMapFromLayout(currentMapLayout);
      if (onMapSaved) {
        onMapSaved('Layout Direset ke Default Rapi');
      }
    };

    // =========================================================================
    // 11. INPUT LISTENERS (WASD, MOUSE AIM, SCROLL ZOOM, CLICK SHOOT / EDITOR)
    // =========================================================================
    const keys: Record<string, boolean> = {};
    const mouseNdc = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.2);
    const aimWorldPoint = new THREE.Vector3(0, 0.2, 0);
    let isPointerDown = false;
    let isEditorPanning = false;
    let isEditorSculptDragging = false;
    let lastSculptStampTime = 0;
    let panDragStart = { x: 0, y: 0, panX: 0, panZ: 0 };
    let pointerDownPos = { x: 0, y: 0 };
    // Default 22% wider zoom-out so Base HQ, Stacking Pad 2x2x2, and Drop Zone road are visible at once!
    let cameraZoom = 1.22;

    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (gameStateRef.current !== 'playing') return;

      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        onTogglePause();
        return;
      }

      if (playModeRef.current === 'editor') {
        if (e.code === 'KeyR') {
          e.preventDefault();
          handleEditorRotate();
        } else if (e.code === 'BracketLeft') {
          e.preventDefault();
          handleEditorScaleStep(-0.15);
        } else if (e.code === 'BracketRight') {
          e.preventDefault();
          handleEditorScaleStep(0.15);
        } else if (e.code === 'Delete' || e.code === 'Backspace') {
          e.preventDefault();
          handleEditorDeleteNearest(aimWorldPoint.x, aimWorldPoint.z);
        }
        return;
      }

      if (nukeStrikeState.phase === 'targeting') {
        if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') {
          e.preventDefault();
          confirmAndLaunchNuclearStrike();
          return;
        }
        return;
      }

      if (e.code === 'KeyN') {
        e.preventDefault();
        startNuclearStrikeTargetingMode();
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (mountedTank && mountedTank.vehicleKind === 'plane') {
          mountedTank.targetAltitude = Math.min(14.5, Math.max(12.2, (mountedTank.targetAltitude ?? 0) + 4.5));
          mountedTank.forwardSpeed = Math.max(mountedTank.forwardSpeed ?? 0, 8.5);
        } else if (!mountedTank) {
          handlePlayerJump();
        }
      }

      if (e.code === 'KeyC' || e.code === 'ControlLeft' || e.code === 'ControlRight') {
        if (mountedTank && mountedTank.vehicleKind === 'plane') {
          mountedTank.targetAltitude = 0;
        }
      }

      if (e.code === 'KeyE') {
        e.preventDefault();
        const blueNl = activeNuclearLaunchers.find((n) => n.team === 'blue');
        if (
          blueNl &&
          getPlanetShortestDistance(playerUnit.x, playerUnit.z, blueNl.root.position.x, blueNl.root.position.z) < 6.8
        ) {
          startNuclearStrikeTargetingMode();
          return;
        }
        if (mountedTank && mountedTank.vehicleKind === 'plane') {
          mountedTank.targetAltitude = Math.min(14.5, Math.max(12.2, (mountedTank.targetAltitude ?? 0) + 4.5));
          mountedTank.forwardSpeed = Math.max(mountedTank.forwardSpeed ?? 0, 8.5);
        } else {
          handlePlayerPickupOrThrowCrate();
        }
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        if (mountedTank && mountedTank.vehicleKind === 'plane') {
          handleUseSecondaryOrdnance();
        } else {
          handlePlayerKickOrCraft();
        }
      } else if (e.code === 'KeyX') {
        e.preventDefault();
        handleUseSecondaryOrdnance();
      } else if (e.code === 'KeyG') {
        e.preventDefault();
        handleToggleMountTank();
      } else if (e.code === 'KeyQ') {
        e.preventDefault();
        handleCycleBuildOrder();
      } else if (e.code === 'KeyB') {
        e.preventDefault();
        const actorX = mountedTank ? mountedTank.x : playerUnit.x;
        const actorZ = mountedTank ? mountedTank.z : playerUnit.z;
        const kioskWorldPos = getBlueKioskWorldCenter(0);
        const distToKiosk = getPlanetShortestDistance(
          actorX,
          actorZ,
          kioskWorldPos.x,
          kioskWorldPos.z,
        );
        if (isKioskPromptActive || distToKiosk <= INTERACT_EXIT_RADIUS) {
          soundEngine.playUiClick();
          emitHudImmediately();
          window.dispatchEvent(new CustomEvent('toggle-kiosk-ui'));
        }
      } else if (e.code === 'KeyV') {
        e.preventDefault();
        handleCursorOrCycleTeamCommand(true);
      } else if (e.code === 'Tab') {
        e.preventDefault();
        handleSwapBuddy();
      } else if (e.code === 'Digit1' || e.code === 'Numpad1') {
        e.preventDefault();
        const slot0 = playerUnit.tacticalLoadout.handheldWeapons[0];
        if (slot0) {
          handleSelectTacticalWeapon(playerUnit.weaponId === slot0.slotId ? 'unarmed' : slot0.slotId);
        } else {
          handleSelectTacticalWeapon('pistol');
        }
      } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
        e.preventDefault();
        const slot1 = playerUnit.tacticalLoadout.handheldWeapons[1];
        if (slot1) {
          handleSelectTacticalWeapon(playerUnit.weaponId === slot1.slotId ? 'unarmed' : slot1.slotId);
        } else {
          handleSelectTacticalWeapon('rifle');
        }
      } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
        e.preventDefault();
        const slot2 = playerUnit.tacticalLoadout.handheldWeapons[2];
        if (slot2) {
          handleSelectTacticalWeapon(playerUnit.weaponId === slot2.slotId ? 'unarmed' : slot2.slotId);
        } else {
          handleSelectTacticalWeapon('bazooka');
        }
      } else if (e.code === 'Digit4' || e.code === 'Numpad4') {
        e.preventDefault();
        if (playerUnit.tacticalLoadout.grenadeCount > 0) {
          handleUseTacticalSecondaryItem('hand_grenade');
        } else {
          handleSelectTacticalWeapon('unarmed');
        }
      } else if (e.code === 'Digit5' || e.code === 'Numpad5') {
        e.preventDefault();
        if (playerUnit.tacticalLoadout.landMineCount > 0) {
          handleUseTacticalSecondaryItem('land_mine');
        }
      } else if (e.code === 'Digit0' || e.code === 'Backquote') {
        e.preventDefault();
        handleSelectTacticalWeapon('unarmed');
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    const updateMouseWorldAim = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      mouseNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouseNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerMove = (e: PointerEvent) => {
      updateMouseWorldAim(e.clientX, e.clientY);
      if (playModeRef.current === 'editor') {
        if (isEditorPanning) {
          const dx = e.clientX - panDragStart.x;
          const dy = e.clientY - panDragStart.y;
          const panFactor = 0.065 * editorZoom;
          editorPan.x = wrapPlanetCoord(panDragStart.panX - dx * panFactor);
          editorPan.z = wrapPlanetCoord(panDragStart.panZ - dy * panFactor);
        } else if (isEditorSculptDragging) {
          const tool = editorToolRef.current;
          if (tool === 'sculpt_raise' || tool === 'sculpt_lower' || tool === 'sculpt_flatten') {
            const nowMs = performance.now();
            if (nowMs - lastSculptStampTime >= 45) {
              lastSculptStampTime = nowMs;
              raycaster.setFromCamera(mouseNdc, camera);
              raycaster.ray.intersectPlane(groundPlane, aimWorldPoint);
              applyTerrainSculptBrush(
                aimWorldPoint.x,
                aimWorldPoint.z,
                editorBrushRadiusRef.current,
                tool,
                0.35,
              );
            }
          }
        }
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (gameStateRef.current !== 'playing') return;
      updateMouseWorldAim(e.clientX, e.clientY);
      pointerDownPos = { x: e.clientX, y: e.clientY };

      if (playModeRef.current === 'editor') {
        if (e.button === 1 || e.button === 2) {
          isEditorPanning = true;
          panDragStart = {
            x: e.clientX,
            y: e.clientY,
            panX: editorPan.x,
            panZ: editorPan.z,
          };
        } else if (e.button === 0) {
          const tool = editorToolRef.current;
          if (tool === 'sculpt_raise' || tool === 'sculpt_lower' || tool === 'sculpt_flatten') {
            isEditorSculptDragging = true;
            lastSculptStampTime = performance.now();
            raycaster.setFromCamera(mouseNdc, camera);
            raycaster.ray.intersectPlane(groundPlane, aimWorldPoint);
            applyTerrainSculptBrush(
              aimWorldPoint.x,
              aimWorldPoint.z,
              editorBrushRadiusRef.current,
              tool,
              0.75,
            );
            soundEngine.playUiClick();
          }
        }
        return;
      }

      if (nukeStrikeState.phase === 'targeting') {
        if (e.button === 0) {
          raycaster.setFromCamera(mouseNdc, camera);
          if (raycaster.ray.intersectPlane(groundPlane, aimWorldPoint)) {
            nukeStrikeState = updateNuclearStrikeTargetCursor(
              nukeStrikeState,
              aimWorldPoint.x,
              getTerrainElevation(aimWorldPoint.x, aimWorldPoint.z),
              aimWorldPoint.z,
              280.0,
            );
          }
          confirmAndLaunchNuclearStrike();
        } else if (e.button === 2) {
          soundEngine.playUiClick();
          nukeStrikeState = createInitialNuclearStrikeState();
          nukeTargetReticleGroup.visible = false;
        }
        return;
      }

      if (e.button === 0) {
        // Clicking directly on the 3D Self-Service Kiosk machine opens the Tactical Kiosk modal immediately when in range (<= 2.9m)
        raycaster.setFromCamera(mouseNdc, camera);
        const kioskHitBox = new THREE.Box3();
        for (const cp of blueBase.commanderPads) {
          cp.kioskMesh.updateWorldMatrix(true, false);
          cp.kioskMesh.getWorldPosition(scratchKioskWorldPos);
          const kx = scratchKioskWorldPos.x;
          const ky = scratchKioskWorldPos.y;
          const kz = scratchKioskWorldPos.z;
          kioskHitBox.min.set(kx - 1.65, ky - 0.25, kz - 1.65);
          kioskHitBox.max.set(kx + 1.65, ky + 4.25, kz + 1.65);
          if (raycaster.ray.intersectsBox(kioskHitBox)) {
            const actorX = mountedTank ? mountedTank.x : playerUnit.x;
            const actorZ = mountedTank ? mountedTank.z : playerUnit.z;
            const distToKiosk = getPlanetShortestDistance(actorX, actorZ, kx, kz);
            if (isKioskPromptActive || distToKiosk <= INTERACT_EXIT_RADIUS) {
              soundEngine.playUiClick();
              emitHudImmediately();
              window.dispatchEvent(new CustomEvent('toggle-kiosk-ui'));
            }
            return;
          }
        }

        // Click-to-Swap Dropped Weapon ("dan juga bisa swap senjata dengan cara mengklik senjata yang drop itu"):
        // Clicking directly on a dropped weapon in the 3D world equips or swaps it into the player's 3-slot handheld inventory!
        if (!mountedTank && playerUnit && playerUnit.alive) {
          raycaster.ray.intersectPlane(groundPlane, aimWorldPoint);
          let clickedWeaponIdx = -1;
          let bestClickScore = 1.65;
          const scratchPickupPt = new THREE.Vector3();
          for (let pi = 0; pi < worldPickups.length; pi++) {
            const pk = worldPickups[pi];
            if (pk.kind !== 'weapon' || pk.collected) continue;
            const distToPlayer = getPlanetShortestDistance(playerUnit.x, playerUnit.z, pk.x, pk.z);
            if (distToPlayer > 16.0) continue;
            scratchPickupPt.set(pk.x, pk.y, pk.z);
            const rayDist = raycaster.ray.distanceToPoint(scratchPickupPt);
            const groundDist = getPlanetShortestDistance(aimWorldPoint.x, aimWorldPoint.z, pk.x, pk.z);
            const clickDist = Math.min(rayDist, groundDist);
            if (clickDist <= bestClickScore) {
              bestClickScore = clickDist;
              clickedWeaponIdx = pi;
            }
          }
          if (clickedWeaponIdx !== -1) {
            const pk = worldPickups[clickedWeaponIdx];
            const swapRes = equipOrSwapDroppedWeaponInLoadout(
              playerUnit.tacticalLoadout,
              pk.weaponName,
              pk.remainingAmmo,
            );
            playerUnit.tacticalLoadout = swapRes.updatedLoadout;
            syncUnitFieldsFromLoadout(playerUnit);
            playerUnit.weaponRecoil = 0.38;
            soundEngine.playPickup();
            spawnBurstParticles(pk.x, pk.y, pk.z, 10);
            if (swapRes.action === 'swapped' && swapRes.droppedPreviousWeapon) {
              const prev = swapRes.droppedPreviousWeapon;
              const prevWid: 'pistol' | 'rifle' | 'rocket' =
                prev.slotId === 'bazooka'
                  ? 'rocket'
                  : prev.slotId === 'pistol'
                    ? 'pistol'
                    : 'rifle';
              spawnWorldPickup('weapon', prev.weaponName, pk.x, pk.z, {
                weaponId: prevWid,
                remainingAmmo: prev.remainingAmmo,
                vx: (Math.random() - 0.5) * 2.2,
                vy: 4.2,
                vz: (Math.random() - 0.5) * 2.2,
                despawnTimerSec: TEAM_BUDDIES_CRAFTED_WEAPON_DESPAWN_SEC,
              });
            }
            playerUnit.saluteTimer = 1.65;
            playerUnit.saluteSign.updateText(
              swapRes.action === 'swapped' ? 'SWAP SENJATA!' : 'AMBIL SENJATA!',
              `${playerUnit.weaponName.toUpperCase()} (${playerUnit.ammo})`,
              '#b8ff3c',
              1,
            );
            playerUnit.saluteSign.sprite.visible = true;
            scene.remove(pk.mesh);
            worldPickups.splice(clickedWeaponIdx, 1);
            emitHudImmediately();
            return;
          }
        }
        isPointerDown = true;
      } else if (e.button === 2) {
        handlePlayerPickupOrThrowCrate();
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (playModeRef.current === 'editor') {
        const dragDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
        const wasSculptDragging = isEditorSculptDragging;
        isEditorPanning = false;
        isEditorSculptDragging = false;
        if (gameStateRef.current === 'playing' && dragDist < 6) {
          raycaster.setFromCamera(mouseNdc, camera);
          raycaster.ray.intersectPlane(groundPlane, aimWorldPoint);
          if (e.button === 0 && !wasSculptDragging) {
            handleEditorPlaceAtCursor(aimWorldPoint.x, aimWorldPoint.z);
          } else if (e.button === 2) {
            handleEditorDeleteNearest(aimWorldPoint.x, aimWorldPoint.z);
          }
        }
        return;
      }

      if (e.button === 0) {
        isPointerDown = false;
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (playModeRef.current === 'editor') {
        editorZoom = clamp(editorZoom + Math.sign(e.deltaY) * 0.1, 0.45, 1.85);
      } else {
        cameraZoom = clamp(cameraZoom + Math.sign(e.deltaY) * 0.08, 0.78, 1.65);
      }
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    // External HUD buttons trigger actions via CustomEvent
    const onBuddyActionEvent = (e: Event) => {
      const ce = e as CustomEvent<string>;
      const act = ce.detail;
      if (act === 'pickupOrThrow') handlePlayerPickupOrThrowCrate();
      else if (act === 'jump') handlePlayerJump();
      else if (act === 'kickOrCraft') handlePlayerKickOrCraft();
      else if (act === 'mountOrDismount') handleToggleMountTank();
      else if (act === 'cycleBuildOrder') handleCycleBuildOrder();
      else if (act === 'cycleCommand') handleCursorOrCycleTeamCommand(false);
      else if (act === 'swapBuddy') handleSwapBuddy();
      else if (act === 'selectWeaponUnarmed') handleSelectTacticalWeapon('unarmed');
      else if (act === 'selectWeaponPistol') handleSelectTacticalWeapon('pistol');
      else if (act === 'selectWeaponRifle') handleSelectTacticalWeapon('rifle');
      else if (act === 'selectWeaponBazooka') handleSelectTacticalWeapon('bazooka');
      else if (act === 'selectWeaponLaser') handleSelectTacticalWeapon('laser');
      else if (act === 'selectWeaponGatling') handleSelectTacticalWeapon('gatling');
      else if (act === 'useHandGrenade') handleUseTacticalSecondaryItem('hand_grenade');
      else if (act === 'useLandMine') handleUseTacticalSecondaryItem('land_mine');
      else if (act === 'hotJoinPlayer') handleHotJoinPlayer();
      else if (act === 'sandboxDropRedCrate') handleSandboxQuickDropCrate('red');
      else if (act === 'sandboxDropSuperCrate') handleSandboxQuickDropCrate('super');
      else if (act === 'sandboxDropLegendCrate') handleSandboxQuickDropCrate('legend');
      else if (act === 'sandboxSpawnTank') handleSandboxQuickSpawnTank();
      else if (act === 'sandboxSpawnPlane') handleSandboxQuickSpawnPlane();
      else if (act === 'sandboxSpawnTruck') handleSandboxQuickSpawnTruck();
      else if (act === 'useSecondaryOrdnance') handleUseSecondaryOrdnance();
      else if (act === 'sandboxUnlockBaseLv3') handleSandboxUnlockBaseLv3();
      else if (act === 'sandboxEquipLaserGun') {
        if (mountedTank) handleToggleMountTank();
        playerUnit.tacticalLoadout = equipOrSwapDroppedWeaponInLoadout(
          playerUnit.tacticalLoadout,
          'LG-88 Photon Lance',
          200,
        ).updatedLoadout;
        syncUnitFieldsFromLoadout(playerUnit);
        handleSelectTacticalWeapon('laser');
        const fwdX = Math.cos(playerUnit.yaw);
        const fwdZ = -Math.sin(playerUnit.yaw);
        const pY = getTerrainElevation(playerUnit.x, playerUnit.z) + 1.48;
        const mPos = new THREE.Vector3(
          wrapPlanetCoord(playerUnit.x + fwdX * 1.48),
          pY,
          wrapPlanetCoord(playerUnit.z + fwdZ * 1.48),
        );
        const endPos = new THREE.Vector3(
          wrapPlanetCoord(playerUnit.x + fwdX * 18.0),
          getTerrainElevation(playerUnit.x + fwdX * 18.0, playerUnit.z + fwdZ * 18.0) + 1.1,
          wrapPlanetCoord(playerUnit.z + fwdZ * 18.0),
        );
        soundEngine.playLaserGunFire();
        spawnLaserBeamEffect(mPos, endPos);
        spawnTargetFireParticles(endPos.x, endPos.y, endPos.z, 18, 0.65);
        fireProjectile(true, 'LyoLaserGun', mPos, new THREE.Vector3(fwdX, 0, fwdZ), 68, 18);
        spawnWorldPickup(
          'weapon',
          'LG-88 Photon Lance',
          wrapPlanetCoord(playerUnit.x + fwdX * 2.8),
          wrapPlanetCoord(playerUnit.z + fwdZ * 2.8),
          { weaponId: 'rifle', remainingAmmo: 160, despawnTimerSec: 60 },
        );
      } else if (act === 'sandboxEquipGatlingGun') {
        if (mountedTank) handleToggleMountTank();
        playerUnit.tacticalLoadout = equipOrSwapDroppedWeaponInLoadout(
          playerUnit.tacticalLoadout,
          'TITAN-6 Rotary Gatling',
          300,
        ).updatedLoadout;
        syncUnitFieldsFromLoadout(playerUnit);
        handleSelectTacticalWeapon('gatling');
        const fwdX = Math.cos(playerUnit.yaw);
        const fwdZ = -Math.sin(playerUnit.yaw);
        const rightX = Math.sin(playerUnit.yaw);
        const rightZ = Math.cos(playerUnit.yaw);
        const pY = getTerrainElevation(playerUnit.x, playerUnit.z) + 1.44;
        const mPos = new THREE.Vector3(
          wrapPlanetCoord(playerUnit.x + fwdX * 1.52),
          pY,
          wrapPlanetCoord(playerUnit.z + fwdZ * 1.52),
        );
        soundEngine.playGatlingGunFire();
        spawnGatlingBrassAndSparks(mPos.x, mPos.y, mPos.z, fwdX, fwdZ, rightX, rightZ);
        fireProjectile(true, 'Titan6Gatling', mPos, new THREE.Vector3(fwdX, 0, fwdZ), 62, 14);
        spawnWorldPickup(
          'weapon',
          'TITAN-6 Rotary Gatling',
          wrapPlanetCoord(playerUnit.x + fwdX * 2.8),
          wrapPlanetCoord(playerUnit.z + fwdZ * 2.8),
          { weaponId: 'rifle', remainingAmmo: 240, despawnTimerSec: 60 },
        );
      } else if (act === 'sandboxGiveHandGrenade') {
        if (mountedTank) handleToggleMountTank();
        playerUnit.tacticalLoadout = addTacticalSecondaryToLoadout(
          playerUnit.tacticalLoadout,
          'hand_grenade',
          5,
        );
        syncUnitFieldsFromLoadout(playerUnit);
        handleUseTacticalSecondaryItem('hand_grenade');
      } else if (act === 'sandboxGiveLandMine') {
        if (mountedTank) handleToggleMountTank();
        playerUnit.tacticalLoadout = addTacticalSecondaryToLoadout(
          playerUnit.tacticalLoadout,
          'land_mine',
          5,
        );
        syncUnitFieldsFromLoadout(playerUnit);
        handleUseTacticalSecondaryItem('land_mine');
      } else if (act === 'sandboxSpawnPlaneWithClusterBomb') {
        handleSandboxUnlockBaseLv3();
        playerUnit.secondaryItem = 'cluster_bomb';
        playerUnit.secondaryCount = 6;
        if (!mountedTank || mountedTank.vehicleKind !== 'plane') {
          if (mountedTank) handleToggleMountTank();
          const newPlane = createLyoPlaneVehicle(playerUnit.x, playerUnit.z, 'blue');
          newPlane.altitude = 9.5;
          newPlane.targetAltitude = 11.5;
          newPlane.forwardSpeed = 10.5;
          tanks.push(newPlane);
          mountedTank = newPlane;
          newPlane.occupiedByPlayer = true;
          newPlane.riderGroup.visible = true;
          playerUnit.root.visible = false;
        }
        if (mountedTank && mountedTank.vehicleKind === 'plane') {
          dropClusterBombFromPlane(mountedTank);
        }
      } else if (act === 'sandboxDeployNuclearLauncher' || act === 'startNuclearStrikeTargeting') {
        if (act === 'sandboxDeployNuclearLauncher') {
          handleSandboxUnlockBaseLv3();
        }
        startNuclearStrikeTargetingMode();
      } else if (act === 'confirmNuclearStrikeTarget') {
        if (nukeStrikeState.phase === 'targeting') {
          confirmAndLaunchNuclearStrike();
        }
      } else if (act === 'cancelNuclearStrikeTarget') {
        soundEngine.playUiClick();
        nukeStrikeState = createInitialNuclearStrikeState();
        nukeTargetReticleGroup.visible = false;
        nukeCinematicRocketGroup.visible = false;
      } else if (act === 'planeClimbStep') {
        if (mountedTank && mountedTank.vehicleKind === 'plane') {
          soundEngine.playPickup();
          mountedTank.targetAltitude = Math.min(19.5, Math.max(13.8, (mountedTank.targetAltitude ?? 0) + 6.5));
          mountedTank.altitude = Math.min(19.5, Math.max(10.5, (mountedTank.altitude ?? 0) + 6.5));
          mountedTank.verticalSpeed = 8.5;
          mountedTank.forwardSpeed = Math.max(mountedTank.forwardSpeed ?? 0, 8.5);
        }
      } else if (act === 'planeDescendStep') {
        if (mountedTank && mountedTank.vehicleKind === 'plane') {
          soundEngine.playUiClick();
          mountedTank.targetAltitude = 0;
          mountedTank.verticalSpeed = -7.5;
        }
      } else if (act === 'toggleKioskUi') {
        const actorX = mountedTank ? mountedTank.x : playerUnit.x;
        const actorZ = mountedTank ? mountedTank.z : playerUnit.z;
        const kioskWorldPos = getBlueKioskWorldCenter(0);
        const distToKiosk = getPlanetShortestDistance(
          actorX,
          actorZ,
          kioskWorldPos.x,
          kioskWorldPos.z,
        );
        if (isKioskPromptActive || distToKiosk <= INTERACT_EXIT_RADIUS) {
          soundEngine.playUiClick();
          emitHudImmediately();
          window.dispatchEvent(new CustomEvent('toggle-kiosk-ui'));
        }
      } else if (act.startsWith('kioskSelectRecipe:')) {
        const recipeId = act.slice('kioskSelectRecipe:'.length) as KioskBuildPriorityRecipeId;
        if (recipeId === 'nuclear_launcher') {
          const currentCmdLevel = blueCommanderBases[0]?.buildingLevel ?? 1;
          const nukeAccess = evaluateNuclearLauncherAccess(currentCmdLevel);
          if (!nukeAccess.allowed) {
            soundEngine.playHit();
            kioskStatusMessage = nukeAccess.statusMessage;
            kioskStatusTimer = 5.5;
            emitHudImmediately();
            return;
          }
          if (activeNuclearLaunchers.some((n) => n.team === 'blue')) {
            startNuclearStrikeTargetingMode();
            return;
          }
        }
        if (recipeId === 'cluster_bomb') {
          const currentCmdLevel = blueCommanderBases[0]?.buildingLevel ?? 1;
          const clusterAccess = evaluateClusterBombAccess(
            currentCmdLevel,
            Boolean(mountedTank && mountedTank.vehicleKind === 'plane'),
          );
          if (!clusterAccess.allowedToBuild) {
            soundEngine.playHit();
            kioskStatusMessage = clusterAccess.statusMessage;
            kioskStatusTimer = 5.5;
            emitHudImmediately();
            return;
          }
        }
        const spec = KIOSK_BUILD_PRIORITY_RECIPES[recipeId];
        if (spec) {
          const wasEmptyQueue = blueBuildQueue.length === 0 || !useCustomHologramRecipe;
          const baseQueue = useCustomHologramRecipe ? blueBuildQueue : [];
          const enq = enqueueKioskBuildRecipe(baseQueue, recipeId, MAX_KIOSK_BUILD_QUEUE);
          if (!enq.enqueued) {
            soundEngine.playHit();
            kioskStatusMessage = enq.statusMessage;
            kioskStatusTimer = 4.5;
            emitHudImmediately();
            return;
          }
          soundEngine.playUiClick();
          blueBuildQueue = enq.queue;
          activePriorityRecipe = enq.activeRecipe;
          useCustomHologramRecipe = true;
          const activeSpec = KIOSK_BUILD_PRIORITY_RECIPES[activePriorityRecipe];
          buildOrder = activeSpec.buildOrder;

          if (wasEmptyQueue || blueBuildQueue.length === 1) {
            const existingCrates = bluePadSlots.filter((s) => s !== 'empty') as (
              | 'red'
              | 'super'
              | 'legend'
            )[];
            bluePadSlots = ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'];
            bluePadSlotsList[0] = bluePadSlots;
            for (const kind of existingCrates) {
              const slotIdx = chooseNextPadSlotIndexForHologram(
                bluePadSlots,
                activeSpec.slotHologramColors,
                kind,
                buildOrder,
              );
              if (slotIdx !== -1) {
                bluePadSlots[slotIdx] = kind;
              } else {
                spawnWorldCrate(kind, blueBase.padX - 3.2, blueBase.padZ - 1.5, true);
              }
            }
          }
          syncPadVisuals(blueBase, bluePadSlots, 'BLUE', blueBaseHp);
          spawnBurstParticles(blueBase.padX, 1.6, blueBase.padZ, 12);
          kioskStatusMessage = enq.statusMessage;
          kioskStatusTimer = 4.5;
          if (
            evaluatePadHologramState(
              true,
              useCustomHologramRecipe,
              activePriorityRecipe,
              bluePadSlotsList[0],
            ).isFulfilled
          ) {
            craftFromCommanderPad('blue', 0, true);
          } else {
            emitHudImmediately();
          }
        }
      } else if (act.startsWith('kioskRemoveQueueIndex:')) {
        const rmIdx = Number(act.slice('kioskRemoveQueueIndex:'.length));
        if (!Number.isNaN(rmIdx)) {
          soundEngine.playUiClick();
          const res = removeKioskBuildQueueAtIndex(blueBuildQueue, rmIdx);
          blueBuildQueue = res.queue;
          if (res.activeRecipe) {
            activePriorityRecipe = res.activeRecipe;
            useCustomHologramRecipe = true;
            buildOrder = KIOSK_BUILD_PRIORITY_RECIPES[activePriorityRecipe].buildOrder;
          } else {
            useCustomHologramRecipe = false;
          }
          syncPadVisuals(blueBase, bluePadSlots, 'BLUE', blueBaseHp);
          emitHudImmediately();
        }
      } else if (act === 'kioskClearQueue') {
        soundEngine.playUiClick();
        blueBuildQueue = [];
        useCustomHologramRecipe = false;
        syncPadVisuals(blueBase, bluePadSlots, 'BLUE', blueBaseHp);
        kioskStatusMessage = 'ANTRIAN BUILD DIKOSONGKAN';
        kioskStatusTimer = 3.5;
        emitHudImmediately();
      } else if (act.startsWith('kioskUpgradeBase:')) {
        const upgradeId = act.slice('kioskUpgradeBase:'.length) as KioskBaseGoldUpgradeId;
        const myPlot = blueCommanderBases[0];
        if (myPlot) {
          const res = applyCommanderBaseGoldUpgrade(myPlot, upgradeId, gold);
          kioskStatusMessage = res.message;
          kioskStatusTimer = 4.5;
          if (res.upgraded) {
            gold = res.nextGold;
            blueBaseHp = Math.min(2500, blueBaseHp + 350);
            soundEngine.playPowerCore();
            spawnBurstParticles(blueBase.hqX, 2.5, blueBase.hqZ, 20);
            spawnBurstParticles(blueBase.padX, 2.0, blueBase.padZ, 16);
            syncPadVisuals(blueBase, bluePadSlots, 'BLUE', blueBaseHp);
          } else {
            soundEngine.playHit();
          }
        }
      } else if (act.startsWith('kioskBuyCrate:')) {
        const crateKind = act.slice('kioskBuyCrate:'.length) as WorldCrateKind;
        const res = purchaseCrateAirdropWithGold(crateKind, gold);
        kioskStatusMessage = res.message;
        kioskStatusTimer = 4.5;
        if (res.purchased && res.airdropCrateKind) {
          gold = res.nextGold;
          soundEngine.playPickup();
          const dropX = blueBase.padX - 3.6 + (Math.random() - 0.5) * 2.2;
          const dropZ = blueBase.padZ - 2.0 + (Math.random() - 0.5) * 1.8;
          spawnWorldCrate(res.airdropCrateKind, dropX, dropZ, false);
          spawnBurstParticles(blueBase.padX - 3.6, 2.0, blueBase.padZ - 2.0, 12);
        } else {
          soundEngine.playHit();
        }
      } else if (act === 'editorRotate') handleEditorRotate();
      else if (act === 'editorScaleUp') handleEditorScaleStep(0.15);
      else if (act === 'editorScaleDown') handleEditorScaleStep(-0.15);
      else if (act === 'editorDeleteLast') handleEditorDeleteNearest(aimWorldPoint.x, aimWorldPoint.z);
      else if (act === 'editorClearAllProps') handleEditorClearAllProps();
      else if (act === 'editorSaveMap') handleEditorSaveLayout();
      else if (act === 'editorResetMap') handleEditorResetLayout();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('buddy-action', onBuddyActionEvent);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // =========================================================================
    // 12. CAMERA SPRING, OBJECT COLLISION SOLVER & MAIN 60FPS ANIMATION LOOP
    // =========================================================================
    let camFollowPos: Vec3 = { x: -32.5, y: 0.8, z: 38.5 };
    let camFollowVel: Vec3 = { x: 0, y: 0, z: 0 };
    const mousePanCurrent = { x: 0, z: 0 };
    const recoilOffset = { x: 0, z: 0 };
    let shakeTrauma = 0;
    let hudSyncAccumulator = 0;
    let runElapsedSec = 0;

    const tryTriggerCooldown = (key: string, timeSec: number, cooldownSec = 0.10): boolean => {
      if (canTriggerCollisionCooldown(collisionCooldownMap.get(key), timeSec, cooldownSec)) {
        collisionCooldownMap.set(key, timeSec);
        return true;
      }
      return false;
    };

    // Detonate an Explosive Red Barrel with 5-Layer Lyo Explosion VFX + 3D Metal Debris + Shockwave Knockback + Lyo Barrel SFX
    // (REA ExplosiveBarrel `Qi` in `B1Nq4Kq6.js:183450`: explosionRadius = 8.0m, damageRadius = 6.0m, chain-reaction + stun 1.5s)
    const triggerBarrelExplosion = (bx: number, bz: number) => {
      playSpatialSoundAt(bx, bz, 36.0, 6.0, () => {
        soundEngine.playBarrelExplosion();
      });
      const barrelGroundY = getTerrainElevation(bx, bz);
      scratchExplosionPos.set(bx, barrelGroundY + 0.75, bz);
      lyoExplosionSystem.spawnLyoExplosion(
        scratchExplosionPos,
        1.35,
        'barrel',
      );
      spawnBurstParticles(bx, barrelGroundY + 1.35, bz, 28);
      spawnDebrisChunks(bx, barrelGroundY + 0.65, bz, 'metal', 14);
      const barrelDistToPlayer = getPlanetShortestDistance(
        bx,
        bz,
        getPlayerAudioListenerPos().x,
        getPlayerAudioListenerPos().z,
      );
      if (barrelDistToPlayer < 32.0) {
        shakeTrauma = Math.min(1, shakeTrauma + 0.64 * Math.max(0, 1 - barrelDistToPlayer / 32.0));
      }

      // 1. Push or shatter nearby props & chain-detonate other explosive barrels within 8.0m (REA explosionRadius = 8)
      for (const other of activeMapProps) {
        if (!other.alive) continue;
        const d = getPlanetShortestDistance(other.x, other.z, bx, bz);
        if (d > 0.05 && d < 8.0) {
          const dx = getPlanetShortestDelta(other.x, bx) / d;
          const dz = getPlanetShortestDelta(other.z, bz) / d;
          const falloff = 1 - d / 8.0;
          const blast = falloff * 14.0;
          if (other.category === 'pushable') {
            other.vx += dx * blast;
            other.vz += dz * blast;
            other.rotVelY += (Math.random() - 0.5) * 9.0;
            if (other.canJiggleOnHit) other.jiggleTimer = 0.35;
          } else if (other.category === 'breakable' && d < 6.0) {
            other.alive = false;
            other.wrapper.visible = false;
            if (other.kind === 'explosive_barrel') {
              triggerBarrelExplosion(other.x, other.z);
            } else {
              spawnDebrisChunks(
                other.x,
                0.55,
                other.z,
                other.materialTag === 'wood' ? 'wood' : 'concrete',
                10,
              );
            }
          }
        }
      }
      for (let ci = worldCrates.length - 1; ci >= 0; ci--) {
        const c = worldCrates[ci];
        if (c.state !== 'grounded') continue;
        const splash = evaluateSplashDamageOnDroppedItem(c.x, c.z, bx, bz, 6.5, 32, c.hp);
        if (splash.hit) {
          c.hp = splash.nextHp;
          c.vx += splash.knockbackVx;
          c.vz += splash.knockbackVz;
          c.vy = Math.max(c.vy, 3.8);
          c.rotVelY += (Math.random() - 0.5) * 8.0;
          if (splash.destroyed) {
            scratchExplosionPos.set(c.x, getTerrainElevation(c.x, c.z) + 0.55, c.z);
            lyoExplosionSystem.spawnLyoExplosion(scratchExplosionPos, 0.72, 'crate');
            spawnDebrisChunks(c.x, 0.55, c.z, c.kind === 'super' ? 'metal' : 'wood', 10);
            const crateDrop = evaluateCrateDestructionDrop(c.kind);
            if (crateDrop.dropKind === 'health' || crateDrop.isPurpleSuperWeapon) {
              spawnWorldPickup(crateDrop.dropKind, crateDrop.label, c.x, c.z, {
                weaponId: crateDrop.weaponId,
                remainingAmmo: crateDrop.remainingAmmo,
                vy: 6.4,
              });
            }
            rewardPlayerOnCrateDestroyed(c.x, c.z);
            scene.remove(c.mesh);
            worldCrates.splice(ci, 1);
          }
        }
      }

      // 1b. Splash Damage Vulnerability (`Hancur Terkena Serangan Area`): Crafted/dropped weapons on the ground explode if shelled!
      for (let pi = worldPickups.length - 1; pi >= 0; pi--) {
        const pk = worldPickups[pi];
        const splash = evaluateSplashDamageOnDroppedItem(pk.x, pk.z, bx, bz, 6.0, 28, pk.hp);
        if (splash.hit) {
          pk.hp = splash.nextHp;
          pk.vx += splash.knockbackVx;
          pk.vz += splash.knockbackVz;
          pk.vy = Math.max(pk.vy, 4.2);
          if (splash.destroyed) {
            scratchExplosionPos.set(pk.x, pk.y, pk.z);
            lyoExplosionSystem.spawnLyoExplosion(scratchExplosionPos, 0.58, 'crate');
            spawnDebrisChunks(pk.x, pk.y, pk.z, 'metal', 7);
            spawnBurstParticles(pk.x, pk.y + 0.25, pk.z, 8);
            scene.remove(pk.mesh);
            worldPickups.splice(pi, 1);
          }
        }
      }

      // 2. Apply REA radial blast knockback + 1.5s StunEffect + directional HitReaction to characters & vehicles within 6.0m (damageRadius = 6)
      let playedStunSfx = false;
      for (const b of buddyUnits) {
        if (!b.alive || (b.isPlayer && (mountedTank || ridingTramCarIdx !== null))) continue;
        const d = getPlanetShortestDistance(b.x, b.z, bx, bz);
        if (d < 6.0) {
          const safeD = Math.max(0.1, d);
          const dx = getPlanetShortestDelta(b.x, bx) / safeD;
          const dz = getPlanetShortestDelta(b.z, bz) / safeD;
          const falloff = 1 - d / 6.0;
          const blastDmg = Math.max(4, Math.round(falloff * 24));
          if (b.isPlayer) {
            const iFrameRes = applyPlayerDamageWithInvincibilityAndKnockback({
              hp: b.hp,
              invincibilityTimer: b.invincibilityTimer ?? 0,
              x: b.x,
              z: b.z,
              vx: b.vx,
              vz: b.vz,
              vy: b.vy,
              damage: blastDmg,
              sourceX: bx,
              sourceZ: bz,
              facingYaw: b.yaw,
              invincibilityDurationSec: PLAYER_INVINCIBILITY_DURATION_SEC,
              knockbackSpeed: Math.max(9.5, falloff * 11.5),
            });
            if (!iFrameRes.damageApplied) {
              continue;
            }
            b.hp = iFrameRes.hp;
            b.invincibilityTimer = iFrameRes.invincibilityTimer;
            b.vx = iFrameRes.vx;
            b.vz = iFrameRes.vz;
            b.vy = iFrameRes.vy;
            b.jumpOffset = Math.max(b.jumpOffset, 0.08);
            b.isGrounded = false;
          } else {
            b.vx += dx * falloff * 11.5;
            b.vz += dz * falloff * 11.5;
            b.hp -= blastDmg;
          }
          b.hitFlashTimer = 0.15;
          b.hitReactionTimer = 0.60;
          b.hitReactionDirX = dx;
          b.hitReactionDirZ = dz;
          b.stunTimer = 1.5;
          if (!playedStunSfx) {
            playSpatialSoundAt(bx, bz, 22.0, 5.0, () => {
              soundEngine.playStunned();
            });
            playedStunSfx = true;
          }
          if (b.hp <= 0) {
            b.alive = false;
            b.respawnTimer = 6.0;
            b.root.visible = false;
            spawnBurstParticles(b.x, 1.4, b.z, 16);
            handleBuddyDeathDrops(b, true);
            if (b.team === 'red') {
              enemiesDefeated++;
              score += 150;
            } else if (b.isPlayer) {
              const ownerPlot = blueCommanderBases[clamp(b.ownerCommanderId, 0, COMMANDERS_PER_TEAM - 1)];
              const canRespawnPlayer =
                playModeRef.current !== 'match' ||
                canBuddyUnitRespawnAtBase(
                  b.isStarterCommanderUnit,
                  ownerPlot?.destroyed ?? false,
                  ownerPlot?.buildingHp ?? 400,
                );
              if (canRespawnPlayer) {
                b.alive = true;
                b.hp = b.maxHp;
                b.weaponId = 'unarmed';
                b.weaponName = 'Tangan Kosong (Tinju)';
                b.ammo = 0;
                b.x = blueBase.padX - 3.8;
                b.z = blueBase.padZ - 0.5;
                b.root.visible = true;
              } else {
                handleSwapBuddy();
              }
            }
            checkMatchDeathmatchWinCondition();
          }
        }
      }
      for (const v of tanks) {
        if (v.hp <= 0 || (v.altitude ?? 0) > 3.5) continue;
        const d = getPlanetShortestDistance(v.x, v.z, bx, bz);
        if (d < 6.0) {
          const safeD = Math.max(0.1, d);
          const dx = getPlanetShortestDelta(v.x, bx) / safeD;
          const dz = getPlanetShortestDelta(v.z, bz) / safeD;
          const falloff = 1 - d / 6.0;
          v.vx += dx * falloff * 7.5;
          v.vz += dz * falloff * 7.5;
          v.hitFlashTimer = 0.15;
          v.hitReactionTimer = 0.60;
          v.hitReactionDirX = dx;
          v.hitReactionDirZ = dz;
          v.stunTimer = 1.5;
          if (!playedStunSfx) {
            playSpatialSoundAt(bx, bz, 22.0, 5.0, () => {
              soundEngine.playStunned();
            });
            playedStunSfx = true;
          }
        }
      }
    };

    let cachedStaticWorldStructures: StaticWorldStructureObb[] | null = null;
    let cachedStaticWorldStructuresKey = '';

    const getStaticWorldStructures = (): StaticWorldStructureObb[] => {
      const blueSkyshields = getBaseSkyshieldTurrets(blueBase.baseGroup);
      const redSkyshields = getBaseSkyshieldTurrets(redBase.baseGroup);
      let stateKey = `${blueBase.hqX},${blueBase.hqZ},${redBase.hqX},${redBase.hqZ}|`;
      for (let i = 0; i < 4; i++) {
        const bp = blueCommanderBases[i];
        const rp = redCommanderBases[i];
        stateKey += `${blueSkyshields[i]?.isBuilt ? 1 : 0}${redSkyshields[i]?.isBuilt ? 1 : 0}`;
        stateKey += bp
          ? `${bp.destroyed ? 1 : 0}:${bp.buildingHp > 0 ? bp.buildingLevel : 0}:${bp.fenceHp > 0 ? bp.fenceLevel : 0}:${bp.hasParkingBay ? 1 : 0};`
          : '0;';
        stateKey += rp
          ? `${rp.destroyed ? 1 : 0}:${rp.buildingHp > 0 ? rp.buildingLevel : 0}:${rp.fenceHp > 0 ? rp.fenceLevel : 0}:${rp.hasParkingBay ? 1 : 0};`
          : '0;';
      }
      if (cachedStaticWorldStructures && cachedStaticWorldStructuresKey === stateKey) {
        return cachedStaticWorldStructures;
      }

      const structures = buildStaticWorldStructuresList({
        blueBase,
        redBase,
        blueCommanderBases,
        redCommanderBases,
      });
      cachedStaticWorldStructures = structures;
      cachedStaticWorldStructuresKey = stateKey;
      return structures;
    };

    // Build & cache 2D A* Navigation Grids for Foot Units (BuddyUnit) and Tracked Vehicles (TankVehicle)
    const getArenaNavGrid = (isTrackedTank: boolean): AStarNavGrid => {
      if (navGridDirty || !cachedFootNavGrid || !cachedVehicleNavGrid) {
        const { footGrid, vehicleGrid } = buildArenaNavGrids({
          staticStructures: getStaticWorldStructures(),
          trees,
          activeMapProps,
        });
        cachedFootNavGrid = footGrid;
        cachedVehicleNavGrid = vehicleGrid;
        navGridDirty = false;
      }
      return isTrackedTank ? cachedVehicleNavGrid! : cachedFootNavGrid!;
    };

    let aStarRepathsThisFrame = 0;

    // Compute A* waypoint steering velocity (vx, vz) for an AI character or AI tank
    const computeAStarSteeringDirection = (
      agent: Parameters<typeof computeUnitAStarSteeringDirection>[0],
      goalX: number,
      goalZ: number,
      dt: number,
      isTrackedTank: boolean,
      canFly = false,
    ): { dirX: number; dirZ: number; distToGoal: number } =>
      computeUnitAStarSteeringDirection(
        agent,
        goalX,
        goalZ,
        dt,
        isTrackedTank,
        canFly,
        getArenaNavGrid,
        () => aStarRepathsThisFrame < 2,
        () => {
          aStarRepathsThisFrame++;
        },
      );

    // =========================================================================
    // MUZZLE RAYCAST HIT DETECTION (100 UNITS, LAYER MASK SKIPPING SHOOTER & FRIENDLIES)
    // + SOFT HOLOGRAPHIC GLOW VFX TARGET LOCK-ON (ENEMY RED UNITS / VEHICLES / SKYSHIELDS ONLY)
    // =========================================================================
    const muzzleRaycastGroup = new THREE.Group();
    muzzleRaycastGroup.name = 'MuzzleRaycastAndTargetLockGroup';
    scene.add(muzzleRaycastGroup);

    // Soft-Glow Target Lock-On VFX Group — ONLY visible when the INVISIBLE raycast locks onto a hostile ('red') target!
    const targetLockGroup = new THREE.Group();
    targetLockGroup.name = 'TargetLockReticleGroup';
    targetLockGroup.visible = false;
    muzzleRaycastGroup.add(targetLockGroup);

    const lockGroundAuraMat = new THREE.MeshBasicMaterial({
      map: createGroundLockAuraTexture(),
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const lockBaseRing = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), lockGroundAuraMat);
    lockBaseRing.rotation.x = -Math.PI / 2;
    lockBaseRing.position.y = 0.08;
    targetLockGroup.add(lockBaseRing);

    const lockHudReticleMat = new THREE.SpriteMaterial({
      map: createHudLockReticleTexture(),
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    const lockHudReticleSprite = new THREE.Sprite(lockHudReticleMat);
    lockHudReticleSprite.position.set(0, 1.35, 0);
    lockHudReticleSprite.scale.set(2.2, 2.2, 1);
    targetLockGroup.add(lockHudReticleSprite);

    let activeMuzzleRaycastResult: MuzzleRaycastResult | null = null;
    let lastLockedColliderId: string | null = null;

    const getPlayerMuzzleAndAimDirection = () =>
      computePlayerMuzzleAndAimDirection(playerUnit, mountedTank, aimWorldPoint);

    const buildWorldRaycastColliders = (
      shooterId: string,
      rayOriginX: number,
      rayOriginZ: number,
    ): RaycastCollider3D[] =>
      buildArenaRaycastColliders({
        shooterId,
        rayOriginX,
        rayOriginZ,
        mountedTank,
        playerUnit,
        buddyUnits,
        tanks,
        redBase,
        activeMapProps,
        trees,
        staticStructures: getStaticWorldStructures(),
      });

    const updateMuzzleRaycastAndTargetLock = (
      planetPivotX: number,
      planetPivotZ: number,
      kCurve: number,
      timeSec: number,
    ): MuzzleRaycastResult => {
      const { muzzleOrigin, aimDir, shooterId } = getPlayerMuzzleAndAimDirection();
      const colliders = buildWorldRaycastColliders(shooterId, muzzleOrigin.x, muzzleOrigin.z);

      // Perform invisible 100-unit raycast skipping shooter & friendly ('blue') units/vehicles/Skyshields
      const result = castMuzzleRaycast3D(muzzleOrigin, aimDir, colliders, {
        maxDistance: RAYCAST_MAX_DISTANCE,
        layerMask: RAYCAST_LAYERS.DEFAULT_MUZZLE_MASK,
        shooterId,
        shooterTeam: 'blue',
      });
      activeMuzzleRaycastResult = result;

      // Soft Holographic Target Lock-On VFX Aura & Optical HUD Reticle (ONLY on Enemy Red targets, 100% invisible raycast line!)
      if (result.isTargetLocked && result.lockCenter) {
        if (result.colliderId && result.colliderId !== lastLockedColliderId) {
          lastLockedColliderId = result.colliderId;
          soundEngine.playSkyshieldRadarLock();
        }
        targetLockGroup.visible = true;
        const lx = planetPivotX + getPlanetShortestDelta(result.lockCenter.x, planetPivotX);
        const lz = planetPivotZ + getPlanetShortestDelta(result.lockCenter.z, planetPivotZ);
        const lGroundY = getTerrainElevation(result.lockCenter.x, result.lockCenter.z);
        const lYOff = computePlanetYOffset(result.lockCenter.x, result.lockCenter.z, planetPivotX, planetPivotZ, kCurve);
        const baseLockY =
          result.targetKind === 'skyshield'
            ? lGroundY + 3.55
            : Math.max(lGroundY, result.lockCenter.y - 1.05);
        targetLockGroup.position.set(lx, baseLockY + lYOff, lz);

        const rScale = clamp(result.lockRadius, 1.05, 2.85);
        const lockPulse = 1.0 + Math.sin(timeSec * 9.0) * 0.06;
        lockBaseRing.scale.setScalar(rScale * lockPulse);
        lockBaseRing.rotation.z = timeSec * 1.6;
        lockGroundAuraMat.opacity = 0.72 + Math.sin(timeSec * 9.0) * 0.14;

        const hudScale = clamp(rScale * 1.18, 1.65, 3.1) * (1.0 + Math.cos(timeSec * 9.0) * 0.05);
        lockHudReticleSprite.position.y =
          result.targetKind === 'skyshield' ? 1.15 : 1.1;
        lockHudReticleSprite.scale.set(hudScale, hudScale, 1);
        lockHudReticleMat.rotation = -timeSec * 0.85;
        lockHudReticleMat.opacity = 0.84 + Math.sin(timeSec * 11.0) * 0.12;
      } else {
        lastLockedColliderId = null;
        targetLockGroup.visible = false;
      }

      return result;
    };

    // Place surface-normal impact effect at the closest raycast hit point (`result.point`, `result.normal`)
    const spawnRaycastSurfaceNormalImpact = (rayRes: MuzzleRaycastResult, isHeavy = false) => {
      if (!rayRes.hit) return;
      const hitPt = new THREE.Vector3(rayRes.point.x, rayRes.point.y, rayRes.point.z);
      const hitNorm = new THREE.Vector3(rayRes.normal.x, rayRes.normal.y, rayRes.normal.z);
      lyoExplosionSystem.spawnLyoBulletHitBurst(hitPt, hitNorm, false);
      spawnCollisionContactParticles(
        rayRes.point.x,
        rayRes.point.y,
        rayRes.point.z,
        rayRes.normal.x,
        rayRes.normal.z,
        rayRes.targetKind === 'vehicle' || rayRes.targetKind === 'skyshield' ? 'metal' : 'concrete',
        isHeavy ? 11.5 : 8.0,
      );
    };

    // Unified 3D OBB + Multi-Sphere Compound Hull Physics Collision Resolver (Solid vs Pushable vs Breakable + Material Impact SFX)
    const resolveMoverWorldCollisions = (
      mover: {
        x: number;
        z: number;
        vx: number;
        vz: number;
        hullYaw?: number;
        altitude?: number;
        vehicleKind?: 'tank' | 'plane' | 'truck';
        team?: 'blue' | 'red';
        ownerCommanderId?: number;
        occupiedByAiId?: number | null;
      },
      moverKey: string,
      isVehicle: boolean,
      moverRadius: number,
      moverMass: number,
      timeSec: number,
      isPlayerControlled: boolean,
      moverAltitudeOverride?: number,
    ) => {
      const moverAltitude =
        moverAltitudeOverride !== undefined
          ? moverAltitudeOverride
          : isVehicle && 'altitude' in mover
            ? (mover.altitude ?? 0)
            : 0;
      const isAirbornePlane = isVehicle && mover.vehicleKind === 'plane' && moverAltitude > 1.25;
      const moverTeam: 'blue' | 'red' = mover.team ?? (isPlayerControlled ? 'blue' : 'red');
      let moverOwnerCommanderId =
        mover.ownerCommanderId !== undefined
          ? mover.ownerCommanderId
          : isPlayerControlled
            ? (playerUnit?.ownerCommanderId ?? 0)
            : -1;
      if (
        moverOwnerCommanderId === -1 &&
        isVehicle &&
        mover.occupiedByAiId !== undefined &&
        mover.occupiedByAiId !== null
      ) {
        const aiDriver = buddyUnits.find((u) => u.id === mover.occupiedByAiId);
        if (aiDriver) moverOwnerCommanderId = aiDriver.ownerCommanderId;
      }

      // 0. Shoreline & Outer Perimeter Hill Embankment ("Tanggul Bukit") Boundary:
      //    - Tracked Tanks (`vehicleKind === 'tank'`) and Airborne Planes can freely cross the Centered Oasis Lake!
      //    - Foot characters (`BuddyUnit`) and wheeled Dump Trucks (`vehicleKind === 'truck'`) remain blocked by the Oasis Lake shoreline.
      //    - All non-flying ground units & vehicles remain blocked from falling off the East Harbor Quay Wall into the deep sea.
      //    - ALL units and vehicles (including Tanks, Trucks, Planes & Characters) are 100% blocked by the Outer Perimeter Hill Embankment ("Tanggul Bukit").
      const isTrackedTank = isVehicle && mover.vehicleKind === 'tank';
      if (!isAirbornePlane) {
        const lakeSdf = evaluateNwLakeSdf(mover.x, mover.z);
        if (!isTrackedTank && lakeSdf < -0.1) {
          const dx = mover.x - -31.0;
          const dz = mover.z - 0.0;
          const len = Math.max(0.01, Math.hypot(dx, dz));
          const nx = dx / len;
          const nz = dz / len;
          const pushOut = -0.1 - lakeSdf;
          mover.x = wrapPlanetCoord(mover.x + nx * pushOut);
          mover.z = wrapPlanetCoord(mover.z + nz * pushOut);
          const vn = mover.vx * nx + mover.vz * nz;
          if (vn < 0) {
            mover.vx -= vn * nx;
            mover.vz -= vn * nz;
          }
        }
        const harborWaterSdf = evaluateSeHarborSdf(mover.x, mover.z).waterSdf;
        if (harborWaterSdf < -0.1) {
          const nx = -1.0;
          const nz = 0.0;
          const pushOut = -0.1 - harborWaterSdf;
          mover.x = wrapPlanetCoord(mover.x + nx * pushOut);
          mover.z = wrapPlanetCoord(mover.z + nz * pushOut);
          const vn = mover.vx * nx + mover.vz * nz;
          if (vn < 0) {
            mover.vx -= vn * nx;
            mover.vz -= vn * nz;
          }
        }
      }

      // 0B. 100% Impassable Outer Perimeter Hill Embankment ("Tanggul Bukit") at all altitudes:
      const embSdf = evaluateOuterEmbankmentSdf(mover.x, mover.z);
      const embLimit = -Math.max(0.65, moverRadius);
      if (embSdf > embLimit) {
        const eps = 0.5;
        const gx = evaluateOuterEmbankmentSdf(mover.x + eps, mover.z) - evaluateOuterEmbankmentSdf(mover.x - eps, mover.z);
        const gz = evaluateOuterEmbankmentSdf(mover.x, mover.z + eps) - evaluateOuterEmbankmentSdf(mover.x, mover.z - eps);
        const glen = Math.max(0.001, Math.hypot(gx, gz));
        const nx = -gx / glen;
        const nz = -gz / glen;
        const pushIn = embSdf - embLimit;
        mover.x = wrapPlanetCoord(mover.x + nx * pushIn);
        mover.z = wrapPlanetCoord(mover.z + nz * pushIn);
        const vn = mover.vx * nx + mover.vz * nz;
        if (vn < 0) {
          mover.vx -= vn * nx * 1.15;
          mover.vz -= vn * nz * 1.15;
        }
      }

      // Build Multi-Sphere Compound Hull for elongated vehicles so Rear Truck Cargo Beds (-3.66m),
      // Front Bumpers (+3.59m), Tank Hulls, and Plane Noses/Tails/Wings NEVER clip into walls or buildings!
      const yaw = mover.hullYaw ?? 0;
      const fwdX = Math.cos(yaw);
      const fwdZ = -Math.sin(yaw);
      const rightX = Math.sin(yaw);
      const rightZ = Math.cos(yaw);

      const hullSpheres: Array<{ ox: number; oz: number; r: number }> =
        isVehicle && mover.vehicleKind === 'truck'
          ? [
              { ox: 0, oz: 0, r: 1.82 },
              { ox: -fwdX * 1.90, oz: -fwdZ * 1.90, r: 1.82 },
              { ox: fwdX * 1.85, oz: fwdZ * 1.85, r: 1.82 },
            ]
          : isVehicle && mover.vehicleKind === 'tank'
            ? [
                { ox: 0, oz: 0, r: 1.68 },
                { ox: -fwdX * 0.85, oz: -fwdZ * 0.85, r: 1.68 },
                { ox: fwdX * 0.90, oz: fwdZ * 0.90, r: 1.68 },
              ]
            : isVehicle && mover.vehicleKind === 'plane'
              ? [
                  { ox: 0, oz: 0, r: 1.48 },
                  { ox: -fwdX * 1.12, oz: -fwdZ * 1.12, r: 1.38 },
                  { ox: fwdX * 1.08, oz: fwdZ * 1.08, r: 1.38 },
                  { ox: rightX * 1.25, oz: rightZ * 1.25, r: 1.25 },
                  { ox: -rightX * 1.25, oz: -rightZ * 1.25, r: 1.25 },
                ]
              : [{ ox: 0, oz: 0, r: moverRadius }];

      // 1. Solid Static 3D OBB Colliders: Retaining Walls, Base Buildings, Watchtower/Guardhouse/Bunker, 8 Bastions, 8 Container Stacks & Construction Yard Equipment
      const staticStructures = getStaticWorldStructures();
      for (const st of staticStructures) {
        if (moverAltitude >= st.heightY) continue;
        const maxReach = st.halfX + st.halfZ + 5.5;
        if (Math.abs(mover.x - st.x) > maxReach || Math.abs(mover.z - st.z) > maxReach) continue;
        const gateMatch = /^(blue|red)_plot_([0-3])_gate$/.exec(st.id);
        if (gateMatch) {
          const gateTeam = gateMatch[1] as 'blue' | 'red';
          const gatePlotIdx = Number(gateMatch[2]);
          if (
            canUnitEnterCommanderBaseGate(
              moverTeam,
              moverOwnerCommanderId,
              gateTeam,
              gatePlotIdx,
            )
          ) {
            // Only the plot owner commander and their built characters pass freely through the automatic sliding gate!
            continue;
          }
        }
        for (const hs of hullSpheres) {
          const sx = mover.x + hs.ox;
          const sz = mover.z + hs.oz;
          const res = resolveSolidObbCollision2D(
            sx,
            sz,
            mover.vx,
            mover.vz,
            hs.r,
            st.x,
            st.z,
            st.halfX,
            st.halfZ,
            st.rotY,
            0.28,
          );
          if (res.collided) {
            mover.x = wrapPlanetCoord(res.x - hs.ox);
            mover.z = wrapPlanetCoord(res.z - hs.oz);
            mover.vx = res.vx;
            mover.vz = res.vz;
            if (
              shouldPlayMoverCollisionSound(isVehicle, false, isPlayerControlled, res.impactSpeed, 0.85) &&
              tryTriggerCooldown(`${moverKey}_${st.id}`, timeSec, 0.11)
            ) {
              soundEngine.playMaterialImpact(st.mat, res.impactSpeed);
              spawnCollisionContactParticles(
                res.contactX,
                moverAltitude + 0.75,
                res.contactZ,
                res.normalX,
                res.normalZ,
                st.mat,
                res.impactSpeed,
              );
              shakeTrauma = Math.min(1, shakeTrauma + Math.min(0.34, res.impactSpeed * 0.024));
            }
          }
        }
      }

      // 2. Solid Static Colliders: Living Tree Trunks & Canopies (height = 9.2 * scale, with Tree Jiggle / Canopy Shake!)
      for (const tr of trees) {
        if (!tr.alive) continue;
        if (moverAltitude >= 9.2 * tr.scale) continue;
        if (Math.abs(mover.x - tr.x) > 7.5 || Math.abs(mover.z - tr.z) > 7.5) continue;
        const treeRadius = moverAltitude > 2.6 ? 1.65 * tr.scale : 0.98 * tr.scale;
        for (const hs of hullSpheres) {
          const sx = mover.x + hs.ox;
          const sz = mover.z + hs.oz;
          const res = resolveSolidCollision2D(
            sx,
            sz,
            mover.vx,
            mover.vz,
            hs.r,
            tr.x,
            tr.z,
            treeRadius,
            0.28,
          );
          if (res.collided) {
            mover.x = wrapPlanetCoord(res.x - hs.ox);
            mover.z = wrapPlanetCoord(res.z - hs.oz);
            mover.vx = res.vx;
            mover.vz = res.vz;

            if (isVehicle && res.impactSpeed > 0.75) {
              tr.jiggleTimer = 0.55;
              tr.jiggleIntensity = Math.min(0.28, 0.06 + res.impactSpeed * 0.018);
              tr.jiggleDirX = -res.normalX;
              tr.jiggleDirZ = -res.normalZ;
            }

            if (
              shouldPlayMoverCollisionSound(isVehicle, false, isPlayerControlled, res.impactSpeed, 0.8) &&
              tryTriggerCooldown(`${moverKey}_tree_${tr.id}`, timeSec, 0.11)
            ) {
              soundEngine.playHeavyThud(res.impactSpeed, true);
              spawnCollisionContactParticles(
                res.contactX,
                moverAltitude + 0.75,
                res.contactZ,
                res.normalX,
                res.normalZ,
                'wood',
                res.impactSpeed,
              );
              shakeTrauma = Math.min(1, shakeTrauma + Math.min(0.32, res.impactSpeed * 0.022));
            }
          }
        }
      }

      // 3. Map Props: Solid Static vs Pushable vs Breakable (checked against 3D prop height mp.heightY!)
      for (const mp of activeMapProps) {
        if (!mp.alive) continue;
        if (moverAltitude >= mp.heightY) continue;
        const propReach = Math.max(mp.radius, (mp.halfX ?? 0) + (mp.halfZ ?? 0)) + 5.5;
        if (Math.abs(mover.x - mp.x) > propReach || Math.abs(mover.z - mp.z) > propReach) continue;

        if (mp.category === 'solid') {
          // Tracked tanks can climb over low rocks and stacked pipes as long as they are not too tall (height <= 1.68m)
          if (isTrackedTank && isTankClimbableProp(mp.kind, mp.scale)) {
            continue;
          }
          for (const hs of hullSpheres) {
            const sx = mover.x + hs.ox;
            const sz = mover.z + hs.oz;
            const res =
              mp.halfX !== undefined && mp.halfZ !== undefined
                ? resolveSolidObbCollision2D(
                    sx,
                    sz,
                    mover.vx,
                    mover.vz,
                    hs.r,
                    mp.x,
                    mp.z,
                    mp.halfX,
                    mp.halfZ,
                    mp.rotY,
                    mp.restitution,
                  )
                : resolveSolidCollision2D(
                    sx,
                    sz,
                    mover.vx,
                    mover.vz,
                    hs.r,
                    mp.x,
                    mp.z,
                    mp.radius,
                    mp.restitution,
                  );
            if (res.collided) {
              mover.x = wrapPlanetCoord(res.x - hs.ox);
              mover.z = wrapPlanetCoord(res.z - hs.oz);
              mover.vx = res.vx;
              mover.vz = res.vz;
              if (isVehicle && res.impactSpeed > 0.8 && mp.canJiggleOnHit) {
                mp.jiggleTimer = 0.28;
              }
              // Level-1 Destructible Solid Wall (concrete_fence): immovable by characters or trucks,
              // but repeated ramming by a Tank or Airplane chips away HP (22 dmg per impact, 60 HP total) until it shatters!
              const isTankOrPlane =
                isVehicle &&
                'vehicleKind' in mover &&
                (mover.vehicleKind === 'tank' || mover.vehicleKind === 'plane');
              if (
                mp.destructible &&
                isTankOrPlane &&
                res.impactSpeed > 2.2 &&
                tryTriggerCooldown(`${moverKey}_ram_${mp.id}`, timeSec, 0.32)
              ) {
                mp.hp -= 22;
                if (mp.canJiggleOnHit) {
                  mp.jiggleTimer = 0.35;
                }
                if (mp.hp <= 0) {
                  mp.alive = false;
                  mp.wrapper.visible = false;
                  navGridDirty = true;
                  score += 50;
                  playSpatialSoundAt(mp.x, mp.z, 22.0, 5.0, () => {
                    soundEngine.playHeavyThud(res.impactSpeed, false);
                  });
                  spawnDebrisChunks(mp.x, 0.75, mp.z, 'concrete', 14, mover.vx * 0.3, mover.vz * 0.3);
                  spawnBurstParticles(mp.x, 0.95, mp.z, 12);
                  if (isPlayerControlled) {
                    shakeTrauma = Math.min(1, shakeTrauma + 0.28);
                  }
                  break;
                }
              }
              if (
                shouldPlayMoverCollisionSound(isVehicle, false, isPlayerControlled, res.impactSpeed, 0.8) &&
                tryTriggerCooldown(`${moverKey}_prop_${mp.id}`, timeSec, 0.10)
              ) {
                soundEngine.playMaterialImpact(mp.materialTag, res.impactSpeed);
                spawnCollisionContactParticles(
                  res.contactX,
                  moverAltitude + 0.75,
                  res.contactZ,
                  res.normalX,
                  res.normalZ,
                  mp.materialTag,
                  res.impactSpeed,
                );
                shakeTrauma = Math.min(1, shakeTrauma + Math.min(0.35, res.impactSpeed * 0.024));
              }
            }
          }
        } else {
          // Pushable (wheelbarrow, traffic_cone, recycle_bin) or Breakable (barricade, explosive_barrel)
          for (const hs of hullSpheres) {
            if (!mp.alive) break;
            const sx = mover.x + hs.ox;
            const sz = mover.z + hs.oz;
            const relSpeed = Math.hypot(mover.vx - mp.vx, mover.vz - mp.vz);
            const dist = getPlanetShortestDistance(sx, sz, mp.x, mp.z);
            const minDist = hs.r + mp.radius;

            if (
              mp.category === 'breakable' &&
              dist < minDist &&
              shouldShatterBreakableProp(mp.kind, relSpeed, isVehicle, mp.hp)
            ) {
              mp.alive = false;
              mp.wrapper.visible = false;
              score += 45;
              mover.vx *= 0.84;
              mover.vz *= 0.84;
              if (mp.kind === 'explosive_barrel') {
                triggerBarrelExplosion(mp.x, mp.z);
              } else if (mp.materialTag === 'wood') {
                playSpatialSoundAt(mp.x, mp.z, 20.0, 4.5, () => {
                  soundEngine.playWoodBreak(relSpeed);
                });
                spawnDebrisChunks(mp.x, 0.55, mp.z, 'wood', 12, mover.vx * 0.35, mover.vz * 0.35);
                spawnBurstParticles(mp.x, 0.8, mp.z, 10);
                if (isPlayerControlled) {
                  shakeTrauma = Math.min(1, shakeTrauma + 0.26);
                }
              } else {
                playSpatialSoundAt(mp.x, mp.z, 20.0, 4.5, () => {
                  soundEngine.playHeavyThud(relSpeed, false);
                });
                spawnDebrisChunks(mp.x, 0.55, mp.z, 'concrete', 12, mover.vx * 0.35, mover.vz * 0.35);
                spawnBurstParticles(mp.x, 0.8, mp.z, 10);
                if (isPlayerControlled) {
                  shakeTrauma = Math.min(1, shakeTrauma + 0.28);
                }
              }
              break;
            }

            const pushRes = computePushableImpulse2D(
              sx,
              sz,
              mover.vx,
              mover.vz,
              hs.r,
              moverMass,
              mp.x,
              mp.z,
              mp.vx,
              mp.vz,
              mp.radius,
              mp.mass,
              mp.restitution,
            );
            if (pushRes.collided) {
              mover.x = wrapPlanetCoord(pushRes.moverX - hs.ox);
              mover.z = wrapPlanetCoord(pushRes.moverZ - hs.oz);
              mover.vx = pushRes.moverVx;
              mover.vz = pushRes.moverVz;

              mp.x = wrapPlanetCoord(pushRes.propX);
              mp.z = wrapPlanetCoord(pushRes.propZ);
              mp.vx = pushRes.propVx;
              mp.vz = pushRes.propVz;
              mp.rotVelY = clamp(mp.rotVelY + pushRes.angularImpulse, -14, 14);
              if (mp.canJiggleOnHit) {
                mp.jiggleTimer = 0.35;
              }
              mp.wrapper.userData.worldX = mp.x;
              mp.wrapper.userData.worldZ = mp.z;

              if (
                shouldPlayMoverCollisionSound(isVehicle, true, isPlayerControlled, pushRes.impactSpeed, 0.65) &&
                tryTriggerCooldown(`${moverKey}_push_${mp.id}`, timeSec, isVehicle ? 0.12 : 0.24)
              ) {
                soundEngine.playMaterialImpact(mp.materialTag, pushRes.impactSpeed);
                if (isVehicle) {
                  spawnCollisionContactParticles(
                    mp.x,
                    0.65,
                    mp.z,
                    sx - mp.x,
                    sz - mp.z,
                    mp.materialTag,
                    pushRes.impactSpeed,
                  );
                  shakeTrauma = Math.min(1, shakeTrauma + Math.min(0.18, pushRes.impactSpeed * 0.015));
                }
              }
            }
          }
        }
      }

      // 3B. Solid Vehicle-vs-Vehicle & Character-vs-Vehicle OBB Collisions (vehicles never pass through each other or characters!)
      for (const veh of tanks) {
        if (veh.hp <= 0 || veh === mover) continue;
        if (!isVehicle && mountedTank === veh) continue;
        const vehAlt = veh.vehicleKind === 'plane' ? (veh.altitude ?? 0) : 0;
        if (Math.abs(moverAltitude - vehAlt) > 2.4) continue;

        const vehHalfX =
          veh.vehicleKind === 'truck' ? 3.66 : veh.vehicleKind === 'tank' ? 2.48 : 2.52;
        const vehHalfZ =
          veh.vehicleKind === 'truck' ? 1.76 : veh.vehicleKind === 'tank' ? 1.66 : 2.48;
        const vehRotY = -(veh.hullYaw ?? 0);

        for (const hs of hullSpheres) {
          const sx = mover.x + hs.ox;
          const sz = mover.z + hs.oz;
          const res = resolveSolidObbCollision2D(
            sx,
            sz,
            mover.vx,
            mover.vz,
            hs.r,
            veh.x,
            veh.z,
            vehHalfX,
            vehHalfZ,
            vehRotY,
            0.24,
          );
          if (res.collided) {
            mover.x = wrapPlanetCoord(res.x - hs.ox);
            mover.z = wrapPlanetCoord(res.z - hs.oz);
            mover.vx = res.vx;
            mover.vz = res.vz;

            // When the character on foot is carrying a crate above their head and walks directly up to a Dump Truck,
            // load that single crate (1-by-1) into the Dump Truck's cargo vessel!
            if (
              !isVehicle &&
              'carryingCrate' in mover &&
              (mover as BuddyUnit).carryingCrate !== 'none' &&
              veh.vehicleKind === 'truck' &&
              canLoadCrateIntoDumpTruck(veh.storedCrates.length, (veh.dumpAnimTimer ?? 0) > 0, true)
            ) {
              const carrier = mover as BuddyUnit;
              const loadedKind = carrier.carryingCrate as 'red' | 'super';
              carrier.carryingCrate = 'none';
              carrier.overheadCrateGroup.visible = false;
              veh.storedCrates.push(loadedKind);
              syncLyoDumpTruckCargoVisuals(veh.bodyGroup, veh.storedCrates);
              spawnBurstParticles(veh.x, 1.85, veh.z, 10);
              if (carrier.isPlayer) {
                soundEngine.playPickup();
              } else {
                playSpatialSoundAt(veh.x, veh.z, 14.0, 3.5, () => {
                  soundEngine.playPickup();
                });
              }
              break;
            }

            if (isVehicle) {
              veh.vx = clamp(veh.vx - res.normalX * res.impactSpeed * 0.25, -18, 18);
              veh.vz = clamp(veh.vz - res.normalZ * res.impactSpeed * 0.25, -18, 18);
            }

            if (
              shouldPlayMoverCollisionSound(isVehicle, false, isPlayerControlled, res.impactSpeed, 0.85) &&
              tryTriggerCooldown(`${moverKey}_veh_${veh.id}`, timeSec, 0.12)
            ) {
              soundEngine.playMaterialImpact('metal', res.impactSpeed);
              spawnCollisionContactParticles(
                res.contactX,
                moverAltitude + 0.95,
                res.contactZ,
                res.normalX,
                res.normalZ,
                'metal',
                res.impactSpeed,
              );
              shakeTrauma = Math.min(1, shakeTrauma + Math.min(0.32, res.impactSpeed * 0.022));
            }
          }
        }
      }

      // 3C. Solid 2-Car City Tram OBB Collision (both Car 1 and Car 2 act as solid moving streetcars on the road!)
      if (moverAltitude < 2.6) {
        const tramState = cityTram.getState();
        const tramHalfX = CITY_TRAM_SPEC.carLength * 0.5;
        const tramHalfZ = CITY_TRAM_SPEC.carWidth * 0.5;
        const tramCars = [tramState.car1, tramState.car2];
        for (let tci = 0; tci < tramCars.length; tci++) {
          const car = tramCars[tci];
          const carVx = car.forwardX * CITY_TRAM_SPEC.cruiseSpeed;
          const carVz = car.forwardZ * CITY_TRAM_SPEC.cruiseSpeed;
          for (const hs of hullSpheres) {
            const sx = mover.x + hs.ox;
            const sz = mover.z + hs.oz;
            const res = resolveSolidObbCollision2D(
              sx,
              sz,
              mover.vx - carVx,
              mover.vz - carVz,
              hs.r,
              car.x,
              car.z,
              tramHalfX,
              tramHalfZ,
              car.yaw,
              0.28,
            );
            if (res.collided) {
              mover.x = wrapPlanetCoord(res.x - hs.ox);
              mover.z = wrapPlanetCoord(res.z - hs.oz);
              mover.vx = res.vx + carVx * 0.65;
              mover.vz = res.vz + carVz * 0.65;
              if (
                shouldPlayMoverCollisionSound(isVehicle, false, isPlayerControlled, res.impactSpeed, 0.8) &&
                tryTriggerCooldown(`${moverKey}_tram_${tci}`, timeSec, 0.14)
              ) {
                soundEngine.playMaterialImpact('metal', res.impactSpeed);
                spawnCollisionContactParticles(
                  res.contactX,
                  moverAltitude + 0.95,
                  res.contactZ,
                  res.normalX,
                  res.normalZ,
                  'metal',
                  res.impactSpeed,
                );
                shakeTrauma = Math.min(1, shakeTrauma + Math.min(0.28, res.impactSpeed * 0.02));
              }
            }
          }
        }
      }

      // 4. Grounded Crates (Pushable when bumped by running character, Dump Truck, or full tank; Breakable if rammed hard!)
      for (let i = worldCrates.length - 1; i >= 0; i--) {
        const c = worldCrates[i];
        if (c.state !== 'grounded') continue;
        // Note: only non-truck vehicles (Tank / Plane) with < 4 stored crates auto-scoop on run-over;
        // Dump Trucks never auto-scoop crates from the ground!
        if (
          isVehicle &&
          mountedTank &&
          mountedTank.vehicleKind !== 'truck' &&
          mountedTank.storedCrates.length < 4 &&
          Math.hypot(mover.vx, mover.vz) < 12.8
        ) {
          continue;
        }
        const relSpd = Math.hypot(mover.vx - c.vx, mover.vz - c.vz);
        const dist = getPlanetShortestDistance(mover.x, mover.z, c.x, c.z);
        const crateRadius = 0.78;
        if (isVehicle && dist < moverRadius + crateRadius && relSpd >= 11.2 && canDamageWorldCrate(c)) {
          // High-speed tank ram shatters wooden/metal crate with Lyo Explosion VFX + 3D debris + drops bonus pickup!
          playSpatialSoundAt(c.x, c.z, 22.0, 5.0, () => {
            soundEngine.playWoodBreak(relSpd);
            soundEngine.playBarrelExplosion();
          });
          lyoExplosionSystem.spawnLyoExplosion(
            new THREE.Vector3(c.x, getTerrainElevation(c.x, c.z) + 0.55, c.z),
            0.78,
            'crate',
          );
          spawnDebrisChunks(c.x, 0.55, c.z, c.kind === 'super' ? 'metal' : 'wood', 11, mover.vx * 0.3, mover.vz * 0.3);
          spawnBurstParticles(c.x, 0.8, c.z, 10);
          spawnWorldPickup('ammo', 'Ammo +50', c.x, c.z);
          scene.remove(c.mesh);
          worldCrates.splice(i, 1);
          if (isPlayerControlled) {
            shakeTrauma = Math.min(1, shakeTrauma + 0.28);
          }
          continue;
        }

        const crateHalfExtent = 0.68;
        for (const hs of hullSpheres) {
          const sx = mover.x + hs.ox;
          const sz = mover.z + hs.oz;
          const pushRes = resolveSolidCratePush2D(
            sx,
            sz,
            mover.vx,
            mover.vz,
            hs.r,
            moverMass,
            c.x,
            c.z,
            c.vx,
            c.vz,
            c.rotY,
            crateHalfExtent,
            1.85,
            0.22,
          );
          if (pushRes.collided) {
            mover.x = wrapPlanetCoord(pushRes.moverX - hs.ox);
            mover.z = wrapPlanetCoord(pushRes.moverZ - hs.oz);
            mover.vx = pushRes.moverVx;
            mover.vz = pushRes.moverVz;

            c.x = wrapPlanetCoord(pushRes.crateX);
            c.z = wrapPlanetCoord(pushRes.crateZ);
            c.vx = pushRes.crateVx;
            c.vz = pushRes.crateVz;
            c.rotVelY = clamp(c.rotVelY + pushRes.angularImpulse, -5.0, 5.0);
            c.squashTimer = 0;
            c.mesh.scale.set(1, 1, 1);

            if (
              shouldPlayMoverCollisionSound(isVehicle, true, isPlayerControlled, pushRes.impactSpeed, 0.7) &&
              tryTriggerCooldown(`${moverKey}_crate_${c.id}`, timeSec, isVehicle ? 0.12 : 0.24)
            ) {
              if (c.kind === 'super') {
                soundEngine.playMetalImpact(pushRes.impactSpeed);
              } else {
                soundEngine.playWoodHit(pushRes.impactSpeed);
              }
            }
          }
        }
      }
    };

    resetArenaRef.current = () => {
      spawnInitialSquadsAndObjects();
      runElapsedSec = 0;
    };

    let rafId = 0;
    let prevTime = performance.now();
    const reusableGrassTramplers: { x: number; z: number; radius: number; weight: number }[] = [];
    const reusableGrassExclusions: {
      x: number;
      z: number;
      yaw: number;
      halfLen: number;
      halfWidth: number;
    }[] = [
      { x: -51.4, z: 60.0, yaw: 0, halfLen: 2.15, halfWidth: 2.15 },
      { x: -21.4, z: 60.0, yaw: 0, halfLen: 2.15, halfWidth: 2.15 },
      { x: 21.4, z: 60.0, yaw: 0, halfLen: 2.15, halfWidth: 2.15 },
      { x: 51.4, z: 60.0, yaw: 0, halfLen: 2.15, halfWidth: 2.15 },
      { x: -51.4, z: -60.0, yaw: 0, halfLen: 2.15, halfWidth: 2.15 },
      { x: -21.4, z: -60.0, yaw: 0, halfLen: 2.15, halfWidth: 2.15 },
      { x: 21.4, z: -60.0, yaw: 0, halfLen: 2.15, halfWidth: 2.15 },
      { x: 51.4, z: -60.0, yaw: 0, halfLen: 2.15, halfWidth: 2.15 },
    ];
    const scratchSignWorldPos = new THREE.Vector3();

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);
      aStarRepathsThisFrame = 0;
      const rawDt = (now - prevTime) / 1000;
      prevTime = now;
      const dt = Math.min(rawDt, 0.05);
      const timeSec = now * 0.001;

      const state = gameStateRef.current;
      const currentPlayMode = playModeRef.current;

      // 1. Decompiled Lyo InfiniteGrass & TreeLeaves Wind Shader Uniforms
      windUniforms.uTime.value = timeSec;
      windUniforms.uWindPhase.value = timeSec * 4.8;
      windUniforms.uWindGust.value = 0.25 + 0.25 * Math.sin(timeSec * 1.7);
      const activeFocusUnit = mountedTank ? mountedTank : playerUnit;
      const nukePrePose =
        nukeStrikeState.phase !== 'idle'
          ? computeNuclearStrikeCameraPose(nukeStrikeState)
          : null;
      const viewCenterX =
        nukePrePose
          ? nukePrePose.focusPivotPos.x
          : currentPlayMode === 'editor'
          ? editorPan.x
          : activeFocusUnit
          ? activeFocusUnit.x
          : 0;
      const viewCenterZ =
        nukePrePose
          ? nukePrePose.focusPivotPos.z
          : currentPlayMode === 'editor'
          ? editorPan.z
          : activeFocusUnit
          ? activeFocusUnit.z
          : 0;
      lyoGrassSystem.update(
        nukePrePose ? nukePrePose.focusPivotPos.x : activeFocusUnit ? activeFocusUnit.x : 0,
        nukePrePose ? nukePrePose.focusPivotPos.z : activeFocusUnit ? activeFocusUnit.z : 0,
        viewCenterX,
        viewCenterZ,
      );
      lyoGrassSystem.decayBlastWave(dt);

      // Multi-Unit Grass Trampling (Vehicles + Characters):
      // Every ground vehicle (Tank, Dump Truck, low-altitude Plane) and every on-foot Character (Player + AI Buddies)
      // radially parts, bends, and flattens the grass blades underneath them in real time!
      reusableGrassTramplers.length = 0;
      for (let i = 0; i < tanks.length; i++) {
        const v = tanks[i];
        if (v.hp <= 0 || (v.altitude ?? 0) > 2.2) continue;
        reusableGrassTramplers.push({
          x: v.x,
          z: v.z,
          radius: v.vehicleKind === 'truck' ? 2.45 : 2.25,
          weight: 1.0,
        });
      }
      for (let i = 0; i < buddyUnits.length; i++) {
        const b = buddyUnits[i];
        if (!b.alive || b.jumpOffset > 1.0) continue;
        if (b.isPlayer && mountedTank) continue;
        if (!b.isPlayer && tanks.some((t) => t.occupiedByAiId === b.id)) continue;
        reusableGrassTramplers.push({
          x: b.x,
          z: b.z,
          radius: 1.05,
          weight: 0.92,
        });
      }
      lyoGrassSystem.setTramplers(reusableGrassTramplers);

      // Suppress grass blades ONLY underneath static Park Benches ("kursi taman jangan sampai tertutup rumput"),
      // Front-Yard Skyshield Bastion Pedestals, & grounded Crates (vehicles use uTramplers + trailTex so grass visibly bends!)
      reusableGrassExclusions.length = 8;
      for (let i = 0; i < activeMapProps.length; i++) {
        const mp = activeMapProps[i];
        if (!mp.alive || (mp.kind !== 'bench' && mp.kind !== 'recycle_bin')) continue;
        reusableGrassExclusions.push({
          x: mp.x,
          z: mp.z,
          yaw: mp.rotY,
          halfLen: mp.kind === 'bench' ? 1.55 : 1.15,
          halfWidth: mp.kind === 'bench' ? 2.25 : 1.15,
        });
      }
      for (let i = 0; i < worldCrates.length; i++) {
        const c = worldCrates[i];
        if (c.state !== 'grounded') continue;
        reusableGrassExclusions.push({
          x: c.x,
          z: c.z,
          yaw: c.rotY,
          halfLen: 0.92,
          halfWidth: 0.92,
        });
      }
      lyoGrassSystem.setDynamicExclusions(reusableGrassExclusions);

      // 2. Raycast Mouse Crosshair onto Ground Plane
      raycaster.setFromCamera(mouseNdc, camera);
      raycaster.ray.intersectPlane(groundPlane, aimWorldPoint);

      if (currentPlayMode === 'editor') {
        editorCursorGroup.visible = true;
        editorCursorGroup.position.set(
          Math.round(wrapPlanetCoord(aimWorldPoint.x) * 2) / 2,
          0.02,
          Math.round(wrapPlanetCoord(aimWorldPoint.z) * 2) / 2,
        );
        editorCursorGroup.rotation.y = editorRotY;
        const activeTool = editorToolRef.current;
        const isSculptTool =
          activeTool === 'sculpt_raise' || activeTool === 'sculpt_lower' || activeTool === 'sculpt_flatten';
        editorCursorGroup.scale.setScalar(
          isSculptTool ? Math.max(1.0, editorBrushRadiusRef.current / 2.2) : editorScale,
        );
      } else {
        editorCursorGroup.visible = false;
      }

      // Pulse the [Q] Ghost Wireframe opacity gently
      const ghostMat = blueBase.ghostPatternBox.material as THREE.MeshBasicMaterial;
      ghostMat.opacity = 0.65 + Math.sin(timeSec * 4.0) * 0.22;

      // 3. Gameplay Simulation Step
      let activeSpeed = 0;
      const isBoosting = Boolean(keys['ShiftLeft'] || keys['ShiftRight']);

      if (state !== 'playing' || currentPlayMode === 'editor') {
        soundEngine.updateVehicleMovementLoop(0, false, false);
      }

      if (state === 'playing') {
        runElapsedSec += dt;

        // Movement Input (WASD)
        let moveX = 0;
        let moveZ = 0;
        if (keys['KeyW'] || keys['ArrowUp']) moveZ -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) moveZ += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) moveZ += 0;
        if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

        if (currentPlayMode === 'editor') {
          // MAP EDITOR CAMERA PANNING WITH WASD (WRAPS 360° AROUND GLOBE)
          const panSpeed = 28 * editorZoom;
          if (moveX !== 0 || moveZ !== 0) {
            editorPan.x = wrapPlanetCoord(editorPan.x + moveX * panSpeed * dt);
            editorPan.z = wrapPlanetCoord(editorPan.z + moveZ * panSpeed * dt);
          }
        } else {
          // SANDBOX OR MATCH MODE: Random Parachute Crate Drops across the Warzone ("drop box itu random di area warzone")
          crateSpawnTimer += dt;
          if (crateSpawnTimer >= 4.5) {
            crateSpawnTimer = 0;
            const spot = pickRandomWarzoneDropCoord();
            spawnWorldCrate('red', spot.x, spot.z, false);
          }

          superCrateSpawnTimer += dt;
          if (superCrateSpawnTimer >= 11.0) {
            superCrateSpawnTimer = 0;
            const spot = pickRandomWarzoneDropCoord();
            spawnWorldCrate('super', spot.x, spot.z, false);
          }

          legendCrateSpawnTimer += dt;
          if (legendCrateSpawnTimer >= 18.0) {
            legendCrateSpawnTimer = 0;
            const spot = pickRandomWarzoneDropCoord();
            spawnWorldCrate('legend', spot.x, spot.z, false);
          }

          medicalCrateSpawnTimer += dt;
          if (medicalCrateSpawnTimer >= 15.0) {
            medicalCrateSpawnTimer = 0;
            const spot = pickRandomWarzoneDropCoord();
            spawnWorldCrate('medical', spot.x, spot.z, false);
          }

          warzoneGoldSpawnTimer += dt;
          if (warzoneGoldSpawnTimer >= 9.0) {
            warzoneGoldSpawnTimer = 0;
            const spot = pickRandomWarzoneDropCoord();
            const isGoldCoin = Math.random() < 0.68;
            spawnWorldPickup(
              isGoldCoin ? 'coin_gold' : 'coin_silver',
              isGoldCoin ? 'EMAS WARZONE (+250G)' : 'PERAK WARZONE (+100G)',
              spot.x,
              spot.z,
              { scoreValue: isGoldCoin ? 250 : 100, vy: 4.5 },
            );
          }

          // Random Warzone Explosive Barrel Parachute Drops ("agar lebih chaos buat juga explostion barrel yang drop random di warzone")
          const activeWarzoneBarrelCount = activeMapProps.filter(
            (mp) => mp.alive && mp.kind === 'explosive_barrel' && mp.isWarzoneDropBarrel,
          ).length;
          const barrelDropStep = stepWarzoneExplosiveBarrelDropTimer(
            warzoneExplosiveBarrelSpawnTimer,
            activeWarzoneBarrelCount,
            dt,
            WARZONE_EXPLOSIVE_BARREL_DROP_INTERVAL_SEC,
            MAX_ACTIVE_WARZONE_EXPLOSIVE_BARRELS,
          );
          warzoneExplosiveBarrelSpawnTimer = barrelDropStep.nextTimerSec;
          if (barrelDropStep.shouldDropBarrel) {
            const spot = pickRandomWarzoneDropCoord();
            spawnWarzoneExplosiveBarrel(spot.x, spot.z, false);
          }

          // Dynamic Supply Drop Event (Alternating Central Oasis & Harbor Dock every 45–70s, with 15s countdown!)
          const supplyStep = stepSupplyDropSchedule(supplyDropSchedule, dt);
          supplyDropSchedule = supplyStep.state;
          if (supplyDropBeaconLingeringTimer > 0) {
            supplyDropBeaconLingeringTimer = Math.max(0, supplyDropBeaconLingeringTimer - dt);
          }
          if (supplyStep.landedPayload) {
            const payload = supplyStep.landedPayload;
            supplyDropBeaconLingeringTimer = 10.0;
            // 1. Spawn 1 Indestructible Special Metallic Crate (65% Silver Metallic / 35% Shiny Gold Metallic)
            spawnWorldCrate(payload.metallicCrateKind, payload.x, payload.z, false);

            // 1b. Refill Player Ammo on Supply Drop Event + Spawn 3 Supply Ammo Packs & Tactical Grenade/Land Mine Packs!
            if (playerUnit && playerUnit.alive) {
              playerUnit.tacticalLoadout = refillLoadoutAmmoFromSource(
                playerUnit.tacticalLoadout,
                'supply_drop',
              );
              syncUnitFieldsFromLoadout(playerUnit);
            }
            for (let ai = 0; ai < 3; ai++) {
              const angle = (ai / 3) * Math.PI * 2 + 0.35;
              const rad = 1.7 + Math.random() * 1.3;
              const ax = wrapPlanetCoord(payload.x + Math.cos(angle) * rad);
              const az = wrapPlanetCoord(payload.z + Math.sin(angle) * rad);
              spawnWorldPickup('ammo', 'SUPPLY AMMO (+60 PELURU)', ax, az, {
                remainingAmmo: 60,
                vx: Math.cos(angle) * 2.4,
                vy: 5.5,
                vz: Math.sin(angle) * 2.4,
              });
            }
            for (const secKind of ['hand_grenade', 'land_mine'] as const) {
              const angle = secKind === 'hand_grenade' ? 0.95 : 2.55;
              const rad = 2.0;
              const sx = wrapPlanetCoord(payload.x + Math.cos(angle) * rad);
              const sz = wrapPlanetCoord(payload.z + Math.sin(angle) * rad);
              spawnWorldPickup(
                'secondary',
                secKind === 'hand_grenade' ? 'HG-04 Frag Grenade' : 'TM-89 Land Mine',
                sx,
                sz,
                {
                  secondaryId: secKind,
                  secondaryCount: 3,
                  vx: Math.cos(angle) * 2.5,
                  vy: 5.4,
                  vz: Math.sin(angle) * 2.5,
                },
              );
            }

            // 2. Spawn 5-8 Large Gold Coins (@ +150 G) around the Supply Drop landing site
            for (let gi = 0; gi < payload.goldCoinCount; gi++) {
              const angle = (gi / Math.max(1, payload.goldCoinCount)) * Math.PI * 2 + Math.random() * 0.35;
              const rad = 1.6 + Math.random() * 2.1;
              const gx = wrapPlanetCoord(payload.x + Math.cos(angle) * rad);
              const gz = wrapPlanetCoord(payload.z + Math.sin(angle) * rad);
              spawnWorldPickup(
                'coin_gold',
                `SUPPLY DROP GOLD (+${payload.goldCoinValue}G)`,
                gx,
                gz,
                {
                  scoreValue: payload.goldCoinValue,
                  vx: Math.cos(angle) * 2.8,
                  vy: 5.8 + Math.random() * 1.6,
                  vz: Math.sin(angle) * 2.8,
                },
              );
            }

            // 3. Spawn 2-3 Medkits (Significantly restores +65 HP when picked up)
            for (let mi = 0; mi < payload.medkitCount; mi++) {
              const angle = (mi / Math.max(1, payload.medkitCount)) * Math.PI * 2 + 0.65;
              const rad = 1.9 + Math.random() * 1.4;
              const mx = wrapPlanetCoord(payload.x + Math.cos(angle) * rad);
              const mz = wrapPlanetCoord(payload.z + Math.sin(angle) * rad);
              spawnWorldPickup(
                'health',
                'SUPPLY MEDKIT (+65 HP)',
                mx,
                mz,
                {
                  healAmount: payload.medkitHealAmount,
                  vx: Math.cos(angle) * 2.2,
                  vy: 5.2,
                  vz: Math.sin(angle) * 2.2,
                },
              );
            }

            playSpatialSoundAt(payload.x, payload.z, 65.0, 12.0, () => {
              soundEngine.playPowerCore();
            });
            spawnBurstParticles(payload.x, getTerrainElevation(payload.x, payload.z) + 1.5, payload.z, 24);
            kioskStatusMessage =
              payload.metallicCrateKind === 'gold_metallic'
                ? `✨ SUPPLY DROP MENDARAT DI ${payload.locationName}! (SHINY GOLD METALLIC BOX + ${payload.goldCoinCount} KOIN + ${payload.medkitCount} MEDKIT)`
                : `🥈 SUPPLY DROP MENDARAT DI ${payload.locationName}! (SILVER METALLIC BOX + ${payload.goldCoinCount} KOIN + ${payload.medkitCount} MEDKIT)`;
            kioskStatusTimer = 6.0;
          }

          if (supplyDropSchedule.warningActive || supplyDropBeaconLingeringTimer > 0) {
            const activeLocId = supplyDropSchedule.warningActive
              ? supplyDropSchedule.nextLocationId
              : supplyDropSchedule.nextLocationId === 'CENTRAL_OASIS'
                ? 'HARBOR_DOCK'
                : 'CENTRAL_OASIS';
            const locSpec = SUPPLY_DROP_LOCATIONS[activeLocId];
            const groundElev = getTerrainElevation(locSpec.x, locSpec.z);
            supplyDropBeaconGroup.visible = true;
            supplyDropBeaconGroup.position.set(locSpec.x, groundElev + 0.08, locSpec.z);
            const pulse = 1.0 + Math.sin(timeSec * 6.5) * 0.14;
            supplyBeaconOuterRing.scale.set(pulse, pulse, 1);
            supplyBeaconInnerRing.scale.set(2.0 - pulse * 0.85, 2.0 - pulse * 0.85, 1);
            supplyBeaconOuterRingMat.opacity = 0.55 + Math.abs(Math.sin(timeSec * 5.0)) * 0.4;
            supplyBeaconBeamMat.opacity = 0.16 + Math.abs(Math.sin(timeSec * 4.0)) * 0.2;
          } else {
            supplyDropBeaconGroup.visible = false;
          }

          if (kioskStatusTimer > 0) {
            kioskStatusTimer = Math.max(0, kioskStatusTimer - dt);
            if (kioskStatusTimer <= 0) {
              kioskStatusMessage = null;
            }
          }

          // Update Falling & Grounded Crates (Parachute descent + Rigid Ballistic Throw/Kick Arc + Solid Box Sliding & Collisions)
          for (let ci = worldCrates.length - 1; ci >= 0; ci--) {
            const c = worldCrates[ci];
            const groundY = getTerrainElevation(c.x, c.z) + 0.65;
            c.squashTimer = 0;
            c.mesh.scale.set(1, 1, 1);

            if (c.state === 'falling') {
              c.y -= 5.2 * dt;
              c.mesh.position.y = c.y;
              c.rotY = Math.sin(timeSec * 2.5 + c.id) * 0.18;
              c.mesh.rotation.y = c.rotY;
              if (c.y <= groundY) {
                c.y = groundY;
                c.state = 'grounded';
                c.parachuteMesh.visible = false;
                c.mesh.position.y = groundY;
                c.rotY = 0;
                c.mesh.rotation.y = 0;
              }
            } else if (c.state === 'grounded') {
              if (c.y > groundY || c.vy > 0) {
                c.y += c.vy * dt;
                c.vy -= 25.0 * dt;
                if (c.y <= groundY) {
                  c.y = groundY;
                  if (c.vy < -2.0) {
                    const impactVy = Math.abs(c.vy);
                    c.vy = -c.vy * 0.24;
                    playSpatialSoundAt(c.x, c.z, 16.0, 3.5, () => {
                      if (c.kind === 'super') {
                        soundEngine.playMetalImpact(Math.min(10, impactVy * 1.35));
                      } else {
                        soundEngine.playWoodHit(Math.min(10, impactVy * 1.35));
                      }
                    });
                  } else {
                    c.vy = 0;
                  }
                }
              } else {
                c.y = groundY;
              }

              const cSpeed = Math.hypot(c.vx, c.vz);
              if (cSpeed > 0.02 || Math.abs(c.rotVelY) > 0.02) {
                c.x = wrapPlanetCoord(c.x + c.vx * dt);
                c.z = wrapPlanetCoord(c.z + c.vz * dt);
                const cEmb = evaluateOuterEmbankmentSdf(c.x, c.z);
                if (cEmb > -0.8) {
                  const len = Math.max(0.01, Math.hypot(c.x, c.z));
                  c.x -= (c.x / len) * (cEmb + 0.8);
                  c.z -= (c.z / len) * (cEmb + 0.8);
                  c.vx *= -0.4;
                  c.vz *= -0.4;
                }

                // Rigid Crate-vs-Static Obstacle Collision (thrown/pushed solid boxes bounce off walls & buildings!)
                for (let mi = 0; mi < activeMapProps.length; mi++) {
                  const mp = activeMapProps[mi];
                  if (!mp.alive || (mp.category !== 'solid' && mp.category !== 'breakable')) continue;
                  if (mp.halfX && mp.halfZ) {
                    const obbRes = resolveSolidObbCollision2D(
                      c.x,
                      c.z,
                      c.vx,
                      c.vz,
                      0.68,
                      mp.x,
                      mp.z,
                      mp.halfX,
                      mp.halfZ,
                      mp.rotY,
                      0.32,
                    );
                    if (obbRes.collided) {
                      c.x = wrapPlanetCoord(obbRes.x);
                      c.z = wrapPlanetCoord(obbRes.z);
                      c.vx = obbRes.vx;
                      c.vz = obbRes.vz;
                    }
                  } else {
                    const colRes = resolveSolidCollision2D(
                      c.x,
                      c.z,
                      c.vx,
                      c.vz,
                      0.68,
                      mp.x,
                      mp.z,
                      mp.radius,
                      0.32,
                    );
                    if (colRes.collided) {
                      c.x = wrapPlanetCoord(colRes.x);
                      c.z = wrapPlanetCoord(colRes.z);
                      c.vx = colRes.vx;
                      c.vz = colRes.vz;
                    }
                  }
                }

                // Rigid Crate-vs-Static Base Walls / Buildings / Fences OBB Collision
                const crateWorldObbs = getStaticWorldStructures();
                for (let oi = 0; oi < crateWorldObbs.length; oi++) {
                  const obb = crateWorldObbs[oi];
                  const obbRes = resolveSolidObbCollision2D(
                    c.x,
                    c.z,
                    c.vx,
                    c.vz,
                    0.66,
                    obb.x,
                    obb.z,
                    obb.halfX,
                    obb.halfZ,
                    obb.rotY,
                    0.32,
                  );
                  if (obbRes.collided) {
                    c.x = wrapPlanetCoord(obbRes.x);
                    c.z = wrapPlanetCoord(obbRes.z);
                    c.vx = obbRes.vx;
                    c.vz = obbRes.vz;
                  }
                }

                // Rigid Crate-vs-Crate Collision (thrown/pushed solid box knocks other grounded crates!)
                for (let cj = 0; cj < worldCrates.length; cj++) {
                  if (cj === ci) continue;
                  const other = worldCrates[cj];
                  if (other.state !== 'grounded') continue;
                  const ccRes = resolveCrateVsCrateCollision2D(
                    c.x,
                    c.z,
                    c.vx,
                    c.vz,
                    other.x,
                    other.z,
                    other.vx,
                    other.vz,
                    1.34,
                    0.34,
                  );
                  if (ccRes.collided) {
                    c.x = wrapPlanetCoord(ccRes.ax);
                    c.z = wrapPlanetCoord(ccRes.az);
                    c.vx = ccRes.avx;
                    c.vz = ccRes.avz;
                    other.x = wrapPlanetCoord(ccRes.bx);
                    other.z = wrapPlanetCoord(ccRes.bz);
                    other.vx = ccRes.bvx;
                    other.vz = ccRes.bvz;
                    if (
                      ccRes.impactSpeed > 1.2 &&
                      tryTriggerCooldown(`crate_crate_${Math.min(c.id, other.id)}_${Math.max(c.id, other.id)}`, timeSec, 0.12)
                    ) {
                      playSpatialSoundAt(c.x, c.z, 15.0, 3.5, () => {
                        soundEngine.playWoodHit(Math.min(9.0, ccRes.impactSpeed * 1.2));
                      });
                    }
                  }
                }

                c.rotY += c.rotVelY * dt;
                const damp = Math.exp(-5.4 * dt);
                c.vx *= damp;
                c.vz *= damp;
                c.rotVelY *= Math.exp(-7.0 * dt);

                // Team Buddies Crate Kick Synergy:
                // 1) If a kicked/thrown crate slides into any of the 4 Blue Stacking Pads, automatically slot it in!
                if (cSpeed > 1.2) {
                  let slottedToPad = false;
                  for (let pIdx = 0; pIdx < blueBase.commanderPads.length; pIdx++) {
                    const pad = blueBase.commanderPads[pIdx];
                    if (
                      getPlanetShortestDistance(c.x, c.z, pad.worldX, pad.worldZ) < 3.4 &&
                      addCrateToPadSlots('blue', c.kind, pIdx)
                    ) {
                      score += 35;
                      playBuildBoxSoundAtPad('blue', pad.worldX, pad.worldZ, pIdx === 0, () => {
                        soundEngine.playPickup();
                      });
                      spawnBurstParticles(pad.worldX, 1.4, pad.worldZ, 10);
                      scene.remove(c.mesh);
                      worldCrates.splice(ci, 1);
                      slottedToPad = true;
                      break;
                    }
                  }
                  if (slottedToPad) continue;
                }

                // 2) If a kicked/thrown crate slides into the rear loading zone of a Dump Truck, load it into the truck!
                if (cSpeed > 1.2) {
                  let loadedIntoTruck = false;
                  for (const t of tanks) {
                    if (
                      t.vehicleKind === 'truck' &&
                      t.hp > 0 &&
                      canLoadCrateIntoDumpTruck(t.storedCrates.length, (t.dumpAnimTimer ?? 0) > 0, true)
                    ) {
                      const rearX = wrapPlanetCoord(t.x - Math.cos(t.hullYaw) * 1.45);
                      const rearZ = wrapPlanetCoord(t.z + Math.sin(t.hullYaw) * 1.45);
                      const dRear = Math.min(
                        getPlanetShortestDistance(c.x, c.z, t.x, t.z),
                        getPlanetShortestDistance(c.x, c.z, rearX, rearZ),
                      );
                      if (dRear < 2.8 && c.kind !== 'medical') {
                        t.storedCrates.push(c.kind);
                        syncLyoDumpTruckCargoVisuals(t.bodyGroup, t.storedCrates);
                        playSpatialSoundAt(t.x, t.z, 16.0, 4.0, () => {
                          soundEngine.playPickup();
                          soundEngine.playWoodHit(7.5);
                        });
                        spawnBurstParticles(t.x, 1.65, t.z, 10);
                        scene.remove(c.mesh);
                        worldCrates.splice(ci, 1);
                        loadedIntoTruck = true;
                        break;
                      }
                    }
                  }
                  if (loadedIntoTruck) continue;
                }
              }
            }
          }

          // Update Pushable & Jiggling Map Props (wheelbarrow, traffic_cone, barricade, recycle_bin, warzone explosive barrels, etc.)
          for (const mp of activeMapProps) {
            if (!mp.alive) continue;
            if (mp.fallingFromSky) {
              const groundY = getTerrainElevation(mp.x, mp.z);
              mp.y = (mp.y ?? groundY + 18.0) - 5.6 * dt;
              mp.rotY = Math.sin(timeSec * 2.6 + mp.id) * 0.16;
              mp.wrapper.userData.baseRotY = mp.rotY;
              if (mp.y <= groundY) {
                mp.y = groundY;
                mp.fallingFromSky = false;
                mp.wrapper.userData.fallOffsetY = 0;
                if (mp.parachuteMesh) mp.parachuteMesh.visible = false;
                spawnBurstParticles(mp.x, groundY + 0.45, mp.z, 8);
              } else {
                mp.wrapper.userData.fallOffsetY = mp.y - groundY;
              }
            }
            if (mp.category === 'pushable' || mp.category === 'breakable') {
              const spd = Math.hypot(mp.vx, mp.vz);
              if (spd > 0.02 || Math.abs(mp.rotVelY) > 0.02) {
                mp.x = wrapPlanetCoord(mp.x + mp.vx * dt);
                mp.z = wrapPlanetCoord(mp.z + mp.vz * dt);
                const mpEmb = evaluateOuterEmbankmentSdf(mp.x, mp.z);
                if (mpEmb > -0.8) {
                  const len = Math.max(0.01, Math.hypot(mp.x, mp.z));
                  mp.x -= (mp.x / len) * (mpEmb + 0.8);
                  mp.z -= (mp.z / len) * (mpEmb + 0.8);
                  mp.vx *= -0.4;
                  mp.vz *= -0.4;
                }
                mp.rotY += mp.rotVelY * dt;
                const damp = Math.exp(-5.2 * dt);
                mp.vx *= damp;
                mp.vz *= damp;
                mp.rotVelY *= Math.exp(-6.2 * dt);
                mp.wrapper.userData.worldX = mp.x;
                mp.wrapper.userData.worldZ = mp.z;
                mp.wrapper.userData.baseRotY = mp.rotY;
                if (spd > 0.8) {
                  lyoGrassSystem.stampTankTracks(mp.x - 0.35, mp.z, mp.x + 0.35, mp.z);
                }
              }
            }
            if (mp.jiggleTimer > 0) {
              mp.jiggleTimer = Math.max(0, mp.jiggleTimer - dt);
            }
          }

          // Animate any unmounted LyoPlane (smoothly lands to altitude = 0 when parked/unmounted)
          // and advance active hydraulic vessel dump cycles on any Dump Truck!
          for (const v of tanks) {
            if (v.vehicleKind === 'plane' && v !== mountedTank && v.hp > 0) {
              const curAlt = v.altitude ?? 0;
              if (curAlt > 0) {
                v.altitude = Math.max(0, curAlt - 5.5 * dt);
                v.verticalSpeed = v.altitude > 0 ? -5.5 : 0;
              } else {
                v.verticalSpeed = 0;
              }
              v.forwardSpeed = Math.max(0, (v.forwardSpeed ?? 0) - 10 * dt);
              stepLyoPlaneAnimation(
                v.bodyGroup,
                dt,
                0,
                0,
                v.forwardSpeed,
                false,
                v.altitude ?? 0,
                v.verticalSpeed ?? 0,
              );
              const sh = v.root.getObjectByName('ContactShadowDisc');
              if (sh) {
                const sc = Math.max(1.5, 3.6 - (v.altitude ?? 0) * 0.13);
                sh.scale.set(sc, sc * 0.88, 1);
              }
            }

            if (v.vehicleKind === 'truck' && v.hp > 0 && (v.dumpAnimTimer ?? 0) > 0) {
              v.dumpAnimTimer = (v.dumpAnimTimer ?? 0) + dt;
              const hydState = evaluateDumpTruckHydraulicCycle(v.dumpAnimTimer);

              if (hydState.shouldReleaseCrates && !v.dumpReleasedInCycle) {
                v.dumpReleasedInCycle = true;
                if (v.storedCrates.length > 0) {
                  soundEngine.playHydraulicDump();
                  const nearBluePad =
                    v.dumpTargetMode === 'pad' ||
                    getPlanetShortestDistance(v.x, v.z, blueBase.padX, blueBase.padZ) <= 9.5;

                  if (nearBluePad) {
                    while (v.storedCrates.length > 0) {
                      const kind = v.storedCrates[0];
                      if (!addCrateToPadSlots('blue', kind)) break;
                      v.storedCrates.shift();
                      score += 35;
                    }
                    spawnBurstParticles(blueBase.padX, 1.8, blueBase.padZ, 12);
                  }

                  // Any crates remaining (or when unloading onto ground anywhere) slide out the rear tailgate!
                  if (v.storedCrates.length > 0) {
                    const fwdX = Math.cos(v.hullYaw);
                    const fwdZ = -Math.sin(v.hullYaw);
                    const rightX = Math.sin(v.hullYaw);
                    const rightZ = Math.cos(v.hullYaw);

                    v.storedCrates.forEach((kind, idx) => {
                      const sideOff = ((idx % 2) - 0.5) * 1.15;
                      const rearDist = 2.85 + Math.floor(idx / 2) * 1.15;
                      const ejectX = wrapPlanetCoord(v.x - fwdX * rearDist + rightX * sideOff);
                      const ejectZ = wrapPlanetCoord(v.z - fwdZ * rearDist + rightZ * sideOff);
                      spawnWorldCrate(kind, ejectX, ejectZ, true);
                      const ejected = worldCrates[worldCrates.length - 1];
                      if (ejected) {
                        ejected.vx = -fwdX * (3.6 + (idx % 2) * 0.8) + rightX * sideOff * 1.1;
                        ejected.vz = -fwdZ * (3.6 + (idx % 2) * 0.8) + rightZ * sideOff * 1.1;
                        ejected.rotVelY = (Math.random() - 0.5) * 5.0;
                      }
                      spawnBurstParticles(ejectX, 0.75, ejectZ, 6);
                    });
                    v.storedCrates = [];
                  }

                  syncLyoDumpTruckCargoVisuals(v.bodyGroup, v.storedCrates);
                }
              }

              if (hydState.finished) {
                v.dumpAnimTimer = 0;
                v.dumpReleasedInCycle = false;
                stepLyoDumpTruckAnimation(
                  v.bodyGroup,
                  0,
                  v.steerAngle ?? 0,
                  evaluateDumpTruckHydraulicCycle(0),
                  v.bodyPitchRad ?? 0,
                  v.bodyRollRad ?? 0,
                );
              } else if (v !== mountedTank) {
                stepLyoDumpTruckAnimation(
                  v.bodyGroup,
                  0,
                  v.steerAngle ?? 0,
                  hydState,
                  v.bodyPitchRad ?? 0,
                  v.bodyRollRad ?? 0,
                );
              }
            } else if (
              v.vehicleKind === 'truck' &&
              v !== mountedTank &&
              v.hp > 0 &&
              (Math.abs(v.forwardSpeed ?? 0) > 0.02 || Math.abs(v.steerAngle ?? 0) > 0.01)
            ) {
              // Unmounted Dump Truck smoothly coasts to a stop on its rubber tires
              const prevX = v.x;
              const prevZ = v.z;
              const prevYaw = v.hullYaw;
              const stepRes = stepDumpTruckWheeledPhysics(
                {
                  forwardSpeed: v.forwardSpeed ?? 0,
                  steerAngle: v.steerAngle ?? 0,
                  hullYaw: v.hullYaw,
                },
                { throttle: 0, steer: 0, boost: false },
                dt,
              );
              v.forwardSpeed = stepRes.forwardSpeed;
              v.steerAngle = stepRes.steerAngle;
              v.hullYaw = stepRes.hullYaw;
              v.vx = stepRes.vx;
              v.vz = stepRes.vz;
              v.bodyPitchRad = stepRes.bodyPitchRad;
              v.bodyRollRad = stepRes.bodyRollRad;
              v.x = wrapPlanetCoord(v.x + v.vx * dt);
              v.z = wrapPlanetCoord(v.z + v.vz * dt);
              resolveMoverWorldCollisions(v, `truck_${v.id}`, true, 2.1, 12.5, timeSec, false);
              v.bodyGroup.rotation.y = v.hullYaw;
              const fwdX = Math.cos(v.hullYaw);
              const fwdZ = -Math.sin(v.hullYaw);
              const fwdMove =
                getPlanetShortestDelta(v.x, prevX) * fwdX +
                getPlanetShortestDelta(v.z, prevZ) * fwdZ;
              stepLyoDumpTruckAnimation(
                v.bodyGroup,
                fwdMove,
                v.steerAngle,
                evaluateDumpTruckHydraulicCycle(v.dumpAnimTimer ?? 0),
                v.bodyPitchRad,
                v.bodyRollRad,
              );
              recordTankMovementAndTracks(v, prevX, prevZ, prevYaw);
            }
          }

          if (mountedTank) {
            // =================================================================
            // A. DRIVING LYO TANK / DUMP TRUCK OR FLYING LYO PLANE MODE
            // =================================================================
            const isPlane = mountedTank.vehicleKind === 'plane';
            const isTruck = mountedTank.vehicleKind === 'truck';
            const prevTankX = mountedTank.x;
            const prevTankZ = mountedTank.z;
            const prevTankYaw = mountedTank.hullYaw;

            if (isPlane) {
              // ---------------------------------------------------------------
              // LYO PLANE FLIGHT & TAKE-OFF PHYSICS (NO REVERSE / BACKWARD!)
              // - Starts on ground (altitude = 0)
              // - [W]: Forward thrust (accelerates forward, auto-takes off from runway, NEVER reverses!)
              // - [Space] / [E] / [ArrowUp]: Take-Off & Climb UP up to 19.5m (clears 9.2m trees, 13.25m HQ & 18.5m crane/turbines!)
              // - [C] / [Ctrl] / [ArrowDown] / [S]: Descend & Land to ground (0m); [S] also brakes forward speed to 0
              // ---------------------------------------------------------------
              const MAX_PLANE_ALT = 19.5;
              const isForwardThrust = Boolean(keys['KeyW']);
              const isAirbrake = Boolean(keys['KeyS']);
              const isClimbInput = Boolean(
                keys['Space'] || keys['KeyE'] || keys['ArrowUp'] || keys['PageUp'],
              );
              const isDescendInput = Boolean(
                keys['KeyC'] ||
                  keys['ControlLeft'] ||
                  keys['ControlRight'] ||
                  keys['ArrowDown'] ||
                  keys['PageDown'] ||
                  keys['KeyS'],
              );

              let turn = 0;
              if (keys['KeyA'] || keys['ArrowLeft']) turn += 1;
              if (keys['KeyD'] || keys['ArrowRight']) turn -= 1;

              let alt = mountedTank.altitude ?? 0;
              let targetAlt = mountedTank.targetAltitude ?? alt;
              let vSpd = mountedTank.verticalSpeed ?? 0;
              let fSpd = mountedTank.forwardSpeed ?? 0;

              // 1. Vertical Altitude & Take-Off Control (0m Ground -> 19.5m Above Trees & Buildings!)
              if (isClimbInput) {
                targetAlt = Math.min(MAX_PLANE_ALT, Math.max(targetAlt + 11.5 * dt, 13.8));
                if (fSpd < 7.0) fSpd = Math.min(7.0, fSpd + 18.0 * dt);
              } else if (isDescendInput) {
                targetAlt = Math.max(0, targetAlt - 12.0 * dt);
                if (keys['KeyC'] || keys['ControlLeft'] || keys['ControlRight']) {
                  targetAlt = 0;
                }
              } else if (isForwardThrust && alt < 1.5 && fSpd >= 4.2) {
                // Automatic runway take-off climb above the trees when accelerating on the ground!
                targetAlt = Math.max(targetAlt, 12.5);
              }

              const altError = targetAlt - alt;
              const desiredVy = clamp(altError * 3.8, -11.0, 12.5);
              vSpd += (desiredVy - vSpd) * Math.min(1, 10.0 * dt);
              alt = clamp(alt + vSpd * dt, 0, MAX_PLANE_ALT);
              if (alt <= 0.02 && targetAlt <= 0.05) {
                alt = 0;
                targetAlt = 0;
                vSpd = 0;
              } else if (alt >= MAX_PLANE_ALT - 0.02 && targetAlt >= MAX_PLANE_ALT - 0.05) {
                alt = MAX_PLANE_ALT;
                vSpd = 0;
              }

              // 2. Forward Airspeed Control (Strictly >= 0 — Plane NEVER moves backwards!)
              const maxFwdSpeed = isBoosting ? 24.5 : 18.2;
              if (isForwardThrust) {
                fSpd = Math.min(maxFwdSpeed, fSpd + (isBoosting ? 22.0 : 16.5) * dt);
              } else if (isAirbrake) {
                // Airbrake / Wheel Brake: decelerates forward speed down to 0, NEVER negative!
                fSpd = Math.max(0, fSpd - 22.0 * dt);
              } else {
                // Coasting: maintain smooth forward glide when airborne, stop on ground
                const minGlideSpeed = alt > 0.35 ? 5.2 : 0;
                if (fSpd > minGlideSpeed) {
                  fSpd = Math.max(minGlideSpeed, fSpd - 6.0 * dt);
                } else if (alt > 0.35 && fSpd < minGlideSpeed) {
                  fSpd = Math.min(minGlideSpeed, fSpd + 6.0 * dt);
                }
              }

              // 3. Yaw Steering (only turns on the ground if rolling forward, or anytime in the air)
              if (turn !== 0 && (alt > 0.2 || fSpd > 0.4)) {
                const turnRate = REA_CONSTANTS.physics.drive.rotationSpeed * (alt > 0.2 ? 1.28 : 0.95);
                mountedTank.hullYaw += turn * turnRate * dt;
              }

              const fwdX = Math.cos(mountedTank.hullYaw);
              const fwdZ = -Math.sin(mountedTank.hullYaw);
              mountedTank.vx = fwdX * fSpd;
              mountedTank.vz = fwdZ * fSpd;
              // Seamless 360° Spherical Loop Wrapping!
              mountedTank.x = wrapPlanetCoord(mountedTank.x + mountedTank.vx * dt);
              mountedTank.z = wrapPlanetCoord(mountedTank.z + mountedTank.vz * dt);

              // Full 3D Altitude-Aware Collision Resolution at ALL altitudes (collides with any building, tree, or prop taller than `alt`, plus Outer Embankment!)
              mountedTank.altitude = alt;
              resolveMoverWorldCollisions(mountedTank, 'player_plane', true, 1.95, 7.0, timeSec, true, alt);
              mountedTank.forwardSpeed = Math.hypot(mountedTank.vx, mountedTank.vz);
              fSpd = mountedTank.forwardSpeed;

              mountedTank.altitude = alt;
              mountedTank.targetAltitude = targetAlt;
              mountedTank.verticalSpeed = vSpd;
              mountedTank.forwardSpeed = fSpd;

              mountedTank.root.position.set(mountedTank.x, getTerrainElevation(mountedTank.x, mountedTank.z), mountedTank.z);
              mountedTank.bodyGroup.rotation.y = mountedTank.hullYaw;
              activeSpeed = fSpd;
              soundEngine.updateVehicleMovementLoop(activeSpeed, isBoosting && isForwardThrust, alt < 1.2);

              const sh = mountedTank.root.getObjectByName('ContactShadowDisc');
              if (sh) {
                const sc = Math.max(1.5, 3.6 - alt * 0.13);
                sh.scale.set(sc, sc * 0.88, 1);
              }

              const isPlaneFiring = Boolean(isPointerDown);
              stepLyoPlaneAnimation(
                mountedTank.bodyGroup,
                dt,
                turn,
                isForwardThrust ? 1 : 0,
                activeSpeed,
                isPlaneFiring,
                alt,
                vSpd,
              );
              mountedTank.turretGroup.rotation.y = 0;

              // 4. Flatten grass beneath LyoPlane ONLY when flying low or taking off (alt < 4.5m)
              if (alt < 4.5 && (fSpd > 0.4 || alt > 0.15)) {
                const rightX = Math.sin(mountedTank.hullYaw);
                const rightZ = Math.cos(mountedTank.hullYaw);
                const wingWashSpan = 1.45;
                lyoGrassSystem.stampTankTracks(
                  mountedTank.x - rightX * wingWashSpan,
                  mountedTank.z - rightZ * wingWashSpan,
                  mountedTank.x + rightX * wingWashSpan,
                  mountedTank.z + rightZ * wingWashSpan,
                );
                lyoGrassSystem.stampTankTracks(
                  mountedTank.x - fwdX * 0.85,
                  mountedTank.z - fwdZ * 0.85,
                  mountedTank.x + fwdX * 0.85,
                  mountedTank.z + fwdZ * 0.85,
                );
              }

              // 5. Twin Under-Wing Rotary Minigun Firing (angles slightly down when flying high to strafe ground targets!)
              if (mountedTank.recoilTimer > 0) {
                mountedTank.recoilTimer = Math.max(0, mountedTank.recoilTimer - dt);
              }
              if (isPlaneFiring && mountedTank.recoilTimer <= 0.01) {
                mountedTank.recoilTimer = 0.095;
                soundEngine.playFighterJetRotaryBurst();
                const groundElev = getTerrainElevation(mountedTank.x, mountedTank.z);
                const muzzleY = groundElev + 0.55 + alt;
                const distToAim = Math.max(
                  9.0,
                  getPlanetShortestDistance(aimWorldPoint.x, aimWorldPoint.z, mountedTank.x, mountedTank.z),
                );
                const pitchDropY =
                  alt > 1.2 ? clamp((groundElev + 1.2 - muzzleY) / distToAim, -0.55, 0.02) : 0;
                const sDir = new THREE.Vector3(fwdX, pitchDropY, fwdZ).normalize();
                const rightX = Math.sin(mountedTank.hullYaw);
                const rightZ = Math.cos(mountedTank.hullYaw);
                for (const side of [-1, 1]) {
                  const mgOrigin = new THREE.Vector3(
                    wrapPlanetCoord(mountedTank.x + fwdX * 2.1 + rightX * (side * 1.12)),
                    muzzleY,
                    wrapPlanetCoord(mountedTank.z + fwdZ * 2.1 + rightZ * (side * 1.12)),
                  );
                  fireProjectile(true, 'PlaneGatling', mgOrigin, sDir, 56, 11);
                  lyoExplosionSystem.spawnLyoMuzzleFlash(mgOrigin, sDir, 0.48, 'minigun');
                }
                if (activeMuzzleRaycastResult?.hit) {
                  spawnRaycastSurfaceNormalImpact(activeMuzzleRaycastResult, false);
                }
                shakeTrauma = Math.min(1, shakeTrauma + 0.08);
              }
              // 5B. Aerial CB-24 Cluster Bomb Salvo Drop (Exclusive to Lyo Plane!)
              if (planeClusterBombCooldown > 0) {
                planeClusterBombCooldown = Math.max(0, planeClusterBombCooldown - dt);
              }
              if (
                isPlaneFiring &&
                planeClusterBombCooldown <= 0 &&
                playerUnit.secondaryItem === 'cluster_bomb' &&
                playerUnit.secondaryCount > 0 &&
                (blueCommanderBases[0]?.buildingLevel ?? 1) >= 3
              ) {
                planeClusterBombCooldown = 0.95;
                dropClusterBombFromPlane(mountedTank);
                playerUnit.secondaryCount = Math.max(0, playerUnit.secondaryCount - 1);
              }
            } else if (isTruck) {
              // ---------------------------------------------------------------
              // LYO DUMP TRUCK WHEELED ACKERMANN STEERING & DIESEL INERTIA
              // - Front-wheel steering (cannot pivot-spin in place when stationary!)
              // - Smooth acceleration, rubber-tire coasting inertia, air-brakes & reverse
              // - Sprung suspension pitch (squat/nose-dive) & cornering roll
              // ---------------------------------------------------------------
              let throttle = 0;
              let steer = 0;
              if (keys['KeyW'] || keys['ArrowUp']) throttle += 1;
              if (keys['KeyS'] || keys['ArrowDown']) throttle -= 1;
              if (keys['KeyA'] || keys['ArrowLeft']) steer += 1;
              if (keys['KeyD'] || keys['ArrowRight']) steer -= 1;

              const truckStep = stepDumpTruckWheeledPhysics(
                {
                  forwardSpeed: mountedTank.forwardSpeed ?? 0,
                  steerAngle: mountedTank.steerAngle ?? 0,
                  hullYaw: mountedTank.hullYaw,
                },
                {
                  throttle,
                  steer,
                  boost: isBoosting && throttle !== 0,
                },
                dt,
              );

              mountedTank.forwardSpeed = truckStep.forwardSpeed;
              mountedTank.steerAngle = truckStep.steerAngle;
              mountedTank.hullYaw = truckStep.hullYaw;
              mountedTank.vx = truckStep.vx;
              mountedTank.vz = truckStep.vz;
              mountedTank.bodyPitchRad = truckStep.bodyPitchRad;
              mountedTank.bodyRollRad = truckStep.bodyRollRad;
              mountedTank.currentDriveSpeed = Math.abs(truckStep.forwardSpeed);

              mountedTank.x = wrapPlanetCoord(mountedTank.x + mountedTank.vx * dt);
              mountedTank.z = wrapPlanetCoord(mountedTank.z + mountedTank.vz * dt);

              resolveMoverWorldCollisions(
                mountedTank,
                'player_truck',
                true,
                2.1,
                12.5,
                timeSec,
                true,
              );

              // Sync longitudinal speed with post-collision velocity along truck forward axis
              const fwdX = Math.cos(mountedTank.hullYaw);
              const fwdZ = -Math.sin(mountedTank.hullYaw);
              const postCollisionFwdSpeed = mountedTank.vx * fwdX + mountedTank.vz * fwdZ;
              if (Math.abs(postCollisionFwdSpeed) < Math.abs(mountedTank.forwardSpeed) * 0.65) {
                mountedTank.forwardSpeed = postCollisionFwdSpeed;
              }

              mountedTank.root.position.set(
                mountedTank.x,
                getTerrainElevation(mountedTank.x, mountedTank.z),
                mountedTank.z,
              );
              mountedTank.bodyGroup.rotation.y = mountedTank.hullYaw;
              activeSpeed = Math.hypot(mountedTank.vx, mountedTank.vz);
              const isOnGrass = Math.hypot(mountedTank.x, mountedTank.z) < 42;
              soundEngine.updateVehicleMovementLoop(
                activeSpeed,
                isBoosting && throttle !== 0,
                isOnGrass,
              );

              recordTankMovementAndTracks(mountedTank, prevTankX, prevTankZ, prevTankYaw);

              const dx = getPlanetShortestDelta(mountedTank.x, prevTankX);
              const dz = getPlanetShortestDelta(mountedTank.z, prevTankZ);
              const fwdMove = dx * fwdX + dz * fwdZ;
              const hydState = evaluateDumpTruckHydraulicCycle(mountedTank.dumpAnimTimer ?? 0);
              stepLyoDumpTruckAnimation(
                mountedTank.bodyGroup,
                fwdMove,
                mountedTank.steerAngle,
                hydState,
                mountedTank.bodyPitchRad,
                mountedTank.bodyRollRad,
              );
            } else {
              // ---------------------------------------------------------------
              // LYO TANK TRACKED DRIVING PHYSICS (DUAL CATERPILLAR PIVOT + TURRET)
              // ---------------------------------------------------------------
              let throttle = 0;
              let turn = 0;
              if (keys['KeyW'] || keys['ArrowUp']) throttle += 1;
              if (keys['KeyS'] || keys['ArrowDown']) throttle -= 1;
              if (keys['KeyA'] || keys['ArrowLeft']) turn += 1;
              if (keys['KeyD'] || keys['ArrowRight']) turn -= 1;

              mountedTank.currentDriveSpeed = computeTankSpeedStep(
                mountedTank.currentDriveSpeed,
                isBoosting && throttle !== 0,
                dt,
              );

              if (turn !== 0) {
                const rev = throttle < 0 ? -1 : 1;
                mountedTank.hullYaw +=
                  turn * rev * REA_CONSTANTS.physics.drive.rotationSpeed * dt;
              }

              const fwdX = Math.cos(mountedTank.hullYaw);
              const fwdZ = -Math.sin(mountedTank.hullYaw);
              const targetVx = fwdX * throttle * mountedTank.currentDriveSpeed;
              const targetVz = fwdZ * throttle * mountedTank.currentDriveSpeed;
              mountedTank.vx += (targetVx - mountedTank.vx) * Math.min(1, 10 * dt);
              mountedTank.vz += (targetVz - mountedTank.vz) * Math.min(1, 10 * dt);

              mountedTank.x = wrapPlanetCoord(mountedTank.x + mountedTank.vx * dt);
              mountedTank.z = wrapPlanetCoord(mountedTank.z + mountedTank.vz * dt);

              resolveMoverWorldCollisions(
                mountedTank,
                'player_tank',
                true,
                mountedTank.isSuper ? 2.15 : 1.95,
                mountedTank.isSuper ? 14.0 : 10.5,
                timeSec,
                true,
              );

              const playerTankClimb = evaluateTankClimbableObstacleElevation(
                mountedTank.x,
                mountedTank.z,
                mountedTank.hullYaw,
                activeMapProps,
              );
              mountedTank.root.position.set(
                mountedTank.x,
                getTerrainElevation(mountedTank.x, mountedTank.z) + playerTankClimb.climbY,
                mountedTank.z,
              );
              mountedTank.bodyGroup.rotation.y = mountedTank.hullYaw;
              activeSpeed = Math.hypot(mountedTank.vx, mountedTank.vz);
              const isOnGrass = Math.hypot(mountedTank.x, mountedTank.z) < 42;
              soundEngine.updateVehicleMovementLoop(activeSpeed, isBoosting && throttle !== 0, isOnGrass);

              recordTankMovementAndTracks(mountedTank, prevTankX, prevTankZ, prevTankYaw);

              // Rotate Turret + Open-Top Rider 360° toward Mouse Crosshair
              const aimDx = getPlanetShortestDelta(aimWorldPoint.x, mountedTank.x);
              const aimDz = getPlanetShortestDelta(aimWorldPoint.z, mountedTank.z);
              const desiredWorldYaw = Math.atan2(-aimDz, aimDx);
              mountedTank.turretYaw = stepTurretYaw(
                mountedTank.turretYaw,
                desiredWorldYaw - mountedTank.hullYaw,
                dt,
              );
              mountedTank.turretGroup.rotation.y = mountedTank.turretYaw;
            }

            // Team Buddies Feature: Crate Run-Over / Low-Hover Scoop for Tanks & Low-Flying Planes ONLY
            // (Dump Truck NEVER auto-fills when driving over crates — the character must load crates into the truck one-by-one!)
            const isDumpingNow = isTruck && (mountedTank.dumpAnimTimer ?? 0) > 0;
            if (!isTruck && (!isPlane || (mountedTank.altitude ?? 0) < 3.2) && !isDumpingNow) {
              for (let i = worldCrates.length - 1; i >= 0; i--) {
                const c = worldCrates[i];
                if (
                  c.state === 'grounded' &&
                  c.kind !== 'medical' &&
                  canLoadCrateIntoDumpTruck(mountedTank.storedCrates.length, isDumpingNow, true)
                ) {
                  if (getPlanetShortestDistance(c.x, c.z, mountedTank.x, mountedTank.z) < 3.1) {
                    mountedTank.storedCrates.push(c.kind);
                    scene.remove(c.mesh);
                    worldCrates.splice(i, 1);
                    soundEngine.playPickup();
                  }
                }
              }
            }

            // Auto-unload stored crates when passing next to Blue Stacking Pad
            if (
              mountedTank.storedCrates.length > 0 &&
              getPlanetShortestDistance(mountedTank.x, mountedTank.z, blueBase.padX, blueBase.padZ) < 5.6
            ) {
              if (isTruck) {
                if (
                  (mountedTank.dumpAnimTimer ?? 0) <= 0 &&
                  chooseNextPadSlotIndex(bluePadSlots, buildOrder) !== -1
                ) {
                  startDumpTruckHydraulicUnload(mountedTank, 'pad');
                }
              } else {
                while (mountedTank.storedCrates.length > 0) {
                  const kind = mountedTank.storedCrates[0];
                  if (!addCrateToPadSlots('blue', kind)) break;
                  mountedTank.storedCrates.shift();
                  score += 35;
                }
                soundEngine.playPickup();
              }
            }

            // Keep playerUnit position synced to the Vehicle
            playerUnit.x = mountedTank.x;
            playerUnit.z = mountedTank.z;

            if (!isPlane && !isTruck) {
              const isFiringNow = Boolean(isPointerDown || keys['Space']);
              if (mountedTank.recoilTimer > 0) {
                mountedTank.recoilTimer = Math.max(0, mountedTank.recoilTimer - dt);
              }

              if (isFiringNow && mountedTank.recoilTimer <= 0.02) {
                mountedTank.recoilTimer = 0.24;
                soundEngine.playTankCannonFire();
                const totalYaw = mountedTank.hullYaw + mountedTank.turretYaw;
                const sDir = new THREE.Vector3(Math.cos(totalYaw), 0, -Math.sin(totalYaw));
                const rightDirX = Math.sin(totalYaw);
                const rightDirZ = Math.cos(totalYaw);
                const sideOffset = (mountedTank.isSuper ? 2.75 : 2.45) * 0.42;
                const tankClimbNow = evaluateTankClimbableObstacleElevation(
                  mountedTank.x,
                  mountedTank.z,
                  mountedTank.hullYaw,
                  activeMapProps,
                );
                const tankGroundY =
                  getTerrainElevation(mountedTank.x, mountedTank.z) + tankClimbNow.climbY;
                const muzzleOrigin = new THREE.Vector3(
                  wrapPlanetCoord(mountedTank.x + sDir.x * 3.7 + rightDirX * sideOffset),
                  tankGroundY + (mountedTank.isSuper ? 3.45 : 3.08),
                  wrapPlanetCoord(mountedTank.z + sDir.z * 3.7 + rightDirZ * sideOffset),
                );
                fireProjectile(true, 'TankCannon', muzzleOrigin, sDir, 46, mountedTank.isSuper ? 26 : 18);
                if (activeMuzzleRaycastResult?.hit) {
                  spawnRaycastSurfaceNormalImpact(activeMuzzleRaycastResult, true);
                }
                lyoExplosionSystem.spawnLyoMuzzleFlash(
                  muzzleOrigin,
                  sDir,
                  mountedTank.isSuper ? 1.45 : 1.22,
                  'cannon',
                );
                recoilOffset.x -= sDir.x * 0.03;
                recoilOffset.z -= sDir.z * 0.03;
                shakeTrauma = Math.min(1, shakeTrauma + 0.05);
              }
            }
          } else if (ridingTramCarIdx !== null && playerUnit.alive) {
            // =================================================================
            // A2. RIDING CITY TRAM MODE (PASSENGER + MAX 1 CARRIED CRATE IN HAND)
            // =================================================================
            const tramStateNow = cityTram.getState();
            const activeCar = ridingTramCarIdx === 0 ? tramStateNow.car1 : tramStateNow.car2;
            playerUnit.x = wrapPlanetCoord(activeCar.x);
            playerUnit.z = wrapPlanetCoord(activeCar.z);
            playerUnit.vx = activeCar.forwardX * CITY_TRAM_SPEC.cruiseSpeed;
            playerUnit.vz = activeCar.forwardZ * CITY_TRAM_SPEC.cruiseSpeed;
            playerUnit.yaw = activeCar.yaw;
            const tramFloorY = getTerrainElevation(playerUnit.x, playerUnit.z) + 0.45;
            playerUnit.root.position.set(playerUnit.x, tramFloorY, playerUnit.z);
            playerUnit.bodyGroup.rotation.set(0, playerUnit.yaw + Math.PI / 2, 0);
            playerUnit.root.visible = true;
            playerUnit.overheadCrateGroup.visible = playerUnit.carryingCrate !== 'none';
            if (playerUnit.hp < playerUnit.maxHp) {
              playerUnit.hp = Math.min(playerUnit.maxHp, playerUnit.hp + dt * 8.5);
            }
            activeSpeed = CITY_TRAM_SPEC.cruiseSpeed;
            soundEngine.updateVehicleMovementLoop(activeSpeed * 0.65, false, false);
          } else if (playerUnit.alive) {
            // =================================================================
            // B. ON-FOOT CHIBI BUDDY CHARACTER MODE + OBJECT COLLISION RESOLUTION
            // =================================================================
            soundEngine.updateVehicleMovementLoop(0, false, false);
            const spec = BUDDY_CLASSES[playerUnit.classId];
            const carryPenalty = playerUnit.carryingCrate !== 'none' ? 0.85 : 1.0;
            const boostMult = isBoosting ? 1.38 : 1.0;
            const moveSpeed = 9.2 * spec.speedMultiplier * carryPenalty * boostMult;

            const inputLen = Math.hypot(moveX, moveZ);
            if (inputLen > 0.01) {
              playerUnit.vx = (moveX / inputLen) * moveSpeed;
              playerUnit.vz = (moveZ / inputLen) * moveSpeed;
              playerUnit.walkCycle += dt * moveSpeed * 1.65;
            } else {
              playerUnit.vx *= Math.exp(-14 * dt);
              playerUnit.vz *= Math.exp(-14 * dt);
            }

            playerUnit.x = wrapPlanetCoord(playerUnit.x + playerUnit.vx * dt);
            playerUnit.z = wrapPlanetCoord(playerUnit.z + playerUnit.vz * dt);

            // Resolve character collision against solid buildings/pipes/trees and pushable props/crates
            resolveMoverWorldCollisions(playerUnit, 'player_foot', false, 0.72, 2.2, timeSec, true);

            // Step Team Buddies Vertical Jump & Gravity Arc with 0.1s Jump Input Buffer ([Space] on foot)
            const jumpStep = stepBuddyJumpPhysicsWithBuffer(
              playerUnit.jumpOffset,
              playerUnit.vy,
              playerUnit.isGrounded,
              playerUnit.jumpBufferTimer ?? 0,
              false,
              spec.jumpMultiplier,
              playerUnit.carryingCrate !== 'none',
              dt,
            );
            playerUnit.jumpOffset = jumpStep.jumpOffset;
            playerUnit.vy = jumpStep.vy;
            playerUnit.isGrounded = jumpStep.isGrounded;
            playerUnit.jumpBufferTimer = jumpStep.jumpBufferTimer;
            if (jumpStep.justJumped) {
              soundEngine.playJump();
              spawnBurstParticles(
                playerUnit.x,
                getTerrainElevation(playerUnit.x, playerUnit.z) + 0.18,
                playerUnit.z,
                6,
              );
            } else if (jumpStep.justLanded) {
              soundEngine.playHeavyThud(3.2, false);
              spawnBurstParticles(
                playerUnit.x,
                getTerrainElevation(playerUnit.x, playerUnit.z) + 0.15,
                playerUnit.z,
                5,
              );
            }

            activeSpeed = Math.hypot(playerUnit.vx, playerUnit.vz);

            // Rotate Character toward WASD movement direction when running, or toward Mouse Crosshair when clicking
            const aimDx = getPlanetShortestDelta(aimWorldPoint.x, playerUnit.x);
            const aimDz = getPlanetShortestDelta(aimWorldPoint.z, playerUnit.z);
            if (inputLen > 0.01 && !isPointerDown) {
              playerUnit.yaw = Math.atan2(-playerUnit.vz, playerUnit.vx);
            } else if (isPointerDown && Math.hypot(aimDx, aimDz) > 0.2) {
              playerUnit.yaw = Math.atan2(-aimDz, aimDx);
            }

            // Player Attack: Unarmed Fist Punch Combo ('unarmed') OR Shooting with 3 Tactical Weapons ('pistol' | 'rifle' | 'bazooka')
            if (playerUnit.shootCooldown > 0) {
              playerUnit.shootCooldown = Math.max(0, playerUnit.shootCooldown - dt);
            }
            if (
              isPointerDown &&
              playerUnit.carryingCrate === 'none' &&
              playerUnit.shootCooldown <= 0
            ) {
              if (Math.hypot(aimDx, aimDz) > 0.2) {
                playerUnit.yaw = Math.atan2(-aimDz, aimDx);
              }
              const wId = playerUnit.weaponId;
              if (wId === 'unarmed') {
                performBuddyMeleeAttack(playerUnit, 'punch');
              } else {
                const isBazooka = wId === 'bazooka';
                const isLaser = wId === 'laser';
                const isGatling = wId === 'gatling';
                const isRifle = wId === 'rifle' || isLaser || isGatling;
                playerUnit.shootCooldown = isBazooka
                  ? 0.52
                  : isGatling
                  ? 0.065
                  : isLaser
                  ? 0.14
                  : isRifle
                  ? 0.11
                  : 0.19;
                playerUnit.weaponRecoil = 1.0;
                if (isBazooka) {
                  soundEngine.playBazookaLaunch();
                } else if (isLaser) {
                  soundEngine.playLaserGunFire();
                } else if (isGatling) {
                  soundEngine.playGatlingGunFire();
                } else if (isRifle) {
                  soundEngine.playTacticalFirearm('rifle');
                } else {
                  soundEngine.playTacticalFirearm('pistol');
                }

                const fwdX = Math.cos(playerUnit.yaw);
                const fwdZ = -Math.sin(playerUnit.yaw);
                const rightX = Math.sin(playerUnit.yaw);
                const rightZ = Math.cos(playerUnit.yaw);
                const sDir = new THREE.Vector3(fwdX, 0, fwdZ);
                const playerTerrainY =
                  getTerrainElevation(playerUnit.x, playerUnit.z) + playerUnit.jumpOffset;

                if (isBazooka) {
                  // Shoulder-Mounted Rocket Launcher: Muzzle sparks in front + Backblast behind right shoulder!
                  const shoulderX = playerUnit.x + rightX * 0.54;
                  const shoulderZ = playerUnit.z + rightZ * 0.54;
                  const frontMuzzleX = wrapPlanetCoord(shoulderX + fwdX * 1.38);
                  const frontMuzzleZ = wrapPlanetCoord(shoulderZ + fwdZ * 1.38);
                  const rearVentX = wrapPlanetCoord(shoulderX - fwdX * 1.18);
                  const rearVentZ = wrapPlanetCoord(shoulderZ - fwdZ * 1.18);

                  // 1. Front Muzzle Sparks around Rocket Warhead
                  spawnDirectionalSparks(frontMuzzleX, playerTerrainY + 1.82, frontMuzzleZ, fwdX, fwdZ, 10, 14, 0.7);
                  // 2. Rear Exhaust Backblast Plume behind Right Shoulder
                  spawnDirectionalSparks(rearVentX, playerTerrainY + 1.82, rearVentZ, -fwdX, -fwdZ, 16, 18, 0.85);

                  const muzzlePos = new THREE.Vector3(frontMuzzleX, playerTerrainY + 1.82, frontMuzzleZ);
                  fireProjectile(true, 'Bazooka', muzzlePos, sDir, 38, 28);
                  if (activeMuzzleRaycastResult?.hit) {
                    spawnRaycastSurfaceNormalImpact(activeMuzzleRaycastResult, true);
                  }
                  lyoExplosionSystem.spawnLyoMuzzleFlash(muzzlePos, sDir, 0.92, 'bazooka');
                  lyoExplosionSystem.spawnLyoMuzzleFlash(
                    new THREE.Vector3(rearVentX, playerTerrainY + 1.82, rearVentZ),
                    sDir.clone().negate(),
                    0.72,
                    'bazooka',
                  );
                  recoilOffset.x -= fwdX * 0.16;
                  recoilOffset.z -= fwdZ * 0.16;
                  shakeTrauma = Math.min(1, shakeTrauma + 0.22);
                } else if (isLaser) {
                  // LG-88 Photon Lance: Coherent Cyan/White 3D Laser Beam + Target Fire Ignition Particles!
                  const muzzleX = wrapPlanetCoord(playerUnit.x + fwdX * 1.48 + rightX * 0.12);
                  const muzzleZ = wrapPlanetCoord(playerUnit.z + fwdZ * 1.48 + rightZ * 0.12);
                  const laserMuzzlePos = new THREE.Vector3(muzzleX, playerTerrainY + 1.48, muzzleZ);
                  const beamTargetPos = activeMuzzleRaycastResult?.hit
                    ? new THREE.Vector3(
                        activeMuzzleRaycastResult.point.x,
                        activeMuzzleRaycastResult.point.y,
                        activeMuzzleRaycastResult.point.z,
                      )
                    : new THREE.Vector3(
                        wrapPlanetCoord(muzzleX + fwdX * 26.0),
                        playerTerrainY + 1.48,
                        wrapPlanetCoord(muzzleZ + fwdZ * 26.0),
                      );
                  spawnLaserBeamEffect(laserMuzzlePos, beamTargetPos);
                  spawnTargetFireParticles(beamTargetPos.x, beamTargetPos.y, beamTargetPos.z, 15, 0.55);
                  lyoExplosionSystem.spawnLyoMuzzleFlash(laserMuzzlePos, sDir, 0.56, 'rifle');
                  fireProjectile(true, 'LyoLaserGun', laserMuzzlePos, sDir, 76, 18);
                  if (activeMuzzleRaycastResult?.hit) {
                    spawnRaycastSurfaceNormalImpact(activeMuzzleRaycastResult, false);
                  }
                  recoilOffset.x -= fwdX * 0.035;
                  recoilOffset.z -= fwdZ * 0.035;
                  shakeTrauma = Math.min(1, shakeTrauma + 0.05);
                } else if (isGatling) {
                  // TITAN-6 Rotary Gatling Gun: High-RPM 7.62x51mm rotary burst + Brass Shell Casings + Rotary Barrel Spin!
                  const muzzleX = wrapPlanetCoord(playerUnit.x + fwdX * 1.52 + rightX * 0.14);
                  const muzzleZ = wrapPlanetCoord(playerUnit.z + fwdZ * 1.52 + rightZ * 0.14);
                  const gatlingMuzzlePos = new THREE.Vector3(muzzleX, playerTerrainY + 1.44, muzzleZ);
                  if (playerUnit.rig.gatlingGroup) {
                    playerUnit.rig.gatlingGroup.rotation.z = Math.sin(timeSec * 65.0) * 0.09;
                  }
                  spawnGatlingBrassAndSparks(
                    muzzleX,
                    playerTerrainY + 1.44,
                    muzzleZ,
                    fwdX,
                    fwdZ,
                    rightX,
                    rightZ,
                  );
                  lyoExplosionSystem.spawnLyoMuzzleFlash(gatlingMuzzlePos, sDir, 0.64, 'minigun');
                  fireProjectile(true, 'Titan6Gatling', gatlingMuzzlePos, sDir, 64, 13);
                  if (activeMuzzleRaycastResult?.hit) {
                    spawnRaycastSurfaceNormalImpact(activeMuzzleRaycastResult, false);
                    spawnDirectionalSparks(
                      activeMuzzleRaycastResult.point.x,
                      activeMuzzleRaycastResult.point.y,
                      activeMuzzleRaycastResult.point.z,
                      -fwdX,
                      -fwdZ,
                      8,
                      14,
                      0.85,
                    );
                  }
                  recoilOffset.x -= fwdX * 0.045;
                  recoilOffset.z -= fwdZ * 0.045;
                  shakeTrauma = Math.min(1, shakeTrauma + 0.06);
                } else if (isRifle) {
                  // Tactical Assault Rifle: Fast carbine fire + muzzle brake flash & smoke puff
                  const muzzleX = wrapPlanetCoord(playerUnit.x + fwdX * 1.42 + rightX * 0.12);
                  const muzzleZ = wrapPlanetCoord(playerUnit.z + fwdZ * 1.42 + rightZ * 0.12);
                  const rifleMuzzlePos = new THREE.Vector3(muzzleX, playerTerrainY + 1.46, muzzleZ);
                  spawnDirectionalSparks(muzzleX, playerTerrainY + 1.46, muzzleZ, fwdX, fwdZ, 5, 11, 0.45);
                  lyoExplosionSystem.spawnLyoMuzzleFlash(rifleMuzzlePos, sDir, 0.46, 'rifle');
                  fireProjectile(true, 'LyoAssaultRifle', rifleMuzzlePos, sDir, 52, 9);
                  if (activeMuzzleRaycastResult?.hit) {
                    spawnRaycastSurfaceNormalImpact(activeMuzzleRaycastResult, false);
                  }
                  recoilOffset.x -= fwdX * 0.05;
                  recoilOffset.z -= fwdZ * 0.05;
                  shakeTrauma = Math.min(1, shakeTrauma + 0.06);
                } else {
                  // Tactical Pistol: Two-handed center-chest precision fire + muzzle flash & smoke puff
                  const muzzleX = wrapPlanetCoord(playerUnit.x + fwdX * 1.15 + rightX * 0.07);
                  const muzzleZ = wrapPlanetCoord(playerUnit.z + fwdZ * 1.15 + rightZ * 0.07);
                  const pistolMuzzlePos = new THREE.Vector3(muzzleX, playerTerrainY + 1.54, muzzleZ);
                  spawnDirectionalSparks(muzzleX, playerTerrainY + 1.54, muzzleZ, fwdX, fwdZ, 4, 9, 0.38);
                  lyoExplosionSystem.spawnLyoMuzzleFlash(pistolMuzzlePos, sDir, 0.36, 'pistol');
                  fireProjectile(true, 'LyoPistol', pistolMuzzlePos, sDir, 46, 11);
                  if (activeMuzzleRaycastResult?.hit) {
                    spawnRaycastSurfaceNormalImpact(activeMuzzleRaycastResult, false);
                  }
                  shakeTrauma = Math.min(1, shakeTrauma + 0.04);
                }
                playerUnit.tacticalLoadout = consumeActiveWeaponAmmoOnShot(
                  playerUnit.tacticalLoadout,
                );
                syncUnitFieldsFromLoadout(playerUnit);
              }
            }
          }

          // Update AI-Driven Open-Top Tanks ONLY in 'match' mode!
          if (currentPlayMode === 'match') {
            for (const t of tanks) {
              if (!t.occupiedByPlayer && t.occupiedByAiId !== null && t.hp > 0) {
                const targetX = t.team === 'blue' ? redBase.hqX : blueBase.hqX;
                const targetZ = t.team === 'blue' ? redBase.hqZ + 4 : blueBase.hqZ - 4;
                const steer = computeAStarSteeringDirection(t, targetX, targetZ, dt, true, false);
                if (steer.distToGoal > 4.0) {
                  const prevX = t.x;
                  const prevZ = t.z;
                  const prevYaw = t.hullYaw;
                  t.hullYaw = Math.atan2(-steer.dirZ, steer.dirX);
                  t.vx = steer.dirX * 6.5;
                  t.vz = steer.dirZ * 6.5;
                  t.x = wrapPlanetCoord(t.x + t.vx * dt);
                  t.z = wrapPlanetCoord(t.z + t.vz * dt);
                  resolveMoverWorldCollisions(t, `ai_tank_${t.id}`, true, 1.85, 9.5, timeSec, false);
                  t.root.position.set(t.x, getTerrainElevation(t.x, t.z), t.z);
                  t.bodyGroup.rotation.y = t.hullYaw;
                  recordTankMovementAndTracks(t, prevX, prevZ, prevYaw);
                }
                if (t.recoilTimer > 0) {
                  t.recoilTimer = Math.max(0, t.recoilTimer - dt);
                } else {
                  t.recoilTimer = 1.1;
                  const sDir = new THREE.Vector3(0, 0, -1);
                  const tankGroundY = getTerrainElevation(t.x, t.z);
                  const aiMuzzlePos = new THREE.Vector3(t.x, tankGroundY + 1.35, wrapPlanetCoord(t.z - 2.0));
                  fireProjectile(
                    true,
                    'TankCannon',
                    aiMuzzlePos,
                    sDir,
                    42,
                    16,
                  );
                  lyoExplosionSystem.spawnLyoMuzzleFlash(aiMuzzlePos, sDir, 1.05, 'cannon');
                }
              }
            }
          }

          // ===================================================================
          // C. UPDATE BUDDIES (SMART UTILITY AI FOR BUILT CHARACTERS & 4v4 COMMANDERS)
          // ===================================================================
          for (const b of buddyUnits) {
            if (!b.alive) {
              const ownerIdx = clamp(b.ownerCommanderId, 0, COMMANDERS_PER_TEAM - 1);
              const ownerPlots = b.team === 'blue' ? blueCommanderBases : redCommanderBases;
              const ownerPlot = ownerPlots[ownerIdx];
              const canRespawn =
                currentPlayMode !== 'match' ||
                canBuddyUnitRespawnAtBase(
                  b.isStarterCommanderUnit,
                  ownerPlot?.destroyed ?? false,
                  ownerPlot?.buildingHp ?? 400,
                );
              if (!canRespawn) {
                continue;
              }
              b.respawnTimer -= dt;
              if (b.respawnTimer <= 0) {
                b.alive = true;
                b.hp = b.maxHp;
                b.isFrozen = false;
                b.carryingCrate = 'none';
                b.overheadCrateGroup.visible = false;
                const ownerBase = b.team === 'blue' ? blueBase : redBase;
                const ownerPad = ownerBase.commanderPads[ownerIdx] ?? ownerBase.commanderPads[0];
                b.x = ownerPad.worldX + (Math.random() - 0.5) * 2.6;
                b.z = ownerPad.worldZ + (b.team === 'blue' ? -4.2 : 4.2) + (Math.random() - 0.5) * 1.6;
                b.root.visible = true;
              }
              continue;
            }

            const ridingTank = tanks.find((t) => t.occupiedByAiId === b.id);
            if (ridingTank) {
              b.x = ridingTank.x;
              b.z = ridingTank.z;
              b.root.visible = false;
              continue;
            }

            if (b.saluteTimer > 0) {
              b.saluteTimer = Math.max(0, b.saluteTimer - dt);
              if (b.saluteTimer <= 0) {
                b.saluteSign.sprite.visible = false;
              }
            }

            if (b.isFrozen) {
              b.frozenTimer -= dt;
              if (b.frozenTimer <= 0) {
                b.isFrozen = false;
              }
            }

            if (b.classId === 'Medic' && b.hp < b.maxHp) {
              b.hp = Math.min(b.maxHp, b.hp + dt * 1.5);
            }

            const playerOwnedSquadCount = buddyUnits.filter(
              (u) => u.team === 'blue' && u.ownerCommanderId === 0 && u.alive,
            ).length;
            const shouldRunSmartAi =
              !b.isPlayer &&
              !b.isFrozen &&
              (currentPlayMode === 'match' || (b.team === 'blue' && b.ownerCommanderId === 0 && playerOwnedSquadCount > 1));

            if (shouldRunSmartAi) {
              const spec = BUDDY_CLASSES[b.classId];
              const aiSpeed = 7.1 * spec.speedMultiplier;
              const ownerIdx = clamp(b.ownerCommanderId, 0, COMMANDERS_PER_TEAM - 1);
              const ownerBase = b.team === 'blue' ? blueBase : redBase;
              const ownerPad = ownerBase.commanderPads[ownerIdx] ?? ownerBase.commanderPads[0];
              const ownerSlots = b.team === 'blue' ? bluePadSlotsList[ownerIdx] : redPadSlotsList[ownerIdx];
              const enemyHqX = b.team === 'blue' ? redBase.hqX : blueBase.hqX;
              const enemyHqZ = b.team === 'blue' ? redBase.hqZ : blueBase.hqZ;
              const ownerTurret = getBaseSkyshieldTurrets(ownerBase.baseGroup)[ownerIdx];
              const ownerHasBuiltTurret = Boolean(ownerTurret && ownerTurret.isBuilt && ownerTurret.hp > 0);
              const isAiCmd = !(b.team === 'blue' && ownerIdx === 0);

              const {
                ownerTargetCount,
                nearestWoundedAlly,
                woundedAllyDist,
                nearestEnemy,
                bestCrate,
                nearestFreeCrateDist,
                nearestWeaponPickup,
                freeTank,
                nearestEmptyVehicleDist,
                aiDecision,
              } = evaluateSquadAiUnitPerceptionAndDecision({
                unit: b,
                buddyUnits,
                worldCrates,
                worldPickups,
                tanks,
                mountedTank,
                ridingTramCarIdx,
                ownerSlots,
                ownerHasBuiltTurret,
                buildOrder,
                teamCommand,
                useCustomHologramRecipe,
                activePriorityRecipe,
                onDropWrongCarriedCrate: (dropKind) => {
                  b.carryingCrate = 'none';
                  b.overheadCrateGroup.visible = false;
                  spawnWorldCrate(
                    dropKind,
                    wrapPlanetCoord(b.x + 1.35),
                    wrapPlanetCoord(b.z - 0.85),
                    true,
                  );
                },
              });

              let goalX = b.x;
              let goalZ = b.z;

              if (aiDecision.action === 'DELIVER_TO_OWNER_PAD' && b.carryingCrate !== 'none') {
                goalX = ownerPad.worldX;
                goalZ = ownerPad.worldZ;
                if (getPlanetShortestDistance(b.x, b.z, ownerPad.worldX, ownerPad.worldZ) < 2.6) {
                  if (addCrateToPadSlots(b.team, b.carryingCrate, ownerIdx, false)) {
                    b.carryingCrate = 'none';
                    b.overheadCrateGroup.visible = false;
                    if (b.team === 'blue') score += 25;
                    const updatedCount = (
                      b.team === 'blue' ? bluePadSlotsList[ownerIdx] : redPadSlotsList[ownerIdx]
                    ).filter((s) => s !== 'empty').length;
                    if (isAiCmd && updatedCount >= ownerTargetCount) {
                      craftFromCommanderPad(b.team, ownerIdx);
                    }
                  } else {
                    // Pad is completely full (8/8 slots) -> gently set the crate down beside the pad!
                    const dropKind = b.carryingCrate;
                    b.carryingCrate = 'none';
                    b.overheadCrateGroup.visible = false;
                    spawnWorldCrate(
                      dropKind,
                      wrapPlanetCoord(ownerPad.worldX + 2.8),
                      wrapPlanetCoord(ownerPad.worldZ - 2.2),
                      true,
                    );
                  }
                }
              } else if (aiDecision.action === 'TRIGGER_OWNER_PAD_CRAFT') {
                goalX = ownerPad.worldX;
                goalZ = ownerPad.worldZ;
                if (getPlanetShortestDistance(b.x, b.z, ownerPad.worldX, ownerPad.worldZ) < 3.2) {
                  craftFromCommanderPad(b.team, ownerIdx);
                }
              } else if (aiDecision.action === 'HARVEST_CRATE' && b.carryingCrate === 'none') {
                if (bestCrate) {
                  goalX = bestCrate.x;
                  goalZ = bestCrate.z;
                  if (nearestFreeCrateDist !== null && nearestFreeCrateDist < 1.85) {
                    b.carryingCrate = bestCrate.kind;
                    if (b.overheadCrateGroup.userData.lyoBoxKind !== bestCrate.kind) {
                      populateRealLyoCrateBoxFromGlb(
                        b.overheadCrateGroup,
                        bestCrate.kind,
                        loadedLyoAssets,
                        windUniforms,
                        isSoftwareGl,
                        UNIFIED_WORLD_CRATE_SIZE,
                      );
                    } else {
                      b.overheadCrateBox.material = getCrateFallbackMaterial(bestCrate.kind);
                    }
                    b.overheadCrateGroup.visible = true;
                    scene.remove(bestCrate.mesh);
                    const idx = worldCrates.indexOf(bestCrate);
                    if (idx !== -1) worldCrates.splice(idx, 1);
                  }
                } else {
                  // Stage near the owner's Stacking Pad while waiting for new field crates or pad slots
                  goalX = wrapPlanetCoord(ownerPad.worldX + ((b.id % 3) - 1) * 2.4);
                  goalZ = wrapPlanetCoord(ownerPad.worldZ + (b.team === 'blue' ? -4.2 : 4.2));
                }
              } else if (aiDecision.action === 'EQUIP_GROUND_WEAPON') {
                if (nearestWeaponPickup) {
                  goalX = nearestWeaponPickup.x;
                  goalZ = nearestWeaponPickup.z;
                  for (let pi = worldPickups.length - 1; pi >= 0; pi--) {
                    const pk = worldPickups[pi];
                    if (pk.kind === 'weapon' && getPlanetShortestDistance(pk.x, pk.z, b.x, b.z) < 2.1) {
                      b.tacticalLoadout = equipOrSwapDroppedWeaponInLoadout(
                        b.tacticalLoadout,
                        pk.weaponName,
                        pk.remainingAmmo ?? 120,
                      ).updatedLoadout;
                      syncUnitFieldsFromLoadout(b);
                      scene.remove(pk.mesh);
                      worldPickups.splice(pi, 1);
                      break;
                    }
                  }
                } else {
                  // Unarmed Attacker returning home to its base Stacking Pad weapon stock area to wait for/pick up a weapon!
                  goalX = wrapPlanetCoord(ownerPad.worldX - (b.team === 'blue' ? 2.6 : -2.6));
                  goalZ = wrapPlanetCoord(ownerPad.worldZ - (b.team === 'blue' ? 2.4 : -2.4));
                }
              } else if (aiDecision.action === 'HEAL_WOUNDED_ALLY' && nearestWoundedAlly) {
                goalX = nearestWoundedAlly.x;
                goalZ = nearestWoundedAlly.z;
                if (woundedAllyDist !== null && woundedAllyDist < 3.2) {
                  nearestWoundedAlly.hp = Math.min(
                    nearestWoundedAlly.maxHp,
                    nearestWoundedAlly.hp + dt * 14.0,
                  );
                }
              } else if (aiDecision.action === 'MOUNT_VEHICLE' && freeTank) {
                goalX = freeTank.x;
                goalZ = freeTank.z;
                if (nearestEmptyVehicleDist !== null && nearestEmptyVehicleDist < 2.4) {
                  freeTank.occupiedByAiId = b.id;
                  freeTank.riderGroup.visible = freeTank.vehicleKind !== 'truck';
                  b.root.visible = false;
                }
              }

              let isAutonomousFollowerMode = false;
              if (aiDecision.action === 'FOLLOW_COMMANDER') {
                // If a Follower is carrying a crate and comes near its owner's Stacking Pad (<= 14m) while the pad has space,
                // smartly deliver and stack the crate onto the pad using A* pathfinding!
                const distToOwnerPad = getPlanetShortestDistance(
                  b.x,
                  b.z,
                  ownerPad.worldX,
                  ownerPad.worldZ,
                );
                if (
                  b.carryingCrate !== 'none' &&
                  distToOwnerPad <= 14.0 &&
                  ownerSlots.some((s) => s === 'empty')
                ) {
                  goalX = ownerPad.worldX;
                  goalZ = ownerPad.worldZ;
                  if (distToOwnerPad < 2.6 && addCrateToPadSlots(b.team, b.carryingCrate, ownerIdx, false)) {
                    b.carryingCrate = 'none';
                    b.overheadCrateGroup.visible = false;
                    if (b.team === 'blue') score += 25;
                  }
                } else {
                  isAutonomousFollowerMode = true;
                  const leaderX = mountedTank ? mountedTank.x : playerUnit.x;
                  const leaderZ = mountedTank ? mountedTank.z : playerUnit.z;

                  // Proactive nearby (< 3.0m) item or crate awareness while escorting
                  const nearbyItemsAndCrates: Array<{
                    id: string;
                    kind: 'crate' | 'pickup';
                    x: number;
                    z: number;
                    dist: number;
                  }> = [];
                  if (b.carryingCrate === 'none') {
                    for (let ci = worldCrates.length - 1; ci >= 0; ci--) {
                      const wc = worldCrates[ci];
                      if (wc.state !== 'grounded' || wc.kind === 'medical') continue;
                      if (isCrateInsideOtherOrEnemyBase(wc.x, wc.z, b.team, ownerIdx)) continue;
                      const cd = getPlanetShortestDistance(wc.x, wc.z, b.x, b.z);
                      if (cd < 1.85) {
                        b.carryingCrate = wc.kind;
                        if (b.overheadCrateGroup.userData.lyoBoxKind !== wc.kind) {
                          populateRealLyoCrateBoxFromGlb(
                            b.overheadCrateGroup,
                            wc.kind,
                            loadedLyoAssets,
                            windUniforms,
                            isSoftwareGl,
                            UNIFIED_WORLD_CRATE_SIZE,
                          );
                        } else {
                          b.overheadCrateBox.material = getCrateFallbackMaterial(wc.kind);
                        }
                        b.overheadCrateGroup.visible = true;
                        scene.remove(wc.mesh);
                        worldCrates.splice(ci, 1);
                        break;
                      } else if (cd < 3.0) {
                        nearbyItemsAndCrates.push({
                          id: `crate_${wc.id}`,
                          kind: 'crate',
                          x: wc.x,
                          z: wc.z,
                          dist: cd,
                        });
                      }
                    }
                  }
                  for (const pk of worldPickups) {
                    if (pk.collected) continue;
                    const pd = getPlanetShortestDistance(pk.x, pk.z, b.x, b.z);
                    if (pd < 3.0) {
                      nearbyItemsAndCrates.push({
                        id: `pickup_${pk.id}`,
                        kind: 'pickup',
                        x: pk.x,
                        z: pk.z,
                        dist: pd,
                      });
                    }
                  }

                  const alliedFollowers = buddyUnits
                    .filter((u) => u.alive && u.team === b.team && u.id !== b.id && !u.isPlayer)
                    .map((u) => ({ id: String(u.id), x: u.x, z: u.z }));
                  const nearestEnemyInfo = nearestEnemy
                    ? {
                        x: nearestEnemy.x,
                        z: nearestEnemy.z,
                        dist: getPlanetShortestDistance(nearestEnemy.x, nearestEnemy.z, b.x, b.z),
                      }
                    : null;

                  // Step 1: Evaluate the Follower's desired tactical goal (goalX, goalZ) around the player (zero mirroring)
                  const previewEscort = evaluateAutonomousFollowerEscortStep({
                    followerId: String(b.id),
                    followerX: b.x,
                    followerZ: b.z,
                    followerVx: b.vx,
                    followerVz: b.vz,
                    followerYaw: b.yaw,
                    followerMaxSpeed: aiSpeed,
                    followerCarryingCrate: b.carryingCrate !== 'none',
                    reactionTimerSec: b.followerReactionTimer ?? 0,
                    idleLookTimerSec: b.followerIdleLookTimer ?? 1.5,
                    idleLookYaw: b.followerIdleLookYaw ?? b.yaw,
                    strafeTimerSec: b.followerStrafeTimer ?? 0.8,
                    strafeSign: b.followerStrafeSign ?? 1,
                    playerX: leaderX,
                    playerZ: leaderZ,
                    playerVx: mountedTank ? mountedTank.vx : playerUnit.vx,
                    playerVz: mountedTank ? mountedTank.vz : playerUnit.vz,
                    playerCarryingCrate: playerUnit.carryingCrate !== 'none',
                    alliedFollowers,
                    nearestEnemy: nearestEnemyInfo,
                    nearbyItemsAndCrates,
                    combatRangeMeters: b.weaponId === 'unarmed' ? 2.35 : 15.5,
                    dt,
                  });

                  // Step 2: Run the Follower's own independent A* pathfinder toward (previewEscort.goalX, previewEscort.goalZ)
                  const goalDist = getPlanetShortestDistance(
                    b.x,
                    b.z,
                    previewEscort.goalX,
                    previewEscort.goalZ,
                  );
                  let escortStep = previewEscort;
                  if (goalDist > 0.35) {
                    const followerSteer = computeAStarSteeringDirection(
                      b,
                      previewEscort.goalX,
                      previewEscort.goalZ,
                      dt,
                      false,
                      spec.canFly,
                    );
                    escortStep = evaluateAutonomousFollowerEscortStep({
                      followerId: String(b.id),
                      followerX: b.x,
                      followerZ: b.z,
                      followerVx: b.vx,
                      followerVz: b.vz,
                      followerYaw: b.yaw,
                      followerMaxSpeed: aiSpeed,
                      followerCarryingCrate: b.carryingCrate !== 'none',
                      reactionTimerSec: b.followerReactionTimer ?? 0,
                      idleLookTimerSec: b.followerIdleLookTimer ?? 1.5,
                      idleLookYaw: b.followerIdleLookYaw ?? b.yaw,
                      strafeTimerSec: b.followerStrafeTimer ?? 0.8,
                      strafeSign: b.followerStrafeSign ?? 1,
                      playerX: leaderX,
                      playerZ: leaderZ,
                      playerVx: mountedTank ? mountedTank.vx : playerUnit.vx,
                      playerVz: mountedTank ? mountedTank.vz : playerUnit.vz,
                      playerCarryingCrate: playerUnit.carryingCrate !== 'none',
                      alliedFollowers,
                      nearestEnemy: nearestEnemyInfo,
                      nearbyItemsAndCrates,
                      combatRangeMeters: b.weaponId === 'unarmed' ? 2.35 : 15.5,
                      aStarSteerDirX: followerSteer.dirX,
                      aStarSteerDirZ: followerSteer.dirZ,
                      dt,
                    });
                  }

                  b.vx = escortStep.vx;
                  b.vz = escortStep.vz;
                  b.yaw = escortStep.yaw;
                  b.followerReactionTimer = escortStep.reactionTimerSec;
                  b.followerIdleLookTimer = escortStep.idleLookTimerSec;
                  b.followerIdleLookYaw = escortStep.idleLookYaw;
                  b.followerStrafeTimer = escortStep.strafeTimerSec;
                  b.followerStrafeSign = escortStep.strafeSign;

                  const moveSpd = Math.hypot(b.vx, b.vz);
                  if (moveSpd > 0.05 && b.saluteTimer <= 1.1) {
                    b.x = wrapPlanetCoord(b.x + b.vx * dt);
                    b.z = wrapPlanetCoord(b.z + b.vz * dt);
                    resolveMoverWorldCollisions(b, `ai_buddy_${b.id}`, false, 0.70, 2.0, timeSec, false);
                    b.walkCycle += dt * moveSpd * 1.6;
                  }
                }
              }

              let activeRangedStandoff: ReturnType<typeof evaluateAiRangedCombatStandoffBehavior> | null =
                null;
              if (aiDecision.action === 'DEFEND_OWNER_PAD') {
                const ownerPlot =
                  b.team === 'blue' ? blueCommanderBases[ownerIdx] : redCommanderBases[ownerIdx];
                const defendCoords = getCommanderDefendStationCoords(
                  b.team,
                  ownerPlot,
                  ownerPad.worldX,
                  ownerPad.worldZ,
                );
                goalX = defendCoords.x;
                goalZ = defendCoords.z;
              } else if (
                aiDecision.action !== 'DELIVER_TO_OWNER_PAD' &&
                aiDecision.action !== 'TRIGGER_OWNER_PAD_CRAFT' &&
                aiDecision.action !== 'HARVEST_CRATE' &&
                aiDecision.action !== 'EQUIP_GROUND_WEAPON' &&
                aiDecision.action !== 'HEAL_WOUNDED_ALLY' &&
                aiDecision.action !== 'MOUNT_VEHICLE' &&
                aiDecision.action !== 'FOLLOW_COMMANDER'
              ) {
                // ATTACK_ENEMY: Armed AI holds/strafes/kites at long standoff range and shoots directly from afar!
                if (nearestEnemy) {
                  const enemyDist = getPlanetShortestDistance(
                    b.x,
                    b.z,
                    nearestEnemy.x,
                    nearestEnemy.z,
                  );
                  const strafeSign: 1 | -1 =
                    (b.id % 2 === 0 ? 1 : -1) *
                      (Math.sin(timeSec * 1.45 + b.id * 1.7) >= 0 ? 1 : -1) >
                    0
                      ? 1
                      : -1;
                  activeRangedStandoff = evaluateAiRangedCombatStandoffBehavior({
                    aiX: b.x,
                    aiZ: b.z,
                    enemyX: nearestEnemy.x,
                    enemyZ: nearestEnemy.z,
                    weaponId: b.weaponId,
                    ammo: b.ammo,
                    strafeSign,
                  });
                  goalX = wrapPlanetCoord(activeRangedStandoff.goalX);
                  goalZ = wrapPlanetCoord(activeRangedStandoff.goalZ);
                } else {
                  goalX = enemyHqX;
                  goalZ = enemyHqZ;
                }
              }

              if (!isAutonomousFollowerMode) {
                const steer = computeAStarSteeringDirection(
                  b,
                  goalX,
                  goalZ,
                  dt,
                  false,
                  spec.canFly,
                );
                const moveScale =
                  activeRangedStandoff &&
                  (activeRangedStandoff.movementMode === 'hold_and_strafe' ||
                    activeRangedStandoff.movementMode === 'retreat_kite')
                    ? 0.72
                    : 1.0;
                if (steer.distToGoal > 0.55 && b.saluteTimer <= 1.1) {
                  b.vx = steer.dirX * aiSpeed * moveScale;
                  b.vz = steer.dirZ * aiSpeed * moveScale;
                  b.x = wrapPlanetCoord(b.x + b.vx * dt);
                  b.z = wrapPlanetCoord(b.z + b.vz * dt);
                  resolveMoverWorldCollisions(b, `ai_buddy_${b.id}`, false, 0.70, 2.0, timeSec, false);
                  b.yaw =
                    activeRangedStandoff && activeRangedStandoff.canShootNow
                      ? activeRangedStandoff.aimYaw
                      : Math.atan2(-b.vz, b.vx);
                  b.walkCycle += dt * aiSpeed * moveScale * 1.6;
                } else {
                  b.vx = 0;
                  b.vz = 0;
                  if (activeRangedStandoff && activeRangedStandoff.canShootNow) {
                    b.yaw = activeRangedStandoff.aimYaw;
                  }
                }
              }

              if (b.shootCooldown > 0) b.shootCooldown -= dt;
              if ((b.carryingCrate === 'none' || isAutonomousFollowerMode) && b.shootCooldown <= 0) {
                let targetX: number | null = null;
                let targetZ: number | null = null;
                const maxWeaponFireRange =
                  b.weaponId === 'unarmed'
                    ? 2.35
                    : b.weaponId === 'bazooka' || b.weaponId === 'laser'
                      ? 28.0
                      : b.weaponId === 'rifle' || b.weaponId === 'gatling'
                        ? 25.0
                        : 21.0;
                let minEnemyDist = maxWeaponFireRange;

                for (const other of buddyUnits) {
                  if (
                    other.alive &&
                    other.team !== b.team &&
                    !(other.isPlayer && (mountedTank || ridingTramCarIdx !== null))
                  ) {
                    const ed = getPlanetShortestDistance(other.x, other.z, b.x, b.z);
                    if (ed < minEnemyDist) {
                      minEnemyDist = ed;
                      targetX = other.x;
                      targetZ = other.z;
                    }
                  }
                }

                if (targetX !== null && targetZ !== null) {
                  const sdx = getPlanetShortestDelta(targetX, b.x);
                  const sdz = getPlanetShortestDelta(targetZ, b.z);
                  const desiredAimYaw = Math.atan2(-sdz, sdx);
                  b.yaw = isAutonomousFollowerMode
                    ? stepFollowerSmoothYaw(b.yaw, desiredAimYaw, dt, 10.5)
                    : desiredAimYaw;
                  if (b.weaponId === 'unarmed') {
                    performBuddyMeleeAttack(b, Math.random() < 0.35 ? 'kick' : 'punch');
                  } else {
                    b.shootCooldown =
                      b.weaponId === 'gatling'
                        ? 0.16 + Math.random() * 0.06
                        : b.weaponId === 'rifle'
                          ? 0.36 + Math.random() * 0.12
                          : b.weaponId === 'laser'
                            ? 0.52 + Math.random() * 0.15
                            : b.weaponId === 'bazooka'
                              ? 0.92 + Math.random() * 0.22
                              : 0.48 + Math.random() * 0.16;
                    b.weaponRecoil = 0.36;
                    scratchSpawnDir.set(sdx, 0, sdz).normalize();
                    const bGroundY = getTerrainElevation(b.x, b.z);
                    scratchSpawnOrigin.set(
                      wrapPlanetCoord(b.x + scratchSpawnDir.x * 1.15),
                      bGroundY + 1.25,
                      wrapPlanetCoord(b.z + scratchSpawnDir.z * 1.15),
                    );
                    lyoExplosionSystem.spawnLyoMuzzleFlash(
                      scratchSpawnOrigin,
                      scratchSpawnDir,
                      b.weaponId === 'bazooka' ? 0.65 : 0.42,
                      b.weaponId === 'bazooka' ? 'bazooka' : 'rifle',
                    );
                    fireProjectile(
                      b.team === 'blue',
                      b.weaponName,
                      scratchSpawnOrigin,
                      scratchSpawnDir,
                      b.weaponId === 'laser' ? 68 : b.weaponId === 'gatling' ? 58 : b.weaponId === 'rifle' ? 48 : 42,
                      b.weaponId === 'bazooka' ? 14 : b.weaponId === 'laser' ? 12 : 7,
                    );
                    b.tacticalLoadout = consumeActiveWeaponAmmoOnShot(b.tacticalLoadout);
                    syncUnitFieldsFromLoadout(b);
                  }
                }
              }
            } else if (!b.isPlayer) {
              // In Sandbox mode when solo, any non-player Buddy stands guard peacefully
              b.vx = 0;
              b.vz = 0;
            }

            // Step vertical jump/knockback physics for non-player Buddy units (e.g. when launched by a kick)
            if (!b.isPlayer && (!b.isGrounded || b.jumpOffset > 0 || b.vy > 0)) {
              const aiJump = stepBuddyJumpPhysics(
                b.jumpOffset,
                b.vy,
                b.isGrounded,
                false,
                BUDDY_CLASSES[b.classId].jumpMultiplier,
                b.carryingCrate !== 'none',
                dt,
              );
              b.jumpOffset = aiJump.jumpOffset;
              b.vy = aiJump.vy;
              b.isGrounded = aiJump.isGrounded;
            }
            if (!b.isPlayer && !shouldRunSmartAi) {
              // Dampen any knockback velocity on idle sandbox NPCs
              b.vx *= Math.exp(-10 * dt);
              b.vz *= Math.exp(-10 * dt);
              if (Math.hypot(b.vx, b.vz) > 0.05) {
                b.x = wrapPlanetCoord(b.x + b.vx * dt);
                b.z = wrapPlanetCoord(b.z + b.vz * dt);
                resolveMoverWorldCollisions(b, `ai_buddy_${b.id}`, false, 0.70, 2.0, timeSec, false);
              }
            }

            if (b.punchTimer > 0) {
              b.punchTimer = Math.max(0, b.punchTimer - dt);
            }
            if (b.kickTimer > 0) {
              b.kickTimer = Math.max(0, b.kickTimer - dt);
            }

            // Animate Roblox Buddy Limbs, Jump Arc, Front Kick, Directional Hit-Reaction Hop/Tilt & Stun Effect (+Z local front faces movement direction yaw)
            if ((b.hitReactionTimer ?? 0) > 0) {
              b.hitReactionTimer = Math.max(0, (b.hitReactionTimer ?? 0) - dt);
            }
            if ((b.stunTimer ?? 0) > 0) {
              b.stunTimer = Math.max(0, (b.stunTimer ?? 0) - dt);
            }
            const hitPose = evaluateLyoHitReactionPose(
              b.hitReactionTimer ?? 0,
              0.60,
              b.hitReactionDirX ?? 0,
              b.hitReactionDirZ ?? 1,
              b.isPlayer,
            );
            const stunState = evaluateLyoStunEffectState(b.stunTimer ?? 0, 1.5);
            if (b.stunMesh) {
              b.stunMesh.visible = stunState.active;
              if (stunState.active) {
                b.stunMesh.rotation.z = stunState.rotationZ;
                b.stunMesh.scale.setScalar(stunState.scale);
              }
            }

            const floatY = BUDDY_CLASSES[b.classId].canFly ? 0.65 + Math.sin(timeSec * 4 + b.id) * 0.18 : 0;
            const terrainY = getTerrainElevation(b.x, b.z);
            b.y = terrainY + floatY + b.jumpOffset + hitPose.hopY;
            b.root.position.set(b.x, terrainY, b.z);
            b.bodyGroup.position.y = floatY + b.jumpOffset + hitPose.hopY;
            b.bodyGroup.rotation.set(hitPose.rotX, b.yaw + Math.PI / 2, hitPose.rotZ);

            const speedMag = Math.hypot(b.vx, b.vz);
            const isMoving = speedMag > 0.4;
            if (isMoving && b.jumpOffset < 0.25 && Math.random() < 0.35) {
              lyoGrassSystem.stampFootstep(b.x, b.z, 0.78);
            }
            const legSwing = isMoving ? Math.sin(b.walkCycle) * 0.68 : 0;

            if (b.kickTimer > 0) {
              // Team Buddies Front Boot Kick: right leg snaps high forward (-X Euler lifts leg toward +Z front!)
              const kickPhase = Math.sin(Math.min(1, b.kickTimer / 0.34) * Math.PI);
              b.rightLegPivot.rotation.x = -1.48 * kickPhase;
              b.leftLegPivot.rotation.x = 0.26 * kickPhase;
            } else if (b.jumpOffset > 0.08) {
              // Mid-Air Jump Stride Pose
              b.leftLegPivot.rotation.x = -0.58;
              b.rightLegPivot.rotation.x = 0.44;
            } else {
              b.leftLegPivot.rotation.x = legSwing;
              b.rightLegPivot.rotation.x = -legSwing;
            }

            if (b.weaponRecoil > 0) {
              b.weaponRecoil = Math.max(0, b.weaponRecoil - dt * (b.weaponId === 'bazooka' ? 3.2 : 6.5));
            }

            b.overheadCrateGroup.visible = b.carryingCrate !== 'none';
            updateCharacterWeaponStance(
              b.rig,
              b.weaponId,
              b.walkCycle,
              isMoving,
              b.carryingCrate !== 'none',
              b.saluteTimer,
              b.weaponRecoil,
              b.punchTimer,
              b.punchHand,
              b.kickTimer,
              b.jumpOffset,
            );

            if (b.hitFlashTimer > 0) {
              b.hitFlashTimer = Math.max(0, b.hitFlashTimer - dt);
              b.headMesh.material = flashWhiteMat;
            } else if (b.isFrozen) {
              b.headMesh.material = frozenIceMat;
            } else {
              b.headMesh.material = (b.headMesh.userData.defaultMat as THREE.Material) || matSkin;
            }

            // Player Invincibility Frames (0.5s to 1.0s) & 10 Hz Sprite Blink
            if ((b.invincibilityTimer ?? 0) > 0) {
              const iFrameState = stepPlayerInvincibilityState(b.invincibilityTimer ?? 0, dt);
              b.invincibilityTimer = iFrameState.invincibilityTimer;
              b.bodyGroup.visible = b.isPlayer ? iFrameState.spriteVisible : true;
            } else if (!b.bodyGroup.visible) {
              b.bodyGroup.visible = true;
            }
          }

          // Red Team Stacking Pad Auto-Crafter ONLY in 'match' mode
          if (currentPlayMode === 'match') {
            const redEval = evaluateStackingPadRecipe(redPadSlots);
            if (redEval.totalCrates >= 2) {
              redCraftTimer += dt;
              if (redCraftTimer >= 3.0) {
                redCraftTimer = 0;
                const activeRed = buddyUnits.filter((u) => u.team === 'red' && u.alive).length;
                if (activeRed < 5) {
                  buddyUnits.push(
                    createBuddyCharacterUnit(
                      'red',
                      false,
                      redEval.isSuper ? 'Cyborg' : 'Commando',
                      redBase.padX - 2.5,
                      redBase.padZ + 2.0,
                      0,
                      false,
                      false,
                    ),
                  );
                }
                redPadSlots = ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'];
                syncPadVisuals(redBase, redPadSlots, 'RED', redBaseHp);
              }
            }
          }

          // ===================================================================
          // D. UPDATE PROJECTILES, TREE & PROP DESTRUCTION, BASE HQ DAMAGE & PICKUPS
          // ===================================================================
          const detonateExplosiveShellIfHeavy = (p: Projectile, hitX: number, hitY: number, hitZ: number) => {
            if (p.weaponType === 'LyoLaserGun') {
              // LG-88 Photon Lance Target Fire Particle Ignition on every hit!
              spawnTargetFireParticles(hitX, hitY, hitZ, 16, 0.65);
            } else if (p.weaponType === 'Titan6Gatling') {
              // TITAN-6 Rotary Gatling dense metallic spark shower on hit!
              spawnDirectionalSparks(hitX, hitY + 0.2, hitZ, -p.vel.x, -p.vel.z, 9, 14, 1.15);
            }
            const isHeavyExplosive =
              p.weaponType === 'TankCannon' ||
              p.weaponType === 'Skyshield35mm' ||
              p.weaponType === 'NuclearMissile' ||
              p.weaponType === 'ClusterBomb' ||
              p.weaponType === 'HandGrenade' ||
              p.weaponType === 'LandMine' ||
              p.weaponType === 'Bazooka' ||
              p.weaponType === 'Supazooka' ||
              p.weaponType.includes('Rocket');
            if (!isHeavyExplosive) return;

            const blastScale =
              p.weaponType === 'NuclearMissile'
                ? 2.45
                : p.weaponType === 'ClusterBomb'
                ? 1.55
                : p.weaponType === 'Bazooka' || p.weaponType === 'Supazooka'
                ? 1.18
                : p.weaponType === 'Skyshield35mm'
                ? 0.72
                : 1.05;
            playSpatialSoundAt(hitX, hitZ, p.weaponType === 'Skyshield35mm' ? 28.0 : 42.0, 6.0, () => {
              if (p.weaponType === 'Skyshield35mm') {
                soundEngine.playSkyshieldFlakAirburst();
              } else if (p.weaponType === 'NuclearMissile' || p.weaponType === 'ClusterBomb') {
                soundEngine.playBarrelExplosion();
                soundEngine.playTacticalExplosion(blastScale);
              } else {
                soundEngine.playTacticalExplosion(blastScale);
              }
            });
            scratchExplosionPos.set(hitX, hitY, hitZ);
            lyoExplosionSystem.spawnLyoExplosion(
              scratchExplosionPos,
              blastScale,
              p.weaponType === 'NuclearMissile' ? 'hq' : 'cannon',
            );
            if (p.weaponType === 'NuclearMissile' || p.weaponType === 'ClusterBomb' || p.weaponType === 'HandGrenade') {
              spawnTargetFireParticles(hitX, hitY, hitZ, 22, 1.45);
            }
            const explDist = getPlanetShortestDistance(
              hitX,
              hitZ,
              getPlayerAudioListenerPos().x,
              getPlayerAudioListenerPos().z,
            );
            if (explDist < 36.0) {
              const baseShake =
                p.weaponType === 'NuclearMissile'
                  ? 0.65
                  : p.weaponType === 'ClusterBomb'
                  ? 0.45
                  : p.weaponType === 'Skyshield35mm'
                  ? 0.16
                  : 0.36;
              shakeTrauma = Math.min(1, shakeTrauma + baseShake * Math.max(0, 1 - explDist / 36.0));
            }

            // Radial blast knockback on nearby pushable/breakable props & crates
            for (const other of activeMapProps) {
              if (!other.alive) continue;
              const d = getPlanetShortestDistance(other.x, other.z, hitX, hitZ);
              if (d > 0.05 && d < 4.4) {
                const dx = getPlanetShortestDelta(other.x, hitX) / d;
                const dz = getPlanetShortestDelta(other.z, hitZ) / d;
                const push = (1 - d / 4.4) * 9.5;
                if (other.category === 'pushable') {
                  other.vx += dx * push;
                  other.vz += dz * push;
                  other.rotVelY += (Math.random() - 0.5) * 7.5;
                } else if (other.category === 'breakable' && d < 3.0 && other.kind === 'explosive_barrel') {
                  other.alive = false;
                  other.wrapper.visible = false;
                  triggerBarrelExplosion(other.x, other.z);
                } else if (other.category === 'solid' && other.destructible && d < 3.4) {
                  other.hp -= Math.round((1 - d / 3.4) * 28);
                  if (other.canJiggleOnHit) {
                    other.jiggleTimer = 0.35;
                  }
                  if (other.hp <= 0) {
                    other.alive = false;
                    other.wrapper.visible = false;
                    score += 50;
                    spawnDebrisChunks(other.x, 0.75, other.z, 'concrete', 12, dx * 3.0, dz * 3.0);
                    spawnBurstParticles(other.x, 0.9, other.z, 10);
                  }
                }
              }
            }

            // Splash Damage Vulnerability (`Rentan Hancur`): Heavy shells (Bazooka, Tank, Skyshield) damage & destroy grounded crates and dropped weapons/pickups!
            const splashRadius = p.weaponType === 'Skyshield35mm' ? 3.2 : 4.6;
            const splashMaxDamage = p.weaponType === 'Skyshield35mm' ? 14 : 26;
            for (let ci = worldCrates.length - 1; ci >= 0; ci--) {
              const c = worldCrates[ci];
              if (c.state !== 'grounded') continue;
              const splash = evaluateSplashDamageOnDroppedItem(
                c.x,
                c.z,
                hitX,
                hitZ,
                splashRadius,
                splashMaxDamage,
                c.hp,
              );
              if (splash.hit) {
                if (canDamageWorldCrate(c)) {
                  c.hp = splash.nextHp;
                }
                c.vx += splash.knockbackVx * 0.75;
                c.vz += splash.knockbackVz * 0.75;
                c.vy = Math.max(c.vy, 3.2);
                c.rotVelY += (Math.random() - 0.5) * 6.5;
                if (canDamageWorldCrate(c) && splash.destroyed) {
                  scratchExplosionPos.set(c.x, getTerrainElevation(c.x, c.z) + 0.55, c.z);
                  lyoExplosionSystem.spawnLyoExplosion(scratchExplosionPos, 0.72, 'crate');
                  spawnDebrisChunks(c.x, 0.55, c.z, c.kind === 'super' ? 'metal' : 'wood', 9);
                  const crateDrop = evaluateCrateDestructionDrop(c.kind);
                  if (crateDrop.dropKind === 'health' || crateDrop.isPurpleSuperWeapon) {
                    spawnWorldPickup(crateDrop.dropKind, crateDrop.label, c.x, c.z, {
                      weaponId: crateDrop.weaponId,
                      remainingAmmo: crateDrop.remainingAmmo,
                      vy: 6.4,
                    });
                  }
                  rewardPlayerOnCrateDestroyed(c.x, c.z);
                  scene.remove(c.mesh);
                  worldCrates.splice(ci, 1);
                }
              }
            }

            for (let pi = worldPickups.length - 1; pi >= 0; pi--) {
              const pk = worldPickups[pi];
              const splash = evaluateSplashDamageOnDroppedItem(
                pk.x,
                pk.z,
                hitX,
                hitZ,
                splashRadius,
                splashMaxDamage,
                pk.hp,
              );
              if (splash.hit) {
                pk.hp = splash.nextHp;
                pk.vx += splash.knockbackVx * 0.85;
                pk.vz += splash.knockbackVz * 0.85;
                pk.vy = Math.max(pk.vy, 3.6);
                if (splash.destroyed) {
                  scratchExplosionPos.set(pk.x, pk.y, pk.z);
                  lyoExplosionSystem.spawnLyoExplosion(scratchExplosionPos, 0.58, 'crate');
                  spawnDebrisChunks(pk.x, pk.y, pk.z, 'metal', 7);
                  spawnBurstParticles(pk.x, pk.y + 0.25, pk.z, 8);
                  scene.remove(pk.mesh);
                  worldPickups.splice(pi, 1);
                }
              }
            }
          };

          const staticWorldObbs = getStaticWorldStructures();
          for (const p of projectiles) {
            if (!p.active) continue;
            p.life -= dt;
            if (p.life <= 0) {
              // Heavy cannon shells or rockets detonate on the ground at max range!
              const floorY = getTerrainElevation(p.pos.x, p.pos.z) + 0.35;
              detonateExplosiveShellIfHeavy(p, p.pos.x, floorY, p.pos.z);
              projectilePool.release(p);
              continue;
            }
            const prevProjX = p.pos.x;
            const prevProjZ = p.pos.z;
            const midProjX = wrapPlanetCoord(prevProjX + p.vel.x * dt * 0.5);
            const midProjZ = wrapPlanetCoord(prevProjZ + p.vel.z * dt * 0.5);
            p.pos.addScaledVector(p.vel, dt);
            p.pos.x = wrapPlanetCoord(p.pos.x);
            p.pos.z = wrapPlanetCoord(p.pos.z);
            p.mesh.position.copy(p.pos);

            const spawnSolidObstacleImpactExplosion = (
              hitX: number,
              hitY: number,
              hitZ: number,
              dirX: number,
              dirZ: number,
            ) => {
              detonateExplosiveShellIfHeavy(p, hitX, hitY, hitZ);
              scratchExplosionPos.set(hitX, hitY, hitZ);
              scratchHitBurstDir.set(-dirX, 0.25, -dirZ).normalize();
              lyoExplosionSystem.spawnLyoBulletHitBurst(scratchExplosionPos, scratchHitBurstDir, false);
              const isHeavyExplosive =
                p.weaponType === 'TankCannon' ||
                p.weaponType === 'Skyshield35mm' ||
                p.weaponType === 'NuclearMissile' ||
                p.weaponType === 'Bazooka' ||
                p.weaponType === 'Supazooka' ||
                p.weaponType.includes('Rocket');
              if (!isHeavyExplosive) {
                lyoExplosionSystem.spawnLyoExplosion(scratchExplosionPos, 0.44, 'fodder');
              }
            };

            // Ground impact check (e.g. when LyoPlane strafes downward or shell hits sloped terrain)
            const groundElevAtProj = getTerrainElevation(p.pos.x, p.pos.z);
            if (p.pos.y <= groundElevAtProj + 0.15) {
              detonateExplosiveShellIfHeavy(p, p.pos.x, groundElevAtProj + 0.3, p.pos.z);
              spawnBurstParticles(p.pos.x, groundElevAtProj + 0.25, p.pos.z, 5);
              projectilePool.release(p);
              continue;
            }

            // 1. Check hit against Indestructible Lyo Trees (Tree Jiggle + Wood Impact SFX + Impact Burst, trees cannot be destroyed!)
            let hitResolved = false;
            for (const tr of trees) {
              if (!tr.alive) continue;
              if (Math.abs(p.pos.x - tr.x) > 4.5 || Math.abs(p.pos.z - tr.z) > 4.5) continue;
              const trGroundY = getTerrainElevation(tr.x, tr.z);
              if (p.pos.y > trGroundY + 9.2 * tr.scale) continue;
              const trHitRadius = (p.pos.y > trGroundY + 2.6 ? 1.75 : 1.18) * tr.scale;
              if (
                getPlanetShortestDistance(p.pos.x, p.pos.z, tr.x, tr.z) < trHitRadius ||
                getPlanetShortestDistance(midProjX, midProjZ, tr.x, tr.z) < trHitRadius
              ) {
                tr.hitFlashTimer = 0.12;
                tr.jiggleTimer = 0.48;
                tr.jiggleIntensity = 0.16;
                const spdLen = Math.max(0.01, Math.hypot(p.vel.x, p.vel.z));
                const dirX = p.vel.x / spdLen;
                const dirZ = p.vel.z / spdLen;
                tr.jiggleDirX = dirX;
                tr.jiggleDirZ = dirZ;
                playSpatialSoundAt(p.pos.x, p.pos.z, 24.0, 5.0, () => {
                  soundEngine.playHeavyThud(10.0, true);
                });
                spawnSolidObstacleImpactExplosion(p.pos.x, p.pos.y, p.pos.z, dirX, dirZ);
                spawnBurstParticles(p.pos.x, p.pos.y, p.pos.z, 6);
                hitResolved = true;
                break;
              }
            }
            if (hitResolved) {
              projectilePool.release(p);
              continue;
            }

            // 1A. Check hit against Static 3D OBB World Structures (Base HQ, Hangar, Barracks, Watchtower, Guardhouse, Bunker, Bastions, Kiosks, Planters, Shipping Containers, Excavators & Retaining Walls)
            for (const st of staticWorldObbs) {
              const stReach = st.halfX + st.halfZ + 2.5;
              if (Math.abs(p.pos.x - st.x) > stReach || Math.abs(p.pos.z - st.z) > stReach) continue;
              const stTopY = st.isRetainingWall
                ? st.heightY
                : getTerrainElevation(st.x, st.z) + st.heightY;
              if (p.pos.y > stTopY) continue;
              if (
                pointInObb2D(p.pos.x, p.pos.z, st.x, st.z, st.halfX, st.halfZ, st.rotY, 0.25) ||
                pointInObb2D(midProjX, midProjZ, st.x, st.z, st.halfX, st.halfZ, st.rotY, 0.25)
              ) {
                const spdLen = Math.max(0.01, Math.hypot(p.vel.x, p.vel.z));
                const dirX = p.vel.x / spdLen;
                const dirZ = p.vel.z / spdLen;
                spawnSolidObstacleImpactExplosion(p.pos.x, p.pos.y, p.pos.z, dirX, dirZ);
                playSpatialSoundAt(p.pos.x, p.pos.z, 24.0, 5.0, () => {
                  soundEngine.playMaterialImpact(st.mat, 10.0);
                });
                spawnCollisionContactParticles(p.pos.x, p.pos.y, p.pos.z, -dirX, -dirZ, st.mat, 10.0);
                spawnBurstParticles(p.pos.x, p.pos.y, p.pos.z, 6);

                const bastionMatch = /^bastion_(r|b)_([0-3])$/.exec(st.id);
                if (bastionMatch) {
                  const isRedBastion = bastionMatch[1] === 'r';
                  const bIdx = Number(bastionMatch[2]);
                  const canDamageSkyshield =
                    (isRedBastion && p.isPlayerTeam) || (!isRedBastion && !p.isPlayerTeam);
                  if (canDamageSkyshield) {
                    const targetSkyshields = getBaseSkyshieldTurrets(
                      isRedBastion ? redBase.baseGroup : blueBase.baseGroup,
                    );
                    const stTurret = targetSkyshields[bIdx];
                    const plotState = (isRedBastion ? redCommanderBases : blueCommanderBases)[bIdx];
                    if (stTurret && stTurret.isBuilt && stTurret.hp > 0) {
                      stTurret.hp = Math.max(0, stTurret.hp - p.damage * 4);
                      if (stTurret.hp <= 0) {
                        stTurret.isBuilt = false;
                        stTurret.root.visible = false;
                        if (plotState) {
                          plotState.hasSkyshield = false;
                        }
                        if (isRedBastion) {
                          score += 350;
                        }
                        scratchExplosionPos.set(
                          st.x,
                          getTerrainElevation(st.x, st.z) + 3.4,
                          st.z,
                        );
                        lyoExplosionSystem.triggerMultiStageExplosion(
                          scratchExplosionPos,
                          2.2,
                          3,
                          'vehicle',
                          (stagePos, stageScale) => {
                            playSpatialSoundAt(stagePos.x, stagePos.z, 32.0, 5.5, () => {
                              soundEngine.playBarrelExplosion();
                            });
                            shakeTrauma = Math.min(1, shakeTrauma + 0.28 * stageScale);
                          },
                        );
                      }
                    }
                  }
                } else if (
                  (st.id === 'red_hq' || st.id.startsWith('red_plot_')) &&
                  p.isPlayerTeam &&
                  currentPlayMode === 'match'
                ) {
                  const plotMatch = /^red_plot_([0-3])_(building|fence|gate)/.exec(st.id);
                  if (plotMatch) {
                    const pIdx = Number(plotMatch[1]);
                    const rPlot = redCommanderBases[pIdx];
                    if (rPlot && !rPlot.destroyed) {
                      if (plotMatch[2] === 'fence' || plotMatch[2] === 'gate') {
                        rPlot.fenceHp = Math.max(0, rPlot.fenceHp - p.damage * 6);
                        if (rPlot.fenceHp <= 0) navGridDirty = true;
                      } else {
                        rPlot.buildingHp = Math.max(0, rPlot.buildingHp - p.damage * 6);
                        if (rPlot.buildingHp <= 0) {
                          rPlot.destroyed = true;
                          navGridDirty = true;
                        }
                      }
                    }
                  }
                  const prevRedHp = redBaseHp;
                  redBaseHp = Math.max(0, redBaseHp - p.damage * 8);
                  score += 25;
                  syncPadVisuals(redBase, redPadSlots, 'RED', redBaseHp);
                  if (redBaseHp <= 0 && prevRedHp > 0) {
                    scratchExplosionPos.set(st.x, getTerrainElevation(st.x, st.z) + 1.4, st.z);
                    lyoExplosionSystem.triggerMultiStageExplosion(
                      scratchExplosionPos,
                      3.8,
                      5,
                      'hq',
                      (_pos, stageScale) => {
                        soundEngine.playBarrelExplosion();
                        shakeTrauma = Math.min(1, shakeTrauma + 0.42 * stageScale);
                      },
                    );
                  }
                  checkMatchDeathmatchWinCondition();
                } else if (
                  (st.id === 'blue_hq' || st.id.startsWith('blue_plot_')) &&
                  !p.isPlayerTeam &&
                  currentPlayMode === 'match'
                ) {
                  const plotMatch = /^blue_plot_([0-3])_(building|fence|gate)/.exec(st.id);
                  if (plotMatch) {
                    const pIdx = Number(plotMatch[1]);
                    const bPlot = blueCommanderBases[pIdx];
                    if (bPlot && !bPlot.destroyed) {
                      if (plotMatch[2] === 'fence' || plotMatch[2] === 'gate') {
                        bPlot.fenceHp = Math.max(0, bPlot.fenceHp - p.damage * 4);
                        if (bPlot.fenceHp <= 0) navGridDirty = true;
                      } else {
                        bPlot.buildingHp = Math.max(0, bPlot.buildingHp - p.damage * 4);
                        if (bPlot.buildingHp <= 0) {
                          bPlot.destroyed = true;
                          navGridDirty = true;
                        }
                      }
                    }
                  }
                  const prevBlueHp = blueBaseHp;
                  blueBaseHp = Math.max(0, blueBaseHp - p.damage * 4);
                  syncPadVisuals(blueBase, bluePadSlots, 'BLUE', blueBaseHp);
                  if (blueBaseHp <= 0 && prevBlueHp > 0) {
                    scratchExplosionPos.set(st.x, getTerrainElevation(st.x, st.z) + 1.4, st.z);
                    lyoExplosionSystem.triggerMultiStageExplosion(
                      scratchExplosionPos,
                      3.8,
                      5,
                      'hq',
                      (_pos, stageScale) => {
                        soundEngine.playBarrelExplosion();
                        shakeTrauma = Math.min(1, shakeTrauma + 0.42 * stageScale);
                      },
                    );
                  }
                  checkMatchDeathmatchWinCondition();
                }
                hitResolved = true;
                break;
              }
            }
            if (hitResolved) {
              projectilePool.release(p);
              continue;
            }

            // 1B. Check hit against Map Props (Breakable Barrels/Barricades/Fences, Pushable Props, and Solid Metal/Concrete Colliders like Wind Turbine, River Rock, Crane, Chimney, Pipes)
            for (const mp of activeMapProps) {
              if (!mp.alive) continue;
              const mpReach = Math.max(mp.radius, (mp.halfX ?? 0) + (mp.halfZ ?? 0)) + 2.5;
              if (Math.abs(p.pos.x - mp.x) > mpReach || Math.abs(p.pos.z - mp.z) > mpReach) continue;
              if (p.pos.y > getTerrainElevation(mp.x, mp.z) + mp.heightY) continue;
              const hitRadius = Math.max(0.72, mp.radius * 0.98);
              const hitProp =
                mp.halfX !== undefined && mp.halfZ !== undefined
                  ? pointInObb2D(p.pos.x, p.pos.z, mp.x, mp.z, mp.halfX, mp.halfZ, mp.rotY, 0.25) ||
                    pointInObb2D(midProjX, midProjZ, mp.x, mp.z, mp.halfX, mp.halfZ, mp.rotY, 0.25)
                  : getPlanetShortestDistance(p.pos.x, p.pos.z, mp.x, mp.z) < hitRadius ||
                    getPlanetShortestDistance(midProjX, midProjZ, mp.x, mp.z) < hitRadius;
              if (hitProp) {
                const spdLen = Math.max(0.01, Math.hypot(p.vel.x, p.vel.z));
                const dirX = p.vel.x / spdLen;
                const dirZ = p.vel.z / spdLen;
                spawnSolidObstacleImpactExplosion(p.pos.x, p.pos.y, p.pos.z, dirX, dirZ);

                if (mp.category === 'breakable' || (mp.category === 'solid' && mp.destructible)) {
                  mp.hp -= p.damage;
                  if (mp.canJiggleOnHit) {
                    mp.jiggleTimer = 0.35;
                  }
                  if (mp.category !== 'solid') {
                    const shotImpulse = mp.shootImpulse > 0 ? mp.shootImpulse * 0.72 : 3.8;
                    mp.vx += dirX * shotImpulse;
                    mp.vz += dirZ * shotImpulse;
                  }
                  if (shouldShatterBreakableProp(mp.kind, 0, false, mp.hp)) {
                    mp.alive = false;
                    mp.wrapper.visible = false;
                    if (mp.category === 'solid') navGridDirty = true;
                    score += 50;
                    if (mp.kind === 'explosive_barrel') {
                      triggerBarrelExplosion(mp.x, mp.z);
                    } else if (mp.materialTag === 'wood') {
                      playSpatialSoundAt(mp.x, mp.z, 22.0, 4.5, () => {
                        soundEngine.playWoodBreak(12.0);
                      });
                      spawnDebrisChunks(mp.x, 0.55, mp.z, 'wood', 12, dirX * 3.0, dirZ * 3.0);
                      spawnBurstParticles(mp.x, 0.9, mp.z, 10);
                    } else {
                      playSpatialSoundAt(mp.x, mp.z, 22.0, 4.5, () => {
                        soundEngine.playHeavyThud(12.5, false);
                      });
                      spawnDebrisChunks(mp.x, 0.55, mp.z, 'concrete', 12, dirX * 3.0, dirZ * 3.0);
                      spawnBurstParticles(mp.x, 0.9, mp.z, 10);
                    }
                  } else {
                    playSpatialSoundAt(p.pos.x, p.pos.z, 22.0, 4.5, () => {
                      soundEngine.playMaterialImpact(mp.materialTag, 9.5);
                    });
                    spawnCollisionContactParticles(p.pos.x, 0.85, p.pos.z, -dirX, -dirZ, mp.materialTag, 9.5);
                  }
                } else if (mp.category === 'pushable') {
                  const shotPush =
                    (mp.shootImpulse > 0 ? mp.shootImpulse * 1.15 : 6.2) / Math.max(0.5, mp.mass);
                  mp.vx += dirX * shotPush;
                  mp.vz += dirZ * shotPush;
                  mp.rotVelY += (Math.random() - 0.5) * 8.0;
                  if (mp.canJiggleOnHit) {
                    mp.jiggleTimer = 0.32;
                  }
                  playSpatialSoundAt(p.pos.x, p.pos.z, 22.0, 4.5, () => {
                    soundEngine.playMaterialImpact(mp.materialTag, 8.5);
                  });
                  spawnCollisionContactParticles(p.pos.x, 0.85, p.pos.z, -dirX, -dirZ, mp.materialTag, 8.5);
                } else {
                  // Solid metal / concrete collider (e.g. Wind Turbine, River Rock, Crane, Chimney, Giant Tank, Containers, Pipes):
                  // ricochet sparks + explosion burst + material impact SFX — large structures NEVER shake/jiggle when shot!
                  if (mp.canJiggleOnHit) {
                    mp.jiggleTimer = 0.22;
                  }
                  playSpatialSoundAt(p.pos.x, p.pos.z, 22.0, 4.5, () => {
                    soundEngine.playMaterialImpact(mp.materialTag, 9.0);
                  });
                  spawnCollisionContactParticles(p.pos.x, 0.95, p.pos.z, -dirX, -dirZ, mp.materialTag, 9.0);
                  spawnBurstParticles(p.pos.x, p.pos.y, p.pos.z, 5);
                }
                hitResolved = true;
                break;
              }
            }
            if (hitResolved) {
              projectilePool.release(p);
              continue;
            }

            // 1C. Check hit against Grounded Crates (Shooting a wooden crate knocks it back and shatters it with Lyo Explosion VFX + 3D wood planks!)
            for (let ci = worldCrates.length - 1; ci >= 0; ci--) {
              const c = worldCrates[ci];
              if (c.state !== 'grounded') continue;
              if (p.pos.y > c.y + 1.8) continue;
              if (getPlanetShortestDistance(p.pos.x, p.pos.z, c.x, c.z) < 0.95) {
                const spdLen = Math.max(0.01, Math.hypot(p.vel.x, p.vel.z));
                const dirX = p.vel.x / spdLen;
                const dirZ = p.vel.z / spdLen;
                if (canDamageWorldCrate(c)) {
                  c.hp -= p.damage;
                }
                c.vx += dirX * 4.5;
                c.vz += dirZ * 4.5;
                c.rotVelY += (Math.random() - 0.5) * 3.5;
                c.squashTimer = 0;
                c.mesh.scale.set(1, 1, 1);
                detonateExplosiveShellIfHeavy(p, c.x, c.y, c.z);
                if (canDamageWorldCrate(c) && c.hp <= 0) {
                  playSpatialSoundAt(c.x, c.z, 22.0, 4.5, () => {
                    soundEngine.playWoodBreak(11.5);
                    soundEngine.playBarrelExplosion();
                  });
                  scratchExplosionPos.set(c.x, getTerrainElevation(c.x, c.z) + 0.55, c.z);
                  lyoExplosionSystem.spawnLyoExplosion(
                    scratchExplosionPos,
                    0.75,
                    'crate',
                  );
                  spawnDebrisChunks(c.x, 0.55, c.z, c.kind === 'super' ? 'metal' : 'wood', 11, dirX * 3.0, dirZ * 3.0);
                  spawnBurstParticles(c.x, 0.8, c.z, 10);
                  const crateDrop = evaluateCrateDestructionDrop(c.kind);
                  spawnWorldPickup(crateDrop.dropKind, crateDrop.label, c.x, c.z, {
                    weaponId: crateDrop.weaponId,
                    remainingAmmo: crateDrop.remainingAmmo,
                    vy: crateDrop.isPurpleSuperWeapon ? 6.8 : 5.4,
                  });
                  rewardPlayerOnCrateDestroyed(c.x, c.z);
                  scene.remove(c.mesh);
                  worldCrates.splice(ci, 1);
                } else {
                  playSpatialSoundAt(c.x, c.z, 18.0, 4.0, () => {
                    if (c.kind === 'super' || !canDamageWorldCrate(c)) {
                      soundEngine.playMetalImpact(9.0);
                    } else {
                      soundEngine.playWoodHit(9.0);
                    }
                  });
                }
                hitResolved = true;
                break;
              }
            }
            if (hitResolved) {
              projectilePool.release(p);
              continue;
            }

            // 1D. Check hit against Vehicles (Lyo Tank / Lyo Plane / Dump Truck OBB, including airborne Lyo Plane!) -> Multi-stage explosion when HP reaches 0!
            for (const tv of tanks) {
              if (tv.hp <= 0) continue;
              if (tv === mountedTank && p.isPlayerTeam) continue;
              if (p.isPlayerTeam && tv.team === 'blue' && tv.occupiedByAiId !== null) continue;
              if (!p.isPlayerTeam && tv.team === 'red' && tv !== mountedTank) continue;
              const vGroundY = getTerrainElevation(tv.x, tv.z);
              const vCenterY = vGroundY + (tv.altitude ?? 0) + 1.15;
              const tvHalfX =
                tv.vehicleKind === 'truck' ? 3.66 : tv.vehicleKind === 'tank' ? 2.48 : 2.52;
              const tvHalfZ =
                tv.vehicleKind === 'truck' ? 1.76 : tv.vehicleKind === 'tank' ? 1.66 : 2.48;
              if (
                Math.abs(p.pos.y - vCenterY) <= 2.35 &&
                pointInObb2D(p.pos.x, p.pos.z, tv.x, tv.z, tvHalfX, tvHalfZ, -(tv.hullYaw ?? 0), 0.22)
              ) {
                if (tv === mountedTank && currentPlayMode === 'sandbox') {
                  tv.hp = Math.max(30, tv.hp - p.damage);
                  shakeTrauma = Math.min(1, shakeTrauma + 0.14);
                } else {
                  tv.hp = Math.max(0, tv.hp - p.damage);
                }
                const bSpd = Math.hypot(p.vel.x, p.vel.z) || 1;
                const bDirX = p.vel.x / bSpd;
                const bDirZ = p.vel.z / bSpd;
                tv.hitFlashTimer = 0.15;
                tv.hitReactionTimer = 0.60;
                tv.hitReactionDirX = bDirX;
                tv.hitReactionDirZ = bDirZ;
                detonateExplosiveShellIfHeavy(p, p.pos.x, p.pos.y, p.pos.z);
                playSpatialSoundAt(tv.x, tv.z, 26.0, 5.5, () => {
                  soundEngine.playMetalImpact(10.5);
                  soundEngine.playEnemyHit();
                });
                scratchExplosionPos.set(p.pos.x, vCenterY, p.pos.z);
                scratchHitBurstDir.set(bDirX, 0, bDirZ);
                lyoExplosionSystem.spawnLyoBulletHitBurst(
                  scratchExplosionPos,
                  scratchHitBurstDir,
                  tv === mountedTank,
                );
                spawnCollisionContactParticles(p.pos.x, vCenterY, p.pos.z, 0, 1, 'metal', 10.5);
                if (tv.hp <= 0) {
                  if (tv === mountedTank) {
                    mountedTank = null;
                    playerUnit.root.visible = true;
                    playerUnit.x = tv.x - 2.4;
                    playerUnit.z = tv.z;
                  }
                  tv.root.visible = false;
                  score += 300;
                  scratchExplosionPos.set(tv.x, vCenterY, tv.z);
                  lyoExplosionSystem.triggerMultiStageExplosion(
                    scratchExplosionPos,
                    2.4,
                    4,
                    'vehicle',
                    (stagePos, stageScale) => {
                      playSpatialSoundAt(stagePos.x, stagePos.z, 34.0, 6.0, () => {
                        soundEngine.playBarrelExplosion();
                      });
                      const dShake = getPlanetShortestDistance(
                        stagePos.x,
                        stagePos.z,
                        getPlayerAudioListenerPos().x,
                        getPlayerAudioListenerPos().z,
                      );
                      if (dShake < 30.0) {
                        shakeTrauma = Math.min(1, shakeTrauma + 0.35 * stageScale * (1 - dShake / 30.0));
                      }
                    },
                  );
                }
                hitResolved = true;
                break;
              }
            }
            if (hitResolved) {
              projectilePool.release(p);
              continue;
            }

            // 3. Check hit against Buddy Units
            for (const b of buddyUnits) {
              if (!b.alive) continue;
              if (b.isPlayer && (mountedTank || ridingTramCarIdx !== null)) continue;
              if ((p.isPlayerTeam && b.team === 'red') || (!p.isPlayerTeam && b.team === 'blue')) {
                if (getPlanetShortestDistance(p.pos.x, p.pos.z, b.x, b.z) < 1.15) {
                  detonateExplosiveShellIfHeavy(p, b.x, b.y + 0.9, b.z);
                  const bSpd = Math.hypot(p.vel.x, p.vel.z) || 1;
                  const bDirX = p.vel.x / bSpd;
                  const bDirZ = p.vel.z / bSpd;
                  const rawDamage =
                    p.weaponType === 'Ice Gun'
                      ? Math.ceil(p.damage * 0.5)
                      : b.isFrozen
                        ? b.hp
                        : p.damage;
                  if (b.isPlayer) {
                    const iFrameRes = applyPlayerDamageWithInvincibilityAndKnockback({
                      hp: b.hp,
                      invincibilityTimer: b.invincibilityTimer ?? 0,
                      x: b.x,
                      z: b.z,
                      vx: b.vx,
                      vz: b.vz,
                      vy: b.vy,
                      damage: rawDamage,
                      sourceX: b.x - bDirX * 2.0,
                      sourceZ: b.z - bDirZ * 2.0,
                      facingYaw: b.yaw,
                      invincibilityDurationSec: PLAYER_INVINCIBILITY_DURATION_SEC,
                    });
                    if (!iFrameRes.damageApplied) {
                      hitResolved = true;
                      break;
                    }
                    b.hp = iFrameRes.hp;
                    b.invincibilityTimer = iFrameRes.invincibilityTimer;
                    b.vx = iFrameRes.vx;
                    b.vz = iFrameRes.vz;
                    b.vy = iFrameRes.vy;
                    b.jumpOffset = Math.max(b.jumpOffset, 0.08);
                    b.isGrounded = false;
                    if (p.weaponType === 'Ice Gun') {
                      b.isFrozen = true;
                      b.frozenTimer = 4.0;
                    }
                  } else {
                    if (p.weaponType === 'Ice Gun') {
                      b.isFrozen = true;
                      b.frozenTimer = 4.0;
                      b.hp -= rawDamage;
                    } else if (b.isFrozen) {
                      b.hp = 0;
                    } else {
                      b.hp -= rawDamage;
                    }
                  }
                  b.hitFlashTimer = 0.15;
                  b.hitReactionTimer = 0.60;
                  b.hitReactionDirX = bDirX;
                  b.hitReactionDirZ = bDirZ;
                  if (b.isPlayer) {
                    soundEngine.playHit();
                  } else {
                    playSpatialSoundAt(b.x, b.z, 22.0, 4.5, () => {
                      soundEngine.playEnemyHit();
                    });
                  }
                  scratchExplosionPos.set(b.x, b.y + 0.95, b.z);
                  scratchHitBurstDir.set(bDirX, 0, bDirZ);
                  lyoExplosionSystem.spawnLyoBulletHitBurst(
                    scratchExplosionPos,
                    scratchHitBurstDir,
                    b.isPlayer,
                  );
                  spawnBurstParticles(b.x, 1.2, b.z, 8);

                  if (b.hp <= 0) {
                    b.alive = false;
                    b.respawnTimer = 6.0;
                    b.root.visible = false;
                    playSpatialSoundAt(b.x, b.z, 26.0, 5.0, () => {
                      soundEngine.playBarrelExplosion();
                    });
                    scratchExplosionPos.set(b.x, getTerrainElevation(b.x, b.z) + 0.85, b.z);
                    lyoExplosionSystem.spawnLyoExplosion(
                      scratchExplosionPos,
                      0.85,
                      'fodder',
                    );
                    spawnBurstParticles(b.x, 1.4, b.z, 16);
                    const isExplosiveKill =
                      p.weaponType === 'TankCannon' ||
                      p.weaponType === 'Skyshield35mm' ||
                      p.weaponType === 'Bazooka' ||
                      p.weaponType === 'Supazooka' ||
                      p.weaponType.includes('Rocket');
                    handleBuddyDeathDrops(b, isExplosiveKill);
                    if (b.team === 'red') {
                      enemiesDefeated++;
                      score += 150;
                      gold += 150;
                    } else if (b.isPlayer) {
                      const ownerPlot = blueCommanderBases[clamp(b.ownerCommanderId, 0, COMMANDERS_PER_TEAM - 1)];
                      const canRespawnPlayer =
                        playModeRef.current !== 'match' ||
                        canBuddyUnitRespawnAtBase(
                          b.isStarterCommanderUnit,
                          ownerPlot?.destroyed ?? false,
                          ownerPlot?.buildingHp ?? 400,
                        );
                      if (canRespawnPlayer) {
                        b.alive = true;
                        b.hp = b.maxHp;
                        b.tacticalLoadout = createInitialBuddyTacticalLoadout('unarmed', 0);
                        syncUnitFieldsFromLoadout(b);
                        b.x = blueBase.padX - 3.8;
                        b.z = blueBase.padZ - 0.5;
                        b.root.visible = true;
                      } else {
                        handleSwapBuddy();
                      }
                    }
                    checkMatchDeathmatchWinCondition();
                  }
                  hitResolved = true;
                  break;
                }
              }
            }
            if (hitResolved) {
              projectilePool.release(p);
            }
          }

          // Update & Collect 3D Pickups (Ballistic Bounce Arc + Team Buddies Despawn Blink Timer + Player/AI Collection)
          const collectorX = mountedTank ? mountedTank.x : playerUnit.x;
          const collectorZ = mountedTank ? mountedTank.z : playerUnit.z;
          for (let i = worldPickups.length - 1; i >= 0; i--) {
            const pk = worldPickups[i];
            pk.bobPhase += dt * 3.5;
            pk.mesh.rotation.y += dt * 2.2;

            // 1. Ballistic Bounce Physics (`terpental dan jatuh ke tanah`) + Base Courtyard Fence Clamping (`berada di tengah base`)
            const groundY = getTerrainElevation(pk.x, pk.z) + 0.75;
            if (Math.abs(pk.vx) > 0.02 || Math.abs(pk.vz) > 0.02 || pk.y > groundY + 0.02 || pk.vy !== 0) {
              const prevPkX = pk.x;
              const prevPkZ = pk.z;
              pk.x = wrapPlanetCoord(pk.x + pk.vx * dt);
              pk.z = wrapPlanetCoord(pk.z + pk.vz * dt);
              pk.y += pk.vy * dt;
              pk.vy -= 22.0 * dt;
              const airDamp = Math.exp(-3.2 * dt);
              pk.vx *= airDamp;
              pk.vz *= airDamp;

              // Ensure pad-crafted pickups stay inside the Commander Base courtyard and never fly outside the perimeter fence!
              for (const plot of [...blueCommanderBases, ...redCommanderBases]) {
                if (
                  Math.abs(prevPkX - plot.plotCenterX) <= 10.2 &&
                  Math.abs(prevPkZ - plot.plotCenterZ) <= 10.2
                ) {
                  if (Math.abs(pk.x - plot.plotCenterX) > 8.6) {
                    pk.x = plot.plotCenterX + Math.sign(pk.x - plot.plotCenterX) * 8.6;
                    pk.vx *= -0.35;
                  }
                  if (Math.abs(pk.z - plot.plotCenterZ) > 8.6) {
                    pk.z = plot.plotCenterZ + Math.sign(pk.z - plot.plotCenterZ) * 8.6;
                    pk.vz *= -0.35;
                  }
                  break;
                }
              }

              const nextGroundY = getTerrainElevation(pk.x, pk.z) + 0.75;
              if (pk.y <= nextGroundY) {
                pk.y = nextGroundY;
                if (pk.vy < -1.8) {
                  pk.vy = -pk.vy * 0.35;
                } else {
                  pk.vy = 0;
                }
                const damp = Math.exp(-7.5 * dt);
                pk.vx *= damp;
                pk.vz *= damp;
              }
            } else {
              pk.y = groundY + Math.sin(pk.bobPhase) * 0.08;
            }
            pk.mesh.position.set(pk.x, pk.y, pk.z);

            // 2. Team Buddies Despawn Timer & Rapid Blinking (`Batas Waktu Hilang: mulai berkedip-kedip lalu menghilang`)
            //    Crafted weapons sitting at a base Stacking Pad (`<= 9.0m` from pad) serve as Base Weapon Stock (`stock senjata`) and do not expire!
            const isBaseWeaponStock =
              pk.kind === 'weapon' &&
              (getPlanetShortestDistance(pk.x, pk.z, blueBase.padX, blueBase.padZ) <= 9.0 ||
                getPlanetShortestDistance(pk.x, pk.z, redBase.padX, redBase.padZ) <= 9.0);
            if (isBaseWeaponStock) {
              pk.lifeRemainingSec = pk.totalLifeSec;
              pk.mesh.visible = true;
            } else if (pk.isFromDeathDrop && pk.totalLifeSec > 0) {
              pk.lifeRemainingSec -= dt;
              const despawnState = evaluateDroppedItemDespawnState(pk.lifeRemainingSec, pk.totalLifeSec);
              pk.mesh.visible = despawnState.visible;
              if (despawnState.expired) {
                scene.remove(pk.mesh);
                worldPickups.splice(i, 1);
                continue;
              }
            }

            // 3. Collection by Player OR nearby AI Buddies (Friendly Auto-Loot + Enemy Stealing / No Team-Lock!)
            const pkWidForLoot: 'pistol' | 'rifle' | 'rocket' =
              pk.weaponName.includes('Bazooka') ||
              pk.weaponName.includes('Supazooka') ||
              pk.weaponName.includes('Rocket') ||
              pk.weaponName.includes('Nuclear') ||
              pk.weaponName.includes('Ion') ||
              pk.weaponName.includes('Homing')
                ? 'rocket'
                : pk.weaponName.includes('Rifle') ||
                    pk.weaponName.includes('Shotgun') ||
                    pk.weaponName.includes('Plasma') ||
                    pk.weaponName.includes('Gatling') ||
                    pk.weaponName.includes('Photon') ||
                    pk.weaponName.includes('Laser')
                  ? 'rifle'
                  : 'pistol';
            let collectorUnit: BuddyUnit | null = null;
            if (getPlanetShortestDistance(pk.x, pk.z, collectorX, collectorZ) < 2.1) {
              if (pk.kind !== 'weapon') {
                collectorUnit = playerUnit;
              } else {
                const resolvedSlot = resolveHandheldWeaponSlotSpec(pk.weaponName);
                const alreadyOwnsSlot = playerUnit.tacticalLoadout.handheldWeapons.some(
                  (w) => w.slotId === resolvedSlot.slotId,
                );
                const hasFreeHandheldSlot =
                  playerUnit.tacticalLoadout.handheldWeapons.length < MAX_HANDHELD_WEAPON_SLOTS;
                if (alreadyOwnsSlot || hasFreeHandheldSlot) {
                  collectorUnit = playerUnit;
                }
              }
            }
            if (!collectorUnit) {
              for (const b of buddyUnits) {
                if (!b.alive || b.isPlayer) continue;
                if (getPlanetShortestDistance(pk.x, pk.z, b.x, b.z) >= 1.85) continue;
                if (pk.kind === 'weapon') {
                  const lootCheck = canUnitLootGroundWeapon(
                    b.team,
                    b.weaponId,
                    b.weaponName,
                    pkWidForLoot,
                    pk.weaponName,
                    b.ammo,
                  );
                  if (!lootCheck.canLoot) continue;
                }
                collectorUnit = b;
                break;
              }
            }

            if (collectorUnit) {
              if (collectorUnit.isPlayer) {
                soundEngine.playPickup();
              } else {
                playSpatialSoundAt(pk.x, pk.z, 18.0, 4.0, () => {
                  soundEngine.playPickup();
                });
              }

              if (pk.kind === 'health') {
                // Medkit (dropped from destroyed White Medical Crates or Dynamic Supply Drops!)
                const healVal = pk.healAmount ?? 35;
                collectorUnit.hp = Math.min(collectorUnit.maxHp, collectorUnit.hp + healVal);
              } else if (pk.kind === 'ammo') {
                collectorUnit.tacticalLoadout = refillLoadoutAmmoFromSource(
                  collectorUnit.tacticalLoadout,
                  'ammo_pickup',
                );
                syncUnitFieldsFromLoadout(collectorUnit);
              } else if (pk.kind === 'coin_gold' || pk.kind === 'coin_silver') {
                const pts = pk.scoreValue ?? (pk.kind === 'coin_gold' ? 250 : 100);
                if (collectorUnit.team === 'blue') {
                  score += pts;
                  gold += pts;
                }
                collectorUnit.saluteTimer = 1.1;
                collectorUnit.saluteSign.updateText(
                  pk.kind === 'coin_gold' ? 'EMAS WARZONE!' : 'PERAK WARZONE!',
                  `+${pts} GOLD`,
                  pk.kind === 'coin_gold' ? '#facc15' : '#e2e8f0',
                  1,
                );
                collectorUnit.saluteSign.sprite.visible = true;
              } else if (pk.kind === 'secondary' && pk.secondaryId) {
                if (pk.secondaryId === 'hand_grenade' || pk.secondaryId === 'land_mine') {
                  collectorUnit.tacticalLoadout = addTacticalSecondaryToLoadout(
                    collectorUnit.tacticalLoadout,
                    pk.secondaryId,
                    pk.secondaryCount ?? 2,
                  );
                  syncUnitFieldsFromLoadout(collectorUnit);
                } else {
                  collectorUnit.secondaryItem = pk.secondaryId;
                  collectorUnit.secondaryCount =
                    (collectorUnit.secondaryCount || 0) + (pk.secondaryCount ?? 1);
                }
              } else if (pk.kind === 'mission_item' && pk.missionItemId) {
                collectorUnit.missionItem = pk.missionItemId;
              } else if (pk.kind === 'weapon') {
                const eqRes = equipOrSwapDroppedWeaponInLoadout(
                  collectorUnit.tacticalLoadout,
                  pk.weaponName,
                  pk.remainingAmmo ?? 120,
                );
                collectorUnit.tacticalLoadout = eqRes.updatedLoadout;
                syncUnitFieldsFromLoadout(collectorUnit);
                collectorUnit.weaponRecoil = 0.38;
              } else if (pk.kind === 'powerup') {
                collectorUnit.hp = collectorUnit.maxHp;
                if (collectorUnit.team === 'blue') score += 120;
              }
              scene.remove(pk.mesh);
              worldPickups.splice(i, 1);
            }
          }
        }

        // Update 5-Layer Lyo Explosion & Muzzle Flash System
        lyoExplosionSystem.update(dt);

        // Update 3D Coherent Photon Laser Beams
        for (let bi = activeLaserBeams.length - 1; bi >= 0; bi--) {
          const b = activeLaserBeams[bi];
          b.life += dt;
          if (b.life >= b.maxLife) {
            scene.remove(b.group);
            b.outerMat.dispose();
            b.coreMat.dispose();
            activeLaserBeams.splice(bi, 1);
            continue;
          }
          const tNorm = b.life / b.maxLife;
          b.outerMat.opacity = 0.85 * (1 - tNorm);
          b.coreMat.opacity = Math.max(0, 1 - tNorm * 1.15);
        }

        // Update Active 3D Ordnance Devices (CB-24 Cluster Bomb from Lyo Plane, HG-04 Frag Grenade, TM-89 Land Mine)
        for (let oi = activeOrdnanceDevices.length - 1; oi >= 0; oi--) {
          const ord = activeOrdnanceDevices[oi];
          ord.fuseTimer -= dt;
          const groundY = getTerrainElevation(ord.pos.x, ord.pos.z);

          if (!ord.isGrounded) {
            ord.vel.y -= 18.5 * dt;
            ord.pos.addScaledVector(ord.vel, dt);
            ord.pos.x = wrapPlanetCoord(ord.pos.x);
            ord.pos.z = wrapPlanetCoord(ord.pos.z);
            ord.mesh.position.copy(ord.pos);
            ord.mesh.rotation.x += dt * 4.5;
            ord.mesh.rotation.z += dt * 3.2;

            if (ord.pos.y <= groundY + 0.22) {
              ord.pos.y = groundY + 0.22;
              ord.mesh.position.copy(ord.pos);
              if (ord.kind === 'cluster_bomb') {
                // CB-24 Cluster Bomb detonates immediately on aerial impact into 1 central + 6 radial submunition blasts!
                ord.fuseTimer = 0;
              } else {
                ord.vel.y = -ord.vel.y * 0.35;
                ord.vel.x *= 0.55;
                ord.vel.z *= 0.55;
                if (Math.abs(ord.vel.y) < 1.2) {
                  ord.isGrounded = true;
                }
              }
            }
          } else if (ord.kind === 'land_mine') {
            // Check proximity trigger against enemy units or vehicles
            for (const u of buddyUnits) {
              if (u.alive && u.team === 'red' && getPlanetShortestDistance(u.x, u.z, ord.pos.x, ord.pos.z) < 2.2) {
                ord.fuseTimer = 0;
                break;
              }
            }
            for (const v of tanks) {
              if (v.hp > 0 && v.team === 'red' && getPlanetShortestDistance(v.x, v.z, ord.pos.x, ord.pos.z) < 3.2) {
                ord.fuseTimer = 0;
                break;
              }
            }
          }

          if (ord.fuseTimer <= 0) {
            const ox = ord.pos.x;
            const oy = groundY + 0.45;
            const oz = ord.pos.z;
            scene.remove(ord.mesh);
            activeOrdnanceDevices.splice(oi, 1);

            soundEngine.playBarrelExplosion();
            soundEngine.playTacticalExplosion(ord.kind === 'cluster_bomb' ? 1.65 : 1.15);
            scratchExplosionPos.set(ox, oy, oz);
            lyoExplosionSystem.spawnLyoExplosion(
              scratchExplosionPos,
              ord.kind === 'cluster_bomb' ? 1.55 : 1.1,
              'vehicle',
            );
            spawnTargetFireParticles(ox, oy, oz, ord.kind === 'cluster_bomb' ? 28 : 16, 1.5);
            spawnDebrisChunks(ox, oy, oz, 'metal', ord.kind === 'cluster_bomb' ? 14 : 8);

            if (ord.kind === 'cluster_bomb') {
              // 6 Radial Sub-Munition Cluster Bomblet Detonations around the primary impact crater!
              for (let sb = 0; sb < 6; sb++) {
                const ang = (sb / 6) * Math.PI * 2;
                const sx = wrapPlanetCoord(ox + Math.cos(ang) * 4.2);
                const sz = wrapPlanetCoord(oz + Math.sin(ang) * 4.2);
                const sy = getTerrainElevation(sx, sz) + 0.4;
                scratchExplosionPos.set(sx, sy, sz);
                lyoExplosionSystem.spawnLyoExplosion(scratchExplosionPos, 0.92, 'cannon');
                spawnTargetFireParticles(sx, sy, sz, 10, 0.85);
              }
            }

            // Area damage to nearby enemies & vehicles
            const blastRad = ord.kind === 'cluster_bomb' ? 8.5 : 4.8;
            const maxDmg = ord.kind === 'cluster_bomb' ? 65 : 38;
            for (const b of buddyUnits) {
              if (!b.alive || b.team === 'blue') continue;
              const d = getPlanetShortestDistance(b.x, b.z, ox, oz);
              if (d <= blastRad) {
                b.hp = Math.max(0, b.hp - Math.round(maxDmg * (1 - (d / blastRad) * 0.5)));
                b.hitFlashTimer = 0.2;
                spawnTargetFireParticles(b.x, getTerrainElevation(b.x, b.z) + 0.8, b.z, 8, 0.45);
                if (b.hp <= 0) {
                  b.alive = false;
                  b.respawnTimer = 6.0;
                  b.root.visible = false;
                  handleBuddyDeathDrops(b, false);
                  enemiesDefeated++;
                  score += 150;
                  gold += 150;
                  checkMatchDeathmatchWinCondition();
                }
              }
            }
            for (const tv of tanks) {
              if (tv.hp <= 0 || tv === mountedTank) continue;
              const d = getPlanetShortestDistance(tv.x, tv.z, ox, oz);
              if (d <= blastRad) {
                tv.hp = Math.max(0, tv.hp - Math.round(maxDmg * (1 - (d / blastRad) * 0.4)));
                tv.hitFlashTimer = 0.2;
              }
            }
            shakeTrauma = Math.min(1, shakeTrauma + (ord.kind === 'cluster_bomb' ? 0.48 : 0.28));
          }
        }

        // Update Explosion Particles (mark inactive on death instead of destroying)
        for (const ep of explosionParticles) {
          if (!ep.active) continue;
          ep.life += dt;
          if (ep.life >= ep.maxLife) {
            explosionParticlePool.release(ep);
            continue;
          }
          ep.vel.y -= 14 * dt;
          ep.mesh.position.addScaledVector(ep.vel, dt);
          const alpha = 1 - ep.life / ep.maxLife;
          (ep.mesh.material as THREE.MeshBasicMaterial).opacity = alpha;
        }

        // Update 3D Shattered Debris Chunks (mark inactive on death instead of destroying)
        for (const dc of debrisChunks) {
          if (!dc.active) continue;
          dc.life += dt;
          if (dc.life >= dc.maxLife) {
            debrisChunkPool.release(dc);
            continue;
          }
          dc.vel.y -= 19.5 * dt;
          dc.mesh.position.addScaledVector(dc.vel, dt);
          dc.mesh.rotation.x += dc.rotVel.x * dt;
          dc.mesh.rotation.y += dc.rotVel.y * dt;
          dc.mesh.rotation.z += dc.rotVel.z * dt;

          const floorY = getTerrainElevation(dc.mesh.position.x, dc.mesh.position.z) + 0.08;
          if (dc.mesh.position.y < floorY) {
            dc.mesh.position.y = floorY;
            if (Math.abs(dc.vel.y) > 1.2) {
              dc.vel.y = -dc.vel.y * 0.42;
            } else {
              dc.vel.y = 0;
            }
            dc.vel.x *= 0.72;
            dc.vel.z *= 0.72;
            dc.rotVel.multiplyScalar(0.68);
          }

          const fadeStart = dc.maxLife * 0.65;
          if (dc.life > fadeStart) {
            const shrink = Math.max(0.01, 1 - (dc.life - fadeStart) / (dc.maxLife - fadeStart));
            dc.mesh.scale.setScalar(shrink);
          }
        }

        // Update Tank Track Ground Tread Marks (mark inactive on death instead of destroying)
        for (const tm of tankTrackMarks) {
          if (!tm.active) continue;
          tm.life += dt;
          if (tm.life >= tm.maxLife) {
            tankTrackMarkPool.release(tm);
            continue;
          }
          if (tm.life > tm.maxLife - 3.0) {
            tm.mat.opacity = 0.72 * ((tm.maxLife - tm.life) / 3.0);
          }
        }
      }

      // 4. Camera: Follow Camera (Sandbox/Match) vs High Top-Down Orbit Overview (Map Editor)
      const activePlaneAlt =
        mountedTank && mountedTank.vehicleKind === 'plane' ? mountedTank.altitude ?? 0 : 0;
      const visualPlaneAlt =
        activePlaneAlt <= 4.0 ? activePlaneAlt : 4.0 + (activePlaneAlt - 4.0) * 0.35;
      const activeTerrainY =
        state === 'title'
          ? getTerrainElevation(-32.5, 38.5)
          : currentPlayMode === 'editor'
          ? getTerrainElevation(editorPan.x, editorPan.z)
          : mountedTank
          ? getTerrainElevation(mountedTank.x, mountedTank.z)
          : getTerrainElevation(playerUnit.x, playerUnit.z);

      const focusTarget: Vec3 =
        state === 'title'
          ? { x: -32.5, y: activeTerrainY + 0.9, z: 38.5 }
          : currentPlayMode === 'editor'
          ? { x: editorPan.x, y: activeTerrainY + 0.5, z: editorPan.z }
          : mountedTank
          ? {
              x: mountedTank.x,
              y: activeTerrainY + 1.1 + visualPlaneAlt * 0.92,
              z: mountedTank.z,
            }
          : { x: playerUnit.x, y: activeTerrainY + 1.0, z: playerUnit.z };

      // Toroidal-aware Camera Spring: unwrap focusTarget relative to camFollowPos so crossing ±80 never snaps!
      const unwrappedFocusTarget: Vec3 = {
        x: camFollowPos.x + getPlanetShortestDelta(focusTarget.x, camFollowPos.x),
        y: focusTarget.y,
        z: camFollowPos.z + getPlanetShortestDelta(focusTarget.z, camFollowPos.z),
      };

      const springStep = stepCriticalDampedSpring3D(
        camFollowPos,
        unwrappedFocusTarget,
        camFollowVel,
        currentPlayMode === 'editor' ? 18 : Math.max(8, activeSpeed),
        dt,
      );
      camFollowPos = {
        x: wrapPlanetCoord(springStep.position.x),
        y: springStep.position.y,
        z: wrapPlanetCoord(springStep.position.z),
      };
      camFollowVel = springStep.velocity;

      const panAlpha = 1 - Math.exp(-REA_CONSTANTS.camera.mousePan.dampSpeed * dt);
      const panScale =
        state === 'title'
          ? 0.3
          : currentPlayMode === 'editor'
          ? 0.0
          : REA_CONSTANTS.camera.mousePan.sensitivity;
      mousePanCurrent.x += (mouseNdc.x * panScale - mousePanCurrent.x) * panAlpha;
      mousePanCurrent.z += (-mouseNdc.y * panScale - mousePanCurrent.z) * panAlpha;

      recoilOffset.x *= Math.exp(-10 * dt);
      recoilOffset.z *= Math.exp(-10 * dt);
      shakeTrauma = Math.max(0, shakeTrauma - dt * 2.5);
      const shakeAmt = shakeTrauma * shakeTrauma * 0.35;
      const shakeX = (Math.random() - 0.5) * shakeAmt;
      const shakeZ = (Math.random() - 0.5) * shakeAmt;

      const fovScale = cameraFovModeRef.current === 'roblox18' ? 1.85 : 1.0;
      const planeAltZoom = 1.0 + activePlaneAlt * 0.038;
      const zoomMult = state === 'title' ? 1.0 : cameraZoom * planeAltZoom;
      const camOffset =
        state === 'title'
          ? { x: -3.2, y: 10.6, z: 14.5 }
          : currentPlayMode === 'editor'
          ? { x: 0, y: 54.0 * editorZoom, z: 22.0 * editorZoom }
          : { x: 0, y: 13.6 * zoomMult, z: 16.2 * zoomMult };

      const searchParams =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const isFullMapOverview = searchParams?.get('fullmap') === '1';
      const planeViewMode = searchParams?.get('planeview') ?? null;
      const skyshieldViewMode = searchParams?.get('skyshieldview') ?? null;
      const buildingViewMode = searchParams?.get('buildingview') ?? null;

      const finalLookX = isFullMapOverview
        ? 0
        : wrapPlanetCoord(camFollowPos.x + mousePanCurrent.x + recoilOffset.x + shakeX);
      const finalLookZ = isFullMapOverview
        ? 0
        : wrapPlanetCoord(camFollowPos.z + mousePanCurrent.z + recoilOffset.z + shakeZ);

      // =======================================================================
      // 4A. STEP NUCLEAR LAUNCHER 4-PHASE SEQUENCE (MAP ZOOM-OUT -> ROCKET CHASE -> PRE-IMPACT RISE -> RETURN)
      // =======================================================================
      if (nukeStrikeState.phase !== 'idle') {
        const currentOriginPos: Vec3 = {
          x: activeFocusUnit ? activeFocusUnit.x : playerUnit.x,
          y: activeTerrainY + 1.0,
          z: activeFocusUnit ? activeFocusUnit.z : playerUnit.z,
        };

        if (nukeStrikeState.phase === 'targeting') {
          // Update target cursor when mouse moves or when player nudges with WASD / Arrow keys
          if (Math.hypot(mouseNdc.x - nukeLastMouseNdc.x, mouseNdc.y - nukeLastMouseNdc.y) > 0.002) {
            nukeLastMouseNdc = { x: mouseNdc.x, y: mouseNdc.y };
            nukeStrikeState = updateNuclearStrikeTargetCursor(
              nukeStrikeState,
              aimWorldPoint.x,
              getTerrainElevation(aimWorldPoint.x, aimWorldPoint.z),
              aimWorldPoint.z,
              280.0,
            );
          }
          const nudgeSpeed = 42.0 * dt;
          let nudgeDx = 0;
          let nudgeDz = 0;
          if (keys['KeyW'] || keys['ArrowUp']) nudgeDz -= nudgeSpeed;
          if (keys['KeyS'] || keys['ArrowDown']) nudgeDz += nudgeSpeed;
          if (keys['KeyA'] || keys['ArrowLeft']) nudgeDx -= nudgeSpeed;
          if (keys['KeyD'] || keys['ArrowRight']) nudgeDx += nudgeSpeed;
          if (nudgeDx !== 0 || nudgeDz !== 0) {
            const nx = nukeStrikeState.targetPos.x + nudgeDx;
            const nz = nukeStrikeState.targetPos.z + nudgeDz;
            nukeStrikeState = updateNuclearStrikeTargetCursor(
              nukeStrikeState,
              nx,
              getTerrainElevation(nx, nz),
              nz,
              280.0,
            );
          }
        }

        const nukeStep = stepNuclearStrikeSequence(
          nukeStrikeState,
          Math.min(rawDt, 0.25),
          currentOriginPos,
        );
        nukeStrikeState = nukeStep.state;

        if (nukeStep.justDetonated) {
          triggerNuclearStrikeDetonation(
            nukeStrikeState.targetPos.x,
            nukeStrikeState.targetPos.y,
            nukeStrikeState.targetPos.z,
          );
        }
        if (nukeStep.justCompletedReturn) {
          camFollowPos = { ...currentOriginPos };
          camFollowVel = { x: 0, y: 0, z: 0 };
          nukeTargetReticleGroup.visible = false;
          nukeCinematicRocketGroup.visible = false;
        }
      }

      // =======================================================================
      // 4B. FLAT GROUND WORLD ALIGNMENT & TREE / PROP JIGGLE ANIMATION
      // =======================================================================
      const activeNukePose =
        nukeStrikeState.phase !== 'idle'
          ? computeNuclearStrikeCameraPose(nukeStrikeState, {
              x: camOffset.x * fovScale,
              y: camOffset.y * fovScale,
              z: camOffset.z * fovScale,
            })
          : null;
      const planetPivotX =
        isFullMapOverview || planeViewMode || skyshieldViewMode || buildingViewMode
          ? 0
          : activeNukePose
          ? activeNukePose.focusPivotPos.x
          : viewCenterX;
      const planetPivotZ =
        isFullMapOverview || planeViewMode || skyshieldViewMode || buildingViewMode
          ? 0
          : activeNukePose
          ? activeNukePose.focusPivotPos.z
          : viewCenterZ;
      const highAltFactor = clamp((activePlaneAlt - 3.5) / 11.0, 0, 1);
      const kCurve =
        isFullMapOverview ||
        planeViewMode ||
        skyshieldViewMode ||
        buildingViewMode ||
        nukeStrikeState.phase === 'targeting'
          ? 0
          : PLANET_CURVATURE_STRENGTH * (1.0 - 0.34 * highAltFactor);
      if (windUniforms.uCurvatureStrength) {
        windUniforms.uCurvatureStrength.value = kCurve;
      }

      // Sync 3D Target Reticle & 3D Flying Nuclear Rocket visuals
      if (nukeStrikeState.phase === 'targeting') {
        nukeTargetReticleGroup.visible = true;
        nukeCinematicRocketGroup.visible = false;
        const tx = nukeStrikeState.targetPos.x;
        const tz = nukeStrikeState.targetPos.z;
        const ty = getTerrainElevation(tx, tz);
        nukeTargetReticleGroup.position.set(tx, ty + 0.05, tz);
        const midRing = nukeTargetReticleGroup.getObjectByName('MidLockRing');
        if (midRing) midRing.rotation.z = timeSec * 2.2;
      } else if (nukeStrikeState.phase === 'tracking_rocket') {
        nukeTargetReticleGroup.visible = true;
        nukeCinematicRocketGroup.visible = true;
        const rx = nukeStrikeState.rocketPos.x;
        const ry = nukeStrikeState.rocketPos.y;
        const rz = nukeStrikeState.rocketPos.z;
        const curvedY =
          ry + computePlanetYOffset(rx, rz, planetPivotX, planetPivotZ) * (kCurve / PLANET_CURVATURE_STRENGTH);
        nukeCinematicRocketGroup.position.set(rx, curvedY, rz);
        const lookAhead = new THREE.Vector3(
          rx + nukeStrikeState.rocketTangent.x * 5.0,
          curvedY + nukeStrikeState.rocketTangent.y * 5.0,
          rz + nukeStrikeState.rocketTangent.z * 5.0,
        );
        nukeCinematicRocketGroup.lookAt(lookAhead);
        const plume = nukeCinematicRocketGroup.getObjectByName('RocketExhaustPlume');
        if (plume) {
          plume.scale.set(
            0.9 + Math.sin(timeSec * 45) * 0.18,
            1.0 + Math.cos(timeSec * 52) * 0.25,
            0.9 + Math.sin(timeSec * 45) * 0.18,
          );
        }
        // Continuous rocket exhaust fire & smoke trail along the ballistic trajectory!
        const tailX = rx - nukeStrikeState.rocketTangent.x * 1.8;
        const tailY = ry - nukeStrikeState.rocketTangent.y * 1.8;
        const tailZ = rz - nukeStrikeState.rocketTangent.z * 1.8;
        spawnTargetFireParticles(tailX, tailY, tailZ, 2, 0.75);
      } else {
        nukeTargetReticleGroup.visible = false;
        nukeCinematicRocketGroup.visible = false;
      }

      if (buildingViewMode) {
        scene.fog = null;
        scene.background = new THREE.Color('#dfd7c8');
        let showcaseBase = scene.getObjectByName('ShowcaseBaseMasterplanRoot') as THREE.Group | null;
        if (!showcaseBase) {
          showcaseBase = new THREE.Group();
          showcaseBase.name = 'ShowcaseBaseMasterplanRoot';
          buildMilitaryBaseMasterplan(showcaseBase, 'blue', windUniforms, false);
          scene.add(showcaseBase);
        }
        const targetGroupName =
          buildingViewMode === 'hq'
            ? 'CentralCommandCommsHQ'
            : buildingViewMode === 'hangar'
            ? 'HeavyVehicleDepotHangar'
            : buildingViewMode === 'barracks'
            ? 'TroopQuartersFieldBarracks'
            : 'PerimeterCheckpointWatchtower';
        const masterRoot = showcaseBase.getObjectByName('MilitaryBaseMasterplan_blue');
        if (masterRoot) {
          masterRoot.children.forEach((ch) => {
            ch.visible = ch.name === targetGroupName;
            if (ch.name === targetGroupName) {
              ch.position.set(0, 0, 0);
            }
          });
        }
        scene.children.forEach((ch) => {
          if (ch === dirLight || ch === dirLight.target || ch === hemiLight) return;
          ch.visible = ch === showcaseBase;
        });
      } else if (skyshieldViewMode) {
        scene.fog = null;
        scene.background = new THREE.Color('#dfd7c8');
        let showcaseTurret = scene.getObjectByName('ShowcaseSkyshieldRoot') as THREE.Group | null;
        if (!showcaseTurret) {
          const built = buildProceduralSkyshieldTurret('blue', windUniforms, false, 0, 0, 0, 0);
          showcaseTurret = built.root;
          showcaseTurret.name = 'ShowcaseSkyshieldRoot';
          showcaseTurret.scale.setScalar(1.0);
          showcaseTurret.userData.pitchGroup = built.pitchGroup;
          showcaseTurret.userData.yawGroup = built.yawGroup;
          scene.add(showcaseTurret);
        }
        scene.children.forEach((ch) => {
          if (ch === dirLight || ch === dirLight.target || ch === hemiLight) return;
          ch.visible = ch === showcaseTurret;
        });
      } else if (planeViewMode) {
        scene.fog = null;
        scene.background = new THREE.Color('#dfd7c8');
        const showcasePlane = tanks.find((v) => v.vehicleKind === 'plane');
        scene.children.forEach((ch) => {
          if (ch === dirLight || ch === dirLight.target || ch === hemiLight) return;
          ch.visible = showcasePlane ? ch === showcasePlane.root : false;
        });
        if (showcasePlane) {
          showcasePlane.x = 0;
          showcasePlane.z = 0;
          showcasePlane.hullYaw = 0;
          showcasePlane.bodyGroup.rotation.set(0, 0, 0);
          const shadowDisc = showcasePlane.root.getObjectByName('ContactShadowDisc');
          if (shadowDisc) shadowDisc.visible = false;
          const tiltRoot = showcasePlane.bodyGroup.getObjectByName('LyoPlaneTiltRoot');
          if (tiltRoot) {
            tiltRoot.position.set(0, 0, 0);
            tiltRoot.rotation.set(0, 0, 0);
          }
          const gearGrp = showcasePlane.bodyGroup.getObjectByName('LyoPlaneLandingGear');
          if (gearGrp) gearGrp.position.y = 0.08;
        }
      } else if (isFullMapOverview) {
        scene.fog = null;
        lyoGrassSystem.grassMesh.visible = false;
        lyoGrassSystem.petalMesh.visible = false;
        editorCursorGroup.visible = false;
        blueBase.hpSign.sprite.visible = false;
        blueBase.commanderPads.forEach((p) => {
          p.padSign.sprite.visible = false;
          p.ghostPatternBox.visible = false;
          p.ghostSlotMeshes.forEach((gm) => {
            gm.visible = false;
          });
        });
        redBase.hpSign.sprite.visible = false;
        redBase.commanderPads.forEach((p) => {
          p.padSign.sprite.visible = false;
          p.ghostPatternBox.visible = false;
          p.ghostSlotMeshes.forEach((gm) => {
            gm.visible = false;
          });
        });
        camera.fov = 38;
        camera.far = 800;
        camera.up.set(0, 0, -1);
        camera.updateProjectionMatrix();
        camera.position.set(0, 412, 0.001);
        camera.lookAt(0, 0, 0);
        dirLight.shadow.camera.left = -148;
        dirLight.shadow.camera.right = 148;
        dirLight.shadow.camera.top = 148;
        dirLight.shadow.camera.bottom = -148;
        dirLight.shadow.camera.far = 395;
        dirLight.shadow.camera.updateProjectionMatrix();
      } else if (activeNukePose) {
        camera.up.set(0, 1, 0);
        camera.position.set(
          activeNukePose.cameraPos.x + shakeX,
          activeNukePose.cameraPos.y,
          activeNukePose.cameraPos.z + shakeZ,
        );
        camera.lookAt(
          activeNukePose.lookAtPos.x,
          activeNukePose.lookAtPos.y,
          activeNukePose.lookAtPos.z,
        );
      } else {
        camera.up.set(0, 1, 0);
        camera.position.set(
          finalLookX + camOffset.x * fovScale,
          camFollowPos.y + camOffset.y * fovScale,
          finalLookZ + camOffset.z * fovScale,
        );
        camera.lookAt(
          finalLookX,
          camFollowPos.y - 1.15 - visualPlaneAlt * 0.28,
          finalLookZ - 2.5 - visualPlaneAlt * 0.24,
        );
      }

      // Update Flat Ground Map, Splatmap, Wildflowers, Stones, Dandelions & Sunbeams
      tolanPlanetEnv.update(planetPivotX, planetPivotZ, camera.position, timeSec);

      // Advance & Articulate the 2-Car Modern Urban Street Tram (1 Rangkaian 2 Gerbong) along the closed road loop
      const tramStepDt = state === 'playing' && currentPlayMode !== 'editor' ? dt : rawDt * 0.65;
      cityTramDistance =
        (cityTramDistance + CITY_TRAM_SPEC.cruiseSpeed * tramStepDt) %
        cityTram.getState().totalTrackLength;
      const liveTramState = cityTram.update(
        cityTramDistance,
        tramStepDt,
        planetPivotX,
        planetPivotZ,
        kCurve,
      );
      if (ridingTramCarIdx !== null && playerUnit.alive) {
        const activeCar = ridingTramCarIdx === 0 ? liveTramState.car1 : liveTramState.car2;
        playerUnit.x = wrapPlanetCoord(activeCar.x);
        playerUnit.z = wrapPlanetCoord(activeCar.z);
      }
      // Push any grounded crate resting on the tram tracks gently aside when the tram passes
      for (let ci = 0; ci < worldCrates.length; ci++) {
        const c = worldCrates[ci];
        if (c.state !== 'grounded') continue;
        for (const car of [liveTramState.car1, liveTramState.car2]) {
          const obbRes = resolveSolidObbCollision2D(
            c.x,
            c.z,
            c.vx - car.forwardX * CITY_TRAM_SPEC.cruiseSpeed,
            c.vz - car.forwardZ * CITY_TRAM_SPEC.cruiseSpeed,
            0.68,
            car.x,
            car.z,
            CITY_TRAM_SPEC.carLength * 0.5,
            CITY_TRAM_SPEC.carWidth * 0.5,
            car.yaw,
            0.35,
          );
          if (obbRes.collided) {
            c.x = wrapPlanetCoord(obbRes.x);
            c.z = wrapPlanetCoord(obbRes.z);
            c.vx = obbRes.vx + car.forwardX * CITY_TRAM_SPEC.cruiseSpeed * 0.85;
            c.vz = obbRes.vz + car.forwardZ * CITY_TRAM_SPEC.cruiseSpeed * 0.85;
          }
        }
      }

      const needFullStaticAlign =
        !scene.userData.__staticWorldAligned ||
        currentPlayMode === 'editor' ||
        kCurve !== 0;

      if (needFullStaticAlign) {
        scene.userData.__staticWorldAligned = true;
        // Align Drop Zone Pads onto Terrain Elevation
        const centerDzElev = getTerrainElevation(
          currentMapLayout.centerDropZone.x,
          currentMapLayout.centerDropZone.z,
        );
        applyPlanetCurvatureToObject(
          centerDropZoneGroup,
          currentMapLayout.centerDropZone.x,
          centerDzElev + 0.04,
          currentMapLayout.centerDropZone.z,
          planetPivotX,
          planetPivotZ,
          0,
          kCurve,
        );
        applyPlanetCurvatureToObject(
          westSuperDropZoneGroup,
          -53.5,
          getTerrainElevation(-53.5, 0.0) + 0.04,
          0.0,
          planetPivotX,
          planetPivotZ,
          0,
          kCurve,
        );
        applyPlanetCurvatureToObject(
          eastSuperDropZoneGroup,
          48.0,
          getTerrainElevation(48.0, 0.0) + 0.04,
          0.0,
          planetPivotX,
          planetPivotZ,
          0,
          kCurve,
        );

        // Align Centered South Blue HQ (+90° facing North) and North Red HQ (-90° facing South) + all 4 Commander Pads per Base
        applyPlanetCurvatureToObject(
          blueBase.baseGroup,
          blueBase.hqX,
          getTerrainElevation(blueBase.hqX, blueBase.hqZ),
          blueBase.hqZ,
          planetPivotX,
          planetPivotZ,
          Math.PI / 2,
          kCurve,
        );
        for (const p of blueBase.commanderPads) {
          applyPlanetCurvatureToObject(
            p.padGroup,
            p.worldX,
            getTerrainElevation(p.worldX, p.worldZ) + 0.04,
            p.worldZ,
            planetPivotX,
            planetPivotZ,
            0,
            kCurve,
          );
          p.padGroup.updateMatrixWorld(true);
        }
        applyPlanetCurvatureToObject(
          redBase.baseGroup,
          redBase.hqX,
          getTerrainElevation(redBase.hqX, redBase.hqZ),
          redBase.hqZ,
          planetPivotX,
          planetPivotZ,
          -Math.PI / 2,
          kCurve,
        );
        for (const p of redBase.commanderPads) {
          applyPlanetCurvatureToObject(
            p.padGroup,
            p.worldX,
            getTerrainElevation(p.worldX, p.worldZ) + 0.04,
            p.worldZ,
            planetPivotX,
            planetPivotZ,
            Math.PI,
            kCurve,
          );
          p.padGroup.updateMatrixWorld(true);
        }
      }

      // Step Military Base Masterplan Dynamic Animations for Both Teams:
      // - Rotating Communication Radar Dish & HVAC Fans on Central Command HQ
      // - Spinning Roof Ventilation Turbine on Troop Quarters & Field Barracks
      // - Panning Searchlight on Perimeter Checkpoint Guard Watchtower
      // - Automatic Boom Barrier Gate opening to 90° when any character or ground vehicle is within < 8.0m
      const computeMinGateDistance = (gateX: number, gateZ: number): number => {
        let minDist = 999;
        for (let i = 0; i < buddyUnits.length; i++) {
          const b = buddyUnits[i];
          if (!b.alive) continue;
          if (b.isPlayer && (mountedTank || ridingTramCarIdx !== null)) continue;
          const d = getPlanetShortestDistance(b.x, b.z, gateX, gateZ);
          if (d < minDist) minDist = d;
        }
        for (let i = 0; i < tanks.length; i++) {
          const v = tanks[i];
          if (v.hp <= 0 || (v.altitude ?? 0) > 2.5) continue;
          const d = getPlanetShortestDistance(v.x, v.z, gateX, gateZ);
          if (d < minDist) minDist = d;
        }
        return minDist;
      };
      const computeAuthorizedPlotGateDistance = (
        plotTeam: 'blue' | 'red',
        plotIdx: number,
        gateX: number,
        gateZ: number,
      ): number => {
        let minDist = 999;
        for (let i = 0; i < buddyUnits.length; i++) {
          const b = buddyUnits[i];
          if (!b.alive) continue;
          if (b.isPlayer && (mountedTank || ridingTramCarIdx !== null)) continue;
          if (
            !canUnitEnterCommanderBaseGate(b.team, b.ownerCommanderId, plotTeam, plotIdx)
          ) {
            continue;
          }
          const d = getPlanetShortestDistance(b.x, b.z, gateX, gateZ);
          if (d < minDist) minDist = d;
        }
        for (let i = 0; i < tanks.length; i++) {
          const v = tanks[i];
          if (v.hp <= 0 || (v.altitude ?? 0) > 2.5) continue;
          const vehOwnerId =
            v === mountedTank
              ? playerUnit.ownerCommanderId
              : v.occupiedByAiId !== null
              ? buddyUnits.find((bu) => bu.id === v.occupiedByAiId)?.ownerCommanderId ?? -1
              : -1;
          if (!canUnitEnterCommanderBaseGate(v.team, vehOwnerId, plotTeam, plotIdx)) {
            continue;
          }
          const d = getPlanetShortestDistance(v.x, v.z, gateX, gateZ);
          if (d < minDist) minDist = d;
        }
        return minDist;
      };
      const plotCenterOffsets = [-39, -13, 13, 39];
      const blueAuthGateDists = plotCenterOffsets.map((ox, idx) =>
        computeAuthorizedPlotGateDistance('blue', idx, blueBase.hqX + ox, blueBase.hqZ - 21.8),
      );
      const redAuthGateDists = plotCenterOffsets.map((ox, idx) =>
        computeAuthorizedPlotGateDistance('red', idx, redBase.hqX - ox, redBase.hqZ + 21.8),
      );
      const blueGateDist = computeMinGateDistance(blueBase.hqX, blueBase.hqZ - 23.8);
      const redGateDist = computeMinGateDistance(redBase.hqX, redBase.hqZ + 23.8);
      stepMilitaryBaseMasterplanAnimation(blueBase.baseGroup, dt, blueGateDist, blueAuthGateDists);
      stepMilitaryBaseMasterplanAnimation(redBase.baseGroup, dt, redGateDist, redAuthGateDists);

      // Step 35mm Skyshield Air & Ground Defense Turrets mounted atop all 4 corner bastions of each Base
      const stepBaseSkyshieldDefense = (
        base: { baseGroup: THREE.Group; hqX: number; hqZ: number },
        team: 'blue' | 'red',
      ) => {
        if (state !== 'playing' || isFullMapOverview || planeViewMode || skyshieldViewMode) return;
        const isRed = team === 'red';
        const skyshields: SkyshieldTurretController[] = getBaseSkyshieldTurrets(base.baseGroup);
        for (let si = 0; si < skyshields.length; si++) {
          const st = skyshields[si];
          if (!st.isBuilt) continue;
          const wx = isRed ? base.hqX - st.localZ : base.hqX + st.localZ;
          const wz = isRed ? base.hqZ + st.localX : base.hqZ - st.localX;
          const wy = getTerrainElevation(wx, wz) + st.localY;

          let bestScoreDist = 999;
          let bestDist = 999;
          let bestX = 0;
          let bestY = 0;
          let bestZ = 0;
          let bestVx = 0;
          let bestVz = 0;
          let bestIsAir = false;
          let hasTarget = false;

          // 1. Evaluate hostile vehicles (Airborne LyoPlane priority 1 up to 46m; Ground LyoTank/DumpTruck priority 2 up to 34m)
          for (let vi = 0; vi < tanks.length; vi++) {
            const v = tanks[vi];
            if (v.hp <= 0) continue;
            const isHostileVehicle =
              (isRed && (v === mountedTank || (v.team === 'blue' && v.occupiedByAiId !== null))) ||
              (!isRed && v !== mountedTank && v.team === 'red' && (v.occupiedByAiId !== null || (v.altitude ?? 0) > 1.2));
            if (!isHostileVehicle) continue;
            const d = getPlanetShortestDistance(wx, wz, v.x, v.z);
            const vAlt = v.altitude ?? 0;
            const isAir = v.vehicleKind === 'plane' && vAlt > 1.2;
            const maxRange = isAir ? 46.0 : 34.0;
            if (d <= maxRange) {
              const scoreDist = isAir ? d * 0.52 : d;
              if (scoreDist < bestScoreDist) {
                bestScoreDist = scoreDist;
                bestDist = d;
                bestX = v.x;
                bestZ = v.z;
                bestY = getTerrainElevation(v.x, v.z) + vAlt + 1.05;
                bestVx = v.vx;
                bestVz = v.vz;
                bestIsAir = isAir;
                hasTarget = true;
              }
            }
          }

          // 2. Evaluate hostile infantry & flying Jetpack units (Airborne Jetpack up to 40m; Ground infantry up to 32m)
          for (let bi = 0; bi < buddyUnits.length; bi++) {
            const b = buddyUnits[bi];
            if (!b.alive || b.team === team) continue;
            if (b.isPlayer && (mountedTank || ridingTramCarIdx !== null)) continue;
            const d = getPlanetShortestDistance(wx, wz, b.x, b.z);
            const isAir = BUDDY_CLASSES[b.classId].canFly;
            const maxRange = isAir ? 40.0 : 32.0;
            if (d <= maxRange) {
              const scoreDist = isAir ? d * 0.62 : d;
              if (scoreDist < bestScoreDist) {
                bestScoreDist = scoreDist;
                bestDist = d;
                bestX = b.x;
                bestZ = b.z;
                bestY = getTerrainElevation(b.x, b.z) + (isAir ? 1.65 : 0.95);
                bestVx = b.vx;
                bestVz = b.vz;
                bestIsAir = isAir;
                hasTarget = true;
              }
            }
          }

          if (!hasTarget) {
            st.burstRemaining = 0;
            continue;
          }

          if (st.activeTargetTimer <= 0.02) {
            playSpatialSoundAt(wx, wz, 28.0, 6.0, () => {
              soundEngine.playSkyshieldRadarLock();
            });
          }
          st.activeTargetTimer = 0.35;
          const leadT = clamp(bestDist / 46.0, 0, 0.52);
          const aimX = bestX + bestVx * leadT;
          const aimZ = bestZ + bestVz * leadT;
          const wdx = getPlanetShortestDelta(aimX, wx);
          const wdz = getPlanetShortestDelta(aimZ, wz);
          const wdy = bestY - (wy + 1.13);
          const ldx = isRed ? wdz : -wdz;
          const ldz = isRed ? -wdx : wdx;

          const targetYaw = Math.atan2(-ldz, ldx);
          const horizDist = Math.max(0.5, Math.hypot(wdx, wdz));
          const targetPitch = clamp(Math.atan2(wdy, horizDist), -0.42, 1.25);

          let yawDiff = targetYaw - st.currentYaw;
          while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
          while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
          st.currentYaw += yawDiff * Math.min(1, dt * 8.5);
          st.currentPitch += (targetPitch - st.currentPitch) * Math.min(1, dt * 8.5);
          st.yawGroup.rotation.y = st.currentYaw;
          st.pitchGroup.rotation.x = 0;
          st.pitchGroup.rotation.y = 0;
          st.pitchGroup.rotation.z = st.currentPitch;

          if (st.fireCooldown <= 0 && Math.abs(yawDiff) < 0.28) {
            if (st.burstRemaining <= 0) {
              st.burstRemaining = 5;
            }
            const worldYaw = st.currentYaw + (isRed ? -Math.PI / 2 : Math.PI / 2);
            const cosP = Math.cos(st.currentPitch);
            const sinP = Math.sin(st.currentPitch);
            const dirX = Math.cos(worldYaw) * cosP;
            const dirZ = -Math.sin(worldYaw) * cosP;
            const dirY = sinP;
            const muzX = wx + dirX * 2.55;
            const muzY = wy + 1.13 + dirY * 2.55;
            const muzZ = wz + dirZ * 2.55;

            st.recoilOffset = 0.22;
            st.recoilGroup.position.x = -0.22;
            spawnBurstParticles(muzX, muzY, muzZ, 5);
            playSpatialSoundAt(wx, wz, 28.0, 6.0, () => {
              soundEngine.playSkyshieldShot();
            });
            scratchSpawnOrigin.set(muzX, muzY, muzZ);
            scratchSpawnDir.set(dirX, dirY, dirZ);
            fireProjectile(
              !isRed,
              'Skyshield35mm',
              scratchSpawnOrigin,
              scratchSpawnDir,
              46.0,
              bestIsAir ? 16 : 12,
            );
            st.burstRemaining--;
            // High-RPM AHEAD Cannon Burst: 0.04s (40ms, within 35ms-45ms) per round during burst
            st.fireCooldown = st.burstRemaining > 0 ? 0.04 : 1.25;
          }
        }
      };
      stepBaseSkyshieldDefense(blueBase, 'blue');
      stepBaseSkyshieldDefense(redBase, 'red');

      // Step Deployed MLRS-MK5 Nuclear Missile Launchers (Long-Range 280m Radar Lock enabled by Command Center Lv.3)
      for (const nl of activeNuclearLaunchers) {
        const nlX = nl.root.position.x;
        const nlZ = nl.root.position.z;
        const nlY = getTerrainElevation(nlX, nlZ);
        applyPlanetCurvatureToObject(nl.root, nlX, nlY, nlZ, planetPivotX, planetPivotZ);
        if (nukeStrikeState.phase === 'targeting' && nl.team === 'blue') {
          const dx = nukeStrikeState.targetPos.x - nlX;
          const dz = nukeStrikeState.targetPos.z - nlZ;
          nl.yawGroup.rotation.y = Math.atan2(dx, dz);
          nl.pitchGroup.rotation.x = -0.52;
        } else if (nukeStrikeState.phase === 'idle') {
          nl.yawGroup.rotation.y = Math.sin(timeSec * 0.45) * 0.35;
        }
      }

      // Align all Destructible Trees + Apply Elastic Tree Jiggle When Rammed or Shot!
      for (let i = 0; i < trees.length; i++) {
        const tr = trees[i];
        if (!tr.alive) continue;
        const isJiggling = tr.jiggleTimer > 0;
        if (needFullStaticAlign || isJiggling || tr.mesh.userData.__wasJiggling) {
          applyPlanetCurvatureToObject(
            tr.mesh,
            tr.x,
            getTerrainElevation(tr.x, tr.z),
            tr.z,
            planetPivotX,
            planetPivotZ,
            (tr.mesh.userData.baseRotY as number) || 0,
            kCurve,
          );
          tr.mesh.userData.__wasJiggling = isJiggling;
        }
        if (isJiggling) {
          tr.jiggleTimer = Math.max(0, tr.jiggleTimer - dt);
          const jPhase = (1 - tr.jiggleTimer / 0.55) * Math.PI * 5.0;
          const jEnv = (tr.jiggleTimer / 0.55) * tr.jiggleIntensity;
          const sway = Math.sin(jPhase) * jEnv;
          tr.mesh.rotation.x += tr.jiggleDirZ * sway;
          tr.mesh.rotation.z -= tr.jiggleDirX * sway;
        }
      }

      // Align all Real GLB Props (including Pushable Wheelbarrow, Cones, Barricades, Falling Warzone Barrels & Jiggle Tilt)
      for (let i = 0; i < realPropsGroup.children.length; i++) {
        const propWrapper = realPropsGroup.children[i];
        if (!propWrapper.visible) continue;
        const wx = (propWrapper.userData.worldX as number) ?? propWrapper.position.x;
        const wz = (propWrapper.userData.worldZ as number) ?? propWrapper.position.z;
        const baseRotY = (propWrapper.userData.baseRotY as number) ?? 0;
        const fallOffsetY = (propWrapper.userData.fallOffsetY as number) ?? 0;
        const movedOrUnaligned =
          needFullStaticAlign ||
          propWrapper.userData.__alignedX !== wx ||
          propWrapper.userData.__alignedZ !== wz ||
          propWrapper.userData.__alignedRotY !== baseRotY ||
          propWrapper.userData.__alignedFallY !== fallOffsetY ||
          propWrapper.userData.__wasJigglingProp;
        if (movedOrUnaligned) {
          applyPlanetCurvatureToObject(
            propWrapper,
            wx,
            getTerrainElevation(wx, wz) + fallOffsetY,
            wz,
            planetPivotX,
            planetPivotZ,
            baseRotY,
            kCurve,
          );
          propWrapper.userData.__alignedX = wx;
          propWrapper.userData.__alignedZ = wz;
          propWrapper.userData.__alignedRotY = baseRotY;
          propWrapper.userData.__alignedFallY = fallOffsetY;
          propWrapper.userData.__wasJigglingProp = false;
        }
      }
      for (let i = 0; i < activeMapProps.length; i++) {
        const mp = activeMapProps[i];
        if (!mp.alive || !mp.canJiggleOnHit || mp.jiggleTimer <= 0) continue;
        const jWobble = Math.sin(mp.jiggleTimer * 36.0) * (mp.jiggleTimer / 0.35) * 0.14;
        mp.wrapper.rotation.x += jWobble;
        mp.wrapper.rotation.z += jWobble * 0.8;
        mp.wrapper.userData.__wasJigglingProp = true;
      }
      stepRealLyoPropsAnimation(realPropsGroup, timeSec);

      // Align all Falling & Grounded Crates (with Pushable Rotation) and World Pickups
      for (let i = 0; i < worldCrates.length; i++) {
        const c = worldCrates[i];
        const cYaw = c.state === 'falling' ? Math.sin(timeSec * 2.5 + c.id) * 0.18 : c.rotY;
        applyPlanetCurvatureToObject(c.mesh, c.x, c.y, c.z, planetPivotX, planetPivotZ, cYaw, kCurve);
      }
      for (let i = 0; i < worldPickups.length; i++) {
        const pk = worldPickups[i];
        const bobY = getTerrainElevation(pk.x, pk.z) + 0.75 + Math.sin(pk.bobPhase) * 0.2;
        applyPlanetCurvatureToObject(
          pk.mesh,
          pk.x,
          bobY,
          pk.z,
          planetPivotX,
          planetPivotZ,
          pk.bobPhase * 0.6,
          kCurve,
        );
      }

      // Align all Vehicles (LyoTank, LyoDumpTruck & LyoPlane) and Tank Track Tread Marks
      // Ground vehicles physically descend into the -1.55m 3-level Oasis Lake Basin and tilt along the terrain slope!
      for (let i = 0; i < tanks.length; i++) {
        const v = tanks[i];
        if (v.hp <= 0) continue;
        if ((v.hitFlashTimer ?? 0) > 0) {
          v.hitFlashTimer = Math.max(0, (v.hitFlashTimer ?? 0) - rawDt);
        }
        if ((v.hitReactionTimer ?? 0) > 0) {
          v.hitReactionTimer = Math.max(0, (v.hitReactionTimer ?? 0) - rawDt);
        }
        if ((v.stunTimer ?? 0) > 0) {
          v.stunTimer = Math.max(0, (v.stunTimer ?? 0) - rawDt);
        }
        const vStun = evaluateLyoStunEffectState(v.stunTimer ?? 0, 1.5);
        if (v.stunMesh) {
          v.stunMesh.visible = vStun.active;
          if (vStun.active) {
            v.stunMesh.rotation.z = vStun.rotationZ;
            v.stunMesh.scale.setScalar(vStun.scale);
          }
        }
        const vHitPose = evaluateLyoHitReactionPose(
          v.hitReactionTimer ?? 0,
          0.60,
          v.hitReactionDirX ?? 0,
          v.hitReactionDirZ ?? 1,
          true,
        );

        if (v.hp / v.maxHp <= 0.33) {
          v.lowHpSmokeTimer = (v.lowHpSmokeTimer ?? 0) + rawDt;
          if (v.lowHpSmokeTimer >= 0.14) {
            v.lowHpSmokeTimer = 0;
            lyoExplosionSystem.spawnLowHealthSmokePuff(
              new THREE.Vector3(v.x, getTerrainElevation(v.x, v.z) + (v.altitude ?? 0) + 1.35, v.z),
            );
          }
        }

        const isGroundVeh = v.vehicleKind !== 'plane' || (v.altitude ?? 0) < 0.25;
        let slopePitch = 0;
        let slopeRoll = 0;
        if (isGroundVeh) {
          const sampleStep = 1.35;
          const hPz = getTerrainElevation(v.x, v.z + sampleStep);
          const hMz = getTerrainElevation(v.x, v.z - sampleStep);
          const hPx = getTerrainElevation(v.x + sampleStep, v.z);
          const hMx = getTerrainElevation(v.x - sampleStep, v.z);
          slopePitch = clamp(Math.atan2(hPz - hMz, sampleStep * 2.0) * 0.72, -0.36, 0.36);
          slopeRoll = clamp(-Math.atan2(hPx - hMx, sampleStep * 2.0) * 0.72, -0.36, 0.36);
        }

        const tankClimb =
          v.vehicleKind === 'tank'
            ? evaluateTankClimbableObstacleElevation(v.x, v.z, v.hullYaw, activeMapProps)
            : { climbY: 0, pitchRad: 0, rollRad: 0, isClimbing: false };

        const tankBodyRecoilLiftY = 0;
        const tankBodyRecoilRotX = 0;
        const tankBodyRecoilRotZ = 0;
        if (v.vehicleKind === 'tank') {
          const tankScale =
            (v.turretGroup.userData.tankScale as number | undefined) ??
            (v.isSuper ? 2.75 : 2.45);
          const baseTurretX =
            (v.turretGroup.userData.baseTurretX as number | undefined) ?? -0.03 * tankScale;
          const baseTurretY =
            (v.turretGroup.userData.baseTurretY as number | undefined) ?? 0.82 * tankScale;
          const baseBarrelX =
            (v.barrelGroup.userData.baseBarrelX as number | undefined) ?? 1.15 * tankScale;
          const recoilWindowRemaining =
            v === mountedTank
              ? clamp(v.recoilTimer, 0, 0.24)
              : clamp(v.recoilTimer - (1.1 - 0.24), 0, 0.24);
          const shotRecoil = evaluateLyoTankShotRecoilPose(recoilWindowRemaining, 0.24);
          // Keep the tank hull and turret cockpit rock-solid when firing; ONLY the
          // telescoping cannon barrel slides back and recovers along its barrel axis.
          v.turretGroup.position.set(baseTurretX, baseTurretY, 0);
          v.turretGroup.rotation.z = 0;
          v.barrelGroup.position.x =
            baseBarrelX - shotRecoil.barrelSlideBack * tankScale * 1.55;
        }

        applyPlanetCurvatureToObject(
          v.root,
          v.x,
          getTerrainElevation(v.x, v.z) + tankClimb.climbY + vHitPose.hopY + tankBodyRecoilLiftY,
          v.z,
          planetPivotX,
          planetPivotZ,
          0,
          kCurve,
          0.85,
          slopePitch + tankClimb.pitchRad + vHitPose.rotX + tankBodyRecoilRotX,
          slopeRoll + tankClimb.rollRad + vHitPose.rotZ + tankBodyRecoilRotZ,
        );
      }
      for (let i = 0; i < tankTrackMarks.length; i++) {
        const tm = tankTrackMarks[i];
        if (!tm.active) continue;
        const wx = tm.mesh.position.x;
        const wz = tm.mesh.position.z;
        const onRoad = evaluateRoadNetworkSdf(wx, wz) < 0;
        const baseY = getTerrainElevation(wx, wz) + (onRoad ? 0.064 : 0.085);
        tm.mesh.position.set(
          planetPivotX + getPlanetShortestDelta(wx, planetPivotX),
          baseY + computePlanetYOffset(wx, wz, planetPivotX, planetPivotZ, kCurve),
          planetPivotZ + getPlanetShortestDelta(wz, planetPivotZ),
        );
      }

      // Align all Buddy Characters (Player & AI Buddies) and Projectiles
      for (let i = 0; i < buddyUnits.length; i++) {
        const b = buddyUnits[i];
        if (!b.alive) continue;
        const floatY = BUDDY_CLASSES[b.classId].canFly ? 0.65 + Math.sin(timeSec * 4 + b.id) * 0.18 : 0;
        const bHitPose = evaluateLyoHitReactionPose(
          b.hitReactionTimer ?? 0,
          0.60,
          b.hitReactionDirX ?? 0,
          b.hitReactionDirZ ?? 1,
          b.isPlayer,
        );
        const localY = getTerrainElevation(b.x, b.z);
        b.bodyGroup.position.y = floatY + b.jumpOffset + bHitPose.hopY;
        applyPlanetCurvatureToObject(b.root, b.x, localY, b.z, planetPivotX, planetPivotZ, 0, kCurve);
      }

      // 4A. Chunk-Synced 3D Fog of War:
      // Hide field objects (Crates, Coins/Pickups, Land Mines/Ordnance) and Enemy (Red) Units & Vehicles
      // outside the player's 21.0m 3D grass chunk streaming radius, with smooth scale fade at the inner edge!
      const bypassFogOfWar3D =
        currentPlayMode === 'editor' ||
        isFullMapOverview ||
        Boolean(skyshieldViewMode || buildingViewMode || planeViewMode) ||
        nukeStrikeState.phase !== 'idle';
      const fogGrassCenterX = activeFocusUnit ? activeFocusUnit.x : playerUnit.x;
      const fogGrassCenterZ = activeFocusUnit ? activeFocusUnit.z : playerUnit.z;
      applyGrassChunkSyncedFogOfWar3D({
        viewerX: fogGrassCenterX,
        viewerZ: fogGrassCenterZ,
        playMode: currentPlayMode,
        bypassFogOfWar: bypassFogOfWar3D,
        worldCrates,
        worldPickups,
        activeOrdnanceDevices,
        buddyUnits,
        tanks,
      });

      for (let i = 0; i < projectiles.length; i++) {
        const p = projectiles[i];
        if (!p.active) continue;
        const yOff = computePlanetYOffset(p.pos.x, p.pos.z, planetPivotX, planetPivotZ, kCurve);
        const rx = planetPivotX + getPlanetShortestDelta(p.pos.x, planetPivotX);
        const ry = p.pos.y + yOff;
        const rz = planetPivotZ + getPlanetShortestDelta(p.pos.z, planetPivotZ);
        p.mesh.position.set(rx, ry, rz);
        p.mesh.lookAt(rx + p.vel.x, ry + p.vel.y, rz + p.vel.z);
      }
      if (editorCursorGroup.visible) {
        const cx = editorCursorGroup.position.x;
        const cz = editorCursorGroup.position.z;
        applyPlanetCurvatureToObject(
          editorCursorGroup,
          cx,
          getTerrainElevation(cx, cz) + 0.04,
          cz,
          planetPivotX,
          planetPivotZ,
          editorRotY,
          kCurve,
        );
      }

      // 4B. Update Muzzle Raycast Hit Detection (100m, Layer Mask Skipping Shooter, Pink Hit Dot, Yellow Normal Arrow & Target Lock-On)
      const showRaycastSight =
        state === 'playing' &&
        currentPlayMode !== 'editor' &&
        !isFullMapOverview &&
        !skyshieldViewMode &&
        !buildingViewMode &&
        !planeViewMode &&
        (mountedTank ? mountedTank.vehicleKind !== 'truck' : playerUnit.alive && playerUnit.carryingCrate === 'none');
      muzzleRaycastGroup.visible = showRaycastSight;
      if (showRaycastSight) {
        updateMuzzleRaycastAndTargetLock(planetPivotX, planetPivotZ, kCurve, timeSec);
      } else {
        activeMuzzleRaycastResult = null;
      }

      // 4C. Clamp / Auto-Hide 3D Floating Billboard Labels when behind UI (Top Bar, Top-Right Radar, Bottom Bar) or in Map Editor
      camera.updateMatrixWorld();
      const updateSignVisibility = (
        sprite: THREE.Sprite,
        worldX: number,
        worldZ: number,
        maxDist = 82.0,
      ) => {
        if (isFullMapOverview || skyshieldViewMode || currentPlayMode === 'editor' || state !== 'playing') {
          sprite.visible = false;
          return;
        }
        const dist = getPlanetShortestDistance(worldX, worldZ, planetPivotX, planetPivotZ);
        if (dist > maxDist) {
          sprite.visible = false;
          return;
        }
        sprite.getWorldPosition(scratchSignWorldPos);
        const ndc = scratchSignWorldPos.project(camera);
        if (
          ndc.z > 1.0 ||
          ndc.z < -1.0 ||
          (Math.abs(ndc.x) < 0.45 && ndc.y > 0.72) || // Top-Center Skewed Score Bar
          (ndc.x > 0.56 && ndc.y > 0.65) || // Top-Right Gear / Run Match cluster
          (ndc.x < -0.56 && ndc.y > 0.28) || // Top-Left Radar + Pad status
          (ndc.x > 0.38 && ndc.y < -0.68) // Bottom-Right Compact Weapon Slots
        ) {
          sprite.visible = false;
        } else {
          sprite.visible = true;
        }
      };

      // Hide legacy 3D billboard text boxes above pads & HQs to keep the viewport 100% clean
      blueBase.hpSign.sprite.visible = false;
      redBase.hpSign.sprite.visible = false;
      for (const p of blueBase.commanderPads) {
        p.padSign.sprite.visible = false;
      }
      for (const p of redBase.commanderPads) {
        p.padSign.sprite.visible = false;
      }

      dirLight.position.set(
        finalLookX + lyoSunOffset.x,
        lyoSunOffset.y,
        finalLookZ + lyoSunOffset.z,
      );
      dirLight.target.position.set(finalLookX, 0, finalLookZ);
      dirLight.target.updateMatrixWorld();

      if (
        dirLight.shadow.map &&
        windUniforms.uDirShadowMap &&
        windUniforms.uDirShadowMatrix &&
        windUniforms.uHasDirShadow
      ) {
        windUniforms.uDirShadowMap.value =
          dirLight.shadow.map.depthTexture || dirLight.shadow.map.texture;
        windUniforms.uDirShadowMatrix.value.copy(dirLight.shadow.matrix);
        windUniforms.uHasDirShadow.value = 1.0;
      }

      if (buildingViewMode) {
        const w = renderer.domElement.clientWidth || window.innerWidth;
        const h = renderer.domElement.clientHeight || window.innerHeight;
        const halfW = Math.floor(w / 2);
        const halfH = Math.floor(h / 2);
        const aspect = halfW / Math.max(1, halfH);

        const cfg =
          buildingViewMode === 'hq'
            ? {
                orthoSize: 5.55,
                centerY: 4.55,
                front: [26, 4.55, -0.25],
                rear: [-26, 4.55, -0.25],
                left: [0, 4.55, 26],
                right: [0, 4.55, -26],
                lookFront: [0, 4.55, -0.25],
                lookRear: [0, 4.55, -0.25],
                lookLeft: [0, 4.55, 0],
                lookRight: [0, 4.55, 0],
              }
            : buildingViewMode === 'hangar'
            ? {
                orthoSize: 3.85,
                centerY: 3.15,
                front: [26, 3.15, 0],
                rear: [-26, 3.15, 0],
                left: [0, 3.15, -26],
                right: [0, 3.15, 26],
                lookFront: [0, 3.15, 0],
                lookRear: [0, 3.15, 0],
                lookLeft: [0, 3.15, 0],
                lookRight: [0, 3.15, 0],
              }
            : buildingViewMode === 'barracks'
            ? {
                orthoSize: 3.35,
                centerY: 2.45,
                front: [0, 2.45, 26],
                rear: [0, 2.45, -26],
                left: [-26, 2.45, 0],
                right: [26, 2.45, 0],
                lookFront: [0, 2.45, 0],
                lookRear: [0, 2.45, 0],
                lookLeft: [0, 2.45, 0],
                lookRight: [0, 2.45, 0],
              }
            : {
                orthoSize: 5.45,
                centerY: 4.45,
                front: [26, 4.45, -1.8],
                rear: [-26, 4.45, -1.8],
                left: [0, 4.45, 26],
                right: [0, 4.45, -26],
                lookFront: [0, 4.45, -1.8],
                lookRear: [0, 4.45, -1.8],
                lookLeft: [0.2, 4.45, 0],
                lookRight: [0.4, 4.45, 0],
              };

        const orthoCam = new THREE.OrthographicCamera(
          -cfg.orthoSize * aspect,
          cfg.orthoSize * aspect,
          cfg.orthoSize,
          -cfg.orthoSize,
          0.1,
          100,
        );
        renderer.setScissorTest(true);

        const renderQuad = (
          vx: number,
          vy: number,
          camPos: number[],
          lookPos: number[],
        ) => {
          renderer.setViewport(vx, vy, halfW, halfH);
          renderer.setScissor(vx, vy, halfW, halfH);
          orthoCam.up.set(0, 1, 0);
          orthoCam.position.set(camPos[0], camPos[1], camPos[2]);
          orthoCam.lookAt(lookPos[0], lookPos[1], lookPos[2]);
          windUniforms.uLightDirection.value
            .set(camPos[0] * 0.04 + 0.25, 0.82, camPos[2] * 0.04 + 0.25)
            .normalize();
          renderer.render(scene, orthoCam);
        };

        // Top-Left: FRONT ELEVATION
        renderQuad(0, halfH, cfg.front, cfg.lookFront);
        // Top-Right: REAR ELEVATION
        renderQuad(halfW, halfH, cfg.rear, cfg.lookRear);
        // Bottom-Left: LEFT SIDE ELEVATION
        renderQuad(0, 0, cfg.left, cfg.lookLeft);
        // Bottom-Right: RIGHT SIDE ELEVATION
        renderQuad(halfW, 0, cfg.right, cfg.lookRight);

        renderer.setScissorTest(false);
        renderer.setViewport(0, 0, w, h);
      } else if (skyshieldViewMode === 'iso') {
        const w = renderer.domElement.clientWidth || window.innerWidth;
        const h = renderer.domElement.clientHeight || window.innerHeight;
        const halfW = Math.floor(w / 2);
        const halfH = Math.floor(h / 2);
        const aspect = halfW / Math.max(1, halfH);
        const orthoIsoSize = 1.62;
        const orthoCam = new THREE.OrthographicCamera(
          -orthoIsoSize * aspect,
          orthoIsoSize * aspect,
          orthoIsoSize,
          -orthoIsoSize,
          0.1,
          100,
        );
        renderer.setScissorTest(true);
        windUniforms.uLightDirection.value.set(0.35, 0.88, 0.32).normalize();

        // Top-Left: Rear-Right 3/4 view (exact angle from user's screenshot!)
        renderer.setViewport(0, halfH, halfW, halfH);
        renderer.setScissor(0, halfH, halfW, halfH);
        orthoCam.up.set(0, 1, 0);
        orthoCam.position.set(-10, 8.5, 11);
        orthoCam.lookAt(0.1, 0.85, 0);
        renderer.render(scene, orthoCam);

        // Top-Right: Front-Right 3/4 view
        renderer.setViewport(halfW, halfH, halfW, halfH);
        renderer.setScissor(halfW, halfH, halfW, halfH);
        orthoCam.position.set(11, 8.5, 10);
        orthoCam.lookAt(0.4, 0.85, 0);
        renderer.render(scene, orthoCam);

        // Bottom-Left: Rear-Left 3/4 view
        renderer.setViewport(0, 0, halfW, halfH);
        renderer.setScissor(0, 0, halfW, halfH);
        orthoCam.position.set(-10, 8.5, -11);
        orthoCam.lookAt(0.1, 0.85, 0);
        renderer.render(scene, orthoCam);

        // Bottom-Right: Front-Left 3/4 view
        renderer.setViewport(halfW, 0, halfW, halfH);
        renderer.setScissor(halfW, 0, halfW, halfH);
        orthoCam.position.set(11, 8.5, -10);
        orthoCam.lookAt(0.4, 0.85, 0);
        renderer.render(scene, orthoCam);

        renderer.setScissorTest(false);
        renderer.setViewport(0, 0, w, h);
      } else if (skyshieldViewMode) {
        const w = renderer.domElement.clientWidth || window.innerWidth;
        const h = renderer.domElement.clientHeight || window.innerHeight;
        const halfW = Math.floor(w / 2);
        const halfH = Math.floor(h / 2);
        const aspect = halfW / Math.max(1, halfH);
        const orthoFrontSize = 1.48;
        const orthoSideSize = 1.72;
        const orthoCam = new THREE.OrthographicCamera(
          -orthoFrontSize * aspect,
          orthoFrontSize * aspect,
          orthoFrontSize,
          -orthoFrontSize,
          0.1,
          100,
        );
        const centerY = 0.98;
        renderer.setScissorTest(true);

        // 1. TOP-LEFT QUADRANT: FRONT ELEVATION (TAMPAK DEPAN) — Looking from +X toward 0
        orthoCam.left = -orthoFrontSize * aspect;
        orthoCam.right = orthoFrontSize * aspect;
        orthoCam.top = orthoFrontSize;
        orthoCam.bottom = -orthoFrontSize;
        orthoCam.updateProjectionMatrix();
        renderer.setViewport(0, halfH, halfW, halfH);
        renderer.setScissor(0, halfH, halfW, halfH);
        orthoCam.up.set(0, 1, 0);
        orthoCam.position.set(18, centerY, 0);
        orthoCam.lookAt(0, centerY, 0);
        windUniforms.uLightDirection.value.set(0.82, 0.58, 0.0).normalize();
        renderer.render(scene, orthoCam);

        // 2. TOP-RIGHT QUADRANT: REAR ELEVATION (TAMPAK BELAKANG) — Looking from -X toward 0
        renderer.setViewport(halfW, halfH, halfW, halfH);
        renderer.setScissor(halfW, halfH, halfW, halfH);
        orthoCam.up.set(0, 1, 0);
        orthoCam.position.set(-18, centerY, 0);
        orthoCam.lookAt(0, centerY, 0);
        windUniforms.uLightDirection.value.set(-0.82, 0.58, 0.0).normalize();
        renderer.render(scene, orthoCam);

        // 3. BOTTOM-LEFT QUADRANT: RIGHT SIDE ELEVATION (TAMPAK SAMPING KANAN) — Looking from +Z toward 0 (Barrel +X on Right)
        orthoCam.left = -orthoSideSize * aspect;
        orthoCam.right = orthoSideSize * aspect;
        orthoCam.top = orthoSideSize;
        orthoCam.bottom = -orthoSideSize;
        orthoCam.updateProjectionMatrix();
        renderer.setViewport(0, 0, halfW, halfH);
        renderer.setScissor(0, 0, halfW, halfH);
        orthoCam.up.set(0, 1, 0);
        orthoCam.position.set(0.55, 0.72, 18);
        orthoCam.lookAt(0.55, 0.72, 0);
        windUniforms.uLightDirection.value.set(0.0, 0.58, 0.82).normalize();
        renderer.render(scene, orthoCam);

        // 4. BOTTOM-RIGHT QUADRANT: LEFT SIDE ELEVATION — Looking from -Z toward 0 (Barrel +X on Left)
        renderer.setViewport(halfW, 0, halfW, halfH);
        renderer.setScissor(halfW, 0, halfW, halfH);
        orthoCam.up.set(0, 1, 0);
        orthoCam.position.set(0.55, 1.18, -18);
        orthoCam.lookAt(0.55, 1.18, 0);
        windUniforms.uLightDirection.value.set(0.0, 0.58, -0.82).normalize();
        renderer.render(scene, orthoCam);

        renderer.setScissorTest(false);
        renderer.setViewport(0, 0, w, h);
      } else if (planeViewMode) {
        const w = renderer.domElement.clientWidth || window.innerWidth;
        const h = renderer.domElement.clientHeight || window.innerHeight;
        const halfW = Math.floor(w / 2);
        const halfH = Math.floor(h / 2);
        const aspect = halfW / Math.max(1, halfH);
        const orthoSize = 2.95;
        const orthoCam = new THREE.OrthographicCamera(
          -orthoSize * aspect,
          orthoSize * aspect,
          orthoSize,
          -orthoSize,
          0.1,
          100,
        );
        const centerY = 0.95;
        renderer.setScissorTest(true);

        // 1. TOP-LEFT QUADRANT: TOP VIEW (Nose +X pointing DOWN, Tail -X pointing UP)
        renderer.setViewport(0, halfH, halfW, halfH);
        renderer.setScissor(0, halfH, halfW, halfH);
        orthoCam.up.set(-1, 0, 0);
        orthoCam.position.set(-0.22, centerY + 18, 0);
        orthoCam.lookAt(-0.22, centerY, 0);
        windUniforms.uLightDirection.value.set(0.25, 1.0, 0.25).normalize();
        renderer.render(scene, orthoCam);

        // 2. TOP-RIGHT QUADRANT: BOTTOM VIEW (Nose +X pointing UP, Tail -X pointing DOWN)
        const topThrusters = scene.getObjectByName('TopThrustersGroup');
        const botThruster = scene.getObjectByName('BottomThrusterGroup');
        if (topThrusters) topThrusters.visible = false;
        if (botThruster) botThruster.visible = true;
        renderer.setViewport(halfW, halfH, halfW, halfH);
        renderer.setScissor(halfW, halfH, halfW, halfH);
        orthoCam.up.set(1, 0, 0);
        orthoCam.position.set(0.22, centerY - 18, 0);
        orthoCam.lookAt(0.22, centerY, 0);
        windUniforms.uLightDirection.value.set(0.25, -1.0, 0.25).normalize();
        renderer.render(scene, orthoCam);
        if (topThrusters) topThrusters.visible = true;
        if (botThruster) botThruster.visible = false;

        // 3. BOTTOM-LEFT QUADRANT: LEFT SIDE VIEW (Nose +X pointing RIGHT, Tail -X pointing LEFT)
        renderer.setViewport(0, 0, halfW, halfH);
        renderer.setScissor(0, 0, halfW, halfH);
        orthoCam.up.set(0, 1, 0);
        orthoCam.position.set(0, centerY + 0.15, 18);
        orthoCam.lookAt(0, centerY + 0.15, 0);
        windUniforms.uLightDirection.value.set(0.35, 0.75, 0.85).normalize();
        renderer.render(scene, orthoCam);

        // 4. BOTTOM-RIGHT QUADRANT: RIGHT SIDE VIEW (Nose +X pointing LEFT, Tail -X pointing RIGHT)
        renderer.setViewport(halfW, 0, halfW, halfH);
        renderer.setScissor(halfW, 0, halfW, halfH);
        orthoCam.up.set(0, 1, 0);
        orthoCam.position.set(0, centerY + 0.15, -18);
        orthoCam.lookAt(0, centerY + 0.15, 0);
        windUniforms.uLightDirection.value.set(0.35, 0.75, -0.85).normalize();
        renderer.render(scene, orthoCam);

        renderer.setScissorTest(false);
        renderer.setViewport(0, 0, w, h);
      } else {
        renderer.render(scene, camera);
      }

      // Smoothly rotate & bob the 3D Hologram shape on top of the Kiosk's side scale platform
      const holoTime = windUniforms.uTime.value;
      for (const cp of blueBase.commanderPads) {
        const sh = cp.kioskMesh?.userData?.sideHologram as
          | { holoTurntable: THREE.Group }
          | undefined;
        if (sh) {
          sh.holoTurntable.rotation.y = holoTime * 1.35;
          sh.holoTurntable.position.y = 1.05 + Math.sin(holoTime * 2.6) * 0.06;
        }
      }

      // Update 2D DOM floating prompt buttons with pixel-perfect Math.round() & Hysteresis at 60 FPS
      updateDirectDomPrompts();

      if (
        dirLight.shadow.map &&
        windUniforms.uDirShadowMap &&
        windUniforms.uDirShadowMatrix &&
        windUniforms.uHasDirShadow
      ) {
        windUniforms.uDirShadowMap.value =
          dirLight.shadow.map.depthTexture || dirLight.shadow.map.texture;
        windUniforms.uDirShadowMatrix.value.copy(dirLight.shadow.matrix);
        windUniforms.uHasDirShadow.value = 1.0;
      }

      // 5. Periodic HUD Snapshot Sync (12.5Hz for smooth HUD/Minimap while halving React App re-render overhead)
      hudSyncAccumulator += dt;
      if (hudSyncAccumulator >= 0.08) {
        hudSyncAccumulator = 0;
        onHudUpdate(buildHudSnapshot(null));
      }
    };

    const scratchProjectVec = new THREE.Vector3();
    const projectWorldToScreenPixels = (
      wx: number,
      wy: number,
      wz: number,
    ): { x: number; y: number; visible: boolean } => {
      const pvx = camFollowPos.x;
      const pvz = camFollowPos.z;
      const rx = pvx + getPlanetShortestDelta(wx, pvx);
      const rz = pvz + getPlanetShortestDelta(wz, pvz);
      const ry = wy + computePlanetYOffset(wx, wz, pvx, pvz, PLANET_CURVATURE_STRENGTH);
      scratchProjectVec.set(rx, ry, rz);
      scratchProjectVec.project(camera);
      if (scratchProjectVec.z < -1.0 || scratchProjectVec.z > 1.0) {
        return { x: 0, y: 0, visible: false };
      }
      const w = window.innerWidth;
      const h = window.innerHeight;
      const sx = Math.round(((scratchProjectVec.x + 1.0) * 0.5) * w);
      const sy = Math.round(((1.0 - scratchProjectVec.y) * 0.5) * h);
      const visible = sx >= 12 && sx <= w - 12 && sy >= 12 && sy <= h - 12;
      return { x: sx, y: sy, visible };
    };

    const isBuildingViewUrlParam =
      typeof window !== 'undefined' &&
      Boolean(new URLSearchParams(window.location.search).get('buildingview'));

    updateDirectDomPrompts = () => {
      if (
        playModeRef.current === 'editor' ||
        gameStateRef.current !== 'playing' ||
        isBuildingViewUrlParam
      ) {
        kioskPromptBtn.style.display = 'none';
        cratePromptBtn.style.display = 'none';
        padCraftPromptBtn.style.display = 'none';
        padDepositPromptBtn.style.display = 'none';
        return;
      }

      const actorX = mountedTank ? mountedTank.x : playerUnit.x;
      const actorZ = mountedTank ? mountedTank.z : playerUnit.z;

      // 1. Kiosk Prompt: [B] KIOSK (True world position via getWorldPosition, Math.round pixel transform, 2.6m -> 2.9m Hysteresis)
      const kioskWorldPos = getBlueKioskWorldCenter(0);
      const kx = kioskWorldPos.x;
      const kz = kioskWorldPos.z;
      const distToKiosk = getPlanetShortestDistance(actorX, actorZ, kx, kz);
      const kioskThreshold = isKioskPromptActive ? INTERACT_EXIT_RADIUS : INTERACT_ENTER_RADIUS;
      const nearKioskNow = distToKiosk <= kioskThreshold;
      isKioskPromptActive = nearKioskNow;

      if (nearKioskNow && !isKioskModalOpenCanvas) {
        const ky = getTerrainElevation(kx, kz) + 2.5;
        const proj = projectWorldToScreenPixels(kx, ky, kz);
        if (proj.visible) {
          kioskPromptBtn.style.display = 'block';
          kioskPromptBtn.style.transform = `translate3d(${proj.x}px, ${proj.y}px, 0) translate(-50%, -50%)`;
        } else {
          kioskPromptBtn.style.display = 'none';
        }
      } else {
        kioskPromptBtn.style.display = 'none';
      }

      // 2. On-Foot Crate Pickup: [E] AMBIL (Static terrain anchor, Math.round pixel transform, 2.6m -> 2.9m Hysteresis)
      if (!mountedTank && ridingTramCarIdx === null && playerUnit.alive && playerUnit.carryingCrate === 'none') {
        let nearestCrate: WorldCrate | null = null;
        let bestDist = 999;
        for (let i = 0; i < worldCrates.length; i++) {
          const c = worldCrates[i];
          if (c.state === 'grounded' || c.state === 'falling') {
            const d = getPlanetShortestDistance(c.x, c.z, playerUnit.x, playerUnit.z);
            const limit = activeCratePromptId === c.id ? INTERACT_EXIT_RADIUS : INTERACT_ENTER_RADIUS;
            if (d <= limit && d < bestDist) {
              bestDist = d;
              nearestCrate = c;
            }
          }
        }

        if (nearestCrate) {
          activeCratePromptId = nearestCrate.id;
          const cy = getTerrainElevation(nearestCrate.x, nearestCrate.z) + 0.95;
          const proj = projectWorldToScreenPixels(nearestCrate.x, cy, nearestCrate.z);
          if (proj.visible) {
            cratePromptBtn.style.display = 'block';
            cratePromptBtn.style.transform = `translate3d(${proj.x}px, ${proj.y}px, 0) translate(-50%, -50%)`;
          } else {
            cratePromptBtn.style.display = 'none';
          }
        } else {
          activeCratePromptId = null;
          cratePromptBtn.style.display = 'none';
        }
      } else {
        activeCratePromptId = null;
        cratePromptBtn.style.display = 'none';
      }

      // 3. Stacking Pad Prompts (2.6m -> 2.9m Hysteresis)
      const distToPad = getPlanetShortestDistance(actorX, actorZ, blueBase.padX, blueBase.padZ);
      const padEval = evaluateStackingPadRecipe(bluePadSlots);

      // Pad Craft Prompt
      const padCraftThreshold = isPadCraftPromptActive ? INTERACT_EXIT_RADIUS : INTERACT_ENTER_RADIUS;
      if (distToPad <= padCraftThreshold && padEval.totalCrates > 0) {
        isPadCraftPromptActive = true;
        const py = getTerrainElevation(blueBase.padX, blueBase.padZ) + 2.0;
        const proj = projectWorldToScreenPixels(blueBase.padX, py, blueBase.padZ);
        if (proj.visible) {
          padCraftPromptBtn.style.display = 'block';
          padCraftPromptBtn.style.transform = `translate3d(${proj.x}px, ${proj.y}px, 0) translate(-50%, -50%)`;
        } else {
          padCraftPromptBtn.style.display = 'none';
        }
      } else {
        isPadCraftPromptActive = false;
        padCraftPromptBtn.style.display = 'none';
      }

      // Pad Deposit Prompt
      const padDepositThreshold = isPadDepositPromptActive ? INTERACT_EXIT_RADIUS : INTERACT_ENTER_RADIUS;
      if (
        distToPad <= padDepositThreshold &&
        ((!mountedTank && playerUnit.carryingCrate !== 'none') ||
          (mountedTank && mountedTank.storedCrates.length > 0))
      ) {
        isPadDepositPromptActive = true;
        const py = getTerrainElevation(blueBase.padX, blueBase.padZ) + 1.45;
        const proj = projectWorldToScreenPixels(blueBase.padX, py, blueBase.padZ);
        if (proj.visible) {
          padDepositPromptBtn.style.display = 'block';
          padDepositPromptBtn.style.transform = `translate3d(${proj.x}px, ${proj.y}px, 0) translate(-50%, -50%)`;
        } else {
          padDepositPromptBtn.style.display = 'none';
        }
      } else {
        isPadDepositPromptActive = false;
        padDepositPromptBtn.style.display = 'none';
      }
    };

    const projectWorldToScreenPct = (
      wx: number,
      wy: number,
      wz: number,
    ): { xPct: number; yPct: number; visible: boolean } => {
      const pvx = camFollowPos.x;
      const pvz = camFollowPos.z;
      const rx = pvx + getPlanetShortestDelta(wx, pvx);
      const rz = pvz + getPlanetShortestDelta(wz, pvz);
      const ry = wy + computePlanetYOffset(wx, wz, pvx, pvz, PLANET_CURVATURE_STRENGTH);
      scratchProjectVec.set(rx, ry, rz);
      scratchProjectVec.project(camera);
      if (scratchProjectVec.z < -1.0 || scratchProjectVec.z > 1.0) {
        return { xPct: 50, yPct: 50, visible: false };
      }
      const xPct = clamp((scratchProjectVec.x + 1.0) * 50.0, 10, 90);
      const yPct = clamp((1.0 - scratchProjectVec.y) * 50.0, 12, 86);
      return { xPct, yPct, visible: true };
    };

    const buildHudSnapshot = (outcome: 'victory' | 'defeat' | null): HudSnapshot => {
      const padEval = evaluateStackingPadRecipe(bluePadSlots);
      const orderSpec = BUILD_ORDER_SPECS[buildOrder];
      const actorX = mountedTank ? mountedTank.x : playerUnit.x;
      const actorZ = mountedTank ? mountedTank.z : playerUnit.z;

      let contextHint =
        playerUnit.weaponId === 'unarmed'
          ? `WASD Lari · [Spasi] Lompat · Klik Kiri: Tinju · [F] Tendang / Rakit · [E] Ambil Peti`
          : `WASD Lari · [Spasi] Lompat · [4] Tinju · [F] Tendang / Rakit · [E] Ambil Peti`;
      if (playModeRef.current === 'editor') {
        contextHint = `Klik Kiri: Pasang · Klik Kanan: Hapus · [R] Putar (${Math.round((editorRotY * 180) / Math.PI)}°) · [ / ] Skala (${editorScale.toFixed(2)}x) · WASD Geser Kamera`;
      } else if (ridingTramCarIdx !== null) {
        contextHint = `Di Dalam Trem Kota (Gerbong ${ridingTramCarIdx + 1}) [AMAN & PEMULIHAN HP] · [G / F / Spasi] Turun di Manapun`;
      } else if (mountedTank) {
        if (mountedTank.vehicleKind === 'plane') {
          const altVal = mountedTank.altitude ?? 0;
          const flightStatus =
            altVal < 0.3
              ? 'Di Darat (Siap Take-Off)'
              : altVal >= 8.0
              ? `Terbang Tinggi Di Atas Pohon (${altVal.toFixed(1)}m)`
              : `Terbang (${altVal.toFixed(1)}m)`;
          contextHint = `Lyo Plane [${flightStatus}] · [W] Maju · [Spasi/E] Naik (Take-Off) · [C/S] Rem & Turun · [G] Keluar`;
        } else if (mountedTank.vehicleKind === 'truck') {
          contextHint = `Dump Truck (${mountedTank.storedCrates.length}/${DUMP_TRUCK_MAX_CRATES} Peti) · [E] Tuang Hidrolik · [G] Turun`;
        } else {
          const vLabel = mountedTank.isSuper ? 'Tyrant Tank' : 'Lyo Tank';
          contextHint = `Mengendarai ${vLabel} (${mountedTank.storedCrates.length}/4 Peti) · [G] Turun`;
        }
      } else if (playerUnit.carryingCrate !== 'none') {
        const nearTruck = tanks.find(
          (t) =>
            t.vehicleKind === 'truck' &&
            t.hp > 0 &&
            getPlanetShortestDistance(t.x, t.z, actorX, actorZ) <= 6.8,
        );
        if (nearTruck) {
          contextHint =
            nearTruck.storedCrates.length < DUMP_TRUCK_MAX_CRATES
              ? `Dekat Dump Truck (${nearTruck.storedCrates.length}/${DUMP_TRUCK_MAX_CRATES} Peti) · [E] / Dekati Bak Untuk Isi 1 Peti`
              : `Bak Dump Truck Penuh (${DUMP_TRUCK_MAX_CRATES}/${DUMP_TRUCK_MAX_CRATES} Peti) · [G] Kemudikan`;
        } else {
          contextHint = `Membawa Peti di Kepala · [E] Lempar ke Pad (${padEval.totalCrates}/${orderSpec.targetCrates}) atau Masukkan ke Bak Truck`;
        }
      } else if (getPlanetShortestDistance(actorX, actorZ, blueBase.padX, blueBase.padZ) <= 8.5 && padEval.totalCrates > 0) {
        contextHint = `Dekat Pad · [F] Rakit ${padEval.outputName} · [B] Mesin Kiosk Pad`;
      } else if (
        getPlanetShortestDistance(actorX, actorZ, getBlueKioskWorldCenter(0).x, getBlueKioskWorldCenter(0).z) <= 6.8 ||
        getPlanetShortestDistance(actorX, actorZ, blueBase.padX, blueBase.padZ) <= 6.8
      ) {
        contextHint = `Dekat Mesin Self-Service Kiosk Pad · [B / E / F] Buka Menu Prioritas Senjata, Upgrade Base & Beli Crate`;
      } else {
        let closestVehicle: TankVehicle | null = null;
        let closestDist = 7.5;
        for (const t of tanks) {
          if (!t.occupiedByPlayer && t.hp > 0) {
            const d = getPlanetShortestDistance(t.x, t.z, actorX, actorZ);
            if (d <= closestDist) {
              closestDist = d;
              closestVehicle = t;
            }
          }
        }
        if (closestVehicle) {
          contextHint =
            closestVehicle.vehicleKind === 'plane'
              ? 'Dekat Lyo Plane (Di Darat) · [G] Masuk Kokpit & Take-Off'
              : closestVehicle.vehicleKind === 'truck'
              ? `Dekat Dump Truck (${closestVehicle.storedCrates.length}/${DUMP_TRUCK_MAX_CRATES} Peti) · Isi Peti Satu-Persatu dengan Karakter atau [G] Kemudikan`
              : 'Dekat Tank Lyo · [G] Naik ke Kubah Meriam';
        } else if (
          canUnitBoardCityTramAtAnyPoint(actorX, actorZ, cityTram.getState(), 3.2).canBoard
        ) {
          contextHint =
            'Dekat Trem Kota · [G] Naik Trem (Kabur / Berlindung & Turun di Manapun)';
        }
      }

      if (activeMuzzleRaycastResult?.isTargetLocked && activeMuzzleRaycastResult.targetLabel) {
        contextHint = `🎯 TARGET TERKUNCI: ${activeMuzzleRaycastResult.targetLabel} (${activeMuzzleRaycastResult.distance.toFixed(1)}m) · ${contextHint}`;
      }

      // Build Mini-Radar dots & Personal Command Center Radar state from live 3D entities
      const myPlot = blueCommanderBases[0];
      const activeSupplyLocId = supplyDropSchedule.warningActive
        ? supplyDropSchedule.nextLocationId
        : supplyDropSchedule.nextLocationId === 'CENTRAL_OASIS'
          ? 'HARBOR_DOCK'
          : 'CENTRAL_OASIS';
      const activeSupplySpec = SUPPLY_DROP_LOCATIONS[activeSupplyLocId];
      const radarEvaluation = evaluatePlayerCommandCenterRadarAndMinimapDots({
        myPlot,
        buddyUnits,
        tanks,
        playerUnit,
        mountedTank,
        teamCommand: playerUnit.assignedRole ?? teamCommand,
        actorX,
        actorZ,
        activeSupplyDropSignal:
          supplyDropSchedule.warningActive || supplyDropBeaconLingeringTimer > 0
            ? { x: activeSupplySpec.x, z: activeSupplySpec.z }
            : null,
      });
      const radarDots: RadarDot[] = radarEvaluation.radarDots;

      const personalSquad = buddyUnits.filter(
        (b) => b.team === 'blue' && b.alive && b.ownerCommanderId === 0,
      );
      const activePersonalIdx = Math.max(0, personalSquad.indexOf(playerUnit));
      const blueSkyshieldsBuilt = getBaseSkyshieldTurrets(blueBase.baseGroup).filter(
        (st) => st.isBuilt,
      ).length;
      const activeRecipeSpec = useCustomHologramRecipe
        ? KIOSK_BUILD_PRIORITY_RECIPES[activePriorityRecipe]
        : null;
      const hudKioskPos = getBlueKioskWorldCenter(0);
      const isNearKiosk =
        isKioskPromptActive ||
        getPlanetShortestDistance(actorX, actorZ, hudKioskPos.x, hudKioskPos.z) <= INTERACT_EXIT_RADIUS;
      // Floating prompts are rendered via direct 60 FPS DOM overlay with Math.round & hysteresis (zero React re-render)
      const floatingPrompts: FloatingWorldPrompt[] = [];

      return {
        hp: mountedTank ? mountedTank.hp : playerUnit.hp,
        maxHp: mountedTank ? mountedTank.maxHp : playerUnit.maxHp,
        score,
        gold,
        bestScore: Math.max(bestScore, score),
        speedKmh: Math.round(
          Math.hypot(
            mountedTank ? mountedTank.vx : playerUnit.vx,
            mountedTank ? mountedTank.vz : playerUnit.vz,
          ) * 3.6,
        ),
        isBoosting: Boolean(keys['ShiftLeft'] || keys['ShiftRight']),
        isGrabMode: Boolean(mountedTank),
        grabbedPropName: mountedTank
          ? mountedTank.vehicleKind === 'plane'
            ? 'Lyo Plane'
            : mountedTank.vehicleKind === 'truck'
            ? 'Dump Truck'
            : 'Lyo Tank'
          : null,
        collectedItems: [
          padEval.totalCrates >= 1 ? 'GEAR' : '',
          padEval.totalCrates >= 2 ? 'TOOLS' : '',
          padEval.totalCrates >= 4 ? 'CIRCUIT' : '',
          padEval.totalCrates >= 8 ? 'FUEL' : '',
        ].filter(Boolean),
        powerCoreActivated: redBaseHp <= 0,
        enemiesDefeated,
        totalEnemies: 4,
        lightingPreset: lightingPresetRef.current,
        cameraFovMode: cameraFovModeRef.current,
        outcome,
        clearTimeSec: Math.round(runElapsedSec),
        controlMode: mountedTank ? 'tank' : 'buddy',
        activeClass: playerUnit.classId,
        equippedWeapon: mountedTank
          ? mountedTank.vehicleKind === 'plane'
            ? 'Twin Minigun Pesawat'
            : mountedTank.vehicleKind === 'truck'
            ? 'Hidrolik 4 Peti'
            : 'Meriam Tank 105mm'
          : playerUnit.weaponName,
        ammo: playerUnit.ammo,
        hudWeaponBadges: getVisibleHudWeaponAndTacticalBadges(playerUnit.tacticalLoadout),
        carryingCrate: playerUnit.carryingCrate,
        tankStoredCrates: mountedTank ? mountedTank.storedCrates.length : 0,
        padSlots: [...bluePadSlots],
        padHologramColors: activeRecipeSpec
          ? [...activeRecipeSpec.slotHologramColors]
          : ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
        activePriorityRecipe,
        buildQueue: useCustomHologramRecipe ? [...blueBuildQueue] : [],
        padShape: padEval.shapeKey,
        padOutputName: padEval.outputName,
        padIsMerged: padEval.isMerged,
        padIsSuper: padEval.isSuper,
        buildOrder,
        buildOrderLabel: activeRecipeSpec ? activeRecipeSpec.name : orderSpec.label,
        buildOrderTargetCrates: activeRecipeSpec ? activeRecipeSpec.targetCrates : orderSpec.targetCrates,
        baseBuildingLevel: myPlot?.buildingLevel ?? 1,
        commandCenterLevel: radarEvaluation.operatorStatus.commandCenterLevel,
        commandCenterRadarActive: radarEvaluation.operatorStatus.radarActive,
        commandCenterRadarCoveragePct: radarEvaluation.operatorStatus.coveragePct,
        baseBuildingHp: myPlot?.buildingHp ?? 400,
        baseBuildingMaxHp: myPlot?.buildingMaxHp ?? 400,
        baseFenceLevel: myPlot?.fenceLevel ?? 1,
        baseFenceHp: myPlot?.fenceHp ?? 260,
        baseFenceMaxHp: myPlot?.fenceMaxHp ?? 260,
        baseHasParkingBay: myPlot?.hasParkingBay ?? true,
        baseHasHelipad: myPlot?.hasHelipad ?? true,
        isNearKiosk,
        kioskStatusMessage,
        supplyDropBanner: supplyDropSchedule.bannerText,
        teamCommand: playerUnit.assignedRole ?? teamCommand,
        alliedBuddiesCount: buddyUnits.filter((b) => b.team === 'blue' && b.alive).length,
        personalSquadCount: personalSquad.length,
        personalSquadMax: MAX_CHARACTERS_PER_COMMANDER,
        personalSquadClasses: personalSquad.map((b) => b.classId),
        activePersonalBuddyIndex: activePersonalIdx,
        blueHumanCount: matchmakingState.blueCommanders.filter((s) => s.controller === 'human').length,
        blueAiCommanderCount: matchmakingState.blueCommanders.filter((s) => s.controller === 'ai').length,
        redHumanCount: matchmakingState.redCommanders.filter((s) => s.controller === 'human').length,
        redAiCommanderCount: matchmakingState.redCommanders.filter((s) => s.controller === 'ai').length,
        skyshieldBuiltCount: blueSkyshieldsBuilt,
        blueBaseHp,
        redBaseHp,
        contextHint,
        radarDots,
        floatingPrompts,
        editorObjectCount: currentMapLayout.props.length,
        editorCursorX: Math.round(aimWorldPoint.x * 2) / 2,
        editorCursorZ: Math.round(aimWorldPoint.z * 2) / 2,
        editorRotDeg: Math.round((editorRotY * 180) / Math.PI),
        editorScale,
        nuclearStrikePhase: nukeStrikeState.phase,
        nuclearTargetCoords: {
          x: Math.round(nukeStrikeState.targetPos.x),
          z: Math.round(nukeStrikeState.targetPos.z),
        },
        hasDeployedNuclearLauncher: activeNuclearLaunchers.some((n) => n.team === 'blue'),
      };
    };
    emitHudImmediately = () => {
      onHudUpdate(buildHudSnapshot(null));
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(rafId);
      soundEngine.stopAllLoops();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('buddy-action', onBuddyActionEvent);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('toggle-kiosk-ui', onKioskUiToggled);
      window.removeEventListener('close-kiosk-ui', onKioskUiClosed);
      if (promptOverlay.parentElement) {
        promptOverlay.parentElement.removeChild(promptOverlay);
      }
      tolanPlanetEnv.dispose();
      cityTram.dispose();
      lyoGrassSystem.dispose();
      lyoExplosionSystem.dispose();
      renderer.dispose();
    };
  }, [onGameOver, onHudUpdate, onTogglePause, onMapSaved]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 w-screen h-screen overflow-hidden"
      style={{ cursor: gameState === 'playing' ? 'crosshair' : 'default' }}
    />
  );
};

export const FactoryPlaygroundCanvas = BuddiesBlitzArena;
