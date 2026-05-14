---

identity:
  name: Unsanity
  genre: [casual, endless-runner, resource-collection]
  platform: [mobile-ios, mobile-android, web]
  players: 1
  renderer: "Three.js (Orthographic 전용 원칙) — Canvas 2D로 플레이 월드를 대신하지 않는다."
  architecture_guide_declarative: docs/JSON_RENDER_Unsanity_Guide.md
  development_structure_handbook: docs/DEVELOPMENT_STRUCTURE.md

  production_methodology_section_note: >-
    기획 순서·시트 책임·경로·로더·카탈로그를 한 세트로 다룰 때의 체크리스트,
    타 장르로 구조만 이식할 때의 경계,
    다른 AI에게 붙일 복사 블록은 통합 문서 §10 「제작 방법론」(본 헌법 「제작 방법」은 요약판).
    아직 완전하지 않은 영역(하이브리드 UI·연구 잔여)은 통합 문서 §9.3·§6 표.

  pitch: >
    플레이어(용 이모지)가 달리며 장애물을 회피하고 코인 등 픽업을 수집한다.
    시간·속도·난이도·픽업 수치 등 **단일 근거(SSoT)** 는 `game_data/` CSV 및
    `TuneBook`/UnsanityGame 구현이며, 아래 초안 수치와 어긋나면 코드·CSV 쪽 우선 수정 후 헌법 갱신.

implementation:
  language: typescript
  bundler: vite
  entry: src/main.tsx
  bootstrap: src/bootstrapGame.ts
  gameplay_core_class: src/game/UnsanityGame.ts
  index_html: 마운트·오버레이 DOM 뼈대 (게임 판별 로직은 넣지 않음)

  files_role_map:
    src/main.tsx: 부트 결과로 React 루트 분기(HUD Spec, 로비 copy Spec, 시작·다시 Spec)
    src/bootstrapGame.ts: CSV glob 검증 및 loadGameData, DOM 문자열 채우기, UnsanityGame 생성 (+ DEV 카탈로그·연구 검증)
    src/game/UnsanityGame.ts: 페이즈, Three 레이아웃·스폰·충돌, 라디오 티어·코인 읽기, pushHudChrome
    src/game/loadGameData.ts 및 csv 모듈: 시트별 파스 (문자열 시트 BOM·값 속 쉼표 안전 포함)
    src/game/textCopyIds.ts: React 카피·버튼에 쓸 text_id 상수(SSoT 05 교차)·lineOr 헬퍼
    src/jsonRender/lobbyStarterHintSpec.ts: 로비 starter Spec JSON 로드·플레이스홀더 치환
    src/catalog/unsanityRunnerCatalog.ts: defineCatalog 진입점 — 운영 UI + 스텁·재료 병합
    src/catalog/runnerCatalogOperationalUi.ts: 로비·HUD·버튼 카탈로그(registry 와 세트로 추가)
    src/catalog/runnerCatalogStubsAndMaterials.ts: RunnerDataMaterial_* · 패키지 + RunnerGameplay 등 스텁(registry 없음)
    src/catalog/runnerCatalogShared.ts: hudBindProp 등 공통 Zod

  data_ssot_pipeline:
    path_constants: src/game/runnerDataPaths.ts
    raw_load: import.meta.glob('../game_data/*.csv', { query: '?raw', import: default, eager: true })
    compose: src/game/buildRawGameDataSheets.ts
    merge_to_runtime: src/game/loadGameData.ts · src/game/gameTune.ts

  json_render_declaration_layer_injection:
    philosophy: >-
      카탈로그(허용 타입)·Spec(조립 순서)·State($state)·Action(카탈로그 액션)으로
      **확실히 DOM 레이어**를 선언 가능 구역만 다룬다.

    packages_names:
      - "@json-render/core"
      - "@json-render/react"
      - zod
    schema_for_spec_shape: "@json-render/react/schema"
    catalog_file: src/catalog/unsanityRunnerCatalog.ts
    catalog_support_files_note: >-
      운영 UI runnerCatalogOperationalUi.ts · 스텁·재료 runnerCatalogStubsAndMaterials.ts ·
      공통 Zod runnerCatalogShared.ts.
      파일 분리 의도·컴포넌트 선정 규칙은 통합 문서 §4.1·§4.2 — 파일 표는 §4.3.

    hud_spec_file: src/jsonRender/GameJsonHud.tsx
    lobby_heading_spec_renderer: src/jsonRender/GameLobbyCopySpec.tsx (RunnerLobbyHeroTitle, RunnerLobbyCopyLine)
    overlay_action_specs: src/jsonRender/GameOverlayActionButtons.tsx (RunnerHudMButton + runnerStartRound 등)
    hud_store_note: >-
      src/game/hudExternalStore.ts (createStateStore). Spec 에서 {"$state":"/hud/…"} 로 읽을 경로는 pushHudChrome·초기 주입 과 반드시 같이 수정.
    imperative_to_declarative_actions: src/game/gameControlBridge.ts

    declarative_materials_concept_note: >-
      `game_data/*.csv` 각 시트는 카탈로그 재료 타입 RunnerDataMaterial_* 과 경로 문자열 묶음.
      DEV 레지스트리 검증 및 연구 패키지 Spec 이 경로 불일치를 잡음.

