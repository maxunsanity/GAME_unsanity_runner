/**
 * 재료 로딩 한 줄기: `runnerDataPaths.ORDER`(파일)·`pickGameDataRaw` → **`buildRawGameDataSheets`**
 * 가 만든 **`RawGameDataSheets`** → **`loadGameData`(여기)** → **`LoadedGameData`**.
 *
 * 카탈로그 `RunnerDataMaterial_*` / 레지스트리 `RUNNER_DECLARATIVE_DATA_MATERIALS.sheetId`
 * 의 시트 이름은 **`ORDER`(CSV 파일 역할)** 와 같은 체계이고,
 * 여기 들어오는 원시 키(`RawGameDataSheets`)는 **짧은 필드명**이다.
 *
 * | `ORDER`(시트 역할·SSoT) | `RawGameDataSheets` 키 | `loadGameData` 출력 필드 (`LoadedGameData`) |
 * |--------------------------|-------------------------|-----------------------------------------------|
 * | bundleMeta               | bundleMeta              | bundleMeta                                     |
 * | character                | character               | characters[]                                   |
 * | objectObstacle           | obstacle                | obsTpl[]                                       |
 * | itemPickup               | item                    | coinTpl[]                                      |
 * | balanceTune              | balance                 | tuneBook (아래 `time` 과 합성)                 |
 * | textStrings              | text                    | textById                                       |
 * | fxCatalog                | fx                      | fxCatalog[]                                    |
 * | timeRules                | time                    | tuneBook (위 `balance` 와 합성)                |
 * | sfxCatalog               | sfx                     | sfxByEvent                                     |
 * | bgmCatalog               | bgm                     | bgmTracks[]                                    |
 * | statusSkill              | status                  | statusSkills[]                                 |
 *
 * @see `buildRawGameDataSheets.ts` — ORDER → raw 키 매핑
 * @see `runnerDataMaterialRegistry.ts` — 동일 시트의 카탈로그 이름·경로
 */

import {
  parseObstacleCsv,
  parseCoinCsv,
  splitCsvLine,
} from './csv';
import { buildTuneBook, type TuneBook } from './gameTune';
import type { ParsedCoinTemplate, ParsedObstacleTemplate } from './types';

/** `game_data/*.csv` raw 묶음 — Vite에서 `?raw`로 주입 */
export interface RawGameDataSheets {
  bundleMeta: string;
  character: string;
  obstacle: string;
  item: string;
  balance: string;
  text: string;
  fx: string;
  time: string;
  sfx: string;
  bgm: string;
  status: string;
}

export interface ParsedCharacterRow {
  character_id: string;
  actor_mesh_key: string;
  text_display_name_id: string;
  runner_slot: string;
  note: string;
}

export interface ParsedFxRow {
  fx_id: string;
  trigger_event: string;
  tune_duration_ms_key: string;
  catalog_mount: string;
  implementation_note: string;
}

export interface ParsedSfxRow {
  sfx_id: string;
  trigger_event_key: string;
  asset_path: string;
  volume: number;
  note: string;
}

export interface ParsedBgmRow {
  bgm_id: string;
  runner_phase_hint: string;
  asset_path: string;
  volume: number;
  loop: boolean;
  note: string;
}

export interface ParsedStatusSkillRow {
  status_id: string;
  applied_by_pickup_kind: string;
  duration_ms_tune_key: string;
  collision_ignore_obstacle: boolean;
  catalog_component_refs: string[];
  fx_rows: string;
}

export interface LoadedGameData {
  bundleMeta: Record<string, string>;
  characters: ParsedCharacterRow[];
  obsTpl: ParsedObstacleTemplate[];
  coinTpl: ParsedCoinTemplate[];
  tuneBook: TuneBook;
  textById: Record<string, string>;
  fxCatalog: ParsedFxRow[];
  sfxByEvent: Record<string, ParsedSfxRow>;
  bgmTracks: ParsedBgmRow[];
  statusSkills: ParsedStatusSkillRow[];
}

function parseTextStringsCsv(raw: string, locale = 'ko'): Record<string, string> {
  const out: Record<string, string> = {};
  const wantLocale = locale.trim().replace(/\uFEFF/g, '').toLowerCase();
  let normalized = raw.trim().replace(/^\uFEFF/, '');
  const lines = normalized.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return out;
  const header = splitCsvLine(lines[0]!).map((s) => s.trim());
  const iLoc = header.indexOf('locale');
  if (!header.includes('text_id')) return out;
  /** 값에 쉼표가 들어올 때 split(',')로는 부서짐 → 첫 필드=id, 마지막 필드=locale 안에서 value 슬라이스 */
  for (let r = 1; r < lines.length; r++) {
    const row = lines[r]!;
    const first = row.indexOf(',');
    const last = row.lastIndexOf(',');
    if (first < 0 || last <= first) continue;
    const id = row
      .slice(0, first)
      .trim()
      .replace(/^\uFEFF/, '');
    const locTail = row
      .slice(last + 1)
      .trim()
      .replace(/\uFEFF/g, '')
      .toLowerCase();
    const loc = iLoc >= 0 ? locTail : wantLocale;
    if (!id || loc !== wantLocale) continue;
    const val = row.slice(first + 1, last).trim();
    out[id] = val;
  }
  return out;
}

