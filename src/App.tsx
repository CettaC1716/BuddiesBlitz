import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FactoryPlaygroundCanvas,
  GameState,
  PlayMode,
  EditorToolId,
  HudSnapshot,
} from './game/FactoryPlaygroundCanvas';
import {
  REA_CONSTANTS,
  LIGHTING_PRESETS,
  LightingPresetKey,
  getBuildOrderAllowedSlots,
  RADAR_WORLD_HALF_EXTENT,
  evaluateCommandCenterRadarSpec,
  worldCoordToRadarPercent,
} from './game/rules';
import { soundEngine } from './game/audio';
import { ReaLuauModal } from './components/ReaLuauModal';
import { TacticalKioskModal } from './components/TacticalKioskModal';

const INITIAL_HUD: HudSnapshot = {
  hp: 30,
  maxHp: 30,
  score: 0,
  gold: 2500,
  bestScore: 0,
  speedKmh: 0,
  isBoosting: false,
  isGrabMode: false,
  grabbedPropName: null,
  collectedItems: [],
  powerCoreActivated: false,
  enemiesDefeated: 0,
  totalEnemies: 4,
  lightingPreset: 'day',
  cameraFovMode: 'webgl35',
  outcome: null,
  clearTimeSec: 0,
  controlMode: 'buddy',
  activeClass: 'Infuntry',
  equippedWeapon: 'Tangan Kosong (Tinju)',
  ammo: 0,
  carryingCrate: 'none',
  tankStoredCrates: 0,
  padSlots: ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'],
  padHologramColors: ['red', 'empty', 'empty', 'empty', 'red', 'empty', 'empty', 'empty'],
  activePriorityRecipe: 'buddy_infantry',
  padShape: 'Empty',
  padOutputName: 'Pad Kosong',
  padIsMerged: false,
  padIsSuper: false,
  buildOrder: '1x1x2',
  buildOrderLabel: 'Buddy Infanteri',
  buildOrderTargetCrates: 2,
  baseBuildingLevel: 1,
  baseBuildingHp: 400,
  baseBuildingMaxHp: 400,
  baseFenceLevel: 1,
  baseFenceHp: 260,
  baseFenceMaxHp: 260,
  baseHasParkingBay: true,
  baseHasHelipad: true,
  isNearKiosk: false,
  kioskStatusMessage: null,
  teamCommand: 'HARVEST',
  alliedBuddiesCount: 1,
  personalSquadCount: 1,
  personalSquadMax: 4,
  personalSquadClasses: ['Infuntry'],
  activePersonalBuddyIndex: 0,
  blueHumanCount: 2,
  blueAiCommanderCount: 2,
  redHumanCount: 2,
  redAiCommanderCount: 2,
  skyshieldBuiltCount: 0,
  blueBaseHp: 2000,
  redBaseHp: 2000,
  contextHint: 'WASD Lari · [E] Ambil Peti · [Q] Pola 1x1x2 · [F] Rakit',
  radarDots: [],
  floatingPrompts: [],
  editorObjectCount: 19,
  editorCursorX: 0,
  editorCursorZ: 0,
  editorRotDeg: 0,
  editorScale: 1.0,
};

const PRESET_ORDER: LightingPresetKey[] = ['day', 'dusk', 'night', 'dawn'];

interface EditorToolOption {
  id: EditorToolId;
  label: string;
  sub: string;
  accentHex: string;
}

const EDITOR_TERRAIN_BRUSH_TOOLS: EditorToolOption[] = [
  { id: 'sculpt_raise', label: 'Sculpt Bukit +', sub: 'Naikkan Elevasi Bukit', accentHex: '#b8ff3c' },
  { id: 'sculpt_lower', label: 'Sculpt Cekungan -', sub: 'Pahat Lembah / Sungai', accentHex: '#00d2ff' },
  { id: 'sculpt_flatten', label: 'Ratakannya / Flatten', sub: 'Ratakan Permukaan Tanah', accentHex: '#fec83e' },
];

const EDITOR_STRUCTURE_TOOLS: EditorToolOption[] = [
  { id: 'move_blue_hq', label: 'Pindah Blue HQ', sub: 'Markas Tim Biru', accentHex: '#00d2ff' },
  { id: 'move_blue_pad', label: 'Pindah Stacking Pad Biru', sub: 'Pad Rakit 2x2x2 Biru', accentHex: '#2979ff' },
  { id: 'move_red_hq', label: 'Pindah Red HQ', sub: 'Markas Tim Merah', accentHex: '#ff3b30' },
  { id: 'move_red_pad', label: 'Pindah Stacking Pad Merah', sub: 'Pad Rakit 2x2x2 Merah', accentHex: '#ff554a' },
  { id: 'move_drop_zone', label: 'Pindah Drop Zone', sub: 'Titik Airdrop Tengah', accentHex: '#fec83e' },
];

const EDITOR_INDUSTRIAL_TOOLS: EditorToolOption[] = [
  { id: 'dump_truck', label: 'Dump Truck', sub: 'dump-truck.glb', accentHex: '#fec83e' },
  { id: 'crane', label: 'Crane', sub: 'crane.glb', accentHex: '#f59e0b' },
  { id: 'chimney', label: 'Chimney (Cerobong)', sub: 'chimney.glb', accentHex: '#ef4444' },
  { id: 'giant_tank', label: 'Giant Tank', sub: 'giant-tank.glb', accentHex: '#38bdf8' },
  { id: 'tank_1a', label: 'Fuel Tank', sub: 'tank-1a.glb', accentHex: '#60a5fa' },
  { id: 'pipe_cluster', label: 'Pipe Cluster', sub: 'pipe-cluster-1a.glb', accentHex: '#94a3b8' },
  { id: 'power_core', label: 'Power Core', sub: 'power-core.glb', accentHex: '#b8ff3c' },
  { id: 'concrete_fence', label: 'Concrete Fence', sub: 'concrete-fence-1a.glb', accentHex: '#cbd5e1' },
  { id: 'barricade', label: 'Barricade', sub: 'barricade-1a.glb', accentHex: '#facc15' },
  { id: 'lamppost_1a', label: 'Lamppost', sub: 'lamppost-1a.glb', accentHex: '#fde047' },
  { id: 'explosive_barrel', label: 'Explosive Barrel', sub: 'explosive-barrel.glb', accentHex: '#ff3b30' },
];

const EDITOR_NATURE_TOOLS: EditorToolOption[] = [
  { id: 'tree_gold', label: 'Pohon 1A', sub: 'tree-1a.glb (Emas/Hijau)', accentHex: '#b8ff3c' },
  { id: 'tree_purple', label: 'Pohon 1B', sub: 'tree-1b.glb (Ungu Lyo)', accentHex: '#a855f7' },
  { id: 'turbine', label: 'Turbin Angin', sub: 'turbine.glb (Berputar)', accentHex: '#00d2ff' },
  { id: 'bench', label: 'Bench', sub: 'bench.glb (Bangku Taman)', accentHex: '#d97706' },
  { id: 'wheelbarrow', label: 'Wheelbarrow', sub: 'wheelbarrow.glb (Gerobak)', accentHex: '#ea580c' },
  { id: 'river_rock', label: 'Batu Sungai', sub: 'Batu Lumut Bantaran', accentHex: '#94a3b8' },
  { id: 'flower_cluster', label: 'Rumpun Bunga', sub: 'Bunga Padang Tolan', accentHex: '#f472b6' },
];

type EditorSidebarTab = 'terrain' | 'industrial' | 'nature';