components:
  game_state:
    phase:          { type: enum, values: [idle, playing, gameover] }
    score:          { type: float, implementation_note: "UnsanityGame 내부 상태 + HUD 스토어" }
    coin_count:     { type: int, implementation_note: "런 카운터 + 결과 화면" }
    time_optional_: { type: float, optional: true }
    play_elapsed_optional_: { type: float, optional: true }

  dragon:
    x:        { type: float }
    y:        { type: float }
    width:    { type: float }
    height:   { type: float }
    dy:       { type: float }
    jump_force:  { tune_key_hint: 예시 PLAY_* 키 — 실제값은 04/07 등 }
    gravity:     { tune_key_hint: GROUND 근변 }
    grounded:    { type: bool, default: true }
    emoji:       { source: character sheet / actor mesh 표현부 }

  obstacle:
    x:      { type: float }
    y:      { type: float }
    width:  { type: float }
    height: { type: float }
    template_row: "obstacle_id 행 참조(game_data/02_object_obstacle.csv)"
    emoji_note: 템플릿 문자열 또는 메시 근처

  coin_or_pickup:
    x:         { type: float }
    y:         { type: float }
    template_row: "03_item_pickup.csv 픽업 종류별 행"

entities:
  dragon:
    components: [dragon]
    states: [running, jumping]

  obstacle:
    components: [obstacle]
    spawn_logic: "weightedPick 로 템플릿 선택 — 레포 구현 참고 · 02 시트 근거"

  pickup:
    components: [coin_or_pickup]
    spawn_logic: "템플릿 선택 + 높이 — 03 시트 근거"

mechanics:
  turn_structure: realtime
  declarative_overlay_boundary: >-
    점프·충돌·스폰 본연은 명령형 UnsanityGame이다.
    보여 줄 패널·HUD 숫자·문구 일부만 json-render·스토어에 올린다.
    카탈로그에 없는 타입을 Spec 에 넣거나 /hud 경로만 고치고 pushHudChrome 과 Spec 동기화 안 하면 DEV 검증 또는 화면이 깨질 수 있다.

actions_spec_note:
  설명: "아래 Mechanics 절 패턴은 사람이 읽는 명세 문자열 형식입니다. 진짜 스키마는 카탈로그와 TypeScript 구현 참고합니다."

goals:
  survive:
    - condition: 히트 없이 회피
  score:
    - metric: score
      note: 시간 정책이 레포 버전별로 추가·변형될 수 있음 → 시트 교차 확인
  collect:
    - metric: coin_count 및 기타 픽업 카운터

---

## Design Pillars

**Blank Paper Sketch** — 배경 톤·테두리·손글씨 느낌 레이블은 연속성 유지. (`src/style.css`, Caveat 폰트 사용 구역 존재)

**카피·문구 줄** — 우선 순위 `game_data/05_text_strings.csv` + `bootstrapDomTexts` 후 로비 헤더·HUD 라벨은 `TEXT_COPY_IDS`(`src/game/textCopyIds.ts`)로 `main.tsx`에서 주입한다.

