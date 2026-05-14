import * as THREE from 'three';
import {
  createCoinMesh,
  createCloudGroup,
  createDragonGroup,
  createObstacleMesh,
  createStarPickupMesh,
  disposeObject3D,
} from './actorMeshes';
import { weightedPickIndex } from './csv';
import type { TuneBook } from './gameTune';
import { loadStats, saveStats } from './storage';
import type {
  BalanceTier,
  GamePhase,
  ParsedCoinTemplate,
  ParsedObstacleTemplate,
} from './types';
import type { LoadedGameData, ParsedStatusSkillRow } from './loadGameData';
import { SfxBus } from './sfxBus';
import { hudExternalStore } from './hudExternalStore';
import {
  attachRunnerGameHooks,
  detachRunnerGameHooks,
} from './gameControlBridge';

const STAR_RUNTIME_TPL: ParsedCoinTemplate = {
  coin_id: '*',
  emoji: '⭐',
  value: 0,
  spawn_height_type: 'ground',
  air_offset_min: 0,
  air_offset_max: 0,
  spawn_weight: 0,
  pickup_kind: 'invincibility',
};

function weightedPickFrom<T>(items: T[], weightOf: (t: T) => number): T | null {
  const w = items.map(weightOf);
  const sum = w.reduce((a, b) => a + Math.max(0, b), 0);
  if (sum <= 0) return items[0] ?? null;
  let r = Math.random() * sum;
  for (let i = 0; i < items.length; i++) {
    r -= Math.max(0, w[i]!);
    if (r <= 0) return items[i]!;
  }
  return items[items.length - 1] ?? null;
}

interface ObstacleBody {
  mesh: THREE.Group;
  w: number;
  h: number;
}

interface CoinBody {
  mesh: THREE.Group;
  tpl: ParsedCoinTemplate;
  w: number;
  h: number;
  collected: boolean;
}

class Rect {
  constructor(
    public x: number,
    public y: number,
    public w: number,
    public h: number,
  ) {}
}

function aabbOverlap(a: Rect, b: Rect): boolean {
  return a.x + a.w > b.x && a.x < b.x + b.w && a.y + a.h > b.y && a.y < b.y + b.h;
}

function expandRect(a: Rect, pad: number): Rect {
  return new Rect(a.x - pad, a.y - pad, a.w + pad * 2, a.h + pad * 2);
}

function randInt(lo: number, hi: number) {
  const a = Math.ceil(Math.min(lo, hi));
  const b = Math.floor(Math.max(lo, hi));
  return a + Math.floor(Math.random() * (b - a + 1));
}

function rnd(lo: number, hi: number) {
  return lo + Math.random() * (hi - lo);
}

function padScore(s: number) {
  return String(Math.max(0, Math.floor(s))).padStart(5, '0');
}

function qs(id: string): HTMLElement {
  const node = document.getElementById(id);
  if (!node) throw new Error(`missing #${id}`);
  return node;
}

export class UnsanityGame {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.OrthographicCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly clock = new THREE.Clock();

  private phase: GamePhase = 'idle';
  private transitioning = false;
  private collisionSpinning = false;

  private state = {
    score: 0,
    coinCount: 0,
    /** 이번 런 누적 플레이 시간(초) */
    playElapsed: 0,
  };

  private readonly tb: TuneBook;
  private readonly textById: Record<string, string>;
  private readonly sfx: SfxBus;
  private readonly statusInvincRow: ParsedStatusSkillRow | null;
  private dragonBottom = 0;
  private dragonVy = 0;
  private grounded = true;

  private obstacles: ObstacleBody[] = [];
  private coins: CoinBody[] = [];

  private obstacleCooldown = 0;
  private coinCooldown = 0;

  private dragonMesh: THREE.Group;
  /** 피격·펄스 애니용 기준 균등 스케일 */
  private dragonScaleFit = 1;

  private cloudGroups: THREE.Group[] = [];

  private stats = loadStats();
  private obsTpl: ParsedObstacleTemplate[];
  private coinTpl: ParsedCoinTemplate[];
  /** 지면·공중 일반 코인 가중 풀 — 별은 스케줄 스폰 */
  private coinTplSpawnWeighted: ParsedCoinTemplate[];
  private readonly starPickupTpl: ParsedCoinTemplate;
  /** 별 스폰 예약 시각(performance.now), 정렬 유지 */
  private pendingStarSpawnAt: number[] = [];
  private coinPickupsTowardStarMilestone = 0;
  /** 이 횟수만큼 코인을 먹으면 별 0~2개 구간 스케줄 */
  private starMilestonePickupCount = 0;
  /** 직전 별 스폰 시각(ms) */
  private lastStarSpawnAtMs = -1e12;

  private mount: HTMLElement;
  /** 라운드 시작 시각(epoch ms) 기준 무적 구간은 performance.now 와 함께 사용 */
  private collisionIgnoreUntil = 0;
  /** 별 수집 후 이 시각(ms)까지 장애 충돌로 게임오버 안 함 */
  private invincibleUntilMs = 0;
  /** 무적 깜빡임 중 재질 수정 여부(해제 시 한 번만 원복) */
  private dragonInvincibilityVisualOn = false;

  /** 라운드(다시하기)마다 증가 — 이전 사망 UI 콜백 무효화 */
  private runId = 0;
  /** 사망 연출 시퀀스마다 증가 */
  private deathUiId = 0;

