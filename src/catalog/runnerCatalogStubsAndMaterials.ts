// @runner-catalog-role #재료(Material·CSV경로) #시맨틱스텁 #registry없음 #데이터슬롯
/**
 * 카탈로그 — **registry 없는 나머지 전부** (한 파일).
 *
 * 1. **데이터 재료** — `RunnerDataMaterial_*` · `RunnerGameDataCsvPackage` (경로 리터럴, SSoT 정합).
 * 2. **시맨틱 스텁** — 연구·문서·향후 Spec 용 이름 (`bindRefProps` 등). DOM registry 없음.
 *
 * `runnerCatalogOperationalUi.ts` 만 실제 JSX registry 와 짝을 이룬다 — 통합 문서 §4.
 */

import { z } from 'zod';

import {
  RUNNER_DATA_CSV_PATHS,
  type RunnerDataCsvSheetId,
} from '../game/runnerDataPaths';
import {
  balanceDataRefProps,
  bindRefProps,
} from './runnerCatalogShared';

const csvFormat = z.literal('csv');

/** Spec에 “이 번들이 참조하는 전 시트 경로”를 한 번에 실을 때 */
export const runnerGameDataSheetsShape = z.object({
  bundleMeta: z.literal(RUNNER_DATA_CSV_PATHS.bundleMeta),
  character: z.literal(RUNNER_DATA_CSV_PATHS.character),
  objectObstacle: z.literal(RUNNER_DATA_CSV_PATHS.objectObstacle),
  itemPickup: z.literal(RUNNER_DATA_CSV_PATHS.itemPickup),
  balanceTune: z.literal(RUNNER_DATA_CSV_PATHS.balanceTune),
  textStrings: z.literal(RUNNER_DATA_CSV_PATHS.textStrings),
  fxCatalog: z.literal(RUNNER_DATA_CSV_PATHS.fxCatalog),
  timeRules: z.literal(RUNNER_DATA_CSV_PATHS.timeRules),
  sfxCatalog: z.literal(RUNNER_DATA_CSV_PATHS.sfxCatalog),
  bgmCatalog: z.literal(RUNNER_DATA_CSV_PATHS.bgmCatalog),
  statusSkill: z.literal(RUNNER_DATA_CSV_PATHS.statusSkill),
});

export function dataMaterialProps(
  path: (typeof RUNNER_DATA_CSV_PATHS)[RunnerDataCsvSheetId],
  role: string,
) {
  return z.object({
    format: csvFormat.describe('런타임 로더 포맷'),
    sourcePath: z
      .literal(path)
      .describe('레포 기준 경로 — 변경 시 `src/game/runnerDataPaths.ts`·파서와 함께 수정'),
    materialRole: z.literal(role).describe('기획·Spec에서 구분용 역할 태그'),
  });
}

