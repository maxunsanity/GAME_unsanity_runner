// @runner-catalog-role #진입점 #defineCatalog #병합(운영UI+재료·스텁) #액션등록
/**
 * Unsanity — json-render **카탈로그 진입점**.
 *
 * 논리상 두 덩어리 (`docs/JSON_RENDER_Unsanity_Guide.md` **§4.1** · **§4.2** · **§4.3** 파일 표):
 *
 * 1. **`runnerCatalogOperationalUi`** — 로비·HUD·오버레이 버튼. Registry 와 1:1 연결.
 * 2. **`runnerCatalogStubsAndMaterials`** — CSV 재료(`RunnerDataMaterial_*`)·번들 + 시맨틱 스텁. Registry 없음.
 *
 * 공통 Zod: **`runnerCatalogShared`** (`hudBindProp` 등).
 *
 * 앱 빌드에 포함됨. 경로 문자열(SSoT)은 `runnerDataPaths.ts` 와 공유한다.
 */

import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react/schema';
import { z } from 'zod';

import { runnerCatalogOperationalUiComponents } from './runnerCatalogOperationalUi';
import { runnerCatalogStubsAndMaterialsComponents } from './runnerCatalogStubsAndMaterials';

/** 레거시 외부 참조용 — 운영 UI + (재료·스텁) 병합 객체 */
export const unsanityRunnerSceneCatalogComponents = {
  ...runnerCatalogOperationalUiComponents,
  ...runnerCatalogStubsAndMaterialsComponents,
};

export const unsanityRunnerCatalog = defineCatalog(schema, {
  components: unsanityRunnerSceneCatalogComponents,
  actions: {
    runnerStartRound: {
      params: z.object({}),
      description: '인게임 한 판 시작 — UnsanityGame.startRun 과 연결.',
    },
    runnerReturnToLobby: {
      params: z.object({}),
      description: '타이틀/로비로 복귀 — UnsanityGame.backToTitleScreen 과 연결.',
    },
  },
});

export type UnsanityRunnerSceneCatalogComponents =
  typeof unsanityRunnerSceneCatalogComponents;

/** 다른 모듈에서 경로 상수만 쓸 때 — 카탈로그 재료 스키마와 동일 근거 */
export {
  RUNNER_DATA_CSV_PATHS,
  RUNNER_GAME_DATA_CSV_MANIFEST,
  type RunnerDataCsvSheetId,
} from '../game/runnerDataPaths';

export {
  dataMaterialProps,
  runnerCatalogMaterialComponents,
  runnerCatalogSemanticStubComponents,
  runnerGameDataSheetsShape,
} from './runnerCatalogStubsAndMaterials';
export { hudBindProp } from './runnerCatalogShared';
