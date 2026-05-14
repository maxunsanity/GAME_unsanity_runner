import type { RawGameDataSheets } from './loadGameData';
import {
  ORDER,
  pickGameDataRaw,
  type RunnerDataCsvSheetId,
} from './runnerDataPaths';

/**
 * `import.meta.glob` 결과(파일명→raw)로 `loadGameData` 입력 객체를 만든다.
 *
 * @see `loadGameData.ts` — `RawGameDataSheets` 각 키가 `LoadedGameData` 의 어느 필드로 파싱되는지 표
 */
export function buildRawGameDataSheets(
  byFilename: Record<string, string>,
): RawGameDataSheets {
  const pick = (id: RunnerDataCsvSheetId) => pickGameDataRaw(byFilename, id);
  return {
    bundleMeta: pick('bundleMeta'),
    character: pick('character'),
    obstacle: pick('objectObstacle'),
    item: pick('itemPickup'),
    balance: pick('balanceTune'),
    text: pick('textStrings'),
    fx: pick('fxCatalog'),
    time: pick('timeRules'),
    sfx: pick('sfxCatalog'),
    bgm: pick('bgmCatalog'),
    status: pick('statusSkill'),
  };
}

/** 타입·번들 검증용 — glob에 ORDER 전부 존재하는지 */
export function assertAllSheetsPresent(byFilename: Record<string, string>): void {
  for (const id of ORDER) {
    pickGameDataRaw(byFilename, id);
  }
}