/** ── CSV 재료 + 번들 (경로 리터럴) ── */
export const runnerCatalogMaterialComponents = {
  RunnerDataMaterial_BundleMeta: {
    props: dataMaterialProps(
      RUNNER_DATA_CSV_PATHS.bundleMeta,
      'meta_bundle_tier_sheet_index',
    ),
    description:
      '00 번들 메타 · 티어/시트 매핑·레벨 없음 플래그 등 — 휴먼/툴이 “무슨 패키지냐”를 읽는 표.',
    example: {
      format: 'csv',
      sourcePath: RUNNER_DATA_CSV_PATHS.bundleMeta,
      materialRole: 'meta_bundle_tier_sheet_index',
    },
  },
  RunnerDataMaterial_Character: {
    props: dataMaterialProps(RUNNER_DATA_CSV_PATHS.character, 'player_actor_registry'),
    description: '01 케릭터(용) 식별·액터 키·표시 문자 id.',
    example: {
      format: 'csv',
      sourcePath: RUNNER_DATA_CSV_PATHS.character,
      materialRole: 'player_actor_registry',
    },
  },
  RunnerDataMaterial_ObjectObstacle: {
    props: dataMaterialProps(
      RUNNER_DATA_CSV_PATHS.objectObstacle,
      'collision_obstacle_templates',
    ),
    description: '02 충돌 오브젝트(장애) 템플릿 풀.',
    example: {
      format: 'csv',
      sourcePath: RUNNER_DATA_CSV_PATHS.objectObstacle,
      materialRole: 'collision_obstacle_templates',
    },
  },
  RunnerDataMaterial_ItemPickup: {
    props: dataMaterialProps(
      RUNNER_DATA_CSV_PATHS.itemPickup,
      'pickup_items_coin_star',
    ),
    description: '03 픽업(코인·무적별 메타)·스폰/종류 행.',
    example: {
      format: 'csv',
      sourcePath: RUNNER_DATA_CSV_PATHS.itemPickup,
      materialRole: 'pickup_items_coin_star',
    },
  },
  RunnerDataMaterial_BalanceTune: {
    props: dataMaterialProps(
      RUNNER_DATA_CSV_PATHS.balanceTune,
      'numeric_balance_scoped_tier',
    ),
    description:
      '04 발란스 수치 — scope/tier/key/value. HUD 순환 등 “시간 전용” 키는 07에 두고 여기서는 제외 가능.',
    example: {
      format: 'csv',
      sourcePath: RUNNER_DATA_CSV_PATHS.balanceTune,
      materialRole: 'numeric_balance_scoped_tier',
    },
  },
  RunnerDataMaterial_TextStrings: {
    props: dataMaterialProps(
      RUNNER_DATA_CSV_PATHS.textStrings,
      'localized_copy_dom_bind',
    ),
    description: '05 표기 문자열 — `text_id`↔`value`·DOM `data-text-id`와 정합.',
    example: {
      format: 'csv',
      sourcePath: RUNNER_DATA_CSV_PATHS.textStrings,
      materialRole: 'localized_copy_dom_bind',
    },
  },
  RunnerDataMaterial_FxCatalog: {
    props: dataMaterialProps(RUNNER_DATA_CSV_PATHS.fxCatalog, 'vfx_semantic_rows'),
    description: '06 FX 정의(트리거·지속 키·마운트 힌트).',
    example: {
      format: 'csv',
      sourcePath: RUNNER_DATA_CSV_PATHS.fxCatalog,
      materialRole: 'vfx_semantic_rows',
    },
  },
  RunnerDataMaterial_TimeRules: {
    props: dataMaterialProps(RUNNER_DATA_CSV_PATHS.timeRules, 'game_time_policy'),
    description: '07 게임 “시간 규칙” 수치 — key/value로 TuneBook에 병합.',
    example: {
      format: 'csv',
      sourcePath: RUNNER_DATA_CSV_PATHS.timeRules,
      materialRole: 'game_time_policy',
    },
  },
  RunnerDataMaterial_SfxCatalog: {
    props: dataMaterialProps(RUNNER_DATA_CSV_PATHS.sfxCatalog, 'sfx_event_assets'),
    description: '08 효과음 이벤트 키·URL·볼륨.',
    example: {
      format: 'csv',
      sourcePath: RUNNER_DATA_CSV_PATHS.sfxCatalog,
      materialRole: 'sfx_event_assets',
    },
  },
  RunnerDataMaterial_BgmCatalog: {
    props: dataMaterialProps(RUNNER_DATA_CSV_PATHS.bgmCatalog, 'bgm_tracks'),
    description: '09 배경음 트랙 정의.',
    example: {
      format: 'csv',
      sourcePath: RUNNER_DATA_CSV_PATHS.bgmCatalog,
      materialRole: 'bgm_tracks',
    },
  },
  RunnerDataMaterial_StatusSkill: {
    props: dataMaterialProps(
      RUNNER_DATA_CSV_PATHS.statusSkill,
      'status_buff_skill_bind',
    ),
    description: '10 상태이상(스킬) — 무적 등 픽업 연동·카탈로그 컴포넌트 참조.',
    example: {
      format: 'csv',
      sourcePath: RUNNER_DATA_CSV_PATHS.statusSkill,
      materialRole: 'status_buff_skill_bind',
    },
  },

  RunnerGameDataCsvPackage: {
    props: z.object({
      packageId: z.literal('runner_game_data_v1'),
      sheets: runnerGameDataSheetsShape,
    }),
    slots: [],
    description:
      '11개 CSV 재료 전부를 하나의 번들로 묶는 슬롯. 개별 `RunnerDataMaterial_*` 와 동일 경로를 참조해야 함.',
    example: {
      packageId: 'runner_game_data_v1',
      sheets: {
        bundleMeta: RUNNER_DATA_CSV_PATHS.bundleMeta,
        character: RUNNER_DATA_CSV_PATHS.character,
        objectObstacle: RUNNER_DATA_CSV_PATHS.objectObstacle,
        itemPickup: RUNNER_DATA_CSV_PATHS.itemPickup,
        balanceTune: RUNNER_DATA_CSV_PATHS.balanceTune,
        textStrings: RUNNER_DATA_CSV_PATHS.textStrings,
        fxCatalog: RUNNER_DATA_CSV_PATHS.fxCatalog,
        timeRules: RUNNER_DATA_CSV_PATHS.timeRules,
        sfxCatalog: RUNNER_DATA_CSV_PATHS.sfxCatalog,
        bgmCatalog: RUNNER_DATA_CSV_PATHS.bgmCatalog,
        statusSkill: RUNNER_DATA_CSV_PATHS.statusSkill,
      },
    },
  },
};

