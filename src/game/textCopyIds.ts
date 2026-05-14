/**
 * 보이는 **문장·라벨**의 한 근거(SSoT)는 `game_data/05_text_strings.csv` 의 `text_id` 이다.
 *
 * - `index.html` 의 `[data-text-id]` 값은 아래 상수와 **동일한 id**를 쓴다 — `bootstrapDomTexts`가 채움.
 * - React(json-render)로 주입하는 문자열은 `main.tsx` 에서 `data.textById[TEXT_COPY_IDS.…]` 로만 가져온다.
 *   (Spec JSON은 트리·타입만 두고 본문은 CSV가 우선 — `lobby_starter_hint.spec.json` 참고.)
 */
export const TEXT_COPY_IDS = {
  docTitle: 'txt_doc_title',
  overlayTitle: 'txt_overlay_title',
  overlaySub: 'txt_overlay_sub',
  difficultyBlurb: 'txt_difficulty_blurb',
  starterBonusBlurb: 'txt_starter_bonus_blurb',
  hudCoinPrefix: 'txt_hud_coin_prefix',
  hudHiPrefix: 'txt_hud_hi_prefix',
  hudPlayTimeHeader: 'txt_hud_play_time_header',
  hudInvincPrefix: 'txt_hud_invinc_prefix',
  hudInvincSecondsSuffix: 'txt_hud_invinc_seconds_suffix',
  btnStart: 'txt_btn_start',
  btnRestart: 'txt_btn_restart',
} as const;

export type TextCopyId = (typeof TEXT_COPY_IDS)[keyof typeof TEXT_COPY_IDS];

export function lineOr(
  textById: Record<string, string>,
  id: TextCopyId,
  fallback: string,
): string {
  return textById[id] ?? fallback;
}
