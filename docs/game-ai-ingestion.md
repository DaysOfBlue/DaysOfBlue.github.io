# 게임·AI 자료 원문 수집 결과

2026-11-18에 기존 자료 모음 7개의 21개 주제를 원문과 대조했다. 기술 공부 글 21편을 공개 목록에 등록했다. 기존 요약을 원문으로 간주하거나 사용자의 실무 경험으로 바꾸지 않았다.

## 보관과 확인 범위

원문 응답 사본은 39개이며 HTML·텍스트·PDF를 합해 25.0 MiB다. 각 파일은 raw/web/game-ai/2026-11-18/에 보관하고 주소·수집 시각·SHA-256을 기록했다. 기존 링크 33개 중 32개의 응답을 보관했으며, 추가로 논문 본문과 책의 읽은 장도 수집했다.

이는 연결된 이미지·스크립트·영상까지 포함한 오프라인 사이트 사본은 아니다. 원문 사본과 내부 출처 기록은 홈페이지에 복사하지 않는다. 공개 글에는 독자가 확인할 원문 링크를 표시한다.

## 남아 있는 제한

- Unity UGK 포럼의 원문 다운로드는 HTML과 JSON 모두 HTTP 403으로 거부됐다. 해당 주제의 공부 글은 보관한 공식 MDI README에 한정했고 포럼의 동기화 수치는 사용하지 않았다.
- Unity 전자책 전체 PDF는 보관했지만 통독하지 않았다. 글은 README·목차와 Render Graph 장에서 실제 읽은 절에 한정했다. PDF는 pending으로 유지한다.
- 유튜브는 소개 페이지 HTML만 보관했다. 영상 파일·자막·발표 내용은 확인하지 않았으며 해당 레코드는 pending이다.
- 공식 MDI 저장소 HTML은 추가 보관한 보조 자료다. 기술 설명은 별도로 보관하고 읽은 README를 근거로 하며, 저장소 전체 코드 검토를 주장하지 않는다.
- 모든 글은 원문 독해를 바탕으로 작성했다. 코드 실행, 실기기 측정, 독립 벤치마크 재현과 영상 시청은 수행하지 않았다.

## 글 목록

| 영역 | 기술 공부 글 |
| --- | --- |
| 엔진·최적화 | [SOL-AVES와 게임 코드가 나눠 맡은 렌더링 최적화](../content/study/sol-aves-rendering-budget.md) |
| 엔진·최적화 | [Lumen World Cache·AVBOIT·Nanite를 소개한 짧은 로드맵](../content/study/unreal-rendering-roadmap.md) |
| 엔진·최적화 | [UE 5.9 MegaJam Preview의 도구 확장과 실험적 웹 타깃](../content/study/unreal-ai-workflow.md) |
| 엔진·최적화 | [Unity Render Graph의 타일 메모리 최적화가 이어지는 순서](../content/study/unity-performance-reading.md) |
| 엔진·최적화 | [Android 검은 화면을 RenderDoc 리플레이로 조사한 과정](../content/study/renderdoc-ai-debugging.md) |
| 엔진·최적화 | [Godot 4.8 beta 3의 수정 목록과 배포 조건](../content/study/godot-upgrade-regressions.md) |
| 엔진·최적화 | [Godot 렌더러의 CPU 병목을 찾아 고친 두 사례](../content/study/godot-cpu-resource-lifetime.md) |
| 렌더링·평가 | [FLUX 3 Image Klein 추론의 병목과 최적화 순서](../content/study/flux-inference-speed-quality.md) |
| 렌더링·평가 | [MatrixSplat의 순서 독립 합성과 행렬 실행](../content/study/matrixsplat-gpu-parallelism.md) |
| 렌더링·평가 | [Neural Render Proxies의 경로 재사용과 조명 편집](../content/study/neural-lighting-proxies.md) |
| 렌더링·평가 | [AnyGameRenderer의 대응 캡션과 객체 단위 평가](../content/study/entity-consistent-rendering.md) |
| 렌더링·평가 | [DIRT의 깊이 보완·워핑·두 대역 합성](../content/study/depth-based-live-view-synthesis.md) |
| 렌더링·평가 | [WorldDraft의 통제 실험과 첫 프레임 단서](../content/study/worlddraft-structure-appearance.md) |
| 렌더링·평가 | [Unity MDI 샘플의 지원 조건과 GPU 그리기 흐름](../content/study/gpu-driven-indirect-drawing.md) |
| AI·게임 시스템 | [RTX Spark의 화면 생성부터 캐릭터 동작까지](../content/study/local-ai-game-budgets.md) |
| AI·게임 시스템 | [GARP의 캐릭터 상태와 로컬 추론 시간표](../content/study/local-npc-async-decisions.md) |
| AI·게임 시스템 | [UnityBench의 프로젝트 구성과 엔진 평가 과정](../content/study/unity-agent-milestone-tests.md) |
| AI·게임 시스템 | [Wizard가 게임 상태를 영상으로 연결하는 과정](../content/study/explicit-state-generative-rendering.md) |
| AI·게임 시스템 | [Android XR의 기반 API와 공간·엔진·오디오 통합](../content/study/android-xr-porting-checklist.md) |
| AI·게임 시스템 | [Mojo Ski의 배포 경로와 일곱 단계 제작 과정](../content/study/ai-prototype-playability.md) |
| AI·게임 시스템 | [OCTAVE의 역량 분류에서 정적 요구사항 판정까지](../content/study/html5-game-capability-evaluation.md) |

## 기존 모음에 보완한 내용

Wizard는 2026-11-17의 v2 본문과 기존 프로젝트 페이지의 저자 표기가 달라 버전을 구분했다. UnityBench의 엔진 실행 검사와 OCTAVE의 정적 코드 판정은 다른 확인 방식으로 설명했다. MatrixSplat의 근사 오차와 AnyGameRenderer의 남은 오류 등 원문에서 확인한 한계도 해당 글에 반영했다.

세부 주장과 확인 절은 각 글과 wiki의 출처 페이지에서 확인한다. 원문 저장 여부와 실제 읽은 범위는 별개로 관리한다.

## 원문별 구성으로 재작성

후속 요청에 따라 위 21편의 보관 원문을 다시 읽고 본문을 개별 구성으로 재작성했다. 기존 경로와 출처 연결은 유지했다. [재독 범위와 글별 구성](study-rewrite-report.md)에 변경 내용을 기록했다.
