import type { BalanceTier } from './types';
import { parseNumericKeyValueCsv, splitCsvLine } from './csv';

/**
 * 게임 수치: `game_data/04_balance_tune.csv` + `07_time_rules.csv` 병합.
 * 시간 시트는 같은 키로 전역 숫자만 덮음(예 PLAY_TIMER_CYCLE_SEC).
 */
export const GAME_TUNE_DEFAULTS: Record<string, number> = {
  VIEW_W: 800,
  VIEW_H: 300,
  GROUND: 46,
  PLAY_TIMER_CYCLE_SEC: 60,
  STARTER_SCORE_PER_COIN: 100,
  COIN_RESPAWN_BASE_SEC: 0.46,
  COIN_CLUSTER_TRIPLE_GATE: 0.09,
  COIN_CLUSTER_DOUBLE_GATE: 0.52,
  COIN_AIR_ROW_MAX_CLUSTER: 2,
  COIN_CHAIN_GAP_LO: 36,
  COIN_CHAIN_GAP_HI: 44,
  COIN_SPAWN_REJECT_RETRIES: 7,
  COIN_AIR_BAND_PROB: 0.45,
  COIN_AIR_Y_BAND_RETRIES: 6,
  COIN_SPAWN_AIR_SAFE_PAD: 9,
  COIN_SPAWN_SAFE_PAD: 14,
  COIN_AIR_LAYER_RND_LO: 22,
  COIN_AIR_LAYER_RND_HI: 58,
  COIN_VERTICAL_STACK_PAIR_CHANCE: 0.22,
  COIN_STACK_VERTICAL_GAP: 32,
  HIT_INSET: 8,
  DRAGON_W: 48,
  DRAGON_H: 48,
  DRAGON_LEFT: 80,
  GRAVITY: 2200,
  JUMP_IMPULSE: 520,
  COLLISION_IGNORE_MS: 2200,
  INVINCIBILITY_MS: 3000,
  STAR_MIN_GAP_MS: 8200,
  SUN_POS_XOF: 280,
  SUN_POS_YOF: 140,
  SUN_POS_ZOF: 900,
  LIGHT_AMBIENT_INT: 0.72,
  LIGHT_SUN_INT: 0.85,
  DRAGON_RENDER_ORDER: 44,
  SCROLL_PF_BASE: 5,
  SCROLL_SCORE_CHUNK: 100,
  SCROLL_PF_STEP: 0.3,
  SCROLL_MULT: 60,
  SCORE_PER_SEC: 6,
  DELTA_CAP: 0.085,
  PARALLAX_MUL: 0.08,
  PARALLAX_IDLE_BASE: 4,
  PARALLAX_RESET_XLEFT: -120,
  PARALLAX_RND_LO: 40,
  PARALLAX_RND_HI: 200,
  CLOUD_SZ_LO: 72,
  CLOUD_SZ_HI: 120,
  CLOUD_POS_X_LO: -40,
  CLOUD_POS_Y_LO: 210,
  CLOUD_POS_Y_HI: 280,
  DRAGON_PULSE_FREQ: 6.3,
  DRAGON_PULSE_AMP: 0.026,
  IDLE_DRAGON_BOB_FREQ: 2.4,
  IDLE_DRAGON_BOB_AMP: 3,
  DRAGON_SCALE_FIT_MULT: 0.92,
  DRAGON_POS_Z_PLAY: 4,
  STEP_RESET_OBSTACLE_CD: 1.6,
  STEP_RESET_COIN_CD: 0.35,
  OBSTACLE_FAIL_COOLDOWN: 0.5,
  OBSTACLE_FRAMES_MIN: 45,
  OBSTACLE_FRAMES_BASE: 150,
  OBSTACLE_SCORE_DIV: 10,
  OBSTACLE_SPAWN_X_RND_LO: 64,
  OBSTACLE_SPAWN_X_RND_HI: 200,
  AIR_HEIGHT_RND_LO: 18,
  AIR_HEIGHT_RND_HI: 52,
  OBSTACLE_RECYCLE_LEFT_X: -140,
  COIN_GRID_W: 28,
  COIN_GRID_H: 28,
  COIN_BOTTOM_OFF: 8,
  COIN_GRID_X_RND_LO: 84,
  COIN_GRID_X_RND_HI: 252,
  COIN_GRID_SI_GAP: 48,
  COIN_PICKUP_DRAGON_EXPAND: 8,
  COIN_PICKUP_COIN_EXPAND: 4,
  COIN_DESTROY_LEFT_X: -80,
  STAR_PICKUP_W: 28,
  STAR_PICKUP_H: 28,
  STAR_OFF_X_LO: 80,
  STAR_OFF_X_HI: 240,
  STAR_GAP_RESCHED_LO: 40,
  STAR_GAP_RESCHED_HI: 320,
  FIRST_STAR_MSTONE_MIN: 14,
  FIRST_STAR_MSTONE_MAX: 26,
  STAR_RESET_MSTONE_MIN: 16,
  STAR_RESET_MSTONE_MAX: 30,
  STAR_EACH_MSTONE_MIN: 18,
  STAR_EACH_MSTONE_MAX: 34,
  STAR_BATCH_PROB_GATE: 0.68,
  STAR_INNER_TWO_V_LT: 0.14,
  STAR_INNER_ONE_V_LT: 0.88,
  STAR_DELAY_MS_LO: 240,
  STAR_DELAY_MS_HI_BASE: 1600,
  STAR_DELAY_MS_PER_STAR_IDX: 2800,
  INVINC_SINE_HZ: 4.4,
  INVINC_ALPHA_MIN: 0.42,
  INVINC_ALPHA_MAX: 1,
  INVINC_EMB_MIN: 0.12,
  INVINC_EMB_MAX: 0.62,
  GAMEOVER_SPIN_MS: 600,
};

