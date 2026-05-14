import { useMemo } from 'react';

import type { Spec } from '@json-render/core';
import type { ComponentRenderProps, ComponentRenderer } from '@json-render/react';
import {
  ActionProvider,
  Renderer,
  ValidationProvider,
  VisibilityProvider,
  StateProvider,
} from '@json-render/react';

import { buildLobbyStarterHintSpec } from './lobbyStarterHintSpec';

function lobbyCopyVariantClass(
  variant: 'sub' | 'balance_hint' | 'starter_hint',
): string {
  if (variant === 'balance_hint')
    return 'overlay-sub mono starter-hint balance-hint';
  if (variant === 'starter_hint') return 'overlay-sub mono starter-hint';
  return 'overlay-sub mono';
}

function LobbyHeroTitleImpl({ element }: ComponentRenderProps) {
  const p = element.props as { title?: unknown };
  return (
    <div className="overlay-title caveat" id="jr-overlay-main-title">
      {String(p.title ?? '')}
    </div>
  );
}

function LobbyCopyLineImpl({ element }: ComponentRenderProps) {
  const p = element.props as {
    text?: unknown;
    variant?: 'sub' | 'balance_hint' | 'starter_hint';
  };
  const v = p.variant ?? 'sub';
  return <p className={lobbyCopyVariantClass(v)}>{String(p.text ?? '')}</p>;
}

const lobbyCopyRegistry: Record<string, ComponentRenderer> = {
  SceneRoot: ({ children }) => (
    <div className="jr-overlay-scene-shell">{children}</div>
  ),
  RunnerLobbyHeroTitle: (p) => <LobbyHeroTitleImpl {...p} />,
  RunnerLobbyCopyLine: (p) => <LobbyCopyLineImpl {...p} />,
};

function makeLobbyHeaderSpec(strings: {
  title: string;
  sub: string;
  tierBlurb: string;
}): Spec {
  return {
    root: 'lobbyRoot',
    elements: {
      lobbyRoot: {
        type: 'SceneRoot',
        props: {},
        children: ['t1', 'p1', 'p2'],
        visible: true,
      },
      t1: {
        type: 'RunnerLobbyHeroTitle',
        props: { title: strings.title },
        children: [],
        visible: true,
      },
      p1: {
        type: 'RunnerLobbyCopyLine',
        props: { text: strings.sub, variant: 'sub' },
        children: [],
        visible: true,
      },
      p2: {
        type: 'RunnerLobbyCopyLine',
        props: { text: strings.tierBlurb, variant: 'balance_hint' },
        children: [],
        visible: true,
      },
    },
  };
}

/** 정적 로비 문구 — 버튼과 별도 루트 */
function ReadonlyDeclarativeChrome({ spec }: { spec: Spec }) {
  return (
    <StateProvider initialState={{}}>
      <ActionProvider>
        <VisibilityProvider>
          <ValidationProvider>
            <Renderer spec={spec} registry={lobbyCopyRegistry} />
          </ValidationProvider>
        </VisibilityProvider>
      </ActionProvider>
    </StateProvider>
  );
}

export function LobbyHeaderCopySpec(props: {
  title: string;
  sub: string;
  tierBlurb: string;
}) {
  const spec = useMemo(
    () =>
      makeLobbyHeaderSpec({
        title: props.title,
        sub: props.sub,
        tierBlurb: props.tierBlurb,
      }),
    [props.title, props.sub, props.tierBlurb],
  );
  return <ReadonlyDeclarativeChrome spec={spec} />;
}

export function LobbyStarterHintCopySpec(props: { text: string }) {
  const spec = useMemo(() => buildLobbyStarterHintSpec(props.text), [props.text]);
  return <ReadonlyDeclarativeChrome spec={spec} />;
}
