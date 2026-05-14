/**
 * 카탈로그 `RunnerDataMaterial_*` 와 동일하게 취급하는 **런타임 레지스트리**.
 * 재료(Material) 컴포넌트가 “실제 존재하는 시트(SSoT)” 와 같은 경로인지 검증하기 위함.
 *
 * `sheetId` 한 줄이 CSV로부터 **`buildRawGameDataSheets` → `loadGameData`** 로 흘러
 * `LoadedGameData` 의 **어느 필드**로 굳는지는 `loadGameData.ts` 상단 표를 본다
 * (`RawGameDataSheets` 키와 출력 필드는 1:1이 아닐 수 있음 — 예: balance+time → tuneBook).
 */

import {
  ORDER,
  RUNNER_DATA_CSV_PATHS,
  type RunnerDataCsvSheetId,
} from './runnerDataPaths';

/** 카탈로그 재료 이름은 `runnerCatalogStubsAndMaterials.ts` 의 재료 타입 정의 · 병합 객체 `unsanityRunnerSceneCatalogComponents` 와 1:1 */
export type RunnerDataMaterialCatalogName =
  | 'RunnerDataMaterial_BundleMeta'
  | 'RunnerDataMaterial_Character'
  | 'RunnerDataMaterial_ObjectObstacle'
  | 'RunnerDataMaterial_ItemPickup'
  | 'RunnerDataMaterial_BalanceTune'
  | 'RunnerDataMaterial_TextStrings'
  | 'RunnerDataMaterial_FxCatalog'
  | 'RunnerDataMaterial_TimeRules'
  | 'RunnerDataMaterial_SfxCatalog'
  | 'RunnerDataMaterial_BgmCatalog'
  | 'RunnerDataMaterial_StatusSkill';

export interface DeclarativeDataMaterialBinding {
  sheetId: RunnerDataCsvSheetId;
  catalogComponent: RunnerDataMaterialCatalogName;
  materialRole: string;
  /** `runnerDataPaths.ts` 와 같은 문자열 */
  sourcePath: string;
}

export const RUNNER_DECLARATIVE_DATA_MATERIALS: readonly DeclarativeDataMaterialBinding[] =
  [
    {
      sheetId: 'bundleMeta',
      catalogComponent: 'RunnerDataMaterial_BundleMeta',
      materialRole: 'meta_bundle_tier_sheet_index',
      sourcePath: RUNNER_DATA_CSV_PATHS.bundleMeta,
    },
    {
      sheetId: 'character',
      catalogComponent: 'RunnerDataMaterial_Character',
      materialRole: 'player_actor_registry',
      sourcePath: RUNNER_DATA_CSV_PATHS.character,
    },
    {
      sheetId: 'objectObstacle',
      catalogComponent: 'RunnerDataMaterial_ObjectObstacle',
      materialRole: 'collision_obstacle_templates',
      sourcePath: RUNNER_DATA_CSV_PATHS.objectObstacle,
    },
    {
      sheetId: 'itemPickup',
      catalogComponent: 'RunnerDataMaterial_ItemPickup',
      materialRole: 'pickup_items_coin_star',
      sourcePath: RUNNER_DATA_CSV_PATHS.itemPickup,
    },
    {
      sheetId: 'balanceTune',
      catalogComponent: 'RunnerDataMaterial_BalanceTune',
      materialRole: 'numeric_balance_scoped_tier',
      sourcePath: RUNNER_DATA_CSV_PATHS.balanceTune,
    },
    {
      sheetId: 'textStrings',
      catalogComponent: 'RunnerDataMaterial_TextStrings',
      materialRole: 'localized_copy_dom_bind',
      sourcePath: RUNNER_DATA_CSV_PATHS.textStrings,
    },
    {
      sheetId: 'fxCatalog',
      catalogComponent: 'RunnerDataMaterial_FxCatalog',
      materialRole: 'vfx_semantic_rows',
      sourcePath: RUNNER_DATA_CSV_PATHS.fxCatalog,
    },
    {
      sheetId: 'timeRules',
      catalogComponent: 'RunnerDataMaterial_TimeRules',
      materialRole: 'game_time_policy',
      sourcePath: RUNNER_DATA_CSV_PATHS.timeRules,
    },
    {
      sheetId: 'sfxCatalog',
      catalogComponent: 'RunnerDataMaterial_SfxCatalog',
      materialRole: 'sfx_event_assets',
      sourcePath: RUNNER_DATA_CSV_PATHS.sfxCatalog,
    },
    {
      sheetId: 'bgmCatalog',
      catalogComponent: 'RunnerDataMaterial_BgmCatalog',
      materialRole: 'bgm_tracks',
      sourcePath: RUNNER_DATA_CSV_PATHS.bgmCatalog,
    },
    {
      sheetId: 'statusSkill',
      catalogComponent: 'RunnerDataMaterial_StatusSkill',
      materialRole: 'status_buff_skill_bind',
      sourcePath: RUNNER_DATA_CSV_PATHS.statusSkill,
    },
  ];

/** 카탈로그 재료와 `runnerDataPaths` 가 어긋나면 즉시 실패시키기 (연구·개발 안전장치). */
export function assertDeclarativeMaterialsMatchSsoT(): void {
  if (RUNNER_DECLARATIVE_DATA_MATERIALS.length !== ORDER.length)
    throw new Error(
      `Declarative registry count ${RUNNER_DECLARATIVE_DATA_MATERIALS.length} !== ORDER ${ORDER.length}`,
    );

  const bySheet = new Map<
    RunnerDataCsvSheetId,
    DeclarativeDataMaterialBinding
  >(RUNNER_DECLARATIVE_DATA_MATERIALS.map((m) => [m.sheetId, m]));

  for (const id of ORDER) {
    const m = bySheet.get(id);
    if (!m) throw new Error(`Declarative registry missing sheetId: ${String(id)}`);
    if (RUNNER_DATA_CSV_PATHS[id] !== m.sourcePath)
      throw new Error(
        `Declarative registry path mismatch for ${String(id)}: registry=${m.sourcePath} paths=${RUNNER_DATA_CSV_PATHS[id]}`,
      );
    if (!m.catalogComponent.startsWith('RunnerDataMaterial_'))
      throw new Error(`Bad catalog component name for ${String(id)}`);
  }
}

export function logDeclarativeMaterialsDevSummary(): void {
  assertDeclarativeMaterialsMatchSsoT();
  console.info(
    '[runner materials / declarative]',
    RUNNER_DECLARATIVE_DATA_MATERIALS.map((m) => ({
      sheet: m.sheetId,
      component: m.catalogComponent,
      path: m.sourcePath,
    })),
  );
}
