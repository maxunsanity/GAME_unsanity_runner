# Unsanity 선언형 저작 가이드 — JSON Render 패턴과 작업 통합본

> **이 문서 하나**가 아래 전부를 담는다.  
> **(가)** 왜 JSON Render 스타일로 UI·재료 레이어를 묶었는지 **이론**  
> **(법)** 카탈로그·Spec·상태·액션이 무엇인지 **개념**  
> **(다)** 이 레포의 **폴더·파일** 대응  
> **(라)** 디렉터·유지보수 에이전트와의 **대화 속에서 어떤 문제가 나오고 어떻게 코드로 처리했는지** 연대기  
> **(마)** 예전 분리되어 있던 **연구 Phase(Declarative authoring)** 진행 상태  
>
> 예전 분리 파일: ~~`Declarative_Game_Authoring_Research.md`~~ → 본 통합본으로 폐기.  
> 독자: 기획·디렉터는 **§10 제작 방법론**·**§9.3 미완 한계**·**§7.7 실행 테스트**·**§4.2 카탈로그 선정 규칙**·헌법 `GAME_unsanity_runner.md` 를 우선, 구현 담당은 **§8 디렉터리 표**·저장소 경로를 우선 본다.  
> **부트 순서·세션 넘김·빌드/zip 스크립트표**까지 한 번에 묶어두면 **`docs/DEVELOPMENT_STRUCTURE.md`** 가 이 통합본보다 빠른 진입점이다.

---

## 1. 서론: 무엇을 하려고 했는가

### 1.1 배경