/** ── 시맨틱 스텁 (registry 없음) ── */
export const runnerCatalogSemanticStubComponents = {
  GameStage: {
    props: bindRefProps,
    description:
      '앱 주요 페이즈 루프(인트로→로비→인게임→결과)가 얹히는 상위 무대. Spec 자식·가시성으로 단계 전환.',
    example: {},
  },
  Layer: {
    props: bindRefProps,
    description: 'z-order 한 층(Three 레이어 vs DOM HUD 오버레이 등).',
    example: {},
  },

  IntroOverlay: {
    props: bindRefProps,
    description:
      '인트로(로고·브랜딩·약관 한 줄 등). 스킵 후 로비로 넘김.',
    example: {},
  },
  LobbyOverlay: {
    props: bindRefProps,
    description:
      '로비·타이틀 — 플레이 진입·세팅. 발란스 프리셋 UI는 여기 또는 BalanceTierControl.',
    example: {},
  },

  BalanceTierControl: {
    props: balanceDataRefProps,
    description:
      '상·중·하 선택 → `balance_tune` tier 행·로비 라디오와 정합.',
    example: {},
  },

  RunnerBalanceBinding: {
    props: balanceDataRefProps,
    description:
      '이 런이 참조하는 발란스/티어 — 수치 원본은 `balance_tune`+`time_rules` 재료 시트.',
    example: {},
  },
  RunnerGameplay: {
    props: bindRefProps,
    description:
      '인게임 페이즈(playing). RunnerWorld·캐릭터·HUD·이펙트가 보통 여기 묶임.',
    example: {},
  },
  GameOverOverlay: {
    props: bindRefProps,
    description:
      '라운드 종료(충돌 등 — 타임오버 없음). 로비 복귀 연결.',
    example: {},
  },

  RunnerWorld: {
    props: bindRefProps,
    description:
      'Orthographic 월드·조명·지면·패럴랙스. RunnerGameplay 자식.',
    example: {},
  },
  RunnerCharacter: {
    props: bindRefProps,
    description: '플레이어(용) — 재료 행은 `character` CSV.',
    example: {},
  },
  Obstacle: {
    props: bindRefProps,
    description: '장애물 — 템플릿 풀은 `object_obstacle` CSV.',
    example: {},
  },
  Coin: {
    props: bindRefProps,
    description: '코인 픽업 — 행 정의는 `item_pickup` CSV (`pickup_kind: coin`).',
    example: {},
  },

  PickupInvincibility: {
    props: bindRefProps,
    description:
      '별 무적 픽업 — `item_pickup` + `status_skill` + 발란스 키 `INVINCIBILITY_MS` 등과 정합.',
    example: {},
  },

  TimerBar: {
    props: bindRefProps,
    description:
      '플레이 경과 보조 바 — 순환 주기는 `time_rules.PLAY_TIMER_CYCLE_SEC`. 생명 타임머 아님.',
    example: {},
  },
  CoinCounter: {
    props: bindRefProps,
    description: '수집 코인 수 표시.',
    example: {},
  },
  ScoreDisplay: {
    props: bindRefProps,
    description: '현재 점수(거리) 표시.',
    example: {},
  },
  BestScoreDisplay: {
    props: bindRefProps,
    description: '최고 점수.',
    example: {},
  },

  CoinCollectFlash: {
    props: bindRefProps,
    description: '코인 수집 시 시맨틱 큐(선택).',
    example: {},
  },

  InvincibilityFlicker: {
    props: bindRefProps,
    description: '무적 구간 캐릭터 표현 — 파라미터는 발란스 `INVINC_*` 키.',
    example: {},
  },

  ObstacleContactIgnored: {
    props: bindRefProps,
    description: '무적 중 장애 충돌 무시 상태(시맨틱).',
    example: {},
  },
  ObstacleHitFinale: {
    props: bindRefProps,
    description: '충돌 게임오버 연출 큐 — 길이는 `GAMEOVER_SPIN_MS` 등.',
    example: {},
  },
  TimerLowPulse: {
    props: bindRefProps,
    description: '구형 잔여시간 펄스 — 현 기획과 매핑 시에만.',
    example: {},
  },

  RunnerWorldVfx: {
    props: bindRefProps,
    description: '월드(Three) VFX 채널 — 정의 줄은 `fx_catalog` 재료.',
    example: {},
  },
  RunnerScreenFx: {
    props: bindRefProps,
    description: '스크린 공간 FX.',
    example: {},
  },

  RunnerMusic: {
    props: bindRefProps,
    description: 'BGM — 트랙 행은 `bgm_catalog` 재료.',
    example: {},
  },
  RunnerSfx: {
    props: bindRefProps,
    description: 'SFX 이벤트 — 행 정의는 `sfx_catalog` 재료.',
    example: {},
  },
};

/** `defineCatalog` 에 넘길 때 한 번에 펼침 — 재료 먼저, 스텁 다음 (키 충돌 없음). */
export const runnerCatalogStubsAndMaterialsComponents = {
  ...runnerCatalogMaterialComponents,
  ...runnerCatalogSemanticStubComponents,
};
