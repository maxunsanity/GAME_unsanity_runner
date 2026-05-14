import {
  ORDER,
  RUNNER_DATA_CSV_PATHS,
  type RunnerDataCsvSheetId,
} from '../game/runnerDataPaths';
import { unsanityRunnerCatalog } from '../catalog/unsanityRunnerCatalog';
import { runnerGameDataPackageResearchSpec } from './runnerGameDataPackageResearchSpec';

/**
 * Phase 2 부록 — `runnerGameDataPackageResearchSpec.sheets` 가 `ORDER`/SSoT 경로와
 * 키 집합까지 일치하는지(스펙 편집 실수 방지). 카탈로그 Zod 검증보다 가볍다.
 */
export function assertResearchPackageSheetManifestAligned(): void {
  const sheets = runnerGameDataPackageResearchSpec.elements.gameDataPkg.props
    .sheets as Record<RunnerDataCsvSheetId, string>;
  for (const id of ORDER) {
    if (!(id in sheets)) {
      throw new Error(
        `[research] RunnerGameDataCsvPackage spec.sheets missing key: ${String(id)}`,
      );
    }
    if (sheets[id] !== RUNNER_DATA_CSV_PATHS[id]) {
      throw new Error(
        `[research] spec.sheets.${String(id)} path !== RUNNER_DATA_CSV_PATHS (SSoT drift)`,
      );
    }
  }
  for (const k of Object.keys(sheets)) {
    const id = k as RunnerDataCsvSheetId;
    if (!ORDER.includes(id)) {
      throw new Error(
        `[research] RunnerGameDataCsvPackage spec.sheets unexpected key: ${k}`,
      );
    }
  }
}

/** Phase 2 — 재료 패키지 Spec 이 카탈로그 스키마와 일치하는지 검증만 수행한다. */
export function assertResearchDataPackageSpecValid(): void {
  const r = unsanityRunnerCatalog.validate(runnerGameDataPackageResearchSpec);
  if (!r.success) {
    console.error('[research] RunnerGameDataCsvPackage spec validation', r.error);
    if (import.meta.env.VITE_RELAX_RESEARCH_VALIDATE === '1') {
      console.warn(
        '[research] VITE_RELAX_RESEARCH_VALIDATE=1 — 부트는 계속하나 Spec·카탈로그 불일치가 있음',
      );
      return;
    }
    throw new Error(
      '[research] runnerGameDataPackageResearchSpec failed unsanityRunnerCatalog.validate()',
    );
  }
  if (import.meta.env.DEV)
    console.info('[research] RunnerGameDataCsvPackage → catalog.validate OK');
}