**단순 입력 하나 중심** — 점프(스페이스/탭). 더블 점프 안 함(변경 시 본 헌법 갱신).

**선언 레이어는 화면·경로 규격에만 초점** — Three 월드를 Spec으로 깨워 넣으려 들지 않음(통합 문서 정책).

**상태 경로 수정은 세트 수정** — `hudExternalStore` 경로·`GameJsonHud` Spec 의 `$state` 문자열·`pushHudChrome` 키 를 **동시 업데이트**.

---

## User Flow

### 1. 진입

브라우저 로드 또는 배너  
  → UN-UI-001 `#start-screen` 로비 표시 (.start-screen-body 스크롤 + 하단 `#jr-start-actions` 고정)  
  → 난이도·시작 코인 라디오 선택  
  → “시작” Spec 버튼  
  → `runnerStartRound` 액션 → `phase = playing`  
  → UN-UI-002 `#game-viewport` 활성 + 숨김 로비 + `#play-hud` 표시

### 2. 플레이 (정상)

달림  
  ├── 픽업 배치 회피/수집 → 점수·픽업 카운터 갱신 (구현)·HUD 스토어 refresh  
  └── 장애물 회피 실패 → `hit_obstacle` 경로  

### 3-A. (선택 디자인) 타임 초과 종료 레포 포함 시

`tune`/루프에 시간 드레인이 있면 → UN-ANI-004 유사 연출 허정 → 게임 오버

### 3-B. 충돌 게임 오버

AABB 검출  
  → UN-ANI-003 tumble 요약  
  → `phase = gameover` 및 `#gameover-screen` 에 사유 줄

### 4. 게임 오버 후

결과 줄·코인 줄 갱신  
  → “다시하기” Spec 버튼 `runnerReturnToLobby` 로 idle 복귀

---

## Mechanics in Depth (명령 층 + 선언 결과만 요약)

### 선언 레이어(json-render) 패치 허용 가장자리

카피 줄이나 상태 스냅을 바꿀 거면 순서 고정:

`runnerCatalogOperationalUi.ts`(및 진입점 `unsanityRunnerCatalog.ts`) 새 컴포넌트 props 정의 → `GameJsonHud` 등 registry JSX 구현 → Spec 트리에 type 추가 → 카탈로그 validate 실패하면 DEV 에서 즉시 전체 로드 깨져 빠르게 된다는 뜻.

카탈로그만 추가하고 **`runnerCatalogStubsAndMaterials.ts`** 스텁에 두는 타입은 registry 없이 연구·문서용일 수 있다(통합본 **§4.2·§4.3**).

카탈로그 이름만 있고 registry 미구현이면 조용히 렌더 null — 카탈로그 과목은 많지만 구현이 적을 수 있다.

### 점프

```
trigger: Space / tap
preconditions: grounded && phase playing
effects: 적용 속도 규약 — UnsanityGame 내부
```

### collect_pickup 요약

```
preconditions: AABB overlap 플레이어 ∩ 미수거 픽업
effects:
  플래그 true
  score / counters — 구현 라인 근처
```

### hit_obstacle

```
preconditions: AABB 장애
effects: 게임 오버 페이즈, 사유 DOM 갱신
```

### speed_loop 및 속도 증폭

밸런스·속도 곡선의 **근거**는 `04_balance_tune`·`07_time_rules` 및 `UnsanityGame` 구현이 우선이다. 과거 초안의 단일 공식 문자열만 믿지 말고 시트 교차 확인.

### spawn 독립성

장애 스폰과 픽업 스폰은 **독립**으로 유지하여 “무조건 죽음 겹침구간만” 형성되는 안티패턴 줄인다 (`Anti-Patterns` 참고).

---

## DOM Elements — 재현 채크리스트 표

실제 존재·이름 깨면 부트 또는 게임 시작 경로 깨진다:

| ID / 선택자 | Role |
| ----------- | ---- |
| `#game-viewport` | 메인 렌더러 마운트 (Three) |
| `#start-screen` | 로비 |
| `.start-screen-body` | 로비 스크롤 본체 |
| `#jr-lobby-spec-header` | 로비 제목·보조설명 Spec 마운트 |
| `#jr-lobby-spec-starter` | 시작 코인 설명 줄 Spec 마운트 |
| `input[name="balance-tier"]` | 티어 값 — 이름 바꿀려면 클래스 질의 같이 교체 필수 |
| `input[name="starter-coins"]` | 시작 코인 — 상동 |
| `#jr-start-actions`, `#jr-restart-actions` | 카탈로그 액션 버튼 |
| `#play-hud` 숨김 토글 | 페이즈에 따름 |
| `#jr-hud-widgets` | 전체 플레이 HUD 렌더 루트 |
| `#gameover-screen` 및 하단 재시작 액션 |
| `#gameover-reason`, `#final-score`, `#final-coin` | 종료 카피 업데이트 |

---

## Animation Specifications (UN-* 내부 코드 — 문서 레벨 이름)

예전 MCU 접두 호환 종료 후 **프로젝트 전용 접두**:

| ID        | 트리거 | 규격 요약 |
| --------- | ------ | --------- |
| UN-ANI-001 | 점프 | 속도 초기값 |
| UN-ANI-002 | 무적 상태 | 무적 HUD 리본·타이머 연계 |
| UN-ANI-003 | 종료 회전 표현 등 | 결과 화면 전환 시간 |

시각 디테일 CSS 는 `src/style.css` 와 카탈로그 JSX 에 실제 존재.

---

## Content Guidelines — CSV 교차

코인 속성·별 픽업: `game_data/03_item_pickup.csv`.

장애 템플릿: `02_object_obstacle.csv`.

글자 줄: `05_text_strings.csv`.

밸런스 시간 룸: `04_balance_tune.csv`, `07_time_rules.csv`.

**경로 상수 수정은 무조건** `runnerDataPaths.ts` + 카탈로그 literal + 레지스트리 연구 Spec 동시 패치.

---

## LocalStorage 스키마 (실 코드 기준)

```
unsanity_game_state → {
  best_score: int,
  total_coins_ever: int
}
```

런 상태는 저장하지 않는다.

---

## 제작 방법 — 기획·디렉터(MD) 요약

통합본 `docs/JSON_RENDER_Unsanity_Guide.md` **§10** 에 절차·체크리스트·AI 공유 블록 전문이 있다. **§7.7** 에 선언 레이어만 검증하는 실행 체크리스트가 있다. **§9.3** 에는 하이브리드 UI·연구 Phase 잔여 과제 등 **아직 완전하지 않은 점** 표가 있다. 여기에는 **헌법 쪽 최소 줄**만 둔다.

1. **처음부터 시트부터 쪼개지 않는다** — 한 판 루프·플레이어가 손댈 수 있는 수치·문구부터 정한 다음, 시트는 **역할 하나 = 시트(또는 탭)** 단위로 나눈다. 과분할은 나중으로 미룬다.  
2. **새 CSV·컬럼은 한 세트로** — `runnerDataPaths.ts`(ORDER/MANIFEST/경로) → `pick`/`buildRawGameDataSheets` → `loadGameData` 파서 → (재료로 쓰이면) 카탈로그·연구 번들 Spec 의 **동일 리터럴**. 줄 하나만 새면 검증 또는 부트에서 터진다.  
3. **명령 vs 선언 분리 유지** — 월드·충돌·스폰은 `UnsanityGame`; 보이는 카피·HUD·버튼은 카탈로그·Spec·`hudExternalStore`·브리지. `/hud/…` 는 **경로·Spec·pushHudChrome** 동시 수정.  
4. **헌법 + 통합본 항상 둘 다** — DOM·데이터 파이프라인·선언 경계를 바꾼 뒤 본 파일과 `docs/JSON_RENDER_Unsanity_Guide.md` 를 같이 갱신한다(통합본 §1.1a).  
5. **“다 Spec이지?”라고 가정하지 않는다** — 로비 라디오 등 **HTML+엔진 혼합**·Phase 4 미착수·대부분 Spec은 TS 인라인 등은 통합본 **§9.3** 과 **§6** 을 본다.

---

## 선언 레이어(json-render) — 최근 들어간 것 (엠디·디렉터 요약)

