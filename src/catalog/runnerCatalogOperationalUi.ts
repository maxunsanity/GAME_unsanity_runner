// @runner-catalog-role #운영UI #JSX-registry연결 #HUD·로비·오버레이 #실화면컴포넌트
import { z } from 'zod';

import { emptySceneProps, hudBindProp } from './runnerCatalogShared';

export const runnerCatalogOperationalUiComponents = {
  SceneRoot: {
    props: emptySceneProps,
    slots: ['default'],
    description: '한 판·앱 단위 최상위 루트.',
    example: {},
  },

  RunnerHudCoinBlock: {
    props: z.object({
      coinPrefix: hudBindProp.describe('{ $state: "/hud/lblCoinPrefix" } 또는 초깃값 문자열'),
      value: hudBindProp.describe('{ $state: "/hud/coinStr" }'),
    }),
    slots: [],
    description: '`hud-coin`·`hud-box` 레이아웃.',
    example: {
      coinPrefix: '🪙 × ',
      value: '3',
    },
  },

  RunnerHudScoreStack: {
    props: z.object({
      hiPrefix: hudBindProp.describe('{ $state: "/hud/lblHiPrefix" }'),
      bestValue: hudBindProp.describe('{ $state: "/hud/bestPadded" }'),
      scoreValue: hudBindProp.describe('{ $state: "/hud/scorePadded" }'),
    }),
    slots: [],
    description: '`hud-right` / `hud-hi` / `hud-score`.',
    example: { hiPrefix: 'HI', bestValue: '01234', scoreValue: '00042' },
  },

  RunnerHudTimerStrip: {
    props: z.object({
      headerLabel: hudBindProp.describe('{ $state: "/hud/lblPlayTimeHeader" }'),
      timeDisplay: hudBindProp.describe('{ $state: "/hud/timerLabel" }'),
      barScale: hudBindProp.describe('{ $state: "/hud/timerBarScale" }'),
      barTone: hudBindProp.describe('{ $state: "/hud/timerBarTone" }'),
      barPulse: hudBindProp.describe('{ $state: "/hud/timerPulseDanger" }'),
    }),
    slots: [],
    description: '`timer-strip` — `PLAY_TIMER_CYCLE_SEC` 와 같은 주기 바.',
    example: {
      headerLabel: '플레이 시간',
      timeDisplay: '0:42',
      barScale: 0.57,
      barTone: 'green',
      barPulse: false,
    },
  },

  RunnerHudInvincRibbon: {
    props: z.object({
      invincPrefix: hudBindProp.describe('{ $state: "/hud/lblInvincPrefix" }'),
      ribbonOpen: hudBindProp.describe('{ $state: "/hud/invincVisible" }'),
      ribbonSec: hudBindProp.describe('{ $state: "/hud/invincSecDisplay" }'),
      secondsSuffix: hudBindProp.describe('{ $state: "/hud/lblInvincSecSuffix" }'),
    }),
    slots: [],
    description: '`hud-invinc-wrap` — 접두·접미·초 표시.',
    example: {
      invincPrefix: '★ 무적',
      ribbonOpen: true,
      ribbonSec: '3',
      secondsSuffix: 's',
    },
  },

  RunnerHudMButton: {
    props: z.object({
      label: z.string(),
    }),
    slots: [],
    description:
      '`press` 로 카탈로그 액션(`runnerStartRound` 또는 `runnerReturnToLobby`)에 연결.',
    example: { label: '시작' },
  },

  RunnerLobbyHeroTitle: {
    props: z.object({ title: z.string() }),
    slots: [],
    description: '`overlay-title caveat` — 로비 메인 제목.',
    example: { title: 'Unsanity 🐲' },
  },

  RunnerLobbyCopyLine: {
    props: z.object({
      text: z.string(),
      variant: z.enum(['sub', 'balance_hint', 'starter_hint']),
    }),
    slots: [],
    description:
      '`overlay-sub`/힌트 클래스 — 규칙은 `runnerDataPaths` 문자열 재료 아님, 정적 카피.',
    example: { text: '…', variant: 'sub' },
  },
};
