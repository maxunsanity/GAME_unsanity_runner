// @runner-catalog-role #공통Zod #스키마공유 #hudBindProp #스텁bindRef
import { z } from 'zod';

/** HUD Spec 에서 동적 필드는 `{ $state: "/hud/…" }`, 초깃값·예시는 문자열·숫자·불리언 허용 */
export const hudBindProp = z.union([
  z.object({
    $state: z
      .string()
      .regex(/^\/hud\//)
      .describe('hudExternalStore 경로 — GameJsonHud Spec·pushHudChrome 과 세트'),
  }),
  z.string(),
  z.number(),
  z.boolean(),
]);

export const bindRefProps = z.object({
  bindsTo: z.string().optional().describe('같은 Spec 내 다른 element id 참조'),
});

export const balanceDataRefProps = z.object({
  bindsTo: z.string().optional().describe('같은 Spec 내 다른 element id 참조'),
  balanceTier: z
    .enum(['low', 'mid', 'high'])
    .optional()
    .describe('상·중·하 — 미지정 시 low(하)가 기본'),
  dataBundleId: z
    .string()
    .optional()
    .describe('예: runner_balance_low — 실제 파일 경로는 세션 빌더가 매핑'),
});

export const emptySceneProps = z.object({});