- **재료 로딩 줄기 표기** — `loadGameData.ts` 파일 머리에 `runnerDataPaths`(시트 순서) → `RawGameDataSheets` → `LoadedGameData` 어떤 필드로 가는지 **한 표**가 있다. 카탈로그 재료(`RunnerDataMaterial_*`)와 같이 보면 “CSV가 무엇이 되는지” 추적하기 쉬움.
- **로비 starter 줄 = 외부 Spec JSON POC** — `src/game_specs/lobby_starter_hint.spec.json` 이 **트리(구조)** 를 갖고, 문장 문자열은 **런타임에** `game_data/05_text_strings.csv` (`txt_starter_bonus_blurb` 근처)에서 넣음. 깨진 JSON은 콘솔 경고 후 **인라인 폴백**으로 동작함.
- **React 카피 id 묶음** — `src/game/textCopyIds.ts` 의 `TEXT_COPY_IDS` + `lineOr` 로 로비 헤더·starter·HUD 라벨·시작·다시 버튼 문자열을 **항상 같은 `05` 행과 맞춤** 짓게 했음(매직 문자열 줄임).

통합본 **§4**(카탈로그 파일 분리 의도·컴포넌트 선정 규칙·파일 표)·**§7.7**(테스트)·**§8** 디렉터리 줄에 같은 파일 이름이 더 자세히 붙어 있음.

---

## 선언 레이어 — 실행해서 확인하기 (테스트 체크리스트)

`npm run dev` 후 브라우저에서 아래 순서로 보면 **JSON Render 쪽이 실제로 먹는지** 거의 검증된다.

| 하고 볼 일 | 무엇이 바뀌면 성공 신호인가 |
|-----------|---------------------------|
| `src/game_specs/lobby_starter_hint.spec.json` 저장(예: `visible` 또는 `children`만 살짝) 후 새로고침 | 로비 **시작 코인 안내 블록** 구조 반영 또는, JSON 깨졌으면 브라우저 **개발자 콘솔 경고** + 문구는 폴백으로 유지 |
| `game_data/05_text_strings.csv` 에서 통합 헌법 카피 id 한 줄 수정(예: `txt_overlay_title`, `txt_starter_bonus_blurb`, `txt_btn_start`) 저장 후 새로고침 | 로비 헤더·starter·버튼 라벨이 **같이** 따라 바뀜(DOM 의 `data-text-id` 줄은 해당 id 수정 시 따로 따라감 — `bootstrapDomTexts`) |
| 플레이 진입 후 점수·시간·무적 리본 확인 | HUD가 **업데이트**되면 Spec 의 `$state` + `pushHudChrome` + `GameJsonHud` 가 연결된 것 |
| 시작 / 다시하기 클릭 | 명령형 페이즈 전환까지 가면 Spec 버튼 → `gameControlBridge` → `UnsanityGame` 줄이 된 것 |

**플레이 본편**(점프·충돌·스폰)은 계속 명령형 — 위는 **선언 레이어만** 겨냥한 확인 목록임.

---

## Anti-Patterns [CRITICAL]

**[선언층]** HUD `$state` 경로 문자열 수정 시 카탈로그·Spec·명령 `update` 세트 미동반 시 화면·검증 분열.

**[선언층]** 연구 Dev 검증 켠 상태에서 카탈로그 validate 필수 필드 깨면 앱 진입 차단 된다(`visible` 등).

**[선언층]** 카탈로그 액션 이름과 `overlayActionHandlers` 키 문자열 불일치 → 버튼 무동작.

**[THREE]** 플레이 월드를 Canvas fillRect 레벨 로만 깎지 말 것.

**[THREE]** PerspectiveCamera 무단 교체 근사 망가뜨리기 가능.

**[DOM]** 라디오 `name` 과 UnsanityGame selector 분리.

---

## 문서↔코드 동기 헌법

구조 수정 시 **항상**:

1. 레포 수정  
2. 본 게임 헌법 `GAME_unsanity_runner.md`  
3. `docs/JSON_RENDER_Unsanity_Guide.md`

세 가지 줄을 같이 새로 채워야 새 혼란이 생기지 않는다.

