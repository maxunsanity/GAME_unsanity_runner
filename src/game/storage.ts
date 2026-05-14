import type { PersistedStats } from './types';

const KEY = 'unsanity_game_state';

export function loadStats(): PersistedStats {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { best_score: 0, total_coins_ever: 0 };
    const o = JSON.parse(raw) as Partial<PersistedStats>;
    return {
      best_score: Math.max(0, Math.floor(Number(o.best_score) || 0)),
      total_coins_ever: Math.max(0, Math.floor(Number(o.total_coins_ever) || 0)),
    };
  } catch {
    return { best_score: 0, total_coins_ever: 0 };
  }
}

export function saveStats(s: PersistedStats) {
  localStorage.setItem(KEY, JSON.stringify(s));
}