- **플레이·금지 규약·다른 에이전트에게 줄 최소 헌법**은 레포 루트 **`GAME_unsanity_runner.md`** 를 본다 — 본 가이드는 **구현·카탈로그·연구**에 치중한다.
- **Unsanity**는 **Vite + TypeScript + Three.js** 런너 게임이다. DOM으로 오버레이·HUD, CSV로 발란스·문자열·테이블 데이터를 읽는다.
- **[json-render](https://github.com/vercel-labs/json-render)** 샘플(Next·R3F 예제 등)은 **“장면·UI 조각을 Spec으로 두고, 카탈로그로 허용 타입을 정한다”**는 **사고방식** 참고용이다. 엔진 전체를 포크하는 목적은 아니다.
- **방침:** 플레이 코어(Three·`UnsanityGame` 루프)는 **명령형**으로 유지하고, **UI·재료·검증 경계**는 **선언적 층**으로 넓혀 간다.

### 1.1a 문서와 코드 동기화 — 왜 레포 안에서 강하게 말할까

구조나 마운트·스토어·경로(SSoT)를 바꾼 뒤에 마크다운 초안만 옛날 그대로 두면, 사람이건 다른 AI건 **항상 레포와 다른 안내**를 따르게 된다.

- 구조 변경 → **`GAME_unsanity_runner.md`**(헌법·DOM·불변 조건)·**`docs/JSON_RENDER_Unsanity_Guide.md`**(선언 레이어·폴더 지도)·**양쪽을 같이** 고칠 것. 하나만 새면 새로 헷갈린다.

- 헌법·가이드를 **실제 레포와 맞춰 둔 이후 버전이** 초안만 있을 때보다 **항상 우위**이다. 줄이 주는 게 “정답 패치 자동 생성”까지는 아니고, **헛수정·헛패스를 줄여 주는 게 효과**다.

---

### 1.2 핵심 아이디어 (세 줄)

1. **카탈로그(Catalog)** — 쓸 수 있는 **부품 이름**과 **props 규칙(Zod)** 을 모은 메뉴판.  
2. **Spec** — 그 부품만으로 **조립 순서**를 적은 주문서(플랫 `elements` 트리).  
3. **상태(State)** — Spec이 읽는 값 상자. `{ $state: "/hud/…" }` 가 “상자에서 꺼내와”.

---

## 2. 구조를 조금 더 풀어서

### 2.1 레이어 다이어그램

```
┌─────────────────────────────────────────────────────────┐
│  defineCatalog(schema, { components, actions })         │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  Spec — root, elements{ id → type, props, children, on } │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  State — JSON Pointer 스타일 경로 (예: /hud/coinStr)       │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  React: StateProvider + Renderer + registry              │
└─────────────────────────────────────────────────────────┘
```

- **스키마:** `@json-render/react/schema`  
- **렌더러:** `Renderer` + **registry**가 `type` → JSX  
- **액션:** 카탈로그 `actions` + Spec `on.press` 등 → 핸들러

### 2.2 Zod

카탈로그 `props`는 `z.object({ … })` 로 고정해 타입·AI·툴에 “허용 필드”를 알려 준다.

### 2.3 샘플 엔진과의 관계

Unsanity는 **Vite + 클래스 기반 Three** 를 유지한다. 가져온 것은 **카탈로그·Spec·스토어·액션** 개념이다.

### 2.4 연구용 개념 표 — UI vs “재료(Material)”

| 개념 | UI에 가깝게 | 테이블(재료)에 대응 |
|------|-------------|---------------------|
| **Catalog** | 허용 UI 타입·props | 허용 **시트 종류**·경로 리터럴·역할 태그 |
| **Spec** | 화면 `elements` 트리 | (연구) 재료 번들을 Spec 조각으로 선언·검증 |
| **State** | HUD `$state` | 플레이 세션 값·튜닝 (일부 실험) |
| **Action** | 버튼 → 게임 브리지 | 이벤트·경계 규격 (실험) |

**연구 명제(한 줄):** “CSV 파일 경로를 **카탈로그에 등재된 재료 컴포넌트**가 가리키는 선언 묶음으로 말할 수 있는가?”

---

## 3. 데이터(CSV)와 “재료(Material)”

- `game_data/*.csv` 는 **재료 시트**. 카탈로그에는 **행 단위**가 아니라 **시트 단위**(경로·역할)를 올린다.  
- **파싱·튜닝 합성**은 `loadGameData.ts`·`gameTune.ts` 등 **TS**가 담당.  
- **SSoT:** `src/game/runnerDataPaths.ts` (`RUNNER_DATA_CSV_PATHS`, `ORDER` 등).  
- 카탈로그는 동일 경로를 **Zod literal**로 묶어 드리프트를 줄인다.

---

## 4. 이 레포의 카탈로그·액션

### 4.1 왜 카탈로그 파일을 나누었나

한 파일에 **운영 UI 타입**과 **연구용 시맨틱 이름**, **CSV 재료 스키마**를 모두 넣으면 다음이 반복된다.

- 카탈로그에 이름만 있는 타입을 **전부 구현된 줄**로 오해한다 → registry 없음 버그·헛패치.
- HUD 바인딩 규칙(`$state`)을 고칠 때 **여러 블록을 한 번에** 못 고친다 → 스키마 파편화.
- 재료 경로 리터럴은 **SSoT·파서·연구 Spec**과 세트인데, UI props 와 같은 파일에 있으면 **책임이 섞여** 리뷰가 어렵다.

그래서 **역할별 파일**로 나누고, **`unsanityRunnerCatalog.ts`** 는 **`defineCatalog` 한 번으로 합치는 진입점**만 담당한다 — 여기서는 **운영 UI 객체**와 **스텁·재료 객체**(registry 없음) **두 덩어리**만 병합한다. 외부 코드는 계속 이 진입점만 import 하면 된다.

### 4.2 카탈로그 컴포넌트 선정 규칙

아래를 만족할 때만 **운영 UI 카탈로그**(`runnerCatalogOperationalUi.ts`) 후보로 올린다. 그렇지 않으면 **재료**로만 두거나 **`runnerCatalogStubsAndMaterials.ts`** 의 스텁 섹션에 이름만 남긴다.

1. **선언 레이어 경계** — Three 루프·충돌·스폰·페이즈 본체는 올리지 않는다. **DOM 오버레이**(HUD·로비 카피·작은 버튼) 또는 **CSV 시트 단위 재료**만 카탈로그 후보다.
2. **Spec으로 말 가능한가** — `type` / `props` / `children` / `visible` 패턴으로 조립 가능하고, 매 프레임 게임 규칙 전체를 Spec에 넣지 않는다. 동적 값은 **`$state`** 나 명령형 쪽 **`pushHudChrome`** 등과 짝을 이룬다.
3. **한 컴포넌트 = 한 UI 의미** — 거대 패널 하나보다 **작은 블록** 여러 개가 유지보수·검증에 유리하다.
4. **이름 규칙** — 재료는 `RunnerDataMaterial_*` + **경로 리터럴** 고정. 화면 부품은 **`RunnerHud*`·`RunnerLobby*`** 등 registry 키와 혼동 없는 이름.
5. **Zod props** — 재료는 **좁은 리터럴**. HUD 동적 필드는 **`hudBindProp`** (`/hud/` `$state` 또는 초깃값 리터럴)로 허용 범위를 명시한다 — `z.any()` 남발 금지.
6. **registry 세트** — 운영 타입은 **`GameJsonHud`·로비·오버레이 registry** JSX 와 **같은 패치**로 추가한다. 의도적으로 비우는 타입만 **`runnerCatalogStubsAndMaterials.ts`** 스텁 쪽에 둔다.
7. **액션은 얇게** — 버튼 한 번에 **코어 메서드 한 번** 정도 (`runnerStartRound` 등). 복잡한 밸런스 계산은 명령형·CSV 쪽에 둔다.

### 4.3 파일·역할 표 (운영 규칙 요약)

| 구역 | 파일 | 역할 |
|------|------|------|
| **진입점** | `src/catalog/unsanityRunnerCatalog.ts` | `defineCatalog` — **운영 UI**·**스텁·재료** 두 객체를 **병합**해 단일 카탈로그 인스턴스 |
| **운영 UI** | `src/catalog/runnerCatalogOperationalUi.ts` | 로비·HUD·`RunnerHudMButton` — **`GameJsonHud`·로비·오버레이 registry** 에 실제 연결되는 타입만 (**§4.2 규칙 1·6**) |
| **스텁·재료** | `src/catalog/runnerCatalogStubsAndMaterials.ts` | **`RunnerDataMaterial_*`** · **`RunnerGameDataCsvPackage`** (경로 리터럴, **§4.2 규칙 4·5**) + **`RunnerGameplay`**·**`RunnerWorld`** 등 시맨틱 스텁 — **런타임 JSX registry 없음** (**§4.2 규칙 6** 후반) |
| **공통 Zod** | `src/catalog/runnerCatalogShared.ts` | `hudBindProp`·스텁용 `bindRefProps` 등 — HUD 필드는 `{ $state: "/hud/…" }` 또는 초깃값 리터럴만 허용 (**§4.2 규칙 5**) |

**운영 규칙 요약:** 새 DOM 부품을 **운영** 카탈로그에 넣었으면 **같은 패치로 registry JSX**를 넣는다. 재료 타입만 추가할 때는 **경로 세트**(`runnerDataPaths`·`runnerDataMaterialRegistry`·연구 Spec)까지 묶는다. **이름만**(스텁) 필요하면 **`runnerCatalogStubsAndMaterials.ts`** 의 스텁 쪽에만 추가하고 registry는 비워 둔다.

### 4.4 액션

| 이름 | 의미 |
|------|------|
| `runnerStartRound` | 로비 → 한 판 시작 |
| `runnerReturnToLobby` | 게임오버 → 로비 |

`gameControlBridge.ts` 가 실제 `UnsanityGame` 훅과 연결한다.

### 4.5 slots

일부 컴포넌트는 스키마상 `slots: []` 또는 `['default']` 필요(json-render 규약).

---

## 5. 대화·결정에서 이어진 작업 연대기

아래는 **협업 대화에서 반복된 요청·증상**이 **어떤 코드·파일 변경**으로 이어졌는지 요약한 **과정 기록**이다. (시간 순은 대략적이며, 목적은 “왜 이렇게 되었는지” 추적이다.)

| 주제 | 대화·증상 | 결과(코드·파일) |
|------|-----------|----------------|
| 브랜딩 | 한글·영문 혼용 | **Unsanity** 등 표기 통일, `05_text_strings.csv` 등과 맞춤 |
| 로비 UI | 제목·난이도·코인 줄, 밸런스 | HTML/CSS·튜닝 CSV 반복 조정 |
| 공중 코인 | 안 보임 | 스폰 가중·높이·오프셋 등 `UnsanityGame`·픽업 CSV 쪽 조정 |
| 구조 이론 | json-render를 UI 너머로? | **재료=카탈로그 슬롯** 주장 → Phase 1·2 연구 코드로 정착 |
| Phase 1 | 재료·경로 드리프트 방지 | `runnerDataMaterialRegistry.ts` + DEV `assertDeclarativeMaterialsMatchSsoT()` |
| Phase 2 | 패키지도 Spec처럼 검증 | `runnerGameDataPackageResearchSpec.ts` + `catalog.validate()` 부트 |
| 로비 글자 없음 | 박스만 보임 | `parseTextStringsCsv` **BOM·값 내 쉼표** 안전 파싱; 라디오 **label/input 분리**(`for`/`id`); 한글 **폰트 폴백** |
| DEV 흰화면·스크립트 중단 | 콘솔 ZodError | json-render 스펙에 **`visible` 필수** → 연구 Spec에 `visible: true`; `RunnerGameDataCsvPackage`에 **`slots: []`**; `locale` 정규화 |
| 시작 버튼 | 화면 아래로 밀림 | `#start-screen` 을 **본문 스크롤** + **`#jr-start-actions` 하단 고정** (`start-screen-body`) |
| 게임오버 | 동일 우려 | `gameover-screen-body` + 하단 `jr-restart-actions` 동일 패턴 |
| 검증 | 연구 Spec과 SSoT 키 | `assertResearchPackageSheetManifestAligned()` |
| 완화 | 로컬에서만 부트 살리기 | `VITE_RELAX_RESEARCH_VALIDATE=1` 시 validate 실패해도 경고 후 계속 |
| 연구 스텝 | 행→시맨틱 예시 | `semanticAuthoringExercise.ts` + DEV 로그 한 줄 |
| 선언 UI 확장 | 로비 카피도 Spec | `GameLobbyCopySpec.tsx` — `RunnerLobbyHeroTitle`, `RunnerLobbyCopyLine`; `index.html` 에 `#jr-lobby-spec-header`, `#jr-lobby-spec-starter` |
| HUD와 State | 라벨도 `$state`로 | `hudExternalStore`에 `lblCoinPrefix` 등 + `GameJsonHud`에서 주입; 플레이 Spec의 코인·HI·타이머·무적 props 갱신 |
| 문서 | 두 개 헷갈림 | **본 파일로 통합** (구 Research + 구 Guide) |

---

## 6. 연구 Phase 진행 상태 (표)

각 Phase는 **작게 끝낼 것 / 이론 / 코드 / 검증**을 한눈에 본다.

### Phase 1 — 재료 레지스트리 + SSoT 정합 ✅

| 항목 | 내용 |
|------|------|
| 목표 | `RunnerDataMaterial_*` 개념과 `runnerDataPaths` 경로가 **레지스트리 한 줄로** 동기화되는지 강제 |
| 코드 | `src/game/runnerDataMaterialRegistry.ts` — DEV 에서 불일치 시 throw + 콘솔 요약 |

### Phase 2 — 재료 패키지 Spec 스텁 + 카탈로그 검증 ✅

| 항목 | 내용 |
|------|------|
| 목표 | `RunnerGameDataCsvPackage`를 **Spec 한 덩이**로 두고 부팅 시 `validate` |
| 코드 | `src/research/runnerGameDataPackageResearchSpec.ts`, `validateResearchSpecs.ts`; 시트 키·경로 추가 검사 `assertResearchPackageSheetManifestAligned()` |

### Phase 3 — “렌더 = 로더 출력” 명시 🔶 진행 중

| 항목 | 내용 |
|------|------|
| 목표 | 재료 컴포넌트의 **출력물**이 화면이 아니라 `LoadedGameData`·`TuneBook` 등임을 코드·문서에 **대칭**으로 고정 |
| 현황 | 로비 정적 카피·플레이 HUD 라벨이 **Spec/`$state` 층**으로 옮겨 감 (**5절 참고**). **`loadGameData.ts` 파일머리**에 ORDER→Raw→`LoadedGameData` 대응표 추가. `loadGameData`와 로더 헬퍼 **전용 헬퍼 모듈**은 **추가 여지** |

### Phase 4 — 패치 검증 POC ⏸

| 항목 | 내용 |
|------|------|
| 목표 | 외부에서 재료 패치가 들어올 때 **카탈로그 검증으로 거절**하는 경로 하나 |
| 코드 | 미착수 |

---

## 7. 구현 단계별 기록 (빌드·도입 순)

### 7.1 환경

- React, `@vitejs/plugin-react`, `@json-render/core`, `@json-render/react`, `zod`  
- 엔트리 `src/main.tsx`, 부트스트랩 `src/bootstrapGame.ts`

### 7.2 카탈로그

- **`unsanityRunnerCatalog.ts`** — 병합 진입점 (`defineCatalog`)  
- **`runnerCatalogOperationalUi.ts`** · **`runnerCatalogStubsAndMaterials.ts`** · **`runnerCatalogShared.ts`** — §4.3 표 · 선정 규칙 §4.2

### 7.3 HUD와 스토어

- `hudExternalStore` (`createStateStore`) — **동적 수치**(점수·타이머 등) + **정적 라벨**(코인 접두, HI, 타이머 헤더, 무적 접두/접미)  
- `UnsanityGame.pushHudChrome()` 이 수치를 갱신; 라벨은 `GameJsonHud` 마운트 시 `update`  
- `GameJsonHud.tsx` — `playHudSpec` + registry

### 7.4 오버레이

- `GameOverlayActionButtons.tsx` — 시작 / 다시하기 작은 Spec + 액션  
- `GameLobbyCopySpec.tsx` — 로비 상단·시작 코인 안내 문구 Spec (라디오 그룹은 HTML 유지, `UnsanityGame` 셀렉터 호환)  
- **로비 starter 한 줄** Spec 골격은 `src/game_specs/lobby_starter_hint.spec.json` + `lobbyStarterHintSpec.ts`에서 병합(텍스트는 런타임·`05` CSV).  
- React에서 쓰는 `text_id` 상수·규칙 요약: `src/game/textCopyIds.ts`

### 7.5 브리지·게임

- `gameControlBridge.ts` — 액션 → `UnsanityGame`  
- `UnsanityGame.ts` — Three 루프, `input[name="balance-tier"]` 등 **DOM 라디오** 읽기

### 7.6 마크업·레이아웃

- `index.html` — `#jr-hud-widgets`, `#jr-lobby-spec-header`, `#jr-lobby-spec-starter`, 라디오 그리드, `#jr-start-actions`, 게임오버 본문·`#jr-restart-actions`  
- `.jr-overlay-scene-shell { display: contents; }` — flex 깨짐 방지  
- `.start-screen-body` / `.gameover-screen-body` — **스크롤 본문**; `.jr-overlay-actions` — **하단 고정 액션 바**

### 7.7 실행해서 확인하기 — declarative 줄만 검증할 때

`npm run dev` 로 띄운 뒤, 아래만 해도 **카탈로그·Spec·State·브리지**가 한 줄로 붙었는지 대부분 확인된다. (Three 루프 자체 검증은 별개.)

| 시도 | 기대 결과 |
|------|-----------|
| `src/game_specs/lobby_starter_hint.spec.json` 편집 후 새로고침 | 로비 **`#jr-lobby-spec-starter`** 줄의 **레이아웃 트리** 반영 또는 JSON 깨졌으면 **`lobbyStarterHintSpec.ts`** 가 콘솔 경고 후 인라인 Spec 폴백 |
| `game_data/05_text_strings.csv` 에서 `TEXT_COPY_IDS`가 가리키는 `text_id`(예 `txt_overlay_title`, `txt_starter_bonus_blurb`, `txt_btn_*`) 수정 | `main.tsx` 경로 로비 헤더·starter·HUD 라벨·버튼이 **함께** 갱신 |
| 플레이 중 HUD 숫자·무적 줄 | **`$state`/hudExternalStore/`pushHudChrome`** 연결 정상 표시 |
| 시작·다시하기 | **`runnerStartRound` / `runnerReturnToLobby`** 까지 액션 브리지 동작 |

`index.html` 의 `[data-text-id]` 카피는 **`bootstrapDomTexts`** 경로 전용이다. React 선언 카피와 **동일한 `05` 행을 쓰게** 만들려면 해당 id 문자열 정합 유지한다.

---

## 8. 디렉터리 대응표 (빠른 참조)

| 개념 | 파일 |
|------|------|
| CSV SSoT | `src/game/runnerDataPaths.ts` |
| CSV → 데이터 | `buildRawGameDataSheets.ts`, `loadGameData.ts` (문자열 파서 `parseTextStringsCsv`) |
| 재료 레지스트리 | `src/game/runnerDataMaterialRegistry.ts` |
| 게임 루프 | `src/game/UnsanityGame.ts` |
| HUD Spec | `src/jsonRender/GameJsonHud.tsx` |
| 로비 문구 Spec | `src/jsonRender/GameLobbyCopySpec.tsx` |
| 오버레이 버튼 Spec | `src/jsonRender/GameOverlayActionButtons.tsx` |
| 액션 브리지 | `src/game/gameControlBridge.ts` |
| HUD 스토어 | `src/game/hudExternalStore.ts` |
| 카탈로그(진입) | `src/catalog/unsanityRunnerCatalog.ts` |
| 카탈로그 운영 UI | `src/catalog/runnerCatalogOperationalUi.ts` |
| 카탈로그 스텁·재료 | `src/catalog/runnerCatalogStubsAndMaterials.ts` |
| 카탈로그 공통 Zod | `src/catalog/runnerCatalogShared.ts` |
| 연구 Spec·검증 | `src/research/*.ts` |
| DOM 문구 주입 | `src/game/domTexts.ts` |
| React 카피 id (SSoT `05`) | `src/game/textCopyIds.ts` (`lineOr`) |
| 로비 starter Spec JSON | `src/game_specs/lobby_starter_hint.spec.json`, `src/jsonRender/lobbyStarterHintSpec.ts` |
| 엔트리 | `src/main.tsx`, `src/bootstrapGame.ts` |

---

## 9. 트레이드오프와 다음 단계

### 9.1 트레이드오프

- **번들:** React + json-render 로 용량 증가 — 필요 시 스플릿 검토  
- **카탈로그 ↔ registry:** 카탈로그에만 있고 registry 미구현 타입은 **선언·문서·AI**용으로 남을 수 있음  
- **createRoot 개수:** HUD + 로비 2 + 버튼 2 등 — 상위 Provider 합치기는 선택

### 9.2 자연스러운 다음 단계

- 난이도·시작 코인 **라디오까지** Spec/상태로 옮기려면 **엔진 읽기 방식**도 함께 설계  
- Spec을 **외부 JSON**으로 더 분리·로드(HUD 헤더 등)  
- **`loadGameData` 전용 얇은 헬퍼 모듈**(파일머리 표 보완)·Phase 4 패치 검증 POC

### 9.3 아직 완전하지 않은 점(실무 알림)

아래는 **실패 원인 줄이려고 적어 둔 것**이다. 세부 상태는 **§6 연구 Phase** 와 교차한다.

| 구역 | 상태·한계 | 비고 |
|------|-----------|------|
| **선언 레이어 범위** | 로비 **난이도·코인 라디오** 등은 여전히 **HTML + 명령형 셀렉터** (`UnsanityGame`)·Spec은 헤더·안내 카피·HUD·버튼 위주 **하이브리드** | §9.2 첫 줄 |
| **Phase 3** | 로더 출력 ↔ `LoadedGameData` 매핑을 **`loadGameData.ts` 파일머리 표**로 고정했으나 **`loadGameData` 전용 얇은 헬퍼 모듈**(코드 레벨 재사용)·본문까지의 **1:1 주석 라인 매핑**은 **추가 여지** | §6 Phase 3 |
| **Phase 4** | 외부 재료 패치 **카탈로그로 거절**하는 POC **미착수** | §6 Phase 4 |
| **카탈로그 vs registry** | **`runnerCatalogStubsAndMaterials`** 의 시맨틱 스텁 전체가 해당 — 운영 HUD/로비 타입만 registry 연결됨. 카탈로그 타입만 있고 JSX 없음 → 조용히 비표시 또는 혼란 | §4.2·§4.3·§9.1 |
| **Spec 배치** | **`lobby_starter_hint.spec.json` 한 조각 POC** 외에는 대부분 **TS 인라인** — 다른 화면·HUD JSON·핫 스왑 **`§9.2`** 과제 남음 |
| **DEV 부트 검증** | 엄격 검증 중 필수 필드 누락 시 **진입 차단**; 로컴 구제는 `VITE_RELAX_RESEARCH_VALIDATE=1` (**완화이지 목표 상태 아님**) | §5 테이블“완화” |
| **번들·React 루트** | 번들 무게·`createRoot` 다발 — 필요 시 정리 과제 | §9.1 |

요약하면, **플레이 코어는 명령형 단일 줄기**가 맞고, **선언·재료·검증 층은 단계적으로 올린 상태**라 “전부가 Spec 하나로 말 가능”까지는 안 왔다. 새 작업 들어오면 **표 위 줄부터 확인**하면 기대치 안 맞는 일이 줄어든다.

---

## 10. 제작 방법론 — 기획·테이블·코드·선언 UI (다른 프로젝트에도 이식 가능한 순서)

이 절은 **레포를 처음 보는 사람·다른 AI**가 순서대로 따라올 수 있게, 한 문서만으로 부족한 **작업 흐름**을 채운다. Unsanity는 **러너 예시**이고 아래 순서는 **장르 변경 시 재사용**(시트 스키마·플레이 코어만 갈음)된다.

### 10.1 문서 역할 — “한 파일만”과의 타협

| 문서 | 역할 |
|------|------|
| `GAME_unsanity_runner.md` | 게임 의도·DOM·금지·SSoT·json-render 만질 경계 (**헌법**) |
| 본 파일 | 카탈로그·Spec·재료·폴더 지도·연구·연대기·**이 절(제작 순서)** (**실무 가이드**) |

본 파일만 읽어도 대체로 된다. DOM·금지 사항 미세는 헌법을 **한 번** 교차하면 빈틈이 줄어든다. 새 에이전트에는 **두 경로를 같이** 붙이는 것을 권장한다.

### 10.2 기획의 첫 작업은 “테이블 잘게 쪼개기”가 아니다

1. **한 판의 루프** — 페이즈, 입력, 승/패, 핵심 재미 한 줄.  
2. **데이터로 뺄 것** — 자주 튜닝할 수치·문구·스폰 풀·티어.  
3. **시트 경계** — 시트 하나 = **하나의 책임**(장애 템플릿 / 픽업 / 발란스 / 로컬라이즈 등).  
4. **과분할은 나중** — 첫날부터 CSV가 많으면 경로·로더·카탈로그·검증만 커지고 기획은 더 헷갈린다. **필요해질 때** 새 시트로 분리한다.

### 10.3 CSV(재료) 추가·변경 시 세트

- **경로 SSoT** — `runnerDataPaths.ts` 의 `ORDER`·`MANIFEST`·`RUNNER_DATA_CSV_PATHS` 를 먼저 맞춘다.  
- **로더** — `buildRawGameDataSheets` 키와 `loadGameData` 파서가 **같은 키**를 읽는지 확인.  
- **카탈로그** — `RunnerDataMaterial_*`·연구 번들 Spec과 **동일한 경로 리터럴**. DEV 레지스트리·검증이 드리프트를 잡는다.  
- **문자열** — `05_text_strings.csv`·`bootstrapDomTexts`·(로비) Spec 카피가 **한 출처**를 보도록 정리.

### 10.4 명령형 코어 vs 선언층

- **Three·충돌·스폰·페이즈** → `UnsanityGame` 등 **명령형**.  
- **HUD·로비 카피·오버레이 버튼** → **카탈로그 + Spec + `$state` + 액션 브리지**.  
- `/hud/…` 경로·Spec 초기값·`pushHudChrome` 은 **한 세트**로 수정 (**§1.1a**).

### 10.5 신규 기능 체크리스트 (구현)

1. “데이터 / 코드” 구분 한 줄 메모.  
2. 새 시트: `runnerDataPaths`(ORDER·MANIFEST 등)·`pick`/`buildRaw`·파서 순으로 연결 확인.  
3. `npm run build` 또는 프로젝트 표준 검증으로 타입·부트 확인.  
4. 재료 카탈로그·연구 Spec 반영 후 DEV 실행.  
5. 구조 변경 시 **`GAME_unsanity_runner.md` + 본 문서** 둘 다 갱신.

### 10.6 다른 장르로 구조만 이식할 때

**남겨두기 좋음:** 경로 SSoT + 시트 재료 패턴 + 선언 가능 UI + DEV 정합 검증.

**무조건 갈음:** 플레이 코어 클래스·엔진 API·각 시트 컬럼·카탈로그 타입 이름.

이 레포는 **만능 템플릿**이 아니라 **패턴 레퍼런스**로 본다.

### 10.7 다른 AI용 복사 블록

```
Unsanity: Three 명령 코어 + DOM(json-render 카탈로그·Spec·hudExternalStore·gameControlBridge) + game_data CSV (SSoT runnerDataPaths.ts).
순서: (1) 한 판 루프 (2) 데이터화 대상 목록 (3) 시트는 책임 단위, 초기 과분할 금지 (4) 경로·로더·카탈로그·문서 동시 수정.
필독: docs/JSON_RENDER_Unsanity_Guide.md §10, GAME_unsanity_runner.md — DOM/구조 바꿨으면 두 문서 모두 갱신.
```

---

## 11. 결론

이 프로젝트는 json-render **엔진 포크**가 아니라, **카탈로그 · Spec · 상태 · 액션**을 **HUD·로비·오버레이·재료 경로**에 단계적으로 이식한 것이다. **Three 기반 플레이 본체**는 여전히 **명령형**이며, 선언 층은 **UI·데이터 슬롯·검증**을 맡는다.

통합본에 **이론·연구 Phase·연대기·디렉터리·§10 제작 순서**를 한 줄기로 두어, 이후 협업(사람·에이전트)이 같은 맥락에서 확장한다.

---

## 부록: 문서 변경 이력

- **2026-05-13:** `Declarative_Game_Authoring_Research.md` 내용을 본 가이드에 **통합**. **5절**에 대화 기반 작업 연대기 추가.  
- **2026-05-13 (이전):** Phase 1·2 기록, JSON Render 가이드 초안 별도 존재.  
- **통합 후:** 단일 원본 = 본 파일 (`docs/JSON_RENDER_Unsanity_Guide.md`).
- **2026-05-13:** **1.1a** — 문서·코드 동기화 강조(구조 변경 시 헌법+가이드 동시 수정, 효과 범위 명시).
- **2026-05-13:** **§10 제작 방법론** 추가(기획 순서·시트 세트·이식·AI 공유). 결론 → **§11**.
- **2026-05-13:** **§9.3** — 미완·하이브리드 UI·Phase 3·4·검증 완화 등 **아직 완전하지 않은 점** 표로 정리.
- **2026-05-13:** **외부 Spec POC** (`src/game_specs/lobby_starter_hint.spec.json`) · **`src/game/textCopyIds.ts`** 로 React 카피 id 묶음. **`loadGameData.ts`** 에 ORDER→Raw→`LoadedGameData` 파일머리 표 추가.
- **2026-05-13:** **§7.7** — 선언 레이어만 노리는 **실행 테스트 체크리스트** 추가.
- **2026-05-13:** 카탈로그 **역할별 분리** — `runnerCatalogOperationalUi`(registry UI) · **`runnerCatalogStubsAndMaterials`**(예전 `SemanticStubs`+`Materials` 통합: 재료·시맨틱 스텁) · `runnerCatalogShared` · HUD props **`hudBindProp`** (`/hud/` `$state` 또는 리터럴). §4.3 표.
- **2026-05-13:** §4.1 **파일 분리 의도** · §4.2 **컴포넌트 선정 규칙** 문단 추가.

*패키지 버전은 `package.json` 의 `@json-render/*`, `vite` 등을 본다.*
