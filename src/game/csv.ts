import type { ParsedObstacleTemplate, ParsedCoinTemplate } from './types';

/** 미니 CSV 파서 — 헤더 기준 간단 블록 */
export function parseObstacleCsv(raw: string): ParsedObstacleTemplate[] {
  const lines = raw
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  const header = lines[0]?.split(',').map((s) => s.trim()) ?? [];
  const rows: ParsedObstacleTemplate[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]!);
    const row: Record<string, string> = {};
    cols.forEach((c, idx) => {
      row[header[idx] ?? `_c${idx}`] = c;
    });
    rows.push({
      obstacle_id: row.obstacle_id ?? '',
      type: row.type ?? '',
      emoji: row.emoji ?? '■',
      min_width: num(row.min_width, 28),
      max_width: num(row.max_width, 28),
      min_height: num(row.min_height, 28),
      max_height: num(row.max_height, 28),
      is_air: row.is_air === 'true',
      air_offset_min: num(row.air_offset_min, 0),
      air_offset_max: num(row.air_offset_max, 0),
      spawn_weight: num(row.spawn_weight, 1),
    });
  }
  return rows;
}

export function parseCoinCsv(raw: string): ParsedCoinTemplate[] {
  const lines = raw
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  const header = lines[0]?.split(',').map((s) => s.trim()) ?? [];
  const rows: ParsedCoinTemplate[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]!);
    const row: Record<string, string> = {};
    cols.forEach((c, idx) => {
      row[header[idx] ?? `_c${idx}`] = c;
    });
    const pk = (row.pickup_kind ?? 'coin').toLowerCase();
    const isAir = row.spawn_height_type === 'air';
    const airLo = row.air_offset_min != null ? num(row.air_offset_min, isAir ? 22 : 0) : isAir ? 22 : 0;
    const airHi = row.air_offset_max != null ? num(row.air_offset_max, isAir ? 52 : 0) : isAir ? 52 : 0;
    rows.push({
      coin_id: row.coin_id ?? '',
      emoji: row.emoji ?? '🪙',
      value: num(row.value, 10),
      spawn_height_type: isAir ? 'air' : 'ground',
      air_offset_min: airLo,
      air_offset_max: airHi,
      spawn_weight: num(row.spawn_weight, 1),
      pickup_kind: pk === 'invincibility' ? 'invincibility' : 'coin',
    });
  }
  return rows;
}

function num(s: string | undefined, d: number) {
  const n = Number(s);
  return Number.isFinite(n) ? n : d;
}

/** 쉼표 분리(쉼표가 없는 단순 CSV 전제) */
export function splitCsvLine(line: string): string[] {
  return line.split(',').map((x) => x.trim());
}

export function weightedPickIndex(weights: number[]): number {
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * sum;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

/** key,value[,…] 헤더 — 시간 규칙 등 순수 숫자 덮어쓰기 */
export function parseNumericKeyValueCsv(raw: string): Record<string, number> {
  const out: Record<string, number> = {};
  const lines = raw
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  if (!lines.length) return out;
  const header = splitCsvLine(lines[0]!).map((s) => s.trim());
  const ik = header.indexOf('key');
  const iv = header.indexOf('value');
  if (ik < 0 || iv < 0) return out;
  for (let i = 1; i < lines.length; i++) {
    const c = splitCsvLine(lines[i]!);
    const k = (c[ik] ?? '').trim();
    const n = Number(c[iv]);
    if (k && Number.isFinite(n)) out[k] = n;
  }
  return out;
}
