import { useEffect } from 'react';

import type { Spec } from '@json-render/core';
import type { ComponentRenderProps, ComponentRenderer } from '@json-render/react';
import {
  ActionProvider,
  Renderer,
  ValidationProvider,
  VisibilityProvider,
  StateProvider,
} from '@json-render/react';

import { hudExternalStore } from '../game/hudExternalStore';

export type HudLabelBundle = {
  txt_hud_coin_prefix: string;
  txt_hud_hi_prefix: string;
  txt_hud_play_time_header: string;
  txt_hud_invinc_prefix: string;
  txt_hud_invinc_seconds_suffix: string;
};

const playHudSpec = {
  root: 'jrRoot',
  elements: {
    jrRoot: {
      type: 'SceneRoot',
      props: {},
      children: ['timerEl', 'invincEl', 'coinEl', 'scoreEl'],
    },
    timerEl: {
      type: 'RunnerHudTimerStrip',
      props: {
        headerLabel: { $state: '/hud/lblPlayTimeHeader' },
        timeDisplay: { $state: '/hud/timerLabel' },
        barScale: { $state: '/hud/timerBarScale' },
        barTone: { $state: '/hud/timerBarTone' },
        barPulse: { $state: '/hud/timerPulseDanger' },
      },
      children: [],
    },
    invincEl: {
      type: 'RunnerHudInvincRibbon',
      props: {
        invincPrefix: { $state: '/hud/lblInvincPrefix' },
        ribbonOpen: { $state: '/hud/invincVisible' },
        ribbonSec: { $state: '/hud/invincSecDisplay' },
        secondsSuffix: { $state: '/hud/lblInvincSecSuffix' },
      },
      children: [],
    },
    coinEl: {
      type: 'RunnerHudCoinBlock',
      props: {
        coinPrefix: { $state: '/hud/lblCoinPrefix' },
        value: { $state: '/hud/coinStr' },
      },
      children: [],
    },
    scoreEl: {
      type: 'RunnerHudScoreStack',
      props: {
        hiPrefix: { $state: '/hud/lblHiPrefix' },
        bestValue: { $state: '/hud/bestPadded' },
        scoreValue: { $state: '/hud/scorePadded' },
      },
      children: [],
    },
  },
} satisfies Spec;

function HudCoinBlockImpl({ element }: ComponentRenderProps) {
  const p = element.props as { coinPrefix?: unknown; value?: unknown };
  return (
    <div className="hud-coin hud-box sketch-float">
      <span className="ink-bleed">{String(p.coinPrefix ?? '')}</span> <span className="ink-bleed">{String(p.value ?? '')}</span>
    </div>
  );
}

function HudScoreStackImpl({ element }: ComponentRenderProps) {
  const p = element.props as {
    hiPrefix?: unknown;
    bestValue?: unknown;
    scoreValue?: unknown;
  };
  return (
    <div className="hud-right">
      <div className="hud-hi">
        <span>{String(p.hiPrefix ?? '')}</span>{' '}
        <span>{String(p.bestValue ?? '')}</span>
      </div>
      <div className="hud-score">{String(p.scoreValue ?? '')}</div>
    </div>
  );
}

function toneToCls(tone: unknown): string {
  const t = typeof tone === 'string' ? tone : 'green';
  if (t === 'yellow') return 'timer-fill-yellow';
  if (t === 'red') return 'timer-fill-red';
  return 'timer-fill-green';
}

function HudTimerStripImpl({ element }: ComponentRenderProps) {
  const p = element.props as {
    headerLabel?: unknown;
    timeDisplay?: unknown;
    barScale?: unknown;
    barTone?: unknown;
    barPulse?: unknown;
  };
  const scale =
    typeof p.barScale === 'number'
      ? p.barScale
      : Number.parseFloat(String(p.barScale ?? 0)) || 0.0001;
  const toneCls = toneToCls(p.barTone);
  const pulse = Boolean(p.barPulse);
  const timeStr = String(p.timeDisplay ?? '');

  return (
    <div className="timer-strip wobble-sketch">
      <div className="timer-bar-label">
        <span className="timer-label ink-bleed">{String(p.headerLabel ?? '')}</span>
        <span className="timer-value ink-bleed">{timeStr}</span>
      </div>
      <div className="timer-track sketch-border-inner">
        <div
          className={['timer-fill', toneCls, pulse && 'pulse-danger']
            .filter(Boolean)
            .join(' ')}
          style={{
            transformOrigin: 'left center',
            transform: `scaleX(${scale})`,
          }}
        />
      </div>
    </div>
  );
}

function HudInvincRibbonImpl({ element }: ComponentRenderProps) {
  const p = element.props as {
    invincPrefix?: unknown;
    ribbonOpen?: unknown;
    ribbonSec?: unknown;
    secondsSuffix?: unknown;
  };
  if (!Boolean(p.ribbonOpen)) return null;

  return (
    <div className="hud-invinc-wrap hud-box" role="status">
      <span>{String(p.invincPrefix ?? '')}</span>
      <span>{String(p.ribbonSec ?? '')}</span>
      <span>{String(p.secondsSuffix ?? '')}</span>
    </div>
  );
}

const fallback: ComponentRenderer = ({ element }) => {
  if (import.meta.env.DEV)
    console.warn('[json-render] 미등록 HUD 타입:', element.type);
  return null;
};

const registry: Record<string, ComponentRenderer> = {
  SceneRoot: ({ children }) => (
    <div className="jr-hud-widgets-inner">{children}</div>
  ),
  RunnerHudTimerStrip: (p) => <HudTimerStripImpl {...p} />,
  RunnerHudInvincRibbon: (p) => <HudInvincRibbonImpl {...p} />,
  RunnerHudCoinBlock: (p) => <HudCoinBlockImpl {...p} />,
  RunnerHudScoreStack: (p) => <HudScoreStackImpl {...p} />,
};

/** `#jr-hud-widgets` — 인게임 HUD 전 블록(플레이 시에만 보임). */
export function GameJsonHud(props: { hudLabels: HudLabelBundle }) {
  useEffect(() => {
    hudExternalStore.update({
      '/hud/lblCoinPrefix': props.hudLabels.txt_hud_coin_prefix,
      '/hud/lblHiPrefix': props.hudLabels.txt_hud_hi_prefix,
      '/hud/lblPlayTimeHeader': props.hudLabels.txt_hud_play_time_header,
      '/hud/lblInvincPrefix': props.hudLabels.txt_hud_invinc_prefix,
      '/hud/lblInvincSecSuffix': props.hudLabels.txt_hud_invinc_seconds_suffix,
    });
  }, [props.hudLabels]);

  return (
    <StateProvider store={hudExternalStore}>
      <ActionProvider>
        <VisibilityProvider>
          <ValidationProvider>
            <Renderer
              spec={playHudSpec}
              registry={registry}
              fallback={fallback}
            />
          </ValidationProvider>
        </VisibilityProvider>
      </ActionProvider>
    </StateProvider>
  );
}
