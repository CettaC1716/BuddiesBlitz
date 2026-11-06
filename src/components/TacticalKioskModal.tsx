import React, { useState } from 'react';
import {
  KIOSK_BUILD_PRIORITY_RECIPES,
  KioskBuildPriorityRecipeId,
  KioskBaseGoldUpgradeId,
  CrateSlotType,
  WorldCrateKind,
  MAX_KIOSK_BUILD_QUEUE,
  evaluateNuclearLauncherAccess,
  evaluateClusterBombAccess,
} from '../game/buddiesBlitzRules';
import { HudSnapshot } from '../game/BuddiesBlitzArena';
import { soundEngine } from '../game/audio';

interface TacticalKioskModalProps {
  isOpen: boolean;
  onClose: () => void;
  hud: HudSnapshot;
  onSelectRecipe: (recipeId: KioskBuildPriorityRecipeId) => void;
  onRemoveQueueIndex?: (index: number) => void;
  onClearQueue?: () => void;
  onUpgradeBase: (upgradeId: KioskBaseGoldUpgradeId) => void;
  onBuyCrateAirdrop: (crateKind: WorldCrateKind) => void;
}

type KioskPageIndex = 0 | 1 | 2 | 3 | 4 | 5;

type KioskCardIllustrationId =
  | 'ar99_rifle'
  | 'p12_handgun'
  | 'vx20_bazooka'
  | 'skyshield_turret'
  | 'st01_minitank'
  | 'ht88_dump_truck'
  | 'af9_plane'
  | 'street_rookie'
  | 't800_cyborg'
  | 'shinobi_infiltrator'
  | 'tactical_veteran'
  | 'hq_super_command'
  | 'hq_tactical_comms'
  | 'lg88_laser_rifle'
  | 'nuclear_launcher'
  | 'titan6_gatling'
  | 'hg04_grenade'
  | 'tm89_mine'
  | 'cb24_cluster';

interface KioskGridCardItem {
  id: string;
  title: string;
  tagLine: string;
  illustration: KioskCardIllustrationId;
  actionKind: 'recipe' | 'upgrade_base' | 'buy_crate';
  recipeId?: KioskBuildPriorityRecipeId;
  upgradeId?: KioskBaseGoldUpgradeId;
  crateKind?: WorldCrateKind;
  inspectDetail: string;
  isSilhouetteLocked?: boolean;
}

