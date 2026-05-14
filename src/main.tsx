import './style.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { bootstrapGame } from './bootstrapGame';
import { TEXT_COPY_IDS, lineOr } from './game/textCopyIds';
import { GameJsonHud } from './jsonRender/GameJsonHud';
import {
  LobbyHeaderCopySpec,
  LobbyStarterHintCopySpec,
} from './jsonRender/GameLobbyCopySpec';
import {
  OverlayReturnLobbyButton,
  OverlayStartRoundButton,
} from './jsonRender/GameOverlayActionButtons';

const data = bootstrapGame();

const hdr = document.getElementById('jr-lobby-spec-header');
if (hdr)
  createRoot(hdr).render(
    <StrictMode>
      <LobbyHeaderCopySpec
        title={lineOr(data.textById, TEXT_COPY_IDS.overlayTitle, 'Unsanity 🐲')}
        sub={lineOr(
          data.textById,
          TEXT_COPY_IDS.overlaySub,
          '장애물 피하기 · 코인은 점수(개수)만 · 점프는 스페이스 / 탭',
        )}
        tierBlurb={lineOr(
          data.textById,
          TEXT_COPY_IDS.difficultyBlurb,
          '난이도 (발란스) · 기본 하',
        )}
      />
    </StrictMode>,
  );

const starterTxt = document.getElementById('jr-lobby-spec-starter');
if (starterTxt)
  createRoot(starterTxt).render(
    <StrictMode>
      <LobbyStarterHintCopySpec
        text={lineOr(
          data.textById,
          TEXT_COPY_IDS.starterBonusBlurb,
          '시작 코인 (보너스 점수 — 코인 하나당 +100)',
        )}
      />
    </StrictMode>,
  );

document.title = lineOr(
  data.textById,
  TEXT_COPY_IDS.docTitle,
  document.title,
);

const hudMount = document.getElementById('jr-hud-widgets');
if (hudMount) {
  createRoot(hudMount).render(
    <StrictMode>
      <GameJsonHud
        hudLabels={{
          txt_hud_coin_prefix: lineOr(data.textById, TEXT_COPY_IDS.hudCoinPrefix, ''),
          txt_hud_hi_prefix: lineOr(data.textById, TEXT_COPY_IDS.hudHiPrefix, ''),
          txt_hud_play_time_header: lineOr(
            data.textById,
            TEXT_COPY_IDS.hudPlayTimeHeader,
            '',
          ),
          txt_hud_invinc_prefix: lineOr(
            data.textById,
            TEXT_COPY_IDS.hudInvincPrefix,
            '',
          ),
          txt_hud_invinc_seconds_suffix: lineOr(
            data.textById,
            TEXT_COPY_IDS.hudInvincSecondsSuffix,
            '',
          ),
        }}
      />
    </StrictMode>,
  );
}

const startAct = document.getElementById('jr-start-actions');
if (startAct) {
  createRoot(startAct).render(
    <StrictMode>
      <OverlayStartRoundButton
        label={lineOr(data.textById, TEXT_COPY_IDS.btnStart, '시작')}
      />
    </StrictMode>,
  );
}

const restartAct = document.getElementById('jr-restart-actions');
if (restartAct) {
  createRoot(restartAct).render(
    <StrictMode>
      <OverlayReturnLobbyButton
        label={lineOr(data.textById, TEXT_COPY_IDS.btnRestart, '다시')}
      />
    </StrictMode>,
  );
}
