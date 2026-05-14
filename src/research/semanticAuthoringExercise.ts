/** 연구 — 행 한 줄을 카탈로그 시맨틱 이름에만 매핑해 두는 패턴 예시 (런타임 플레이 미연동). */
export const SEMANTIC_OBSTACLE_ROW_EXAMPLE = {
  obstacle_id: '1',
  type: 'cactus',
  rendersAsCatalogType: 'Obstacle' as const,
};

export function logSemanticAuthoringExerciseDev(): void {
  console.info(
    '[research] CSV 행 → 시맨틱 카탈로그 타입 예시',
    SEMANTIC_OBSTACLE_ROW_EXAMPLE,
  );
}
