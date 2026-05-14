import type { Spec } from '@json-render/core';

import lobbyStarterHintTemplate from '../game_specs/lobby_starter_hint.spec.json';

const TEXT_PLACEHOLDER = '__UNS_LOBBY_STARTER_TEXT__';

function lobbyStarterFallback(text: string): Spec {
  return {
    root: 'lobbyStarterRoot',
    elements: {
      lobbyStarterRoot: {
        type: 'SceneRoot',
        props: {},
        children: ['ph'],
        visible: true,
      },
      ph: {
        type: 'RunnerLobbyCopyLine',
        props: { text, variant: 'starter_hint' },
        children: [],
        visible: true,
      },
    },
  };
}

/** `src/game_specs/lobby_starter_hint.spec.json` — 레이아웃만 두고 문자열은 런타임 주입 */
export function buildLobbyStarterHintSpec(text: string): Spec {
  try {
    const s = structuredClone(lobbyStarterHintTemplate) as Spec;
    if (typeof s.root !== 'string' || !s.elements || typeof s.elements !== 'object') {
      throw new Error('root/elements');
    }
    const ph = s.elements.ph;
    if (
      !ph ||
      ph.type !== 'RunnerLobbyCopyLine' ||
      !ph.props ||
      typeof ph.props !== 'object'
    ) {
      throw new Error('ph');
    }
    const props = ph.props as Record<string, unknown>;
    const cur = String(props.text ?? '');
    if (
      cur !== TEXT_PLACEHOLDER &&
      cur !== '' &&
      import.meta.env.DEV
    ) {
      console.warn(
        '[unsanity lobby starter hint] JSON `text` should be placeholder or empty; replacing anyway',
      );
    }
    props.text = text;
    ph.visible = true;
    return s;
  } catch (err) {
    console.warn('[unsanity lobby starter hint] template failed → inline fallback', err);
    return lobbyStarterFallback(text);
  }
}
