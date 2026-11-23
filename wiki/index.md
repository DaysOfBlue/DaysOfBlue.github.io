# Wiki 인덱스

원자료를 읽고 정리한 지식과 프로젝트 결정을 모았다. 원자료의 처리 상태는 [출처 목록](../raw/manifest.json), 변경 순서는 [작업 로그](log.md)를 참고한다.

## 출처

- [LLM Wiki 인사이트](sources/llm-wiki.md): 제공된 패턴의 요약, 적용 범위와 비판적 검토
- [포트폴리오 저장소 요청](sources/portfolio-brief.md): 사용자가 확인한 목표와 제공되지 않은 정보
- [홈페이지 기본 틀 요청](sources/homepage-scaffold-brief.md): 디자인을 제외한 로컬 홈페이지 구성 범위
- [영역 분리와 감상문 요청](sources/section-separation-brief.md): 프로젝트·기술 공부·취미 감상문을 구분하는 기준
- [고정 양식 삭제 요청](sources/source-led-writing-brief.md): 원문을 읽고 각 글의 구성을 따로 정하는 작성 방침
- [기존 21편 재작성 요청](sources/study-rewrite-brief.md): 보관 원문을 다시 읽고 원문별 흐름을 기존 글에도 적용
- [자기소개와 분야 페이지 요청](sources/home-navigation-brief.md): 메인 소개 우선 배치와 기술·취미 전환
- [CV 작성법과 소개 페이지 양식](sources/kisoo-cv-writing.md): 대학원 지원용 글의 참고 범위와 웹 소개용 빈 양식

## 개념

- [누적 지식과 공개 콘텐츠](concepts/compiled-knowledge.md): 원자료·wiki·공개 글의 역할과 출처를 보존하는 방법

## 프로젝트

- [Homepage](projects/homepage.md): 저장소의 현재 상태, 실제 구성 범위와 후속 작업

## 결정

- [0001: 자료와 공개 콘텐츠의 경계](decisions/0001-content-boundaries.md): 원본 보존, 공개 목록, 도구 선택을 미룬 이유
- [0002: 정적 홈페이지 기본 틀](decisions/0002-static-skeleton.md): 일반 HTML, 공개 목록 기반 빌드와 표현 범위
- [0003: 영역 분리](decisions/0003-separate-sections.md): 분류·경로를 구분하고 홈과 목록에 적용
- [0004: 원문에 맞춘 개별 글쓰기](decisions/0004-source-led-writing.md): 고정 양식을 없애고 원문별로 본문 구성 결정
- [0005: 메인과 분야 페이지 연결](decisions/0005-home-navigation.md): 소개를 먼저 표시하고 기술·취미 미리보기와 독립 페이지 연결

## 게임·AI 자료 수집 상태

`raw/game-ai/`의 자료 모음 7개는 출처 탐색 자료로 읽었다. 웹 원문을 별도로 보관하고 기술 공부 글 21편을 작성했다. 원문 파일을 확보하지 못한 UGK 포럼, 통독하지 않은 PDF와 시청하지 않은 영상은 [수집 결과](../docs/game-ai-ingestion.md)에 구분했다. 원문 독해를 독립 재현 검증으로 취급하지 않는다.

## 게임·AI 원문 출처

- [Mojo Ski 제작 회고](sources/ai-prototype-playability.md)
- [Android XR 도구와 이식 검증 범위](sources/android-xr-porting-checklist.md)
- [DIRT 원문](sources/depth-based-live-view-synthesis.md)
- [AnyGameRenderer 원문](sources/entity-consistent-rendering.md)
- [Wizard v2의 상태와 생성 표현](sources/explicit-state-generative-rendering.md)
- [FLUX 추론 최적화 원문](sources/flux-inference-speed-quality.md)
- [게임·AI 자료 모음의 출처 추적](sources/game-ai-digests.md)
- [Godot CPU 원문](sources/godot-cpu-resource-lifetime.md)
- [Godot 베타 원문](sources/godot-upgrade-regressions.md)
- [Unity MDI README 원문](sources/gpu-driven-indirect-drawing.md)
- [OCTAVE의 정적 요구사항 평가](sources/html5-game-capability-evaluation.md)
- [NVIDIA 로컬 AI와 게임 자원 예산](sources/local-ai-game-budgets.md)
- [GARP의 비동기 NPC 설계](sources/local-npc-async-decisions.md)
- [MatrixSplat 원문](sources/matrixsplat-gpu-parallelism.md)
- [Neural Render Proxies 원문](sources/neural-lighting-proxies.md)
- [RenderDoc·AI 디버깅 원문](sources/renderdoc-ai-debugging.md)
- [SOL-AVES 렌더링 최적화 취재 원문](sources/sol-aves-rendering-budget.md)
- [UnityBench-Mini3D 엔진 마일스톤 검사](sources/unity-agent-milestone-tests.md)
- [Unity 튜닝 책 공개 보도](sources/unity-performance-announcement.md)
- [Unity 튜닝 책의 확인 범위](sources/unity-performance-reading.md)
- [Unreal MegaJam Preview 원문](sources/unreal-ai-workflow.md)
- [Epic 렌더링 로드맵 원문](sources/unreal-rendering-roadmap.md)
- [WorldDraft 원문](sources/worlddraft-structure-appearance.md)


## 2026-11-19 게임 개발·AI 자료

- [Three.js 기기별 렌더링 파이프라인과 G-buffer 설계](sources/2026-11-19-threejs-pipeline-tiers.md)
- [긴 컨텍스트 AI 추론: Sparse Attention의 진짜 병목 찾기](sources/2026-11-19-sparse-attention-co-design.md)
- [Cosmos: 생성·검증·라벨링을 연결하는 AI 학습 데이터 파이프라인](sources/2026-11-19-cosmos-data-factory.md)


## 2026-11-20 게임 개발·AI 자료

- [Gaussian Evil: PlayCanvas에서 3DGS 장면을 실시간으로 다시 비추기](sources/2026-11-20-gaussian-evil.md)
- [Rust로 스트리밍 AI 도구 호출 파서 만들기](sources/2026-11-20-rust-tool-call-parser.md)
- [Stride 4.4.3: 렌더링 API별 셰이더 컴파일 시간 비교](sources/2026-11-20-stride-443-shader-compile.md)


## 2026-11-21 게임 개발·AI 자료

- [Superfluid: 여러 로컬 장비에 LLM 요청을 나누는 방법](sources/2026-11-21-superfluid-fleet.md)
- [세가의 Unreal Engine Horde 운용기: 제출 전에 빌드 깨짐 잡기](sources/2026-11-21-sega-unreal-horde.md)
- [CORTAO: 깊이·법선으로 원형 가림막을 만들어 실시간 AO 계산하기](sources/2026-11-21-carbon-cortao.md)


## 2026-11-22 게임 개발·AI 자료

- [NINJA GAIDEN 4의 120 FPS: 에셋 예산과 프레임 계측을 같이 관리한 사례](sources/2026-11-22-platinumgames-ninja-gaiden-4-120fps.md)
- [AGSR: 한 장면을 여러 Gaussian 폭으로 렌더링해 초해상도 복원](sources/2026-11-22-agsr-gaussian-splatting-super-resolution.md)


## 2026-11-23 게임 개발·AI 자료

- [Spartan Engine: 반사 디노이저를 RELAX로 바꿀 때 함께 손본 입력들](sources/2026-11-23-spartan-relax-specular.md)
- [FAB: 영상에서 사람의 3D 자세와 접촉을 추정하는 방법](sources/2026-11-23-fab-body-estimation.md)
