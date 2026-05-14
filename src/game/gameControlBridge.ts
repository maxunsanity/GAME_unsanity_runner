/**
 * 바닐라 `UnsanityGame` 과 React+json-render 트리를 잇는 가벼운 다리.
 * 오버레이 버튼의 dispatch 액션이 여기로 와서 게임 메서드를 부른다.
 */
const noopStart = (): void =>
  console.warn('[game-bridge] start 아직 게임 미연결');
const noopBack = (): void =>
  console.warn('[game-bridge] 로비복귀 아직 게임 미연결');

let startRunHook: () => void = noopStart;
let backToTitleHook: () => void = noopBack;

/** `UnsanityGame` 생성 후 한 번 호출된다. */
export function attachRunnerGameHooks(cmd: {
  startRun: () => void;
  backToTitle: () => void;
}): void {
  startRunHook = cmd.startRun;
  backToTitleHook = cmd.backToTitle;
}

/** `dispose()` 등 에서 초기 상태로 되돌릴 때 선택. */
export function detachRunnerGameHooks(): void {
  startRunHook = noopStart;
  backToTitleHook = noopBack;
}

/** 카탈로그 액션 `runnerStartRound` 에 대응. */
export function requestRunnerStartRound(): void {
  startRunHook();
}

/** 카탈로그 액션 `runnerReturnToLobby` 에 대응. */
export function requestRunnerReturnToLobby(): void {
  backToTitleHook();
}
