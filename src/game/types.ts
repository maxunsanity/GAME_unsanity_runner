export type GamePhase = 'idle' | 'playing' | 'gameover';
export type BalanceTier = 'low' | 'mid' | 'high';

export interface ParsedObstacleTemplate {
  obstacle_id: string;
  type: string;
  emoji: string;
  min_width: number;
  max_width: number;
  min_height: number;
  max_height: number;
  is_air: boolean;
  air_offset_min: number;
  air_offset_max: number;
  spawn_weight: number;
}

export type PickupKind = 'coin' | 'invincibility';

export interface ParsedCoinTemplate {
  coin_id: string;
  emoji: string;
  value: number;
  spawn_height_type: 'ground' | 'air';
  /** air 코인 바닥 GROUND 에서 추가 상승 범위(장애 air 와 같은 식으로 스폰) */
  air_offset_min: number;
  air_offset_max: number;
  spawn_weight: number;
  /** coin: 점수용 코인 수집 — invincibility: 별(일정 시간 장애 무시) */
  pickup_kind: PickupKind;
}

export interface PersistedStats {
  best_score: number;
  total_coins_ever: number;
}
