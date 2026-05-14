import { bootstrapDomTexts } from './game/domTexts';
import { loadGameData } from './game/loadGameData';
import type { LoadedGameData } from './game/loadGameData';
import {
  buildRawGameDataSheets,
  assertAllSheetsPresent,
} from './game/buildRawGameDataSheets';
import { indexGameDataCsvByFilename } from './game/runnerDataPaths';
import {
  assertDeclarativeMaterialsMatchSsoT,
  logDeclarativeMaterialsDevSummary,
} from './game/runnerDataMaterialRegistry';
import {
  assertResearchDataPackageSpecValid,
  assertResearchPackageSheetManifestAligned,
} from './research/validateResearchSpecs';
import { logSemanticAuthoringExerciseDev } from './research/semanticAuthoringExercise';
import { UnsanityGame } from './game/UnsanityGame';

const gameDataCsvRaw = import.meta.glob('../game_data/*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** 게임 + DOM 문구 채우고, React HUD 가 쓸 `LoadedGameData` 를 돌려준다. */
export function bootstrapGame(): LoadedGameData {
  const mount = document.getElementById('game-viewport');
  if (!mount) throw new Error('#game-viewport missing');

  const byFilename = indexGameDataCsvByFilename(gameDataCsvRaw);
  assertAllSheetsPresent(byFilename);
  if (import.meta.env.DEV) {
    assertDeclarativeMaterialsMatchSsoT();
    logDeclarativeMaterialsDevSummary();
    assertResearchPackageSheetManifestAligned();
    assertResearchDataPackageSpecValid();
    logSemanticAuthoringExerciseDev();
  }

  const raw = buildRawGameDataSheets(byFilename);
  const data = loadGameData(raw);

  bootstrapDomTexts(data.textById, document.documentElement);
  document.title = data.textById.txt_doc_title ?? document.title;

  void new UnsanityGame(mount, data);

  return data;
}