export default function App() {
  // Default to 'playing' in SANDBOX TEST (NO NPC) mode when first opened (unless ?title=1 is passed)
  const [gameState, setGameState] = useState<GameState>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('title') === '1') {
        return 'title';
      }
    }
    return 'playing';
  });

  const [playMode, setPlayMode] = useState<PlayMode>('sandbox');
  const [editorTab, setEditorTab] = useState<EditorSidebarTab>('terrain');
  const [editorTool, setEditorTool] = useState<EditorToolId>('sculpt_raise');
  const [editorBrushRadius, setEditorBrushRadius] = useState<number>(10);
  const [isSpawnDrawerOpen, setIsSpawnDrawerOpen] = useState<boolean>(false);
  const [mapSaveStatus, setMapSaveStatus] = useState<string | null>(null);

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [finalRunStats, setFinalRunStats] = useState<HudSnapshot | null>(null);
  const [lightingPreset, setLightingPreset] = useState<LightingPresetKey>('day');
  const [cameraFovMode, setCameraFovMode] = useState<'webgl35' | 'roblox18'>('webgl35');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isReaModalOpen, setIsReaModalOpen] = useState<boolean>(false);
  const [isKioskModalOpen, setIsKioskModalOpen] = useState<boolean>(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [resetTrigger, setResetTrigger] = useState<number>(0);

  const hexContainerRef = useRef<HTMLDivElement | null>(null);
  const [hexRect, setHexRect] = useState<{ left: number; top: number; width: number; height: number }>({
    left: 720,
    top: 140,
    width: 480,
    height: 462,
  });

  useEffect(() => {
    document.body.dataset.state = gameState;
    document.body.dataset.mode = playMode;
  }, [gameState, playMode]);

  const handleMapSaved = useCallback((msg: string) => {
    setMapSaveStatus(msg);
    setTimeout(() => {
      setMapSaveStatus(null);
    }, 2800);
  }, []);

  const syncHexBounds = useCallback(() => {
    if (!hexContainerRef.current) return;
    const r = hexContainerRef.current.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      setHexRect({
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
      });
    }
  }, []);

  useEffect(() => {
    syncHexBounds();
    window.addEventListener('resize', syncHexBounds);
    return () => window.removeEventListener('resize', syncHexBounds);
  }, [syncHexBounds, gameState]);

  const dispatchBuddyAction = useCallback((actionName: string) => {
    window.dispatchEvent(new CustomEvent('buddy-action', { detail: actionName }));
  }, []);

  const handleStartGame = useCallback((shouldReset = false) => {
    soundEngine.playUiClick();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (shouldReset) {
      setResetTrigger((prev) => prev + 1);
      setFinalRunStats(null);
    }
    document.body.dataset.state = 'playing';
    setGameState('playing');
  }, []);

  const handleSwitchPlayMode = useCallback((nextMode: PlayMode) => {
    soundEngine.playUiClick();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setPlayMode(nextMode);
    if (nextMode === 'editor') {
      setIsSpawnDrawerOpen(false);
    }
    if (gameState !== 'playing') {
      setGameState('playing');
    }
  }, [gameState]);

  const handleToggleAudio = useCallback(() => {
    const nextMuted = !soundEngine.muted;
    soundEngine.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted) {
      soundEngine.playUiClick();
    }
  }, []);

  const handleCycleLighting = useCallback(() => {
    soundEngine.playUiClick();
    setLightingPreset((prev) => {
      const idx = PRESET_ORDER.indexOf(prev);
      return PRESET_ORDER[(idx + 1) % PRESET_ORDER.length];
    });
  }, []);

  const handleToggleFovMode = useCallback(() => {
    soundEngine.playUiClick();
    setCameraFovMode((prev) => (prev === 'webgl35' ? 'roblox18' : 'webgl35'));
  }, []);

  const handleTogglePause = useCallback(() => {
    soundEngine.playUiClick();
    setGameState((prev) => {
      const next = prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev;
      document.body.dataset.state = next;
      return next;
    });
  }, []);

  const handleGameOver = useCallback(
    (_outcome: 'victory' | 'defeat', snapshot: HudSnapshot) => {
      setFinalRunStats(snapshot);
      document.body.dataset.state = 'gameover';
      setGameState('gameover');
    },
    [],
  );

  useEffect(() => {
    const onToggleKiosk = () => {
      setIsKioskModalOpen((prev) => !prev);
    };
    window.addEventListener('toggle-kiosk-ui', onToggleKiosk);
    return () => window.removeEventListener('toggle-kiosk-ui', onToggleKiosk);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isKioskModalOpen) {
        if (e.code === 'Escape' || e.code === 'KeyB') {
          e.preventDefault();
          e.stopImmediatePropagation();
          setIsKioskModalOpen(false);
        }
        return;
      }

      if (isReaModalOpen) {
        if (e.code === 'Escape') {
          setIsReaModalOpen(false);
        }
        return;
      }

      if (gameState === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        handleStartGame(false);
        return;
      }

      if (e.code === 'KeyM') {
        handleToggleAudio();
      } else if (e.code === 'KeyL') {
        handleCycleLighting();
      } else if (e.code === 'KeyC') {
        handleToggleFovMode();
      } else if (e.code === 'KeyH') {
        setIsDockCollapsed((prev) => !prev);
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [
    gameState,
    isKioskModalOpen,
    isReaModalOpen,
    handleStartGame,
    handleToggleAudio,
    handleCycleLighting,
    handleToggleFovMode,
  ]);

  const currentPresetConfig = LIGHTING_PRESETS[lightingPreset];
  const scaleX = hexRect.width / 500;
  const scaleY = hexRect.height / 482;
  const isFullMapOverview =
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('fullmap') === '1' ||
      Boolean(new URLSearchParams(window.location.search).get('planeview')) ||
      Boolean(new URLSearchParams(window.location.search).get('skyshieldview')) ||
      Boolean(new URLSearchParams(window.location.search).get('buildingview')));

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none">
      {/* 1. 60FPS 3D Team Buddies x Lyo Grassland Arena */}
      <FactoryPlaygroundCanvas
        gameState={gameState}
        playMode={playMode}
        editorTool={editorTool}
        editorBrushRadius={editorBrushRadius}
        lightingPreset={lightingPreset}
        cameraFovMode={cameraFovMode}
        resetTrigger={resetTrigger}
        onHudUpdate={setHud}
        onGameOver={handleGameOver}
        onTogglePause={handleTogglePause}
        onMapSaved={handleMapSaved}
      />

      {/* Atmospheric Viewport Color Tint Overlay */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-10 transition-colors duration-700"
        style={{
          backgroundColor: currentPresetConfig.viewportFilterColor,
          opacity: currentPresetConfig.viewportFilterOpacity,
        }}
      />

      {/* =====================================================================
          2. TITLE SCREEN: HEXAGON CUTOUT & COMIC STICKER LOCKUP (CJn-Xu8f.js)
         ===================================================================== */}
      {gameState === 'title' && (
        <section
          aria-label="LYOOO Portfolio Title Screen"
          className="fixed inset-0 z-20 flex flex-col justify-between pointer-events-none"
        >
          <svg
            className="fixed inset-0 w-full h-full pointer-events-none"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
          >
            <defs>
              <mask
                id="intro-mask-cutout"
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="100%"
                height="100%"
              >
                <rect width="100%" height="100%" fill="white" />
                <g
                  transform={`translate(${hexRect.left}, ${hexRect.top}) scale(${scaleX}, ${scaleY})`}
                >
                  <path d={REA_CONSTANTS.introHexagonSvgPath} fill="black" />
                </g>
              </mask>
              <linearGradient id="intro-overlay-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0b0c12" stopOpacity="0.94" />
                <stop offset="52%" stopColor="#11121a" stopOpacity="0.86" />
                <stop offset="100%" stopColor="#11121a" stopOpacity="0.72" />
              </linearGradient>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="url(#intro-overlay-gradient)"
              mask="url(#intro-mask-cutout)"
            />
          </svg>

          <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 items-center px-6 sm:px-12 lg:px-16 pt-8 pb-4 gap-6">
            <div className="lg:col-span-6 flex flex-col items-start justify-end lg:justify-center space-y-5 pointer-events-auto">
              <svg
                viewBox="0 0 560 225"
                className="w-full max-w-[510px] drop-shadow-[6px_8px_0px_#11121a]"
                role="img"
                aria-label="LYOOO PORTFOLIO"
              >
                <g transform="rotate(-3 260 85)">
                  <rect
                    x="10"
                    y="12"
                    width="455"
                    height="108"
                    rx="18"
                    fill="#ffffff"
                    stroke="#11121a"
                    strokeWidth="8"
                  />
                  <text
                    x="32"
                    y="94"
                    fontFamily="'Barlow', sans-serif"
                    fontWeight="900"
                    fontStyle="italic"
                    fontSize="94"
                    letterSpacing="2"
                    fill="#ffffff"
                    stroke="#11121a"
                    strokeWidth="16"
                    paintOrder="stroke fill"
                  >
                    LYOOO
                  </text>
                </g>

                <g transform="translate(24, 108) rotate(-1.5 220 45)">
                  <rect
                    x="0"
                    y="0"
                    width="430"
                    height="84"
                    rx="14"
                    fill="#b4ff39"
                    stroke="#ffffff"
                    strokeWidth="10"
                  />
                  <rect
                    x="4"
                    y="4"
                    width="422"
                    height="76"
                    rx="11"
                    fill="#b4ff39"
                    stroke="#11121a"
                    strokeWidth="6"
                  />
                  <text
                    x="26"
                    y="61"
                    fontFamily="'Barlow', sans-serif"
                    fontWeight="900"
                    fontSize="58"
                    letterSpacing="4"
                    fill="#11121a"
                  >
                    PORTFOLIO
                  </text>
                </g>
              </svg>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    setIsReaModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-[#272935] hover:bg-[#393b49] text-[#b8ff3c] font-black text-xs sm:text-sm rounded-xl border-3 border-[#11121a] ring-2 ring-white/80 comic-sticker-shadow transition-transform hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
                >
                  Kode Luau
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 flex items-center justify-center">
              <div
                ref={hexContainerRef}
                className="relative w-[330px] h-[318px] sm:w-[440px] sm:h-[424px] lg:w-[485px] lg:h-[468px] pointer-events-none"
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 500 482"
                  fill="none"
                  className="absolute inset-0 w-full h-full"
                >
                  <path
                    d={REA_CONSTANTS.introHexagonSvgPath}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.55)"
                    strokeWidth="3.5"
                  />
                  <path
                    d={REA_CONSTANTS.introHexagonSvgPath}
                    fill="none"
                    stroke="#11121a"
                    strokeWidth="2"
                    strokeDasharray="10 6"
                  />
                </svg>

                <button
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    handleToggleAudio();
                  }}
                  aria-label={isMuted ? 'Suara Mati' : 'Suara Aktif'}
                  className="pointer-events-auto absolute top-3 right-6 w-14 h-14 flex items-center justify-center bg-white hover:bg-[#fec83e] text-[#11121a] font-black text-xs border-4 border-[#11121a] ring-2 ring-white rounded-2xl rotate-6 comic-sticker-shadow transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  {isMuted ? 'MUTE' : 'SUARA'}
                </button>

                <button
                  type="button"
                  data-start="true"
                  onClick={() => handleStartGame(false)}
                  aria-label="LET'S GO"
                  className="pointer-events-auto absolute -bottom-3 left-1/2 -translate-x-1/2 -rotate-3 hover:-rotate-6 hover:scale-108 active:scale-95 px-9 py-4 bg-[#b4ff39] hover:bg-[#c7ff72] text-[#11121a] font-black text-2xl sm:text-3xl tracking-wider rounded-2xl border-4 border-[#11121a] ring-4 ring-white comic-sticker-shadow-lg transition-all duration-150 cursor-pointer whitespace-nowrap"
                >
                  LET&apos;S GO
                </button>
              </div>
            </div>
          </div>

          <div className="relative z-10 pb-5 px-6 text-center text-xs sm:text-sm font-bold tracking-wide text-[#dfdfe2]/85">
            WASD Lari &nbsp;·&nbsp; [E] Ambil/Lempar Peti &nbsp;·&nbsp; [Q] Pola Ghost Pad &nbsp;·&nbsp; [F] Rakit &nbsp;·&nbsp; [V] Teropong AI
          </div>
        </section>
      )}

      {/* =====================================================================
          3. PLAYING HUD: STYLIZED TACTICAL ARCADE OVERHAUL
             - Top-Left: Compact Radar/Minimap + [Q: 1x1x2] Pad Badge
             - Top-Center: Skewed Arcade Health/Score Bar ("BLUE 2000 vs RED 2000")
             - Top-Right: Prominent [RUN MATCH] (prep mode) + Skewed [⚙] Dev Drawer
             - Viewport: 3D-to-2D Contextual Hexagonal Floating Prompts ([E] AMBIL, [F] RAKIT, [G] NAIK, [B] KIOSK)
             - Bottom-Right: Compact 3 Weapon Slots ([1] Pistol, [2] Rifle, [3] Bazooka)
         ===================================================================== */}
      {gameState === 'playing' && !isFullMapOverview && (
        <div className="fixed inset-0 z-20 pointer-events-none">
          {/* =================================================================
              3A. MINIMALIST CONTEXTUAL 3D-TO-2D FLOATING ICONS
                  - Item / Crate Pickup & Deposit: Hand Emoji ONLY (✋)
                  - Machine / Kiosk / Pad / Vehicle: Tilted White-Black Polygon Dot Icon
             ================================================================= */}
          <div
            aria-label="Contextual 3D Floating Prompts"
            className="fixed inset-0 pointer-events-none z-20 overflow-hidden"
          >
            {!isKioskModalOpen &&
              hud.floatingPrompts.map((fp) => (
                <button
                  key={fp.id}
                  type="button"
                  tabIndex={-1}
                  data-floating-prompt={fp.id}
                  aria-label={`${fp.actionLabel} [${fp.keyLabel}]`}
                  title={`${fp.actionLabel} [${fp.keyLabel}]`}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    dispatchBuddyAction(fp.actionEvent);
                  }}
                  style={{
                    left: `${fp.xPct}%`,
                    top: `${fp.yPct}%`,
                  }}
                  className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 hover:scale-115 active:scale-90 cursor-pointer select-none"
                >
                  {fp.iconType === 'hand' ? (
                    <span
                      role="img"
                      aria-hidden="true"
                      className="inline-block text-[32px] sm:text-[36px] leading-none drop-shadow-[0_3px_0_#14161d] filter-[drop-shadow(0_0_2px_#ffffff)]"
                    >
                      ✋
                    </span>
                  ) : (
                    <svg
                      viewBox="0 0 64 64"
                      className="w-11 h-11 sm:w-12 sm:h-12 drop-shadow-[0_3px_6px_rgba(0,0,0,0.35)]"
                      aria-hidden="true"
                    >
                      {/* Outer Crisp White Polygon Sticker Silhouette */}
                      <polygon
                        points="15,10 46,5 60,22 60,48 45,60 18,57 5,40"
                        fill="#ffffff"
                      />
                      {/* Inner Thick Black Asymmetric Polygon Ring (Thicker Top-Left Comic Weight) */}
                      <polygon
                        points="18,14 45,9 57,24 57,46 44,56 20,53 9,39"
                        fill="#14161d"
                      />
                      {/* Pure White Inner Polygon Cutout */}
                      <polygon
                        points="22,20 44,16 54,27 54,44 43,53 22,50 14,38"
                        fill="#ffffff"
                      />
                      {/* Center Solid Pitch-Black Circle Dot */}
                      <circle cx="34.5" cy="34.5" r="7.5" fill="#14161d" />
                    </svg>
                  )}
                </button>
              ))}
          </div>

          {/* =================================================================
              3B. TOP-LEFT: COMPACT RADAR/MINIMAP + [Q: 1x1x2] PAD STATUS
             ================================================================= */}
          <div className="fixed top-3 left-3 z-30 flex flex-col items-start gap-2 pointer-events-none">
            {/* Compact 1:1 Calibrated Radar with Command Center Level Coverage & Fog-of-War */}
            {(() => {
              const radarSpec = evaluateCommandCenterRadarSpec(hud.baseBuildingLevel);
              const arenaSpan = RADAR_WORLD_HALF_EXTENT * 2.0; // 250m
              const baseCenter = worldCoordToRadarPercent(0.0, 81.7);
              const baseRadiusPct = (radarSpec.baseRadarRadius / arenaSpan) * 100;
              const playerDot = hud.radarDots.find((d) => d.kind === 'player');
              const playerPos = playerDot
                ? worldCoordToRadarPercent(playerDot.x, playerDot.z)
                : baseCenter;
              const playerRadiusPct = (radarSpec.playerVisionRadius / arenaSpan) * 100;
              const plotOffsetsX = [-45.0, -15.0, 15.0, 45.0];

              return (
                <div
                  aria-label="Mini Radar Arena"
                  data-radar-level={radarSpec.level}
                  className="pointer-events-auto relative w-32 h-32 sm:w-36 sm:h-36 bg-[#2c661c] border-3 border-[#1a1a1a] ring-2 ring-white rounded-xl overflow-hidden shadow-[4px_4px_0_#1a1a1a] shrink-0"
                >
                  {/* 1:1 Orthographic Top-Down Map of the Current 3-Part Mirrored Arena ([-125, +125]) */}
                  <img
                    src="/assets/kiosk/radar_arena_map.png"
                    alt="Peta Radar Arena"
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                  />

                  {/* Subtle Team Plot Indicators for 4 North Red Bases & 4 South Blue Bases */}
                  {plotOffsetsX.map((px, idx) => {
                    const redPos = worldCoordToRadarPercent(px, -81.7);
                    const bluePos = worldCoordToRadarPercent(px, 81.7);
                    return (
                      <React.Fragment key={idx}>
                        <span
                          style={{ left: `${redPos.leftPct}%`, top: `${redPos.topPct}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-3.5 border border-[#ff3b30]/80 bg-[#ff3b30]/20 rounded-[1px] pointer-events-none"
                        />
                        <span
                          style={{ left: `${bluePos.leftPct}%`, top: `${bluePos.topPct}%` }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-3.5 border rounded-[1px] pointer-events-none ${
                            idx === 0
                              ? 'border-[#00d2ff] bg-[#00d2ff]/35'
                              : 'border-[#00d2ff]/75 bg-[#00d2ff]/15'
                          }`}
                        />
                      </React.Fragment>
                    );
                  })}

                  {/* Command Center Radar Range Mask (Fog of War outside Radar Radius when Lv.1 / Lv.2) */}
                  <svg
                    viewBox="0 0 100 100"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  >
                    <defs>
                      <mask id="command-center-radar-fog-mask">
                        <rect x="0" y="0" width="100" height="100" fill="white" />
                        {radarSpec.fullMapUnlocked ? (
                          <rect x="0" y="0" width="100" height="100" fill="black" />
                        ) : (
                          <>
                            <circle
                              cx={baseCenter.leftPct}
                              cy={baseCenter.topPct}
                              r={baseRadiusPct}
                              fill="black"
                            />
                            <circle
                              cx={playerPos.leftPct}
                              cy={playerPos.topPct}
                              r={playerRadiusPct}
                              fill="black"
                            />
                          </>
                        )}
                      </mask>
                    </defs>

                    {/* Darkened Unscanned Fog-of-War Zone */}
                    {!radarSpec.fullMapUnlocked && (
                      <rect
                        x="0"
                        y="0"
                        width="100"
                        height="100"
                        fill="rgba(6, 12, 18, 0.72)"
                        mask="url(#command-center-radar-fog-mask)"
                      />
                    )}

                    {/* Command Center Radar Coverage Perimeter Ring */}
                    {!radarSpec.fullMapUnlocked && (
                      <>
                        <circle
                          cx={baseCenter.leftPct}
                          cy={baseCenter.topPct}
                          r={baseRadiusPct}
                          fill="rgba(184, 255, 60, 0.05)"
                          stroke="#b8ff3c"
                          strokeWidth="1.2"
                          strokeDasharray="3 2"
                        />
                        <circle
                          cx={playerPos.leftPct}
                          cy={playerPos.topPct}
                          r={playerRadiusPct}
                          fill="none"
                          stroke="rgba(0, 210, 255, 0.65)"
                          strokeWidth="0.9"
                          strokeDasharray="2 2"
                        />
                      </>
                    )}
                  </svg>

                  {/* Live Scanned Radar Dots (Crates, Vehicles, Allies, Enemies, Player) */}
                  {hud.radarDots.map((dot) => {
                    const { leftPct, topPct } = worldCoordToRadarPercent(dot.x, dot.z);
                    let dotStyle = 'w-2 h-2 bg-[#ff3b30] rounded-xs';
                    if (dot.kind === 'player') {
                      dotStyle =
                        'w-3 h-3 bg-[#b8ff3c] rounded-full ring-2 ring-[#1a1a1a] shadow-[0_0_6px_#b8ff3c] z-20';
                    } else if (dot.kind === 'ally') {
                      dotStyle = 'w-2.5 h-2.5 bg-[#2979ff] rounded-full border border-white z-10';
                    } else if (dot.kind === 'enemy') {
                      dotStyle =
                        'w-2.5 h-2.5 bg-[#ff3b30] rounded-full border border-[#1a1a1a] z-10';
                    } else if (dot.kind === 'crate_legend') {
                      dotStyle = 'w-2.5 h-2.5 bg-[#ffd700] border border-[#1a1a1a] rounded-xs z-10';
                    } else if (dot.kind === 'crate_super') {
                      dotStyle = 'w-2 h-2 bg-[#00d2ff] border border-[#1a1a1a] z-10';
                    } else if (dot.kind === 'crate_red') {
                      dotStyle = 'w-1.5 h-1.5 bg-[#ff3b30] border border-[#1a1a1a]';
                    } else if (dot.kind === 'tank_blue' || dot.kind === 'tank_red') {
                      dotStyle = 'w-3 h-2.5 bg-[#fec83e] border border-[#1a1a1a] rounded-xs z-10';
                    }
                    return (
                      <span
                        key={dot.id}
                        style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 ${dotStyle}`}
                      />
                    );
                  })}

                  {/* Top-Left Radar Level & Range Pill */}
                  <div className="absolute top-1 left-1.5 z-20 px-1.5 py-0.5 bg-[#1a1a1a]/92 border border-white/30 text-[#b8ff3c] text-[8px] font-black tracking-wider rounded-xs shadow">
                    {radarSpec.label}
                  </div>
                </div>
              );
            })()}

            {/* Compact Pad Status Badge [Q: 1x1x2] + Kiosk/Gold Shortcut */}
            <div className="pointer-events-auto flex items-center gap-1.5">
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  dispatchBuddyAction('cycleBuildOrder');
                }}
                title="Klik atau Tekan [Q] untuk mengganti pola Stacking Pad"
                className="-skew-x-12 px-2.5 py-1 bg-white hover:bg-[#b8ff3c] text-[#1a1a1a] border-3 border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
              >
                <span className="skew-x-12 font-black text-[11px] tracking-tight uppercase">
                  [Q: {hud.buildOrder}]
                </span>
                <div className="skew-x-12 flex items-center gap-0.5">
                  {hud.padSlots.map((slot, idx) => {
                    const holoSlot =
                      hud.padHologramColors?.[idx] ??
                      (getBuildOrderAllowedSlots(hud.buildOrder).includes(idx) ? 'red' : 'empty');
                    return (
                      <span
                        key={idx}
                        className={`w-2 h-2.5 border border-[#1a1a1a] ${
                          slot === 'legend'
                            ? 'bg-[#ffd700]'
                            : slot === 'super'
                            ? 'bg-[#00d2ff]'
                            : slot === 'red'
                            ? 'bg-[#ff3b30]'
                            : holoSlot === 'legend'
                            ? 'bg-[#ffd700]/35'
                            : holoSlot === 'super'
                            ? 'bg-[#00d2ff]/35'
                            : holoSlot === 'red'
                            ? 'bg-[#ff3b30]/35'
                            : 'bg-[#1a1a1a]/20'
                        }`}
                      />
                    );
                  })}
                </div>
              </button>

              <button
                type="button"
                tabIndex={-1}
                data-kiosk-open-btn="top-pad"
                onClick={(e) => {
                  e.currentTarget.blur();
                  soundEngine.playUiClick();
                  setIsKioskModalOpen(true);
                }}
                title="Buka Mesin Self-Service Kiosk [B]"
                className="-skew-x-12 px-2.5 py-1 bg-[#fec83e] hover:bg-[#ffe066] text-[#1a1a1a] border-3 border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] font-black text-[11px] cursor-pointer transition-transform active:scale-95"
              >
                <span className="skew-x-12 inline-block">
                  [B] {hud.gold}G
                </span>
              </button>
            </div>

            {/* 3-TAB MAP EDITOR SIDEBAR (Only shown when in MAP EDITOR mode) */}
            {playMode === 'editor' && (
              <aside
                aria-label="Sidebar Map Editor 3 Tab"
                className="pointer-events-auto w-76 sm:w-82 max-h-[calc(100vh-210px)] flex flex-col bg-[#1a1a1a]/95 border-3 border-white rounded-xl p-3 shadow-[5px_5px_0_#1a1a1a] space-y-2.5 overflow-hidden"
              >
                <div className="flex items-center justify-between border-b-2 border-[#272935] pb-2 shrink-0">
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-[#00d2ff]">
                      MAP EDITOR STUDIO
                    </div>
                    <div className="text-[10px] font-bold text-[#8f93a5]">
                      Klik Kiri: Pasang/Sculpt · Klik Kanan: Hapus
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-white text-[#1a1a1a] font-mono-tabular font-black text-xs rounded-md border-2 border-[#1a1a1a]">
                    {hud.editorObjectCount} Prop
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 bg-[#11121a] p-1 rounded-lg border border-[#272935] shrink-0">
                  <button
                    type="button"
                    data-editor-tab="terrain"
                    onClick={() => {
                      soundEngine.playUiClick();
                      setEditorTab('terrain');
                      setEditorTool('sculpt_raise');
                    }}
                    className={`py-1.5 px-1 rounded-md font-black text-[10px] transition-all cursor-pointer ${
                      editorTab === 'terrain'
                        ? 'bg-[#b8ff3c] text-[#1a1a1a]'
                        : 'bg-[#272935] text-white/80 hover:bg-[#393b49]'
                    }`}
                  >
                    Terrain &amp; Base
                  </button>
                  <button
                    type="button"
                    data-editor-tab="industrial"
                    onClick={() => {
                      soundEngine.playUiClick();
                      setEditorTab('industrial');
                      setEditorTool('dump_truck');
                    }}
                    className={`py-1.5 px-1 rounded-md font-black text-[10px] transition-all cursor-pointer ${
                      editorTab === 'industrial'
                        ? 'bg-[#fec83e] text-[#1a1a1a]'
                        : 'bg-[#272935] text-white/80 hover:bg-[#393b49]'
                    }`}
                  >
                    Industri
                  </button>
                  <button
                    type="button"
                    data-editor-tab="nature"
                    onClick={() => {
                      soundEngine.playUiClick();
                      setEditorTab('nature');
                      setEditorTool('tree_gold');
                    }}
                    className={`py-1.5 px-1 rounded-md font-black text-[10px] transition-all cursor-pointer ${
                      editorTab === 'nature'
                        ? 'bg-[#00d2ff] text-[#1a1a1a]'
                        : 'bg-[#272935] text-white/80 hover:bg-[#393b49]'
                    }`}
                  >
                    Alam
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-0.5 space-y-2.5 min-h-0">
                  {editorTab === 'terrain' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 gap-1.5">
                        {EDITOR_TERRAIN_BRUSH_TOOLS.map((tool) => {
                          const active = editorTool === tool.id;
                          return (
                            <button
                              key={tool.id}
                              type="button"
                              data-editor-tool={tool.id}
                              onClick={() => {
                                soundEngine.playUiClick();
                                setEditorTool(tool.id);
                              }}
                              className={`px-2.5 py-1.5 text-left rounded-lg border-2 transition-all cursor-pointer flex items-center justify-between ${
                                active
                                  ? 'bg-[#b8ff3c] text-[#1a1a1a] border-[#1a1a1a]'
                                  : 'bg-[#272935] text-white hover:bg-[#393b49] border-[#1a1a1a]'
                              }`}
                            >
                              <span className="text-xs font-black">{tool.label}</span>
                              <span className="text-[10px] font-bold opacity-80">{tool.sub}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="p-2 bg-[#272935] rounded-lg border-2 border-[#1a1a1a] space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-black">
                          <span className="text-white">Radius Kuas Sculpt</span>
                          <span className="text-[#b8ff3c] font-mono-tabular">{editorBrushRadius}m</span>
                        </div>
                        <input
                          type="range"
                          min={4}
                          max={24}
                          step={1}
                          value={editorBrushRadius}
                          onChange={(e) => setEditorBrushRadius(Number(e.target.value))}
                          className="w-full accent-[#b8ff3c] cursor-pointer"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        {EDITOR_STRUCTURE_TOOLS.map((tool) => {
                          const active = editorTool === tool.id;
                          return (
                            <button
                              key={tool.id}
                              type="button"
                              data-editor-tool={tool.id}
                              onClick={() => {
                                soundEngine.playUiClick();
                                setEditorTool(tool.id);
                              }}
                              className={`p-1.5 text-left rounded-lg border-2 transition-all cursor-pointer ${
                                active
                                  ? 'bg-[#fec83e] text-[#1a1a1a] border-[#1a1a1a]'
                                  : 'bg-[#272935] text-white hover:bg-[#393b49] border-[#1a1a1a]'
                              }`}
                            >
                              <div className="text-[11px] font-black leading-tight">{tool.label}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {editorTab === 'industrial' && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {EDITOR_INDUSTRIAL_TOOLS.map((tool) => {
                        const active = editorTool === tool.id;
                        return (
                          <button
                            key={tool.id}
                            type="button"
                            data-editor-tool={tool.id}
                            onClick={() => {
                              soundEngine.playUiClick();
                              setEditorTool(tool.id);
                            }}
                            className={`p-2 text-left rounded-lg border-2 transition-all cursor-pointer ${
                              active
                                ? 'bg-[#fec83e] text-[#1a1a1a] border-[#1a1a1a]'
                                : 'bg-[#272935] text-white hover:bg-[#393b49] border-[#1a1a1a]'
                            }`}
                          >
                            <div className="text-[11px] font-black leading-tight">{tool.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {editorTab === 'nature' && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {EDITOR_NATURE_TOOLS.map((tool) => {
                        const active = editorTool === tool.id;
                        return (
                          <button
                            key={tool.id}
                            type="button"
                            data-editor-tool={tool.id}
                            onClick={() => {
                              soundEngine.playUiClick();
                              setEditorTool(tool.id);
                            }}
                            className={`p-2 text-left rounded-lg border-2 transition-all cursor-pointer ${
                              active
                                ? 'bg-[#00d2ff] text-[#1a1a1a] border-[#1a1a1a]'
                                : 'bg-[#272935] text-white hover:bg-[#393b49] border-[#1a1a1a]'
                            }`}
                          >
                            <div className="text-[11px] font-black leading-tight">{tool.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t-2 border-[#272935] space-y-1.5 shrink-0">
                  <div className="flex items-center justify-between gap-1">
                    <button
                      type="button"
                      data-editor-action="rotate"
                      onClick={() => dispatchBuddyAction('editorRotate')}
                      className="flex-1 py-1 bg-[#272935] hover:bg-[#393b49] text-white font-black text-[11px] rounded-lg border-2 border-[#1a1a1a] cursor-pointer"
                    >
                      [R] {hud.editorRotDeg}°
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatchBuddyAction('editorScaleDown')}
                      className="px-2 py-1 bg-[#272935] text-white font-black text-[11px] rounded-lg border-2 border-[#1a1a1a] cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-[11px] font-mono-tabular font-black text-[#b8ff3c]">
                      {hud.editorScale.toFixed(2)}x
                    </span>
                    <button
                      type="button"
                      onClick={() => dispatchBuddyAction('editorScaleUp')}
                      className="px-2 py-1 bg-[#272935] text-white font-black text-[11px] rounded-lg border-2 border-[#1a1a1a] cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      data-editor-action="clear-all"
                      onClick={() => dispatchBuddyAction('editorClearAllProps')}
                      className="py-1.5 bg-[#ff3b30] text-white font-black text-[10px] rounded-lg border-2 border-[#1a1a1a] cursor-pointer"
                    >
                      Hapus
                    </button>
                    <button
                      type="button"
                      data-editor-action="reset-map"
                      onClick={() => dispatchBuddyAction('editorResetMap')}
                      className="py-1.5 bg-[#272935] text-white font-black text-[10px] rounded-lg border-2 border-[#1a1a1a] cursor-pointer"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      data-editor-action="save-map"
                      onClick={() => dispatchBuddyAction('editorSaveMap')}
                      className="py-1.5 bg-[#b8ff3c] text-[#1a1a1a] font-black text-[10px] rounded-lg border-2 border-[#1a1a1a] cursor-pointer"
                    >
                      Simpan
                    </button>
                  </div>
                  {mapSaveStatus && (
                    <div className="px-2 py-1 bg-[#b8ff3c] text-[#1a1a1a] font-black text-[10px] text-center rounded-lg border-2 border-[#1a1a1a]">
                      {mapSaveStatus}
                    </div>
                  )}
                </div>
              </aside>
            )}
          </div>

          {/* =================================================================
              3C. TOP-CENTER: SKEWED ARCADE SCORE & HEALTH BAR ("BLUE 2000 vs RED 2000")
             ================================================================= */}
          <div
            aria-label="Top Score Bar"
            className="fixed top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center"
          >
            {/* Blue Team Skewed Health Bar */}
            <div className="-skew-x-12 bg-[#1a1a1a] border-3 border-[#1a1a1a] ring-2 ring-white shadow-[4px_4px_0_#1a1a1a] px-1 py-1 flex items-center">
              <div className="relative w-28 sm:w-36 h-6 bg-[#11121a] overflow-hidden flex items-center justify-start px-2.5">
                <div
                  style={{
                    width: `${Math.max(0, Math.min(100, (hud.blueBaseHp / 2000) * 100))}%`,
                  }}
                  className="absolute inset-y-0 left-0 bg-[#00d2ff] transition-all duration-200"
                />
                <span className="skew-x-12 relative z-10 font-black font-mono-tabular text-xs sm:text-sm text-white drop-shadow-[0_1px_2px_#1a1a1a] tracking-wider">
                  BLUE {hud.blueBaseHp}
                </span>
              </div>
            </div>

            {/* Center Polygonal VS Badge */}
            <div className="-skew-x-12 -mx-1.5 z-10 px-2.5 py-1 bg-[#fec83e] text-[#1a1a1a] border-3 border-[#1a1a1a] ring-2 ring-white shadow-[3px_3px_0_#1a1a1a] font-black text-xs tracking-widest">
              <span className="skew-x-12 inline-block">VS</span>
            </div>

            {/* Red Team Skewed Health Bar */}
            <div className="-skew-x-12 bg-[#1a1a1a] border-3 border-[#1a1a1a] ring-2 ring-white shadow-[4px_4px_0_#1a1a1a] px-1 py-1 flex items-center">
              <div className="relative w-28 sm:w-36 h-6 bg-[#11121a] overflow-hidden flex items-center justify-end px-2.5">
                <div
                  style={{
                    width: `${Math.max(0, Math.min(100, (hud.redBaseHp / 2000) * 100))}%`,
                  }}
                  className="absolute inset-y-0 right-0 bg-[#ff3b30] transition-all duration-200"
                />
                <span className="skew-x-12 relative z-10 font-black font-mono-tabular text-xs sm:text-sm text-white drop-shadow-[0_1px_2px_#1a1a1a] tracking-wider">
                  RED {hud.redBaseHp}
                </span>
              </div>
            </div>
          </div>

          {/* =================================================================
              3D. TOP-RIGHT: PROMINENT [RUN MATCH] BUTTON + SKEWED GEAR [⚙] DRAWER
             ================================================================= */}
          <div className="fixed top-3 right-3 z-30 flex flex-col items-end gap-2 pointer-events-auto">
            <div className="flex items-center gap-2">
              {/* Prominent [RUN MATCH] Button in Prep Mode (Sandbox/Editor), or Live 4v4 Badge in Match Mode */}
              {playMode !== 'match' ? (
                <button
                  type="button"
                  data-mode-btn="match"
                  onClick={() => handleSwitchPlayMode('match')}
                  className="-skew-x-12 px-4 py-2 bg-[#b8ff3c] hover:bg-[#d2ff7a] text-[#1a1a1a] font-black text-xs sm:text-sm tracking-wider uppercase border-3 border-[#1a1a1a] ring-2 ring-white shadow-[4px_4px_0_#1a1a1a] transition-transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                >
                  <span className="skew-x-12 inline-block">▶ RUN MATCH</span>
                </button>
              ) : (
                <div className="-skew-x-12 px-3 py-1.5 bg-[#ff3b30] text-white font-black text-xs tracking-wider uppercase border-3 border-[#1a1a1a] ring-2 ring-white shadow-[4px_4px_0_#1a1a1a] flex items-center gap-2">
                  <span className="skew-x-12 inline-block">
                    4v4 MATCH ({hud.blueHumanCount}P+{hud.blueAiCommanderCount}AI)
                  </span>
                  {(hud.blueAiCommanderCount > 0 || hud.redAiCommanderCount > 0) && (
                    <button
                      type="button"
                      tabIndex={-1}
                      data-matchmaking-btn="hot-join"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        dispatchBuddyAction('hotJoinPlayer');
                      }}
                      className="skew-x-12 px-1.5 py-0.5 bg-[#b8ff3c] text-[#1a1a1a] font-black text-[10px] border-2 border-[#1a1a1a] cursor-pointer"
                    >
                      +JOIN
                    </button>
                  )}
                </div>
              )}

              {/* Skewed Polygonal Gear [⚙] Button */}
              <button
                type="button"
                aria-label="Menu Pengaturan & Developer"
                aria-expanded={isSpawnDrawerOpen}
                data-sandbox-toggle="true"
                onClick={() => {
                  soundEngine.playUiClick();
                  setIsSpawnDrawerOpen((prev) => !prev);
                }}
                className={`-skew-x-12 w-11 h-10 flex items-center justify-center font-black text-lg border-3 border-[#1a1a1a] ring-2 ring-white shadow-[4px_4px_0_#1a1a1a] transition-transform hover:scale-105 active:scale-95 cursor-pointer ${
                  isSpawnDrawerOpen
                    ? 'bg-[#fec83e] text-[#1a1a1a]'
                    : 'bg-white hover:bg-[#fec83e] text-[#1a1a1a]'
                }`}
              >
                <span className="skew-x-12 inline-block">⚙</span>
              </button>
            </div>

            {/* Pop-up Developer & Utility Drawer (Opened via [⚙]) */}
            {isSpawnDrawerOpen && (
              <div
                aria-label="Drawer Developer & Pengaturan"
                className="w-72 bg-white border-3 border-[#1a1a1a] ring-2 ring-white shadow-[6px_6px_0_#1a1a1a] p-3 flex flex-col gap-2.5 text-[#1a1a1a]"
              >
                {/* Section 1: Game Modes ([SANDBOX], [MAP EDITOR], [RUN MATCH]) */}
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#1a1a1a]/70 mb-1">
                    MODE PERMAINAN
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      data-mode-btn="sandbox"
                      onClick={() => handleSwitchPlayMode('sandbox')}
                      className={`-skew-x-6 py-1.5 font-black text-[10px] border-2 border-[#1a1a1a] cursor-pointer ${
                        playMode === 'sandbox'
                          ? 'bg-[#b8ff3c] text-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a]'
                          : 'bg-[#1a1a1a] text-white hover:bg-[#343848]'
                      }`}
                    >
                      <span className="skew-x-6 inline-block">SANDBOX</span>
                    </button>
                    <button
                      type="button"
                      data-mode-btn="editor"
                      onClick={() => handleSwitchPlayMode('editor')}
                      className={`-skew-x-6 py-1.5 font-black text-[10px] border-2 border-[#1a1a1a] cursor-pointer ${
                        playMode === 'editor'
                          ? 'bg-[#00d2ff] text-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a]'
                          : 'bg-[#1a1a1a] text-white hover:bg-[#343848]'
                      }`}
                    >
                      <span className="skew-x-6 inline-block">MAP EDITOR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchPlayMode('match')}
                      className={`-skew-x-6 py-1.5 font-black text-[10px] border-2 border-[#1a1a1a] cursor-pointer ${
                        playMode === 'match'
                          ? 'bg-[#ff3b30] text-white shadow-[2px_2px_0_#1a1a1a]'
                          : 'bg-[#1a1a1a] text-white hover:bg-[#343848]'
                      }`}
                    >
                      <span className="skew-x-6 inline-block">RUN MATCH</span>
                    </button>
                  </div>
                </div>

                {/* Section 2: System Controls ([Kode Luau], [SUARA], [JEDA]) */}
                <div className="pt-2 border-t-2 border-[#1a1a1a]/15">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#1a1a1a]/70 mb-1">
                    SISTEM &amp; KODE
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playUiClick();
                        setIsReaModalOpen(true);
                      }}
                      className="-skew-x-6 py-1.5 bg-[#fec83e] hover:bg-[#ffe066] text-[#1a1a1a] font-black text-[10px] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] cursor-pointer"
                    >
                      <span className="skew-x-6 inline-block">Kode Luau</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleAudio}
                      className="-skew-x-6 py-1.5 bg-[#1a1a1a] hover:bg-[#343848] text-white font-black text-[10px] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] cursor-pointer"
                    >
                      <span className="skew-x-6 inline-block">{isMuted ? 'MUTE' : 'SUARA'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleTogglePause}
                      className="-skew-x-6 py-1.5 bg-[#1a1a1a] hover:bg-[#343848] text-white font-black text-[10px] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] cursor-pointer"
                    >
                      <span className="skew-x-6 inline-block">JEDA</span>
                    </button>
                  </div>
                </div>

                {/* Section 3: [Menu Spawn] Quick Drop Crates & Vehicles */}
                <div className="pt-2 border-t-2 border-[#1a1a1a]/15 space-y-1.5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#1a1a1a]/70">
                    MENU SPAWN (UJI COBA CEPAT)
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      data-sandbox-btn="drop-red"
                      onClick={() => dispatchBuddyAction('sandboxDropRedCrate')}
                      className="py-1.5 px-1 bg-[#ff3b30] text-white font-black text-[10px] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] cursor-pointer"
                    >
                      +Peti Merah
                    </button>
                    <button
                      type="button"
                      data-sandbox-btn="drop-blue"
                      onClick={() => dispatchBuddyAction('sandboxDropSuperCrate')}
                      className="py-1.5 px-1 bg-[#00d2ff] text-[#1a1a1a] font-black text-[10px] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] cursor-pointer"
                    >
                      +Peti Biru
                    </button>
                    <button
                      type="button"
                      data-sandbox-btn="drop-legend"
                      onClick={() => dispatchBuddyAction('sandboxDropLegendCrate')}
                      className="py-1.5 px-1 bg-[#ffd700] text-[#1a1a1a] font-black text-[10px] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] cursor-pointer"
                    >
                      +Peti Emas
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      data-sandbox-btn="spawn-tank"
                      onClick={() => dispatchBuddyAction('sandboxSpawnTank')}
                      className="py-1.5 px-1 bg-[#b8ff3c] text-[#1a1a1a] font-black text-[10px] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] cursor-pointer"
                    >
                      +Lyo Tank
                    </button>
                    <button
                      type="button"
                      data-sandbox-btn="spawn-plane"
                      onClick={() => dispatchBuddyAction('sandboxSpawnPlane')}
                      className="py-1.5 px-1 bg-[#fec83e] text-[#1a1a1a] font-black text-[10px] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] cursor-pointer"
                    >
                      +Lyo Plane
                    </button>
                    <button
                      type="button"
                      data-sandbox-btn="spawn-truck"
                      onClick={() => dispatchBuddyAction('sandboxSpawnTruck')}
                      className="py-1.5 px-1 bg-[#ffa822] text-[#1a1a1a] font-black text-[10px] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] cursor-pointer"
                    >
                      +Dump Truck
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =================================================================
              3E. BOTTOM-RIGHT: COMPACT 3 WEAPON SLOTS ([1] Pistol, [2] Rifle, [3] Bazooka)
                  + COMPACT SQUAD / VEHICLE STATUS
             ================================================================= */}
          {playMode !== 'editor' && (
            <div
              aria-label="Tactical Weapon & Character HUD"
              className="fixed bottom-3 right-3 z-30 pointer-events-auto flex flex-col items-end gap-2"
            >
              {/* Compact Character HP + Squad Swap [Tab] + AI Order [V] */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    dispatchBuddyAction('cycleCommand');
                  }}
                  title="Tekan [V] untuk perintah AI Tim"
                  className="-skew-x-12 px-2.5 py-1 bg-[#1a1a1a] text-[#fec83e] border-2 border-white shadow-[3px_3px_0_#1a1a1a] font-black text-[10px] uppercase cursor-pointer"
                >
                  <span className="skew-x-12 inline-block">[V] AI: {hud.teamCommand}</span>
                </button>

                <button
                  type="button"
                  tabIndex={-1}
                  data-buddy-btn="swap-personal"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    dispatchBuddyAction('swapBuddy');
                  }}
                  title="Tekan [Tab] untuk menukar karakter milikmu"
                  className="-skew-x-12 px-2.5 py-1 bg-white text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] font-black text-[10px] uppercase cursor-pointer flex items-center gap-1.5"
                >
                  <span className="skew-x-12 inline-block">
                    [TAB] {hud.activeClass.toUpperCase()} ({hud.personalSquadCount}/{hud.personalSquadMax})
                  </span>
                  <span className="skew-x-12 px-1 bg-[#b8ff3c] border border-[#1a1a1a] font-mono-tabular text-[10px]">
                    {Math.max(0, Math.round(hud.hp))} HP
                  </span>
                </button>
              </div>

              {/* 3 Compact Skewed Weapon Slots ([1] Pistol, [2] Rifle, [3] Bazooka) */}
              {hud.controlMode === 'tank' ? (
                <div className="flex items-center gap-2">
                  {hud.grabbedPropName === 'Lyo Plane' && (
                    <>
                      <button
                        type="button"
                        tabIndex={-1}
                        data-plane-btn="climb"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          dispatchBuddyAction('planeClimbStep');
                        }}
                        className="-skew-x-12 px-3 py-2 bg-[#00d2ff] text-[#1a1a1a] font-black text-xs border-3 border-[#1a1a1a] ring-2 ring-white shadow-[4px_4px_0_#1a1a1a] cursor-pointer"
                      >
                        <span className="skew-x-12 inline-block">[SPASI] NAIK</span>
                      </button>
                      <button
                        type="button"
                        tabIndex={-1}
                        data-plane-btn="descend"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          dispatchBuddyAction('planeDescendStep');
                        }}
                        className="-skew-x-12 px-3 py-2 bg-[#ff3b30] text-white font-black text-xs border-3 border-[#1a1a1a] ring-2 ring-white shadow-[4px_4px_0_#1a1a1a] cursor-pointer"
                      >
                        <span className="skew-x-12 inline-block">[C] DARAT</span>
                      </button>
                    </>
                  )}
                  <div className="-skew-x-12 px-3.5 py-2 bg-[#b8ff3c] text-[#1a1a1a] font-black text-xs border-3 border-[#1a1a1a] ring-2 ring-white shadow-[4px_4px_0_#1a1a1a]">
                    <span className="skew-x-12 inline-block uppercase">
                      {hud.grabbedPropName || 'TANK'} ({hud.tankStoredCrates}/4 PETI)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {[
                    {
                      slotKey: '1',
                      label: 'Pistol',
                      action: 'selectWeaponPistol',
                      dataAttr: 'pistol',
                      isActive:
                        hud.equippedWeapon === 'LyoPistol' ||
                        hud.equippedWeapon.includes('Pistol') ||
                        hud.equippedWeapon.includes('Uzi'),
                    },
                    {
                      slotKey: '2',
                      label: 'Rifle',
                      action: 'selectWeaponRifle',
                      dataAttr: 'rifle',
                      isActive:
                        hud.equippedWeapon === 'LyoAssaultRifle' ||
                        hud.equippedWeapon.includes('Rifle') ||
                        hud.equippedWeapon.includes('Shotgun') ||
                        hud.equippedWeapon.includes('Gatling'),
                    },
                    {
                      slotKey: '3',
                      label: 'Bazooka',
                      action: 'selectWeaponBazooka',
                      dataAttr: 'bazooka',
                      isActive:
                        hud.equippedWeapon === 'LyoRocketLauncher' ||
                        hud.equippedWeapon.includes('Bazooka') ||
                        hud.equippedWeapon.includes('Supazooka') ||
                        hud.equippedWeapon.includes('Nuclear') ||
                        hud.equippedWeapon.includes('Homing'),
                    },
                  ].map((w) => (
                    <button
                      key={w.slotKey}
                      type="button"
                      tabIndex={-1}
                      data-weapon-btn={w.dataAttr}
                      onClick={(e) => {
                        e.currentTarget.blur();
                        dispatchBuddyAction(w.action);
                      }}
                      className={`-skew-x-12 px-3.5 py-2 font-black text-xs sm:text-sm uppercase tracking-wider border-3 border-[#1a1a1a] transition-all cursor-pointer ${
                        w.isActive
                          ? 'bg-[#b8ff3c] text-[#1a1a1a] ring-2 ring-white -translate-y-1 shadow-[4px_5px_0_#1a1a1a]'
                          : 'bg-white/95 hover:bg-[#fec83e] text-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a]'
                      }`}
                    >
                      <span className="skew-x-12 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-[#1a1a1a] text-white text-[10px] font-black">
                          [{w.slotKey}]
                        </span>
                        <span>{w.label}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          4. PAUSE MODAL CARD (gameState === 'paused')
         ===================================================================== */}
      {gameState === 'paused' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-modal-title"
          className="fixed inset-0 z-30 flex items-center justify-center p-4 pointer-events-auto"
          style={{ backgroundColor: 'rgba(17, 18, 26, 0.82)' }}
        >
          <div className="w-full max-w-md bg-[#191b24] border-4 border-[#11121a] ring-4 ring-white rounded-2xl p-6 comic-sticker-shadow-lg text-center space-y-5">
            <h2
              id="pause-modal-title"
              className="text-3xl font-black tracking-wide text-[#b8ff3c]"
            >
              Permainan Dijeda
            </h2>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 bg-[#272935] rounded-xl border-2 border-[#11121a]">
                <div className="text-[10px] font-black text-[#8f93a5]">SKOR</div>
                <div className="text-lg font-black font-mono-tabular text-white">{hud.score}</div>
              </div>
              <div className="p-3 bg-[#272935] rounded-xl border-2 border-[#11121a]">
                <div className="text-[10px] font-black text-[#8f93a5]">RED HQ</div>
                <div className="text-lg font-black font-mono-tabular text-[#ff3b30]">
                  {hud.redBaseHp}
                </div>
              </div>
              <div className="p-3 bg-[#272935] rounded-xl border-2 border-[#11121a]">
                <div className="text-[10px] font-black text-[#8f93a5]">MUSUH KO</div>
                <div className="text-lg font-black font-mono-tabular text-[#b8ff3c]">
                  {hud.enemiesDefeated}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleTogglePause}
                className="w-full py-3 bg-[#b8ff3c] hover:bg-[#c7ff72] text-[#11121a] font-black text-base rounded-xl border-3 border-[#11121a] comic-sticker-shadow cursor-pointer"
              >
                Lanjut Main
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  setIsReaModalOpen(true);
                }}
                className="w-full py-3 bg-[#fec83e] hover:bg-[#fee763] text-[#11121a] font-black text-sm rounded-xl border-3 border-[#11121a] comic-sticker-shadow cursor-pointer"
              >
                Kode Luau
              </button>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleStartGame(true)}
                  className="py-2.5 bg-[#272935] hover:bg-[#393b49] text-white font-black text-xs rounded-xl border-2 border-[#11121a] cursor-pointer"
                >
                  Ulangi Arena
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    document.body.dataset.state = 'title';
                    setGameState('title');
                  }}
                  className="py-2.5 bg-[#272935] hover:bg-[#393b49] text-white font-black text-xs rounded-xl border-2 border-[#11121a] cursor-pointer"
                >
                  Layar Utama
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. VICTORY / GAME OVER MODAL CARD (gameState === 'gameover')
         ===================================================================== */}
      {gameState === 'gameover' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="gameover-modal-title"
          className="fixed inset-0 z-30 flex items-center justify-center p-4 pointer-events-auto"
          style={{ backgroundColor: 'rgba(17, 18, 26, 0.85)' }}
        >
          <div className="w-full max-w-md bg-[#191b24] border-4 border-[#11121a] ring-4 ring-white rounded-2xl p-6 comic-sticker-shadow-lg text-center space-y-5">
            <h2
              id="gameover-modal-title"
              className={`text-3xl font-black tracking-wide ${
                (finalRunStats?.outcome || hud.outcome) === 'victory'
                  ? 'text-[#b8ff3c]'
                  : 'text-[#f42f4c]'
              }`}
            >
              {(finalRunStats?.outcome || hud.outcome) === 'victory'
                ? 'Markas Merah Hancur'
                : 'Markas Biru Hancur'}
            </h2>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 bg-[#272935] rounded-xl border-2 border-[#11121a]">
                <div className="text-[10px] font-black text-[#8f93a5]">SKOR</div>
                <div className="text-base font-black font-mono-tabular text-white">
                  {finalRunStats?.score ?? hud.score}
                </div>
              </div>
              <div className="p-3 bg-[#272935] rounded-xl border-2 border-[#11121a]">
                <div className="text-[10px] font-black text-[#8f93a5]">WAKTU</div>
                <div className="text-base font-black font-mono-tabular text-[#fec83e]">
                  {finalRunStats?.clearTimeSec ?? hud.clearTimeSec}s
                </div>
              </div>
              <div className="p-3 bg-[#272935] rounded-xl border-2 border-[#11121a]">
                <div className="text-[10px] font-black text-[#8f93a5]">MUSUH KO</div>
                <div className="text-base font-black font-mono-tabular text-[#b8ff3c]">
                  {finalRunStats?.enemiesDefeated ?? hud.enemiesDefeated}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                data-start="true"
                onClick={() => handleStartGame(true)}
                className="w-full py-3.5 bg-[#b8ff3c] hover:bg-[#c7ff72] text-[#11121a] font-black text-lg rounded-xl border-3 border-[#11121a] comic-sticker-shadow cursor-pointer"
              >
                Main Lagi
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiClick();
                  setIsReaModalOpen(true);
                }}
                className="w-full py-2.5 bg-[#fec83e] hover:bg-[#fee763] text-[#11121a] font-black text-xs rounded-xl border-2 border-[#11121a] cursor-pointer"
              >
                Kode Luau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          6. REA EXTRACTION REPORT & ROBLOX STUDIO (LUAU) CODE MODAL
         ===================================================================== */}
      <ReaLuauModal
        isOpen={isReaModalOpen}
        onClose={() => setIsReaModalOpen(false)}
      />

      {/* =====================================================================
          7. SELF-SERVICE TACTICAL KIOSK MODAL (PRIORITY HOLOGRAM, BASE UPGRADE & CRATE AIRDROP)
         ===================================================================== */}
      <TacticalKioskModal
        isOpen={isKioskModalOpen}
        onClose={() => setIsKioskModalOpen(false)}
        hud={hud}
        onSelectRecipe={(recipeId) => {
          dispatchBuddyAction(`kioskSelectRecipe:${recipeId}`);
        }}
        onUpgradeBase={(upgradeId) => {
          dispatchBuddyAction(`kioskUpgradeBase:${upgradeId}`);
        }}
        onBuyCrateAirdrop={(crateKind) => {
          dispatchBuddyAction(`kioskBuyCrate:${crateKind}`);
        }}
      />
    </main>
  );
}
