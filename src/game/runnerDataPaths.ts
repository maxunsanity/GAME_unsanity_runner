/**
 * `game_data/*.csv` — **경로·파일명의 단일 진실(SSoT)**.
 * `main`·카탈로그·문서는 여기서 파생한다.
 */

export const RUNNER_DATA_CSV_FILENAMES = {
  bundleMeta: '00_bundle_tier_meta.csv',
  character: '01_character_dragon.csv',
  objectObstacle: '02_object_obstacle.csv',
  itemPickup: '03_item_pickup.csv',
  balanceTune: '04_balance_tune.csv',
  textStrings: '05_text_strings.csv',
  fxCatalog: '06_fx_catalog.csv',
  timeRules: '07_time_rules.csv',
  sfxCatalog: '08_sfx_catalog.csv',
  bgmCatalog: '09_bgm_catalog.csv',
  statusSkill: '10_status_skill.csv',
} as const;

export type RunnerDataCsvSheetId = keyof typeof RUNNER_DATA_CSV_FILENAMES;

/** manifest·검증 공통 순서 */
export const ORDER: readonly RunnerDataCsvSheetId[] = [
  'bundleMeta',
  'character',
  'objectObstacle',
  'itemPickup',
  'balanceTune',
  'textStrings',
  'fxCatalog',
  'timeRules',
  'sfxCatalog',
  'bgmCatalog',
  'statusSkill',
] as const;

function toRepoPath(filename: string): string {
  return `game_data/${filename}`;
}

export const RUNNER_DATA_CSV_PATHS: {
  readonly [K in RunnerDataCsvSheetId]: string;
} = {
  bundleMeta: toRepoPath(RUNNER_DATA_CSV_FILENAMES.bundleMeta),
  character: toRepoPath(RUNNER_DATA_CSV_FILENAMES.character),
  objectObstacle: toRepoPath(RUNNER_DATA_CSV_FILENAMES.objectObstacle),
  itemPickup: toRepoPath(RUNNER_DATA_CSV_FILENAMES.itemPickup),
  balanceTune: toRepoPath(RUNNER_DATA_CSV_FILENAMES.balanceTune),
  textStrings: toRepoPath(RUNNER_DATA_CSV_FILENAMES.textStrings),
  fxCatalog: toRepoPath(RUNNER_DATA_CSV_FILENAMES.fxCatalog),
  timeRules: toRepoPath(RUNNER_DATA_CSV_FILENAMES.timeRules),
  sfxCatalog: toRepoPath(RUNNER_DATA_CSV_FILENAMES.sfxCatalog),
  bgmCatalog: toRepoPath(RUNNER_DATA_CSV_FILENAMES.bgmCatalog),
  statusSkill: toRepoPath(RUNNER_DATA_CSV_FILENAMES.statusSkill),
};

/** 로더·문서용 — `ORDER`와 동일 순서 */
export const RUNNER_GAME_DATA_CSV_MANIFEST = ORDER.map(
  (id) => RUNNER_DATA_CSV_PATHS[id],
);

/** Vite glob 키에서 `00_xxx.csv` 파일명만 뽑아 맵 */
export function indexGameDataCsvByFilename(
  globMap: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(globMap)) {
    const marker = 'game_data/';
    const idx = key.lastIndexOf(marker);
    if (idx === -1) continue;
    const file = key.slice(idx + marker.length);
    if (file.endsWith('.csv')) out[file] = val;
  }
  return out;
}

export function pickGameDataRaw(
  byFilename: Record<string, string>,
  id: RunnerDataCsvSheetId,
): string {
  const name = RUNNER_DATA_CSV_FILENAMES[id];
  const raw = byFilename[name];
  if (raw === undefined)
    throw new Error(`[game_data] 누락: ${name} (glob·경로 확인)`);
  return raw;
}