function renderShieldCrestSvg(pageIndex: KioskPageIndex) {
  return (
    <svg
      viewBox="0 0 96 108"
      className="w-[74px] h-[84px] sm:w-[82px] sm:h-[92px] drop-shadow-[0_4px_0_#0d0f12] select-none"
    >
      {/* Outer Black Shield Silhouette */}
      <path
        d="M48 3 L88 17 L88 50 C88 77 69 95 48 105 C27 95 8 77 8 50 L8 17 Z"
        fill="#0d0f12"
      />
      {/* Metallic Olive-Drab Bezel */}
      <path
        d="M48 8 L83 20 L83 49 C83 73 66 89 48 99 C30 89 13 73 13 49 L13 20 Z"
        fill="#595e48"
        stroke="#0d0f12"
        strokeWidth="2.5"
      />
      {/* Left Highlight Bevel on Shield Rim */}
      <path
        d="M48 8 L13 20 L13 49 C13 73 30 89 48 99 L48 90 C34 81 21 67 21 49 L21 25 L48 15 Z"
        fill="#757b62"
      />
      {/* Corner Notch Rivets */}
      <rect x="45" y="7" width="6" height="5" fill="#0d0f12" />
      <rect x="12" y="44" width="5" height="6" fill="#0d0f12" />
      <rect x="79" y="44" width="5" height="6" fill="#0d0f12" />

      {/* Inner Shield Face */}
      <path
        d="M48 16 L75 26 L75 49 C75 68 61 81 48 89 C35 81 21 68 21 49 L21 26 Z"
        fill={
          pageIndex === 0 || pageIndex === 2
            ? '#f4f6f8'
            : pageIndex === 1
            ? '#2e332b'
            : '#262b30'
        }
        stroke="#0d0f12"
        strokeWidth="3"
      />
      {/* Subtle Right-Side Inner Shadow */}
      <path
        d="M48 16 L75 26 L75 49 C75 68 61 81 48 89 Z"
        fill={
          pageIndex === 0 || pageIndex === 2
            ? 'rgba(160,172,184,0.38)'
            : 'rgba(0,0,0,0.28)'
        }
      />

      {pageIndex === 0 && (
        /* Page 0: WEAPON ARMORY Crosshair Reticle Crest (1:1 Image 1) */
        <g stroke="#0d0f12" strokeLinecap="round">
          <circle cx="48" cy="51" r="19" fill="none" strokeWidth="3.5" />
          <circle cx="48" cy="51" r="7.5" fill="none" strokeWidth="2.8" />
          <line x1="48" y1="25" x2="48" y2="41" strokeWidth="3.8" />
          <line x1="48" y1="61" x2="48" y2="77" strokeWidth="3.8" />
          <line x1="22" y1="51" x2="38" y2="51" strokeWidth="3.8" />
          <line x1="58" y1="51" x2="74" y2="51" strokeWidth="3.8" />
        </g>
      )}

      {pageIndex === 1 && (
        /* Page 1: VEHICLE HANGAR Winged Military Tank Crest (1:1 Image 2) */
        <g stroke="#0d0f12" strokeWidth="2.2" strokeLinejoin="round">
          <path
            d="M44 50 L14 36 L19 44 L15 48 L23 53 L19 57 L42 58 Z"
            fill="#cfd6dc"
          />
          <path
            d="M52 50 L82 36 L77 44 L81 48 L73 53 L77 57 L54 58 Z"
            fill="#aab4bd"
          />
          <rect x="39" y="40" width="18" height="8" rx="2" fill="#768557" />
          <rect x="48" y="42" width="20" height="4" rx="1" fill="#768557" />
          <polygon points="31,48 65,48 69,55 27,55" fill="#8ca063" />
          <rect x="29" y="55" width="38" height="8" rx="4" fill="#3a3f45" />
          <circle cx="35" cy="59" r="2" fill="#cfd6dc" />
          <circle cx="43" cy="59" r="2" fill="#cfd6dc" />
          <circle cx="52" cy="59" r="2" fill="#cfd6dc" />
          <circle cx="60" cy="59" r="2" fill="#cfd6dc" />
        </g>
      )}

      {pageIndex === 2 && (
        /* Page 2: SQUAD BUILD Tactical Soldier Helmet & Goggles Crest (1:1 Image 3) */
        <g stroke="#0d0f12" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
          <line x1="48" y1="62" x2="48" y2="85" strokeWidth="2.6" />
          <path d="M33 54 C35 66, 61 66, 63 54" fill="none" strokeWidth="2.6" />
          <path
            d="M27 48 C26 28, 70 28, 69 48 L67 49 L29 49 Z"
            fill="#6d7453"
          />
          <path d="M27 46 L25 53 L31 53 L31 47 Z" fill="#555b40" />
          <path d="M69 46 L71 53 L65 53 L65 47 Z" fill="#555b40" />
          <polygon points="48,30 56,37 53,45 43,45 40,37" fill="#555b40" />
          <rect x="45" y="36" width="6" height="6" rx="1" fill="#7a8260" strokeWidth="1.8" />
          <path
            d="M31 46 L65 46 L63 57 L52 57 L48 53 L44 57 L33 57 Z"
            fill="#262b30"
          />
          <polygon points="53,48 58,48 55,55 50,55" fill="#7c8792" stroke="none" />
        </g>
      )}

      {pageIndex === 3 && (
        /* Page 3: BASE UPGRADE Double-Chevron Command Rank Crest (1:1 Reference Image) */
        <g stroke="#0d0f12" strokeWidth="2.4" strokeLinejoin="round">
          <polygon
            points="48,26 70,41 70,51 48,37 26,51 26,41"
            fill="#b8ab83"
          />
          <polygon
            points="48,26 26,41 26,51 48,37"
            fill="#d2c69e"
          />
          <polygon
            points="48,43 70,58 70,68 48,54 26,68 26,58"
            fill="#b8ab83"
          />
          <polygon
            points="48,43 26,58 26,68 48,54"
            fill="#d2c69e"
          />
          <polygon
            points="48,60 64,70 48,80 32,70"
            fill="#887e5e"
          />
        </g>
      )}

      {(pageIndex === 4 || pageIndex === 5) && (
        /* Page 4 & 5: STRATEGIC ORDNANCE & TACTICAL EXPLOSIVES Crest */
        <g stroke="#0d0f12" strokeWidth="2.2" strokeLinejoin="round">
          <circle cx="48" cy="51" r="18" fill="#f5b82e" />
          <path d="M48 51 L38 35 A18 18 0 0 1 58 35 Z" fill="#0d0f12" />
          <path d="M48 51 L66 52 A18 18 0 0 1 56 67 Z" fill="#0d0f12" />
          <path d="M48 51 L40 67 A18 18 0 0 1 30 52 Z" fill="#0d0f12" />
          <circle cx="48" cy="51" r="5.5" fill="#00f5ff" stroke="#0d0f12" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
}

const KIOSK_SPRITE_IMAGE_PATHS: Record<KioskCardIllustrationId, string> = {
  ar99_rifle: '/assets/kiosk/ar99_rifle.png',
  p12_handgun: '/assets/kiosk/p12_handgun.png',
  vx20_bazooka: '/assets/kiosk/vx20_bazooka.png',
  skyshield_turret: '/assets/kiosk/skyshield_turret.png',
  st01_minitank: '/assets/kiosk/st01_minitank.png',
  ht88_dump_truck: '/assets/kiosk/ht88_dump_truck.png',
  af9_plane: '/assets/kiosk/af9_plane.png',
  street_rookie: '/assets/kiosk/street_rookie.png',
  t800_cyborg: '/assets/kiosk/t800_cyborg.png',
  shinobi_infiltrator: '/assets/kiosk/shinobi_infiltrator.png',
  tactical_veteran: '/assets/kiosk/tactical_veteran.png',
  hq_super_command: '/assets/kiosk/hq_super_command.png',
  hq_tactical_comms: '/assets/kiosk/hq_tactical_comms.png',
  lg88_laser_rifle: '/assets/kiosk/lg88_laser_rifle.png',
  nuclear_launcher: '/assets/kiosk/nuclear_launcher.png',
  titan6_gatling: '/assets/kiosk/titan6_gatling.png',
  hg04_grenade: '/assets/kiosk/hg04_grenade.png',
  tm89_mine: '/assets/kiosk/tm89_mine.png',
  cb24_cluster: '/assets/kiosk/cb24_cluster.png',
};

const SQUAD_BUST_ILLUSTRATION_IDS = new Set<KioskCardIllustrationId>([
  'street_rookie',
  't800_cyborg',
  'shinobi_infiltrator',
  'tactical_veteran',
]);

const BASE_HOUSE_ILLUSTRATION_IDS = new Set<KioskCardIllustrationId>([
  'hq_super_command',
  'hq_tactical_comms',
]);

function renderComicCardIllustration(
  kind: KioskCardIllustrationId,
  altText: string,
  isSilhouetteLocked = false,
) {
  const spriteSrc = KIOSK_SPRITE_IMAGE_PATHS[kind];
  const isSquadBust = SQUAD_BUST_ILLUSTRATION_IDS.has(kind);
  const isBaseHouse = BASE_HOUSE_ILLUSTRATION_IDS.has(kind);

  return (
    <div
      className={`relative w-full flex items-center justify-center select-none pointer-events-none ${
        isSilhouetteLocked ? 'h-[118px] sm:h-[132px]' : ''
      }`}
    >
      <img
        src={spriteSrc}
        alt={isSilhouetteLocked ? 'Surprise Locked Weapon' : altText}
        draggable={false}
        className={`w-full ${
          isSilhouetteLocked
            ? 'h-[96px] sm:h-[108px] object-contain brightness-0 contrast-200 drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]'
            : isSquadBust
            ? 'h-[92px] sm:h-[104px] object-contain object-bottom -mb-2.5'
            : isBaseHouse
            ? 'h-[82px] sm:h-[92px] object-contain'
            : 'h-[78px] sm:h-[88px] object-contain'
        } transition-all duration-300 select-none pointer-events-none`}
      />
      {isSilhouetteLocked && (
        <div
          data-nuclear-silhouette-lock="true"
          data-silhouette-lock-id={kind}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-12 h-12 rounded-full bg-[#0d0f12] border-[3px] border-[#f5b82e] shadow-[0_3.5px_0_#0d0f12] flex items-center justify-center">
            <span
              className="text-[28px] font-black leading-none text-[#f5b82e]"
              style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}
            >
              ?
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function renderSlotHologramPills(slots: readonly CrateSlotType[]) {
  return (
    <div className="flex items-center gap-1" title="Kombinasi Warna Hologram 2x2x2 di Crate Pad">
      {slots.map((slot, idx) => {
        const bgClass =
          slot === 'legend'
            ? 'bg-[#f5b82e] border-[#0d0f12]'
            : slot === 'super'
            ? 'bg-[#2bb3b1] border-[#0d0f12]'
            : slot === 'red'
            ? 'bg-[#e5483b] border-[#0d0f12]'
            : 'bg-[#d6dade] border-[#0d0f12] opacity-45';
        return <span key={idx} className={`w-3 h-3 border-[1.5px] ${bgClass}`} />;
      })}
    </div>
  );
}

export const TacticalKioskModal: React.FC<TacticalKioskModalProps> = ({
  isOpen,
  onClose,
  hud,
  onSelectRecipe,
  onRemoveQueueIndex,
  onClearQueue,
  onUpgradeBase,
  onBuyCrateAirdrop,
}) => {
  const [pageIndex, setPageIndex] = useState<KioskPageIndex>(0);
  const [selectedCardIdByPage, setSelectedCardIdByPage] = useState<Record<KioskPageIndex, string>>({
    0: 'ar99_rifle',
    1: 'st01_minitank',
    2: 't800_cyborg',
    3: 'hq_super_command',
    4: 'lg88_laser_rifle',
    5: 'tm89_mine',
  });
  const [isInspectOpen, setIsInspectOpen] = useState<boolean>(false);

  const bLv = hud.baseBuildingLevel;
  const fLv = hud.baseFenceLevel;
  const comboMaxed = bLv >= 3 && fLv >= 3;
  const superCommandCost = comboMaxed ? 800 : 1200;
  const commsCost = bLv === 1 ? 750 : bLv === 2 ? 1500 : 500;
  const nukeAccess = evaluateNuclearLauncherAccess(bLv);
  const clusterAccess = evaluateClusterBombAccess(
    bLv,
    Boolean(hud.controlMode === 'tank' && hud.equippedWeapon.toLowerCase().includes('plane')),
  );

  const pages: Record<
    KioskPageIndex,
    {
      headerTitle: string;
      headerSubtitle: string;
      cards: KioskGridCardItem[];
    }
  > = {
    0: {
      headerTitle: 'WEAPON ARMORY',
      headerSubtitle:
        'Equip your primary arsenal, heavy ordnance, or tactical defense turret for the upcoming battle.',
      cards: [
        {
          id: 'ar99_rifle',
          title: 'AR-99 ASSAULT RIFLE',
          tagLine: '[PRIMARY // TIER 4]',
          illustration: 'ar99_rifle',
          actionKind: 'recipe',
          recipeId: 'assault_plasma',
          inspectDetail: '5.56x45mm Tactical Carbine · Hologram Pad: 2x Peti Biru',
        },
        {
          id: 'p12_handgun',
          title: 'P-12 TACTICAL HANDGUN',
          tagLine: '[SIDEARM // TIER 2]',
          illustration: 'p12_handgun',
          actionKind: 'recipe',
          recipeId: 'pistol_uzi',
          inspectDetail: '9x19mm Sidearm + Reflex Sight · Hologram Pad: 1x Peti Merah',
        },
        {
          id: 'vx20_bazooka',
          title: 'VX-20 HEAVY BAZOOKA',
          tagLine: '[ORDNANCE // TIER 5]',
          illustration: 'vx20_bazooka',
          actionKind: 'recipe',
          recipeId: 'bazooka',
          inspectDetail: '84mm Anti-Armor Rocket · Hologram Pad: 1x Peti Biru + 1x Peti Merah',
        },
        {
          id: 'skyshield_turret',
          title: '35mm SKYSHIELD TURRET',
          tagLine: '[TURRET // TIER 4]',
          illustration: 'skyshield_turret',
          actionKind: 'recipe',
          recipeId: 'skyshield_turret',
          inspectDetail: 'C-RAM Base Air/Ground Defense · Hologram Pad: 2x Biru + 2x Merah',
        },
      ],
    },
    1: {
      headerTitle: 'VEHICLE HANGAR',
      headerSubtitle:
        'Deploy armored ground units or aerial strike craft to the battlefield.',
      cards: [
        {
          id: 'st01_minitank',
          title: 'ST-01 COMBAT MINI-TANK',
          tagLine: '[GROUND // ASSAULT // TIER 4]',
          illustration: 'st01_minitank',
          actionKind: 'recipe',
          recipeId: 'lyo_tank',
          inspectDetail: '105mm Chibi Battle Tank · Hologram Pad: 4x Peti Merah (2x1x2)',
        },
        {
          id: 'ht88_dump_truck',
          title: 'HT-88 HEAVY DUMP TRUCK',
          tagLine: '[GROUND // CARGO // TIER 3]',
          illustration: 'ht88_dump_truck',
          actionKind: 'recipe',
          recipeId: 'dump_truck',
          inspectDetail: '4-Crate Hydraulic Dump Vessel · Hologram Pad: 4x Peti Merah (2x2x1)',
        },
        {
          id: 'af9_plane',
          title: 'AF-9 SKY-STRIKER PLANE',
          tagLine: '[AERIAL // INTERCEPTOR // TIER 4]',
          illustration: 'af9_plane',
          actionKind: 'recipe',
          recipeId: 'lyo_plane',
          inspectDetail: 'VTOL Strike Aircraft · Hologram Pad: 2x Emas + 2x Biru + 4x Merah',
        },
      ],
    },
    2: {
      headerTitle: 'SQUAD BUILD',
      headerSubtitle:
        'Recruit and deploy your tactical Roblox operators and battle specialists for the front line.',
      cards: [
        {
          id: 'street_rookie',
          title: 'STREET ROOKIE // SCOUT',
          tagLine: '[RECON // TIER 1]',
          illustration: 'street_rookie',
          actionKind: 'recipe',
          recipeId: 'buddy_infantry',
          inspectDetail: 'Fast Crate Harvester & Recon Scout · Hologram Pad: 2x Peti Merah (1x1x2)',
        },
        {
          id: 't800_cyborg',
          title: 'T-800 CYBORG // HEAVY',
          tagLine: '[ASSAULT // TIER 4]',
          illustration: 't800_cyborg',
          actionKind: 'recipe',
          recipeId: 'buddy_commando',
          inspectDetail: 'Armored Exo-Cyborg (2x HP & Anti-Armor) · Hologram Pad: 1x Biru + 1x Merah',
        },
        {
          id: 'shinobi_infiltrator',
          title: 'SHINOBI // INFILTRATOR',
          tagLine: '[STEALTH // TIER 3]',
          illustration: 'shinobi_infiltrator',
          actionKind: 'recipe',
          recipeId: 'buddy_ninja',
          inspectDetail: 'Dual-Katana Stealth Assassin · Hologram Pad: 1x Emas + 1x Biru (1x1x2)',
        },
        {
          id: 'tactical_veteran',
          title: 'TACTICAL VETERAN // COMMANDER',
          tagLine: '[LEADER // TIER 5]',
          illustration: 'tactical_veteran',
          actionKind: 'recipe',
          recipeId: 'buddy_super_wall',
          inspectDetail: 'Elite Squad Commander (260 HP) · Hologram Pad: 2x Biru + 2x Merah (2x1x2)',
        },
      ],
    },
    3: {
      headerTitle: 'BASE UPGRADE',
      headerSubtitle:
        'Upgrade central command facilities, tactical quarters, defense barriers, and operations hubs to higher tiers.',
      cards: [
        {
          id: 'hq_super_command',
          title: '3-STORY SUPER COMMAND',
          tagLine: bLv >= 3 ? '[AKTIF // HQ LV.3 TERBUKA]' : '[HQ // STRATEGIC // TIER 3]',
          illustration: 'hq_super_command',
          actionKind: 'upgrade_base',
          upgradeId: 'upgrade_super_command_lv3',
          inspectDetail: `${
            comboMaxed
              ? 'MAX LV.3 AKTIF (Nuclear Launcher & Cluster Bomb Terbuka!)'
              : `Biaya Upgrade Langsung Lv.3: ${superCommandCost} GOLD`
          } · HP Markas: ${hud.baseBuildingHp}/${hud.baseBuildingMaxHp} · Pagar: ${hud.baseFenceHp}/${hud.baseFenceMaxHp}`,
        },
        {
          id: 'hq_tactical_comms',
          title: 'CENTRAL TACTICAL COMMS',
          tagLine: bLv >= 2 ? `[AKTIF // RADAR LV.${bLv}]` : '[OPERATIONS // TIER 2]',
          illustration: 'hq_tactical_comms',
          actionKind: 'upgrade_base',
          upgradeId: 'upgrade_building_only',
          inspectDetail: `Biaya Upgrade Bertahap: ${commsCost} GOLD · Radar Lv.${bLv}: ${
            bLv >= 3 ? 'MAX 280m (Full Peta)' : bLv === 2 ? '152m -> MAX 280m' : '92m -> 152m'
          }`,
        },
      ],
    },
    4: {
      headerTitle: 'SPECIAL ARMORY',
      headerSubtitle:
        'Equip your primary arsenal, heavy ordnance, or tactical defense turret for the upcoming battle.',
      cards: [
        {
          id: 'lg88_laser_rifle',
          title: 'LG-88 PHOTON LANCE',
          tagLine: '[ENERGY // TIER 4]',
          illustration: 'lg88_laser_rifle',
          actionKind: 'recipe',
          recipeId: 'laser_gun',
          inspectDetail: 'Directed-Energy Photon Lance Rifle (Efek Laser + Api Target) · Hologram Pad: 1x Biru + 1x Merah',
        },
        {
          id: 'titan6_gatling',
          title: 'TITAN-6 ROTARY GATLING',
          tagLine: '[HEAVY // TIER 4]',
          illustration: 'titan6_gatling',
          actionKind: 'recipe',
          recipeId: 'gatling_mortar',
          inspectDetail: '6-Barrel 7.62mm Rotary Gatling Gun · Hologram Pad: 2x Biru + 2x Merah',
        },
        {
          id: 'hg04_grenade',
          title: 'HG-04 FRAG GRENADE',
          tagLine: '[TACTICAL // TIER 2]',
          illustration: 'hg04_grenade',
          actionKind: 'recipe',
          recipeId: 'hand_grenade',
          inspectDetail: 'Delay 3.5s Fragmentation Hand Grenade · Hologram Pad: 1x Peti Merah',
        },
        {
          id: 'nuclear_launcher',
          title: nukeAccess.isRevealed ? 'TACTICAL NUKE LAUNCHER' : '',
          tagLine: nukeAccess.isRevealed ? '[TURRET // TIER 5]' : '',
          illustration: 'nuclear_launcher',
          actionKind: 'recipe',
          recipeId: 'nuclear_launcher',
          isSilhouetteLocked: !nukeAccess.isRevealed,
          inspectDetail: nukeAccess.statusMessage,
        },
      ],
    },
    5: {
      headerTitle: 'TACTICAL EXPLOSIVES',
      headerSubtitle:
        'Deploy pressure-activated anti-vehicle land mines and multi-bomblet cluster dispensers.',
      cards: [
        {
          id: 'tm89_mine',
          title: 'TM-89 ANTI-VEHICLE MINE',
          tagLine: '[ORDNANCE // TIER 2]',
          illustration: 'tm89_mine',
          actionKind: 'recipe',
          recipeId: 'land_mine',
          inspectDetail: 'Heavy Anti-Vehicle Pressure Land Mine · Hologram Pad: 1x Peti Biru',
        },
        {
          id: 'cb24_cluster',
          title: clusterAccess.isRevealed ? 'CB-24 CLUSTER BOMB' : '',
          tagLine: clusterAccess.isRevealed ? '[KHUSUS PESAWAT // TIER 3]' : '',
          illustration: 'cb24_cluster',
          actionKind: 'recipe',
          recipeId: 'cluster_bomb',
          isSilhouetteLocked: !clusterAccess.isRevealed,
          inspectDetail: clusterAccess.isRevealed
            ? `Khusus Pesawat Tempur (Lyo Plane) · 24x Submunition Cluster Bomb · ${clusterAccess.statusMessage}`
            : clusterAccess.statusMessage,
        },
      ],
    },
  };

  const currentPage = pages[pageIndex];
  const selectedCardId = selectedCardIdByPage[pageIndex];
  const selectedCard =
    currentPage.cards.find((c) => c.id === selectedCardId) ?? currentPage.cards[0];
  const selectedRecipeSpec = selectedCard.recipeId
    ? KIOSK_BUILD_PRIORITY_RECIPES[selectedCard.recipeId]
    : null;

  const handlePrevPage = () => {
    soundEngine.playUiClick();
    setPageIndex((prev) => ((prev + 5) % 6) as KioskPageIndex);
  };

  const handleNextPage = () => {
    soundEngine.playUiClick();
    setPageIndex((prev) => ((prev + 1) % 6) as KioskPageIndex);
  };

  const handleSelectCard = (card: KioskGridCardItem) => {
    soundEngine.playUiClick();
    setSelectedCardIdByPage((prev) => ({
      ...prev,
      [pageIndex]: card.id,
    }));
  };

  const buildQueue = hud.buildQueue ?? [];
  const isQueueFull = buildQueue.length >= MAX_KIOSK_BUILD_QUEUE;

  const handleExecuteBuild = () => {
    soundEngine.playUiClick();
    if (selectedCard.actionKind === 'recipe' && selectedCard.recipeId) {
      onSelectRecipe(selectedCard.recipeId);
      if (!selectedCard.isSilhouetteLocked && !isQueueFull) {
        onClose();
      }
    } else if (selectedCard.actionKind === 'upgrade_base' && selectedCard.upgradeId) {
      onUpgradeBase(selectedCard.upgradeId);
    } else if (selectedCard.actionKind === 'buy_crate' && selectedCard.crateKind) {
      onBuyCrateAirdrop(selectedCard.crateKind);
    }
  };

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-hidden={!isOpen}
      aria-label="Self-Service Tactical Kiosk"
      data-kiosk-drawer="true"
      className={`fixed top-1/2 right-3 sm:right-7 -translate-y-1/2 z-40 w-[94vw] max-w-[490px] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isOpen
          ? 'translate-x-0 opacity-100 pointer-events-auto'
          : 'translate-x-[120%] opacity-0 pointer-events-none'
      }`}
    >
      <div className="relative pt-6 pl-2.5 pb-2.5 pr-1">
        {/* Solid Pitch-Black Comic Offset Backplate Shadow (Left & Bottom Skewed Frame) */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-8 bottom-0 bg-[#0d0f12] -rotate-[1.1deg] translate-x-[-7px] translate-y-[7px]"
          style={{
            clipPath:
              'polygon(0% 1%, 96% 0%, 100% 4%, 99% 100%, 1% 99%)',
          }}
        />

        {/* Main Crisp White Comic-Tactical Card Container */}
        <div className="relative bg-white border-[3.5px] border-[#0d0f12] px-5 sm:px-6 pt-9 pb-5 text-[#0d0f12]">
          {/* Top-Edge Tactical V-Notch & Top-Right Chamfer Accent */}
          <div
            aria-hidden="true"
            className="absolute -top-[3.5px] right-20 w-5 h-2.5 bg-[#0d0f12]"
            style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
          />
          <div
            aria-hidden="true"
            className="absolute -top-[4px] -right-[4px] w-5 h-5 bg-[#0d0f12]"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}
          />

          {/* Overlapping Top-Left Metallic Shield Crest Emblem */}
          <div className="absolute -top-9 left-4 sm:left-5 z-20">
            {renderShieldCrestSvg(pageIndex)}
          </div>

          {/* Top-Right Warzone Gold Pill + Bold "✕" Close Button */}
          <div className="absolute top-3 right-3.5 z-20 flex items-center gap-2">
            <div
              data-kiosk-gold="true"
              className="px-2.5 py-0.5 bg-[#f4f6f8] border-2 border-[#0d0f12] text-[11px] font-black tracking-tight text-[#0d0f12] shadow-[0_2px_0_#0d0f12]"
              title="Warzone Gold"
            >
              🪙 {hud.gold.toLocaleString()}G
            </div>
            <button
              type="button"
              data-kiosk-close="true"
              onClick={() => {
                soundEngine.playUiClick();
                onClose();
              }}
              aria-label="Tutup Kiosk"
              className="w-8 h-8 flex items-center justify-center text-[#0d0f12] hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-[#0d0f12]" strokeWidth="3.8">
                <line x1="4" y1="4" x2="20" y2="20" strokeLinecap="square" />
                <line x1="20" y1="4" x2="4" y2="20" strokeLinecap="square" />
              </svg>
            </button>
          </div>

          {/* Header Block: Ultra-Black Uppercase Title & Subtitle */}
          <div className="mt-2">
            <h2
              className="text-[32px] sm:text-[38px] font-black uppercase tracking-tight leading-[0.98] text-[#0d0f12]"
              style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}
            >
              {currentPage.headerTitle}
            </h2>
            <p className="mt-1.5 text-[12.5px] sm:text-[13.5px] font-medium leading-[1.32] text-[#1c2026]">
              {currentPage.headerSubtitle}
            </p>
          </div>

          {/* 2x2 Grid of 4 Slots (When a page has only 2 cards, bottom row stays empty without shrinking modal height) */}
          <div className="grid grid-cols-2 grid-rows-2 gap-3 sm:gap-3.5 mt-4">
            {currentPage.cards.map((card) => {
              const isSelected = selectedCard.id === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  data-kiosk-card={card.id}
                  data-kiosk-recipe={card.recipeId}
                  onClick={() => handleSelectCard(card)}
                  className={`group relative text-left transition-transform cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[#2bb3b1] p-[3.5px] border-[3px] border-[#0d0f12] shadow-[0_3.5px_0_#0d0f12]'
                      : 'bg-white border-[2.5px] border-[#0d0f12] shadow-[0_3px_0_#0d0f12] hover:-translate-y-0.5'
                  }`}
                >
                  <div
                    className={`relative h-full flex flex-col justify-between bg-white overflow-hidden ${
                      isSelected ? 'border-[2px] border-[#0d0f12] p-2.5' : 'p-2.5'
                    }`}
                  >
                    {/* Top-Right Teal Corner Checkmark Badge on Selected Card */}
                    {isSelected && (
                      <div
                        className="absolute -top-[2px] -right-[2px] w-7 h-7 bg-[#2bb3b1] border-l-[2.5px] border-b-[2.5px] border-[#0d0f12] flex items-center justify-center z-10"
                        style={{
                          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 22% 100%, 0 78%)',
                        }}
                      >
                        <svg
                          viewBox="0 0 20 20"
                          className="w-4 h-4 stroke-[#0d0f12] fill-none"
                          strokeWidth="3.2"
                        >
                          <polyline
                            points="3.5,10.5 8,15 16.5,5.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Card Title & Bracketed Tier Classification (Hidden completely when isSilhouetteLocked is true so it is a pure surprise silhouette + ?) */}
                    {!card.isSilhouetteLocked && (
                      <div className={isSelected ? 'pr-6' : ''}>
                        <div
                          className={`${
                            card.title.length >= 26
                              ? 'text-[10.5px] sm:text-[11.5px]'
                              : 'text-[12.5px] sm:text-[14px]'
                          } font-black uppercase tracking-tight leading-[1.1] text-[#0d0f12]`}
                          style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}
                        >
                          {card.title}
                        </div>
                        <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-tight text-[#1c2026] mt-0.5">
                          {card.tagLine}
                        </div>
                      </div>
                    )}

                    {/* High-Detail Comic Tactical Illustration */}
                    <div
                      className={`${
                        card.isSilhouetteLocked ? 'my-auto' : 'mt-1.5'
                      } flex items-center justify-center`}
                    >
                      {renderComicCardIllustration(
                        card.illustration,
                        card.title,
                        Boolean(card.isSilhouetteLocked),
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
            {Array.from({ length: Math.max(0, 4 - currentPage.cards.length) }).map((_, emptyIdx) => (
              <div
                key={`empty-slot-${emptyIdx}`}
                aria-hidden="true"
                className="invisible pointer-events-none select-none border-[2.5px] border-transparent p-2.5"
              >
                <div className="h-[34px] sm:h-[38px]" />
                <div className="mt-1.5 h-[78px] sm:h-[88px]" />
              </div>
            ))}
          </div>

          {/* 6-Slot Continuous Build Queue Strip (Max 6 Antrian) */}
          <div
            data-kiosk-build-queue="true"
            className="mt-3 px-2.5 py-2 bg-[#f4f6f8] border-[2.5px] border-[#0d0f12] shadow-[0_2px_0_#0d0f12]"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10.5px] font-black uppercase tracking-tight text-[#0d0f12]">
                ANTRIAN BUILD OTOMATIS ({buildQueue.length}/{MAX_KIOSK_BUILD_QUEUE})
              </span>
              {buildQueue.length > 0 && onClearQueue && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    onClearQueue();
                  }}
                  className="text-[9.5px] font-black uppercase px-1.5 py-0.5 bg-white hover:bg-[#fee2e2] border border-[#0d0f12] text-[#0d0f12] cursor-pointer"
                >
                  HAPUS SEMUA
                </button>
              )}
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {Array.from({ length: MAX_KIOSK_BUILD_QUEUE }).map((_, qIdx) => {
                const qRecipeId = buildQueue[qIdx];
                const qSpec = qRecipeId ? KIOSK_BUILD_PRIORITY_RECIPES[qRecipeId] : null;
                const isFrontActive = qIdx === 0 && Boolean(qSpec);
                return (
                  <button
                    key={`queue-slot-${qIdx}`}
                    type="button"
                    disabled={!qSpec}
                    onClick={() => {
                      if (qSpec && onRemoveQueueIndex) {
                        soundEngine.playUiClick();
                        onRemoveQueueIndex(qIdx);
                      }
                    }}
                    title={
                      qSpec
                        ? `${qIdx === 0 ? '[SEDANG DIBANGUN] ' : `[ANTRIAN #${qIdx + 1}] `}${qSpec.name} (Klik untuk hapus)`
                        : `Slot Antrian #${qIdx + 1} Kosong`
                    }
                    className={`h-7 px-1 border-[2px] border-[#0d0f12] flex items-center justify-center text-[9px] font-black uppercase truncate transition-colors ${
                      isFrontActive
                        ? 'bg-[#2bb3b1] text-[#0d0f12] shadow-[0_1.5px_0_#0d0f12] cursor-pointer'
                        : qSpec
                          ? 'bg-white hover:bg-[#fee2e2] text-[#0d0f12] cursor-pointer'
                          : 'bg-[#e5e9ee] text-[#7a8490] border-dashed cursor-default'
                    }`}
                  >
                    {qSpec ? `${qIdx + 1}.${qSpec.name.split(' ')[0]}` : `#${qIdx + 1}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Inspect Drawer (Toggled by INSPECT button or when Kiosk Status Toast is active) */}
          {(isInspectOpen || hud.kioskStatusMessage) && (
            <div className="mt-3 px-3 py-2 bg-[#f0f4f6] border-[2.5px] border-[#0d0f12] shadow-[0_2px_0_#0d0f12] flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black uppercase tracking-tight text-[#0d0f12]">
                  {selectedCard.isSilhouetteLocked
                    ? '??? [SENJATA PENGHANCUR RAHASIA]'
                    : selectedCard.title}
                </span>
                {selectedRecipeSpec &&
                  !selectedCard.isSilhouetteLocked &&
                  renderSlotHologramPills(selectedRecipeSpec.slotHologramColors)}
              </div>
              <div className="text-[11px] font-bold text-[#1c2026]">
                {selectedCard.inspectDetail}
              </div>
              {hud.kioskStatusMessage && (
                <div className="text-[10.5px] font-black text-[#0f7a78]">
                  ✓ {hud.kioskStatusMessage}
                </div>
              )}
            </div>
          )}

          {/* Bottom Footer Bar: [◄] [►] Pagination on Left + Skewed [INSPECT] [BUILD] Lockup on Right */}
          <div className="mt-4 pt-1 flex items-center justify-between gap-3">
            {/* Left: Square Prev / Next Page Arrow Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                data-kiosk-prev="true"
                onClick={handlePrevPage}
                aria-label="Halaman Sebelumnya"
                className="w-11 h-11 bg-white hover:bg-[#eef2f5] active:translate-y-0.5 border-[3px] border-[#0d0f12] shadow-[0_3.5px_0_#0d0f12] flex items-center justify-center cursor-pointer transition-all"
              >
                <svg viewBox="0 0 20 20" className="w-4 h-4 fill-[#0d0f12]">
                  <polygon points="14,3 5,10 14,17" />
                </svg>
              </button>
              <button
                type="button"
                data-kiosk-next="true"
                onClick={handleNextPage}
                aria-label="Halaman Berikutnya"
                className="w-11 h-11 bg-white hover:bg-[#eef2f5] active:translate-y-0.5 border-[3px] border-[#0d0f12] shadow-[0_3.5px_0_#0d0f12] flex items-center justify-center cursor-pointer transition-all"
              >
                <svg viewBox="0 0 20 20" className="w-4 h-4 fill-[#0d0f12]">
                  <polygon points="6,3 15,10 6,17" />
                </svg>
              </button>
            </div>

            {/* Right: Connected Dual Trapezoidal INSPECT + BUILD Buttons */}
            <div className="flex items-center">
              {/* Left Skewed INSPECT Button */}
              <button
                type="button"
                data-kiosk-inspect="true"
                onClick={() => {
                  soundEngine.playUiClick();
                  setIsInspectOpen((prev) => !prev);
                }}
                className={`h-9 px-3.5 border-y-[3px] border-l-[3px] border-[#0d0f12] font-black text-xs sm:text-[13px] uppercase tracking-tight text-[#0d0f12] shadow-[0_3px_0_#0d0f12] -skew-x-6 cursor-pointer transition-colors ${
                  isInspectOpen ? 'bg-[#2bb3b1]' : 'bg-[#d9dde2] hover:bg-[#c8cfd6]'
                }`}
              >
                <span className="inline-block skew-x-6">INSPECT</span>
              </button>

              {/* Right Larger Skewed BUILD Button */}
              <button
                type="button"
                data-kiosk-build="true"
                onClick={handleExecuteBuild}
                className={`h-12 px-7 sm:px-9 active:translate-y-0.5 border-[3.5px] border-[#0d0f12] font-black text-xl sm:text-2xl uppercase tracking-tight shadow-[3px_4px_0_#0d0f12] -skew-x-6 cursor-pointer transition-all ${
                  selectedCard.isSilhouetteLocked
                    ? 'bg-[#262b30] text-[#f5b82e] hover:bg-[#343b42]'
                    : 'bg-[#e2e6ea] hover:bg-[#2bb3b1] text-[#0d0f12]'
                }`}
                style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}
              >
                <span className="inline-block skew-x-6">
                  {selectedCard.isSilhouetteLocked
                    ? 'LOCKED LV.3'
                    : selectedCard.actionKind === 'upgrade_base'
                    ? 'UPGRADE'
                    : selectedCard.actionKind === 'buy_crate'
                    ? 'AIRDROP'
                    : 'BUILD'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
