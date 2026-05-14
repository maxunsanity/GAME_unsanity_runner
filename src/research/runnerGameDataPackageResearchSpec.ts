/**
 * 연구 Phase 2 — **플레이 엔진은 아직 이 Spec을 소비하지 않음.**
 * 목적: `RunnerGameDataCsvPackage` 를 **진짜 Spec 형태**로 두고
 * `unsanityRunnerCatalog.validate()` 가 통과하는지 부트에서 확인한다.
 */

import type { Spec } from '@json-render/core';

import { RUNNER_DATA_CSV_PATHS } from '../game/runnerDataPaths';

export const runnerGameDataPackageResearchSpec = {
  root: 'gameDataPkg',
  elements: {
    gameDataPkg: {
      type: 'RunnerGameDataCsvPackage',
      props: {
        packageId: 'runner_game_data_v1',
        sheets: {
          bundleMeta: RUNNER_DATA_CSV_PATHS.bundleMeta,
          character: RUNNER_DATA_CSV_PATHS.character,
          objectObstacle: RUNNER_DATA_CSV_PATHS.objectObstacle,
          itemPickup: RUNNER_DATA_CSV_PATHS.itemPickup,
          balanceTune: RUNNER_DATA_CSV_PATHS.balanceTune,
          textStrings: RUNNER_DATA_CSV_PATHS.textStrings,
          fxCatalog: RUNNER_DATA_CSV_PATHS.fxCatalog,
          timeRules: RUNNER_DATA_CSV_PATHS.timeRules,
          sfxCatalog: RUNNER_DATA_CSV_PATHS.sfxCatalog,
          bgmCatalog: RUNNER_DATA_CSV_PATHS.bgmCatalog,
          statusSkill: RUNNER_DATA_CSV_PATHS.statusSkill,
        },
      },
      /** `@json-render/react/schema` 에서 요소 레코드에 `visible` 키가 필수로 생성됨 */
      visible: true,
      children: [],
    },
  },
} satisfies Spec;