  /** 정적 배경 유지용 (purge 시 유지) */
  private groundRibbon!: THREE.Mesh;

  constructor(mount: HTMLElement, data: LoadedGameData) {
    this.tb = data.tuneBook;
    this.textById = data.textById;
    this.sfx = new SfxBus(data.sfxByEvent);
    this.statusInvincRow =
      data.statusSkills.find((s) => s.applied_by_pickup_kind === 'invincibility') ?? null;
    this.dragonBottom = this.tb.num('GROUND');
    this.mount = mount;
    this.obsTpl = data.obsTpl;
    this.coinTpl = data.coinTpl;
    const inv = this.coinTpl.find((c) => c.pickup_kind === 'invincibility');
    this.starPickupTpl = inv ? { ...inv, spawn_weight: 0 } : STAR_RUNTIME_TPL;
    this.coinTplSpawnWeighted = this.coinTpl.filter(
      (c) => c.pickup_kind === 'coin' && c.spawn_weight > 0,
    );
    if (!this.coinTplSpawnWeighted.length) {
      this.coinTplSpawnWeighted = this.coinTpl.filter((c) => c.pickup_kind === 'coin');
    }

    this.scene.background = new THREE.Color(0xfaf8f5);

    const vw = this.tb.num('VIEW_W');
    const vh = this.tb.num('VIEW_H');
    /** 월드 XY는 0~VIEW_W × 0~VIEW_H — 카메라를 (0,0,Z)에 두지 않으면 좌표가 평행이동돼 전부 클립된다 */
    this.camera = new THREE.OrthographicCamera(0, vw, vh, 0, 1, 2000);
    this.camera.position.set(0, 0, 500);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(vw, vh, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    mount.replaceChildren(this.renderer.domElement);

    this.scene.add(
      new THREE.AmbientLight(0xffffff, this.tb.num('LIGHT_AMBIENT_INT')),
    );
    const sun = new THREE.DirectionalLight(
      0xfff8ec,
      this.tb.num('LIGHT_SUN_INT'),
    );
    sun.position.set(
      vw + this.tb.num('SUN_POS_XOF'),
      vh + this.tb.num('SUN_POS_YOF'),
      this.tb.num('SUN_POS_ZOF'),
    );
    this.scene.add(sun);

    this.addGroundRibbon();
    this.addCloudBackdrop();

    this.dragonMesh = createDragonGroup();
    this.dragonMesh.renderOrder = this.tb.num('DRAGON_RENDER_ORDER');

    const dW = this.tb.num('DRAGON_W');
    const dH = this.tb.num('DRAGON_H');
    const dbox = new THREE.Box3().setFromObject(this.dragonMesh);
    const dSz = new THREE.Vector3();
    dbox.getSize(dSz);
    this.dragonScaleFit =
      Math.min(dW / Math.max(dSz.x, 1), dH / Math.max(dSz.y, 1)) *
      this.tb.num('DRAGON_SCALE_FIT_MULT');
    this.dragonMesh.scale.setScalar(this.dragonScaleFit);

    this.syncDragonPose();
    this.dragonMesh.position.z = this.tb.num('DRAGON_POS_Z_PLAY');
    this.scene.add(this.dragonMesh);

    window.addEventListener('keydown', this.onKeyDown);
    mount.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('resize', this.onResize);

    attachRunnerGameHooks({
      startRun: () => {
        this.startRun();
      },
      backToTitle: () => {
        this.backToTitleScreen();
      },
    });

    this.applyHudInitial();
    this.applyPhaseUi();

    this.renderer.setAnimationLoop(this.loop);
    this.clock.start();
    queueMicrotask(() => this.syncRendererToMount());
    window.requestAnimationFrame(() => this.syncRendererToMount());
  }

  dispose() {
    detachRunnerGameHooks();
    this.renderer.setAnimationLoop(null);
    window.removeEventListener('keydown', this.onKeyDown);
    this.mount.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('resize', this.onResize);
    this.clearWorldActors();
    disposeObject3D(this.dragonMesh);
    for (const c of this.cloudGroups) disposeObject3D(c);
    this.cloudGroups = [];
    this.renderer.dispose();
  }

  private addGroundRibbon() {
    const vw = this.tb.num('VIEW_W');
    const g = this.tb.num('GROUND');
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(vw, 6),
      new THREE.MeshBasicMaterial({ color: 0xcfc8bf }),
    );
    mesh.position.set(vw / 2, g - 2, -2);
    this.groundRibbon = mesh;
    this.scene.add(mesh);
  }

  private addCloudBackdrop() {
    const vw = this.tb.num('VIEW_W');
    const lo = this.tb.num('CLOUD_SZ_LO');
    const hi = this.tb.num('CLOUD_SZ_HI');
    const xLo = this.tb.num('CLOUD_POS_X_LO');
    const yLo = this.tb.num('CLOUD_POS_Y_LO');
    const yHi = this.tb.num('CLOUD_POS_Y_HI');
    for (let i = 0; i < 3; i++) {
      const sz = rnd(lo, hi);
      const cl = createCloudGroup(sz * 1.06);
      cl.position.set(rnd(xLo, vw), rnd(yLo, yHi), -4);
      this.scene.add(cl);
      this.cloudGroups.push(cl);
    }
  }