export const DEFAULT_TALL_TREE_AFTER: Record<BalanceTier, number> = {
  low: 76,
  mid: 44,
  high: 11,
};

/** 티어 전용 행 예: key=TALL_TREE_SEC_AFTER — 선인장(키 큼) 등장 경과 시간(초) */
export class TuneBook {
  constructor(
    private readonly globalNums: Record<string, number>,
    private readonly tierNums: Partial<Record<BalanceTier, Record<string, number>>>,
  ) {}

  /** 글로벌 수치(CSV 또는 기본값) */
  num(key: string): number {
    const v =
      this.globalNums[key] ?? GAME_TUNE_DEFAULTS[key as keyof typeof GAME_TUNE_DEFAULTS];
    return Number.isFinite(v) ? (v as number) : NaN;
  }

  tierNum(tier: BalanceTier, key: string): number {
    const t = this.tierNums[tier]?.[key];
    if (Number.isFinite(t)) return t!;
    const d = DEFAULT_TALL_TREE_AFTER[tier];
    if (Number.isFinite(d) && key === 'TALL_TREE_SEC_AFTER') return d;
    const g = this.num(key);
    return Number.isFinite(g) ? g : 0;
  }
}

function numCell(s: string | undefined): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * scope,tier,key,value + `07_time_rules` key,value 를 순서대로 병합.
 */
export function buildTuneBook(balanceCsv: string, timeCsv: string): TuneBook {
  const { globalOverrides, tiers } = parseScopedBalanceTune(balanceCsv);
  const timeOverrides = parseNumericKeyValueCsv(timeCsv);
  const merged = {
    ...GAME_TUNE_DEFAULTS,
    ...globalOverrides,
    ...timeOverrides,
  };
  return new TuneBook(merged, tiers);
}

function parseScopedBalanceTune(raw: string): {
  globalOverrides: Record<string, number>;
  tiers: Partial<Record<BalanceTier, Record<string, number>>>;
} {
  const globalOverrides: Record<string, number> = {};
  const tiers: Partial<Record<BalanceTier, Record<string, number>>> = {};

  const lines = raw
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  if (!lines.length) return { globalOverrides, tiers };

  const header = splitCsvLine(lines[0]!).map((s) => s.trim());
  const idxScope = header.indexOf('scope');
  const idxTier = header.indexOf('tier');
  const idxKey = header.indexOf('key');
  const idxValue = header.indexOf('value');
  if (idxKey < 0 || idxValue < 0) return { globalOverrides, tiers };

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]!);
    const rowScope = idxScope >= 0 ? (cols[idxScope] ?? '').trim().toLowerCase() : 'global';
    const tierRaw = idxTier >= 0 ? (cols[idxTier] ?? '').trim().toLowerCase() : '';
    const key = (cols[idxKey] ?? '').trim();
    const val = numCell(cols[idxValue]);
    if (!key || !Number.isFinite(val)) continue;

    if (rowScope === 'tier' && (tierRaw === 'low' || tierRaw === 'mid' || tierRaw === 'high')) {
      const tr = tierRaw as BalanceTier;
      if (!tiers[tr]) tiers[tr] = {};
      tiers[tr]![key] = val;
    } else {
      globalOverrides[key] = val;
    }
  }

  return { globalOverrides, tiers };
}
