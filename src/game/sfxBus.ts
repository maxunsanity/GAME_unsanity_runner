import type { ParsedSfxRow } from './loadGameData';

/** `08_sfx_catalog.csv` 재생기 — 에셋 URL 비었으면 무두 */
export class SfxBus {
  constructor(private readonly byEventKey: Record<string, ParsedSfxRow>) {}

  play(trigger_event_key: string): void {
    const row = this.byEventKey[trigger_event_key];
    if (!row?.asset_path?.trim()) return;
    const audio = new Audio(row.asset_path);
    audio.volume = Math.min(1, Math.max(0, Number.isFinite(row.volume) ? row.volume : 1));
    void audio.play().catch(() => {});
  }
}