function parseBundleMeta(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = raw
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  if (!lines.length) return out;
  const header = splitCsvLine(lines[0]!).map((s) => s.trim());
  const ik = header.indexOf('meta_key');
  const iv = header.indexOf('meta_value');
  if (ik < 0 || iv < 0) return out;
  for (let i = 1; i < lines.length; i++) {
    const c = splitCsvLine(lines[i]!);
    const k = (c[ik] ?? '').trim();
    if (k) out[k] = (c[iv] ?? '').trim();
  }
  return out;
}

function parseCharacters(raw: string): ParsedCharacterRow[] {
  const lines = raw
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  if (!lines.length) return [];
  const header = splitCsvLine(lines[0]!).map((s) => s.trim());
  const rows: ParsedCharacterRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const c = splitCsvLine(lines[i]!);
    const row: Record<string, string> = {};
    c.forEach((cell, idx) => {
      row[header[idx] ?? `_c${idx}`] = cell;
    });
    rows.push({
      character_id: row.character_id ?? '',
      actor_mesh_key: row.actor_mesh_key ?? '',
      text_display_name_id: row.text_display_name_id ?? '',
      runner_slot: row.runner_slot ?? '',
      note: row.note ?? '',
    });
  }
  return rows;
}

function parseFxCatalog(raw: string): ParsedFxRow[] {
  const lines = raw
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  if (!lines.length) return [];
  const header = splitCsvLine(lines[0]!).map((s) => s.trim());
  const rows: ParsedFxRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const c = splitCsvLine(lines[i]!);
    const row: Record<string, string> = {};
    c.forEach((cell, idx) => {
      row[header[idx] ?? `_c${idx}`] = cell;
    });
    rows.push({
      fx_id: row.fx_id ?? '',
      trigger_event: row.trigger_event ?? '',
      tune_duration_ms_key: row.tune_duration_ms_key ?? '',
      catalog_mount: row.catalog_mount ?? '',
      implementation_note: row.implementation_note ?? '',
    });
  }
  return rows;
}

function parseSfx(raw: string): ParsedSfxRow[] {
  const lines = raw
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  if (!lines.length) return [];
  const header = splitCsvLine(lines[0]!).map((s) => s.trim());
  const rows: ParsedSfxRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const c = splitCsvLine(lines[i]!);
    const row: Record<string, string> = {};
    c.forEach((cell, idx) => {
      row[header[idx] ?? `_c${idx}`] = cell;
    });
    const vol = Number(row.volume);
    rows.push({
      sfx_id: row.sfx_id ?? '',
      trigger_event_key: row.trigger_event_key ?? '',
      asset_path: (row.asset_path ?? '').trim(),
      volume: Number.isFinite(vol) ? vol : 1,
      note: row.note ?? '',
    });
  }
  return rows;
}

function indexSfx(rows: ParsedSfxRow[]): Record<string, ParsedSfxRow> {
  const ix: Record<string, ParsedSfxRow> = {};
  for (const r of rows) {
    const k = r.trigger_event_key?.trim();
    if (k) ix[k] = r;
  }
  return ix;
}

function parseBgm(raw: string): ParsedBgmRow[] {
  const lines = raw
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  if (!lines.length) return [];
  const header = splitCsvLine(lines[0]!).map((s) => s.trim());
  const rows: ParsedBgmRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const c = splitCsvLine(lines[i]!);
    const row: Record<string, string> = {};
    c.forEach((cell, idx) => {
      row[header[idx] ?? `_c${idx}`] = cell;
    });
    const vol = Number(row.volume);
    rows.push({
      bgm_id: row.bgm_id ?? '',
      runner_phase_hint: row.runner_phase_hint ?? '',
      asset_path: (row.asset_path ?? '').trim(),
      volume: Number.isFinite(vol) ? vol : 0.35,
      loop: row.loop === 'true' || row.loop === '1',
      note: row.note ?? '',
    });
  }
  return rows;
}

function parseStatusSkills(raw: string): ParsedStatusSkillRow[] {
  const lines = raw
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  if (!lines.length) return [];
  const header = splitCsvLine(lines[0]!).map((s) => s.trim());
  const rows: ParsedStatusSkillRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const c = splitCsvLine(lines[i]!);
    const row: Record<string, string> = {};
    c.forEach((cell, idx) => {
      row[header[idx] ?? `_c${idx}`] = cell;
    });
    const refs = (row.catalog_component_refs ?? '')
      .split('|')
      .map((x) => x.trim())
      .filter(Boolean);
    rows.push({
      status_id: row.status_id ?? '',
      applied_by_pickup_kind: row.applied_by_pickup_kind ?? '',
      duration_ms_tune_key: row.duration_ms_tune_key ?? '',
      collision_ignore_obstacle:
        row.collision_ignore_obstacle === 'true' || row.collision_ignore_obstacle === '1',
      catalog_component_refs: refs,
      fx_rows: row.fx_rows ?? '',
    });
  }
  return rows;
}

export function loadGameData(raw: RawGameDataSheets): LoadedGameData {
  return {
    bundleMeta: parseBundleMeta(raw.bundleMeta),
    characters: parseCharacters(raw.character),
    obsTpl: parseObstacleCsv(raw.obstacle),
    coinTpl: parseCoinCsv(raw.item),
    tuneBook: buildTuneBook(raw.balance, raw.time),
    textById: parseTextStringsCsv(raw.text),
    fxCatalog: parseFxCatalog(raw.fx),
    sfxByEvent: indexSfx(parseSfx(raw.sfx)),
    bgmTracks: parseBgm(raw.bgm),
    statusSkills: parseStatusSkills(raw.status),
  };
}
