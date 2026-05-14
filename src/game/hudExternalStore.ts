import { createStateStore } from '@json-render/core';

/**
 * 플레이 HUD — 점수·코인·HI · 타이머 글자/바 · 무적 리본까지 한 스토어.
 * `UnsanityGame.pushHudChrome()` 이 한 번에 갱신한다.
 */
export const hudExternalStore = createStateStore({
  hud: {
    /** HUD 정적 라벨 — `05_text_strings` 부트 시 주입 */
    lblCoinPrefix: '',
    lblHiPrefix: '',
    lblPlayTimeHeader: '',
    lblInvincPrefix: '',
    lblInvincSecSuffix: '',

    scorePadded: '00000',
    coinStr: '0',
    bestPadded: '00000',

    timerLabel: '0:00',
    /** 0~1, CSS `scaleX` */
    timerBarScale: 0.0001,
    /** `timer-fill-green` 등으로 매핑 */
    timerBarTone: 'green',
    timerPulseDanger: false,

    invincVisible: false,
    invincSecDisplay: '0',
  },
});
