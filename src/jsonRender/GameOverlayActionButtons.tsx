import { useMemo } from 'react';

import type { Spec, ActionHandler } from '@json-render/core';
import type { ComponentRenderer } from '@json-render/react';
import {
  ActionProvider,
  Renderer,
  ValidationProvider,
  VisibilityProvider,
  StateProvider,
} from '@json-render/react';

import {
  requestRunnerReturnToLobby,
  requestRunnerStartRound,
} from '../game/gameControlBridge';

const overlayActionHandlers: Record<string, ActionHandler> = {
  runnerStartRound: async () => {
    queueMicrotask(() => requestRunnerStartRound());
  },
  runnerReturnToLobby: async () => {
    queueMicrotask(() => requestRunnerReturnToLobby());
  },
};

const overlayBtnRegistry: Record<string, ComponentRenderer> = {
  SceneRoot: ({ children }) => (
    <div className="jr-overlay-scene-shell">{children}</div>
  ),

  RunnerHudMButton: ({ element, emit }) => {
    const label = String((element.props as { label?: unknown }).label ?? '');
    // 시작 버튼이면 화살표, 다시하기면 리턴 아이콘 느낌
    const isRestart = label.includes('다시') || label.includes('Restart') || label.includes('Lobby');
    const icon = isRestart ? '↩' : '▶';

    return (
      <button
        type="button"
        className="m-btn sketch-shadow"
        style={{ pointerEvents: 'auto' }}
        onClick={() => emit('press')}
      >
        <span className="ink-bleed" style={{ marginRight: '8px', fontSize: '1.2em' }}>{icon}</span>
        {label}
      </button>
    );
  },
};

function makeStartSpec(btnLabel: string): Spec {
  return {
    root: 'overlayRoot',
    elements: {
      overlayRoot: {
        type: 'SceneRoot',
        props: {},
        children: ['startBtn'],
      },
      startBtn: {
        type: 'RunnerHudMButton',
        props: { label: btnLabel },
        children: [],
        on: {
          press: { action: 'runnerStartRound' },
        },
      },
    },
  };
}

function makeRestartSpec(btnLabel: string): Spec {
  return {
    root: 'overlayRoot',
    elements: {
      overlayRoot: {
        type: 'SceneRoot',
        props: {},
        children: ['restartBtn'],
      },
      restartBtn: {
        type: 'RunnerHudMButton',
        props: { label: btnLabel },
        children: [],
        on: {
          press: { action: 'runnerReturnToLobby' },
        },
      },
    },
  };
}

function OverlayChrome({ spec }: { spec: Spec }) {
  return (
    <StateProvider initialState={{}}>
      <ActionProvider handlers={overlayActionHandlers}>
        <VisibilityProvider>
          <ValidationProvider>
            <Renderer spec={spec} registry={overlayBtnRegistry} />
          </ValidationProvider>
        </VisibilityProvider>
      </ActionProvider>
    </StateProvider>
  );
}

export function OverlayStartRoundButton(props: { label: string }) {
  const spec = useMemo(() => makeStartSpec(props.label), [props.label]);
  return <OverlayChrome spec={spec} />;
}

/** 게임오버 → 시작 화면(로비 복귀). */
export function OverlayReturnLobbyButton(props: { label: string }) {
  const spec = useMemo(() => makeRestartSpec(props.label), [props.label]);
  return <OverlayChrome spec={spec} />;
}