  private syncDragonPose() {
    const dL = this.tb.num('DRAGON_LEFT');
    const dW = this.tb.num('DRAGON_W');
    const dH = this.tb.num('DRAGON_H');
    this.dragonMesh.position.x = dL + dW / 2;
    this.dragonMesh.position.y = this.dragonBottom + dH / 2;
  }

  /** md: px/frame@60 → px/s 근사 */
  private scrollSpeedPxPerSec(score: number): number {
    const base = this.tb.num('SCROLL_PF_BASE');
    const chunk = this.tb.num('SCROLL_SCORE_CHUNK');
    const step = this.tb.num('SCROLL_PF_STEP');
    const mult = this.tb.num('SCROLL_MULT');
    const perFrame = base + Math.floor(score / chunk) * step;
    return perFrame * mult;
  }

  private dragonHitRect(dragonBottom: number): Rect {
    const left = this.tb.num('DRAGON_LEFT');
    const dW = this.tb.num('DRAGON_W');
    const dH = this.tb.num('DRAGON_H');
    const inset = this.tb.num('HIT_INSET');
    return new Rect(
      left + inset,
      dragonBottom + inset,
      dW - inset * 2,
      dH - inset * 2,
    );
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code !== 'Space') return;
    e.preventDefault();
    if (this.phase === 'idle') {
      if (!this.transitioning) this.startRun();
      return;
    }
    if (this.phase === 'gameover') {
      /** 게임 오버에서는 스페이스 = 초기 화면(시작 코인 선택)으로 */
      this.backToTitleScreen();
      return;
    }
    this.tryJump();
  };

  private onPointerDown = () => {
    if (this.phase === 'idle') {
      if (!this.transitioning) this.startRun();
      return;
    }
    if (this.phase === 'gameover') {
      /** 캔버스 탭도 타이틀 복귀 (인게임 바로 시작 X) — 실제 시작은 시작 버튼·스페이스 */
      this.backToTitleScreen();
      return;
    }
    this.tryJump();
  };

  private onResize = () => this.syncRendererToMount();

  private syncRendererToMount() {
    const w = Math.max(1, this.mount.clientWidth);
    const vw = this.tb.num('VIEW_W');
    const vh = this.tb.num('VIEW_H');
    this.renderer.setSize(w, (w * vh) / vw, false);
    this.camera.updateProjectionMatrix();
  }

  private readStarterCoinCount(): number {
    const el = document.querySelector(
      'input[name="starter-coins"]:checked',
    ) as HTMLInputElement | null;
    const n = el ? Number(el.value) : 3;
    return Math.max(1, Math.min(99, Number.isFinite(n) ? Math.floor(n) : 3));
  }

  private readBalanceTier(): BalanceTier {
    const el = document.querySelector(
      'input[name="balance-tier"]:checked',
    ) as HTMLInputElement | null;
    const v = el?.value;
    if (v === 'low' || v === 'mid' || v === 'high') return v;
    return 'low';
  }

  /** CSV type `cactus` = 키 큰 장애 — 난이도·경과에 따라 등장 지연 */
  private tallTreeAllowedElapsed(): boolean {
    const elapsed = this.state.playElapsed;
    const need = this.tb.tierNum(this.readBalanceTier(), 'TALL_TREE_SEC_AFTER');
    return elapsed >= need;
  }

  private txt(textId: string, fallback: string): string {
    const v = this.textById[textId];
    return v !== undefined && v !== null && v !== '' ? v : fallback;
  }

  /** `10_status_skill` 의 무적 행 연동 — 미정이면 발란스 키 INVINCIBILITY_MS */
  private invincDurationTuneKey(): string {
    const k = this.statusInvincRow?.duration_ms_tune_key?.trim();
    return k || 'INVINCIBILITY_MS';
  }

  private invincDurationMs(): number {
    return this.tb.num(this.invincDurationTuneKey());
  }

  private pickObstacleTemplate(): ParsedObstacleTemplate | null {
    if (!this.obsTpl.length) return null;
    let pool = this.obsTpl;
    if (!this.tallTreeAllowedElapsed()) {
      const noCactus = this.obsTpl.filter((t) => t.type !== 'cactus');
      if (noCactus.length) pool = noCactus;
    }
    return weightedPickFrom(pool, (t) => t.spawn_weight);
  }

  private weightedPickSpawnCoinTpl(): ParsedCoinTemplate {
    const pool = this.coinTplSpawnWeighted;
    const air = pool.filter((c) => c.spawn_height_type === 'air');
    const gra = pool.filter((c) => c.spawn_height_type === 'ground');
    const packPick = (p: ParsedCoinTemplate[]) => {
      const wi = p.map((c) => c.spawn_weight);
      return p[weightedPickIndex(wi)]!;
    };
    if (air.length && Math.random() < this.tb.num('COIN_AIR_BAND_PROB'))
      return packPick(air);
    if (gra.length) return packPick(gra);
    return packPick(pool);
  }

  private coinClustersObstacleOverlap(
    cx: number,
    cyCenter: number,
    cw: number,
    ch: number,
    pad: number,
  ): boolean {
    const cr = expandRect(
      new Rect(cx - cw / 2, cyCenter - ch / 2, cw, ch),
      pad,
    );
    for (const ob of this.obstacles) {
      const ocx = ob.mesh.position.x;
      const baseY = ob.mesh.position.y;
      const or = new Rect(ocx - ob.w / 2, baseY, ob.w, ob.h);
      if (aabbOverlap(cr, or)) return true;
    }
    return false;
  }

  /** 같은 템플릿(지면 줄 / 공중 줄)로 장애 AABB 회피 — 공중은 Y 대역도 새로 고름 */
  private trySpawnOneCoinLane(
    tpl: ParsedCoinTemplate,
    vw: number,
    g: number,
    hintCxCenter: number | null,
  ): { cx: number; bottom: number; w: number; h: number } | null {
    const cw = this.tb.num('COIN_GRID_W');
    const ch = this.tb.num('COIN_GRID_H');
    const padGround = this.tb.num('COIN_SPAWN_SAFE_PAD');
    const padAir = this.tb.num('COIN_SPAWN_AIR_SAFE_PAD');

    const yOuterBands =
      tpl.spawn_height_type === 'air'
        ? Math.max(1, Math.floor(this.tb.num('COIN_AIR_Y_BAND_RETRIES')))
        : 1;
    const retries = Math.max(1, Math.floor(this.tb.num('COIN_SPAWN_REJECT_RETRIES')));
    const padTpl = tpl.spawn_height_type === 'air' ? padAir : padGround;

    const xLo = this.tb.num('COIN_GRID_X_RND_LO');
    const xHi = this.tb.num('COIN_GRID_X_RND_HI');

    for (let yAttempt = 0; yAttempt < yOuterBands; yAttempt++) {
      let bottom: number;
      if (tpl.spawn_height_type === 'air') {
        const lo = Math.min(tpl.air_offset_min, tpl.air_offset_max);
        const hi = Math.max(tpl.air_offset_min, tpl.air_offset_max);
        bottom =
          g +
          rnd(lo, hi) +
          rnd(
            this.tb.num('COIN_AIR_LAYER_RND_LO'),
            this.tb.num('COIN_AIR_LAYER_RND_HI'),
          );
      } else {
        bottom = g + this.tb.num('COIN_BOTTOM_OFF');
      }
      const cy = bottom + ch / 2;

      for (let t = 0; t < retries; t++) {
        const cx =
          hintCxCenter != null && Number.isFinite(hintCxCenter)
            ? hintCxCenter + (t > 0 ? rnd(-42, 44) : 0)
            : vw + rnd(xLo, xHi);
        if (!this.coinClustersObstacleOverlap(cx, cy, cw, ch, padTpl))
          return { cx, bottom, w: cw, h: ch };
      }
    }
    return null;
  }

  /** 가로 줄 끝 같은 X 근처로 위쪽에 한 줄 더 얹음 (2층 쌓기) */
  private trySpawnStackAbove(
    tpl: ParsedCoinTemplate,
    cxBase: number,
    cyAboveThisCenter: number,
    stackDy: number,
  ): { cx: number; bottom: number; w: number; h: number } | null {
    const cw = this.tb.num('COIN_GRID_W');
    const ch = this.tb.num('COIN_GRID_H');
    const cy = cyAboveThisCenter + stackDy;
    const bottom = cy - ch / 2;
    const pad =
      tpl.spawn_height_type === 'air'
        ? this.tb.num('COIN_SPAWN_AIR_SAFE_PAD')
        : this.tb.num('COIN_SPAWN_SAFE_PAD');

    for (let i = 0; i < 7; i++) {
      const cx = cxBase + rnd(-13, 13) + (i > 0 ? rnd(-30, 30) : 0);
      if (!this.coinClustersObstacleOverlap(cx, cy, cw, ch, pad))
        return { cx, bottom, w: cw, h: ch };
    }
    return null;
  }

  private applyHudInitial() {
    this.pushHudChrome();
  }

  /** 점수·코인·HI·타이머 글/바·무적 — HUD DOM 없이 `hudExternalStore` 만. */
  private pushHudChrome(): void {
    const playing = this.phase === 'playing';

    const sec = Math.max(0, Math.floor(this.state.playElapsed));
    const mm = Math.floor(sec / 60);
    const ss = sec % 60;
    const timerLabel = playing ? `${mm}:${String(ss).padStart(2, '0')}` : '0:00';

    const cycle = Math.max(1e-6, this.tb.num('PLAY_TIMER_CYCLE_SEC'));
    const ratio = playing ? (this.state.playElapsed % cycle) / cycle : 0;

    const now = performance.now();
    let invincVisible = false;
    let invincSecDisplay = '0';
    if (playing && now < this.invincibleUntilMs) {
      invincVisible = true;
      invincSecDisplay = String(
        Math.max(0, Math.ceil((this.invincibleUntilMs - now) / 1000)),
      );
    }

    hudExternalStore.update({
      '/hud/scorePadded': padScore(this.state.score),
      '/hud/coinStr': String(this.state.coinCount),
      '/hud/bestPadded': padScore(this.stats.best_score),
      '/hud/timerLabel': timerLabel,
      '/hud/timerBarScale': Math.max(1e-4, ratio),
      '/hud/timerBarTone': 'green',
      '/hud/timerPulseDanger': false,
      '/hud/invincVisible': invincVisible,
      '/hud/invincSecDisplay': invincSecDisplay,
    });
  }

  private applyPhaseUi() {
    const start = qs('start-screen');
    const go = qs('gameover-screen');
    const hud = qs('play-hud');
    if (this.phase === 'idle') {
      start.hidden = false;
      go.hidden = true;
      hud.hidden = true;
    } else if (this.phase === 'playing') {
      start.hidden = true;
      go.hidden = true;
      hud.hidden = false;
    } else {
      start.hidden = true;
      go.hidden = false;
      hud.hidden = true;
    }
    this.pushHudChrome();
  }

  private startRun() {
    this.runId++;
    this.deathUiId++;
    this.transitioning = false;
    this.collisionSpinning = false;

    this.phase = 'playing';
    this.resetRound();
    this.applyPhaseUi();
  }

  /** 다시하기: 인게임이 아니라 시작 오버레이(코인 선택)로만 복귀 */
  private backToTitleScreen() {
    this.runId++;
    this.deathUiId++;
    this.transitioning = false;
    this.collisionSpinning = false;

    this.phase = 'idle';
    this.clearWorldActors();
    const g = this.tb.num('GROUND');
    this.dragonBottom = g;
    this.dragonVy = 0;
    this.grounded = true;
    this.dragonMesh.rotation.set(0, 0, 0);
    this.dragonMesh.quaternion.identity();
    this.dragonMesh.scale.setScalar(this.dragonScaleFit);
    this.syncDragonPose();
    this.dragonMesh.position.z = this.tb.num('DRAGON_POS_Z_PLAY');

    this.invincibleUntilMs = 0;
    this.clearDragonInvincibilityVisual();
    this.dragonInvincibilityVisualOn = false;
    this.pendingStarSpawnAt = [];

    qs('gameover-reason').textContent = this.txt('txt_gameover_reason_placeholder', '—');

    this.applyPhaseUi();
  }

  private resetRound() {
    this.collisionSpinning = false;
    this.clearWorldActors();
    this.collisionIgnoreUntil =
      performance.now() + this.tb.num('COLLISION_IGNORE_MS');
    this.invincibleUntilMs = 0;
    this.clearDragonInvincibilityVisual();
    this.dragonInvincibilityVisualOn = false;
    this.pendingStarSpawnAt = [];
    this.coinPickupsTowardStarMilestone = 0;
    this.starMilestonePickupCount = randInt(
      this.tb.num('STAR_RESET_MSTONE_MIN'),
      this.tb.num('STAR_RESET_MSTONE_MAX'),
    );
    this.lastStarSpawnAtMs = -1e12;

    const starter = this.readStarterCoinCount();
    this.state = {
      score: starter * this.tb.num('STARTER_SCORE_PER_COIN'),
      coinCount: 0,
      playElapsed: 0,
    };
    this.dragonBottom = this.tb.num('GROUND');
    this.dragonVy = 0;
    this.grounded = true;
    this.dragonMesh.rotation.set(0, 0, 0);
    this.dragonMesh.quaternion.identity();
    this.dragonMesh.scale.setScalar(this.dragonScaleFit);
    this.obstacleCooldown = this.tb.num('STEP_RESET_OBSTACLE_CD');
    this.coinCooldown = this.tb.num('STEP_RESET_COIN_CD');
    this.syncDragonPose();
    this.refreshHud();
  }

  /** 배열 밖에 남은 장애물·코인 그룹 제거(리셋 누락 방지) */
  private purgeDynamicSceneChildren() {
    for (const ch of [...this.scene.children]) {
      if (
        ch === this.dragonMesh ||
        ch === this.groundRibbon ||
        this.cloudGroups.includes(ch as THREE.Group) ||
        ch instanceof THREE.Light
      ) {
        continue;
      }
      disposeObject3D(ch);
      this.scene.remove(ch);
    }
  }

  private clearWorldActors() {
    for (const o of this.obstacles) {
      this.scene.remove(o.mesh);
      disposeObject3D(o.mesh);
    }
    this.obstacles = [];
    for (const c of this.coins) {
      if (!c.collected) {
        this.scene.remove(c.mesh);
        disposeObject3D(c.mesh);
      }
    }
    this.coins = [];
    this.purgeDynamicSceneChildren();
  }

  private tryJump() {
    if (this.phase !== 'playing' || this.transitioning) return;
    if (!this.grounded) return;
    this.sfx.play('player_jump');
    this.dragonVy = this.tb.num('JUMP_IMPULSE');
    this.grounded = false;
  }

  private loop = () => {
    const delta = Math.min(this.clock.getDelta(), this.tb.num('DELTA_CAP'));
    if (this.phase === 'playing' && !this.transitioning) this.stepPlaying(delta);
    this.parallaxClouds(delta);
    const t = this.clock.elapsedTime;
    if (!this.collisionSpinning) {
      const pulse =
        1 +
        Math.sin(t * this.tb.num('DRAGON_PULSE_FREQ')) *
          this.tb.num('DRAGON_PULSE_AMP');
      this.dragonMesh.scale.setScalar(this.dragonScaleFit * pulse);
    }
    this.updateDragonInvincibilityVisual();

    if (this.phase === 'idle' || this.phase === 'gameover') {
      const dL = this.tb.num('DRAGON_LEFT');
      const dW = this.tb.num('DRAGON_W');
      const dH = this.tb.num('DRAGON_H');
      const g = this.tb.num('GROUND');
      this.dragonMesh.position.x = dL + dW / 2;
      this.dragonMesh.position.y =
        g +
        dH / 2 +
        Math.sin(t * this.tb.num('IDLE_DRAGON_BOB_FREQ')) *
          this.tb.num('IDLE_DRAGON_BOB_AMP');
    }

    this.renderer.render(this.scene, this.camera);
  };

  private parallaxClouds(delta: number) {
    const vw = this.tb.num('VIEW_W');
    const scroll = this.scrollSpeedPxPerSec(
      this.phase === 'playing'
        ? this.state.score
        : this.tb.num('PARALLAX_IDLE_BASE'),
    );
    const pm = this.tb.num('PARALLAX_MUL');
    const rst = this.tb.num('PARALLAX_RESET_XLEFT');
    const rlo = this.tb.num('PARALLAX_RND_LO');
    const rhi = this.tb.num('PARALLAX_RND_HI');
    for (const c of this.cloudGroups) {
      c.position.x -= scroll * pm * delta;
      if (c.position.x < rst) c.position.x = vw + rnd(rlo, rhi);
    }
  }

  private stepPlaying(delta: number) {
    const scroll = this.scrollSpeedPxPerSec(this.state.score);
    const g = this.tb.num('GROUND');

    this.processScheduledStarPickups();

    this.state.score += this.tb.num('SCORE_PER_SEC') * delta;
    this.state.playElapsed += delta;

    this.dragonVy -= this.tb.num('GRAVITY') * delta;
    this.dragonBottom += this.dragonVy * delta;
    if (this.dragonBottom <= g) {
      this.dragonBottom = g;
      this.dragonVy = 0;
      this.grounded = true;
    }
    this.syncDragonPose();

    this.spawnActors(delta);

    const dr = this.dragonHitRect(this.dragonBottom);

    const obRecLeft = this.tb.num('OBSTACLE_RECYCLE_LEFT_X');
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const ob = this.obstacles[i]!;
      ob.mesh.position.x -= scroll * delta;
      const cx = ob.mesh.position.x;
      const baseY = ob.mesh.position.y;

      const or = new Rect(cx - ob.w / 2, baseY, ob.w, ob.h);
      const now = performance.now();
      if (
        now >= this.collisionIgnoreUntil &&
        now >= this.invincibleUntilMs &&
        aabbOverlap(dr, or)
      ) {
        this.sfx.play('hit_obstacle_death');
        void this.finishGameOver(this.txt('txt_death_collision', '충돌!'));
        return;
      }

      if (cx + ob.w / 2 < obRecLeft) {
        this.scene.remove(ob.mesh);
        disposeObject3D(ob.mesh);
        this.obstacles.splice(i, 1);
      }
    }

    const dragonPad = this.tb.num('COIN_PICKUP_DRAGON_EXPAND');
    const coinPickup = expandRect(dr, dragonPad);
    const destroyLeftX = this.tb.num('COIN_DESTROY_LEFT_X');

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const cn = this.coins[i]!;
      if (cn.collected) continue;

      cn.mesh.position.x -= scroll * delta;
      const cx = cn.mesh.position.x;
      const cy = cn.mesh.position.y;
      const coinExpand = this.tb.num('COIN_PICKUP_COIN_EXPAND');
      const cr = expandRect(
        new Rect(cx - cn.w / 2, cy - cn.h / 2, cn.w, cn.h),
        coinExpand,
      );

      if (aabbOverlap(coinPickup, cr)) {
        cn.collected = true;
        this.scene.remove(cn.mesh);
        disposeObject3D(cn.mesh);
        this.coins.splice(i, 1);
        if (cn.tpl.pickup_kind === 'invincibility') {
          this.invincibleUntilMs =
            performance.now() + this.invincDurationMs();
          this.sfx.play('pickup_star_invincibility');
        } else {
          this.state.coinCount += 1;
          this.sfx.play('pickup_coin');
          this.bumpStarMilestoneFromCoinPickup();
        }
      } else if (cx + cn.w / 2 < destroyLeftX) {
        this.scene.remove(cn.mesh);
        disposeObject3D(cn.mesh);
        this.coins.splice(i, 1);
      }
    }

    this.refreshHud();
  }

  private spawnActors(delta: number) {
    const vw = this.tb.num('VIEW_W');
    const g = this.tb.num('GROUND');
    this.obstacleCooldown -= delta;
    if (this.obstacleCooldown <= 0 && this.obsTpl.length) {
      const tpl = this.pickObstacleTemplate();
      if (!tpl) {
        this.obstacleCooldown += this.tb.num('OBSTACLE_FAIL_COOLDOWN');
      } else {
        const w = randInt(tpl.min_width, tpl.max_width);
        const h = randInt(tpl.min_height, tpl.max_height);

        let bottom = g;
        if (tpl.is_air) {
          const offLow = Math.min(tpl.air_offset_min, tpl.air_offset_max);
          const offHi = Math.max(tpl.air_offset_min, tpl.air_offset_max);
          const off = rnd(offLow, offHi);
          /** 점프 궤적과 겹치도록 추가 상승을 낮게(이전 72~130은 너무 높아 충돌 거의 없음) */
          bottom =
            g +
            off +
            rnd(
              this.tb.num('AIR_HEIGHT_RND_LO'),
              this.tb.num('AIR_HEIGHT_RND_HI'),
            );
        }

        const grp = createObstacleMesh(tpl.type, w, h);
        const leftOrigin =
          vw +
          rnd(
            this.tb.num('OBSTACLE_SPAWN_X_RND_LO'),
            this.tb.num('OBSTACLE_SPAWN_X_RND_HI'),
          );
        grp.position.set(leftOrigin + w / 2, bottom, 2);
        this.scene.add(grp);
        this.obstacles.push({ mesh: grp, w, h });

        const frames = Math.max(
          this.tb.num('OBSTACLE_FRAMES_MIN'),
          this.tb.num('OBSTACLE_FRAMES_BASE') -
            Math.floor(this.state.score / this.tb.num('OBSTACLE_SCORE_DIV')),
        );
        this.obstacleCooldown += frames / 60;
      }
    }

    this.coinCooldown -= delta;
    if (this.coinCooldown <= 0 && this.coinTplSpawnWeighted.length) {
      const tplLead = this.weightedPickSpawnCoinTpl();

      let want = 1;
      const rol = Math.random();
      const triple = this.tb.num('COIN_CLUSTER_TRIPLE_GATE');
      const duoCap = this.tb.num('COIN_CLUSTER_DOUBLE_GATE');
      if (rol < triple) want = 3;
      else if (rol < duoCap) want = 2;
      if (tplLead.spawn_height_type === 'air') {
        want = Math.min(
          want,
          Math.max(1, Math.floor(this.tb.num('COIN_AIR_ROW_MAX_CLUSTER'))),
        );
      }

      let prevCx: number | null = null;
      let placedAny = false;
      let lastPlacedSpot: {
        cx: number;
        bottom: number;
        w: number;
        h: number;
      } | null = null;
      const gapLo = this.tb.num('COIN_CHAIN_GAP_LO');
      const gapHi = this.tb.num('COIN_CHAIN_GAP_HI');

      for (let i = 0; i < want; i++) {
        const hint =
          i > 0 && prevCx !== null ? prevCx + rnd(gapLo, gapHi) : null;
        const spot = this.trySpawnOneCoinLane(tplLead, vw, g, hint);
        if (!spot) break;
        const grp = createCoinMesh(spot.w, spot.h);
        grp.position.set(spot.cx, spot.bottom + spot.h / 2, 3);
        this.scene.add(grp);
        this.coins.push({
          mesh: grp,
          tpl: tplLead,
          w: spot.w,
          h: spot.h,
          collected: false,
        });
        placedAny = true;
        prevCx = spot.cx;
        lastPlacedSpot = spot;
      }

      if (
        placedAny &&
        lastPlacedSpot &&
        tplLead.pickup_kind === 'coin' &&
        Math.random() < this.tb.num('COIN_VERTICAL_STACK_PAIR_CHANCE')
      ) {
        const dy = this.tb.num('COIN_STACK_VERTICAL_GAP');
        const prevCyCenter =
          lastPlacedSpot.bottom + lastPlacedSpot.h / 2;
        const stack = this.trySpawnStackAbove(
          tplLead,
          lastPlacedSpot.cx,
          prevCyCenter,
          dy,
        );
        if (stack) {
          const grpUp = createCoinMesh(stack.w, stack.h);
          grpUp.position.set(stack.cx, stack.bottom + stack.h / 2, 3);
          this.scene.add(grpUp);
          this.coins.push({
            mesh: grpUp,
            tpl: tplLead,
            w: stack.w,
            h: stack.h,
            collected: false,
          });
        }
      }

      this.coinCooldown += this.tb.num('COIN_RESPAWN_BASE_SEC');
      if (!placedAny) this.coinCooldown += 0.14;
    }
  }

  /** 코인 수집 누적 → 일정마다 별 0~2개를 랜덤 지연으로 예약 */
  private bumpStarMilestoneFromCoinPickup() {
    this.coinPickupsTowardStarMilestone++;
    if (this.coinPickupsTowardStarMilestone < this.starMilestonePickupCount) return;
    this.coinPickupsTowardStarMilestone = 0;
    this.starMilestonePickupCount = randInt(
      this.tb.num('STAR_EACH_MSTONE_MIN'),
      this.tb.num('STAR_EACH_MSTONE_MAX'),
    );
    const u = Math.random();
    let n = 0;
    const gate = this.tb.num('STAR_BATCH_PROB_GATE');
    if (u < gate) {
      const v = Math.random();
      const t2 = this.tb.num('STAR_INNER_TWO_V_LT');
      const t1 = this.tb.num('STAR_INNER_ONE_V_LT');
      if (v < t2) n = 2;
      else if (v < t1) n = 1;
    }
    const t0 = performance.now();
    const dLo = this.tb.num('STAR_DELAY_MS_LO');
    const dHi = this.tb.num('STAR_DELAY_MS_HI_BASE');
    const dPer = this.tb.num('STAR_DELAY_MS_PER_STAR_IDX');
    for (let i = 0; i < n; i++) {
      this.pendingStarSpawnAt.push(t0 + rnd(dLo, dHi + i * dPer));
    }
    this.pendingStarSpawnAt.sort((a, b) => a - b);
  }

  private processScheduledStarPickups() {
    if (this.phase !== 'playing' || this.transitioning) return;
    const now = performance.now();
    while (this.pendingStarSpawnAt.length && this.pendingStarSpawnAt[0]! <= now) {
      const minGap = this.tb.num('STAR_MIN_GAP_MS');
      const gapLo = this.tb.num('STAR_GAP_RESCHED_LO');
      const gapHi = this.tb.num('STAR_GAP_RESCHED_HI');
      if (this.lastStarSpawnAtMs >= 0 && now - this.lastStarSpawnAtMs < minGap) {
        this.pendingStarSpawnAt[0] =
          this.lastStarSpawnAtMs + minGap + rnd(gapLo, gapHi);
        this.pendingStarSpawnAt.sort((a, b) => a - b);
        return;
      }
      this.pendingStarSpawnAt.shift();
      this.spawnStarPickup();
      this.lastStarSpawnAtMs = now;
    }
  }

  private spawnStarPickup() {
    const vw = this.tb.num('VIEW_W');
    const g = this.tb.num('GROUND');
    const w = this.tb.num('STAR_PICKUP_W');
    const h = this.tb.num('STAR_PICKUP_H');
    const bottom = g + this.tb.num('COIN_BOTTOM_OFF');
    const grp = createStarPickupMesh(w, h);
    const xOff =
      vw + rnd(this.tb.num('STAR_OFF_X_LO'), this.tb.num('STAR_OFF_X_HI'));
    grp.position.set(xOff, bottom + h / 2, 3);
    this.scene.add(grp);
    this.coins.push({
      mesh: grp,
      tpl: this.starPickupTpl,
      w,
      h,
      collected: false,
    });
  }

  private clearDragonInvincibilityVisual() {
    this.dragonMesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const m of mats) {
          if (m instanceof THREE.MeshLambertMaterial) {
            m.transparent = false;
            m.opacity = 1;
            m.depthWrite = true;
            m.emissive = new THREE.Color(0x000000);
            m.emissiveIntensity = 0;
          }
        }
      }
    });
  }

  /** 무적 중 알파 50%~100% 깜빡임(마리오류). 비무적이면 재질 원복 */
  private updateDragonInvincibilityVisual() {
    const now = performance.now();
    const inv =
      this.phase === 'playing' &&
      now < this.invincibleUntilMs &&
      !this.collisionSpinning &&
      !this.transitioning;
    if (!inv) {
      if (this.dragonInvincibilityVisualOn) {
        this.clearDragonInvincibilityVisual();
        this.dragonInvincibilityVisualOn = false;
      }
      return;
    }
    this.dragonInvincibilityVisualOn = true;
    const hz = this.tb.num('INVINC_SINE_HZ');
    const pulse = (Math.sin(now * 0.001 * Math.PI * 2 * hz) + 1) * 0.5;
    const opacity = THREE.MathUtils.lerp(
      this.tb.num('INVINC_ALPHA_MIN'),
      this.tb.num('INVINC_ALPHA_MAX'),
      pulse,
    );
    const emissiveStrength = THREE.MathUtils.lerp(
      this.tb.num('INVINC_EMB_MIN'),
      this.tb.num('INVINC_EMB_MAX'),
      pulse,
    );
    this.dragonMesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const m of mats) {
          if (m instanceof THREE.MeshLambertMaterial) {
            m.transparent = true;
            m.depthWrite = false;
            m.opacity = opacity;
            m.emissive = new THREE.Color(0x66ffcc);
            m.emissiveIntensity = emissiveStrength;
          }
        }
      }
    });
  }

  private finishGameOver(reason: string) {
    if (this.transitioning || this.phase !== 'playing') return;

    this.invincibleUntilMs = 0;
    this.clearDragonInvincibilityVisual();
    this.dragonInvincibilityVisualOn = false;
    this.pendingStarSpawnAt = [];

    /** 연출 도중 새 판이면 wrapUp 만 스킵해도 됨 — 기록은 여기서 한 번만 저장 */
    const sc = Math.floor(this.state.score);
    if (sc > this.stats.best_score) this.stats.best_score = sc;
    this.stats.total_coins_ever += this.state.coinCount;
    saveStats(this.stats);

    const capRun = this.runId;
    const capDeath = ++this.deathUiId;
    this.transitioning = true;

    const wrapUp = () => {
      if (this.runId !== capRun || this.deathUiId !== capDeath) return;

      qs('gameover-reason').textContent = reason;
      qs('final-score').textContent = String(sc);
      qs('final-coin').textContent = String(this.state.coinCount);
      this.pushHudChrome();

      this.phase = 'gameover';
      this.transitioning = false;
      this.applyPhaseUi();
    };

    this.collisionSpinning = true;
    const t0 = performance.now();
    const dur = this.tb.num('GAMEOVER_SPIN_MS');
    const step = () => {
      if (this.runId !== capRun || this.deathUiId !== capDeath) return;
      const alpha = Math.min(1, (performance.now() - t0) / dur);
      this.dragonMesh.rotation.z = alpha * Math.PI * 2;
      const shrink = Math.max(1 - alpha * 0.85, 0.09);
      this.dragonMesh.scale.setScalar(this.dragonScaleFit * shrink);
      if (alpha < 1) requestAnimationFrame(step);
      else {
        this.collisionSpinning = false;
        wrapUp();
      }
    };
    step();
  }

  private refreshHud() {
    this.pushHudChrome();
  }
}
