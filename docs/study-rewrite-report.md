# 기술 공부 글 21편의 원문 재독과 재작성

2026-11-18에 보관한 원문을 다시 읽고 기존 공개 글 21편을 재작성했다. 파일 경로·문서 ID·분류·공개 상태와 출처 연결은 유지했다. 제목과 요약, 본문은 원문의 성격에 맞춰 바꿨다.

## 재작성 방식

각 원문의 목차와 논리 진행을 먼저 확인했다. 짧은 로드맵은 항목 목록으로, 릴리스 글은 변경 표와 배포 조건으로, 제작 회고는 실제 제작 단계로 구성했다. 논문은 해당 연구의 데이터·방법·평가 순서에 맞춰 필요한 부분을 설명했다. 같은 질문·학습·실험 목차를 반복하거나 모든 글에 새 실험 제안을 붙이지 않았다.

원문 전체를 복제하거나 번역하지 않았으며, 직접 수행하지 않은 실험·게임 플레이·영상 시청을 경험처럼 쓰지 않았다. 원문 링크와 작성자·날짜, 실제 다시 읽은 범위는 각 글의 문맥이나 말미에 표시했다.

## 글별 구성

| 재작성한 글 | 이번 글의 전개 |
| --- | --- |
| [SOL-AVES와 게임 코드가 나눠 맡은 렌더링 최적화](../content/study/sol-aves-rendering-budget.md) | 엔진이 마련한 기반 / 게임 화면에서 해상도를 조절하는 방식 / 해상도를 낮춘 뒤에도 남는 비용 |
| [Lumen World Cache·AVBOIT·Nanite를 소개한 짧은 로드맵](../content/study/unreal-rendering-roadmap.md) | 소제목 없이 원문의 짧은 전개를 반영 |
| [UE 5.9 MegaJam Preview의 도구 확장과 실험적 웹 타깃](../content/study/unreal-ai-workflow.md) | 에디터에서 확장한 작업 범위 / 브라우저 실행의 조건 / 알려진 문제까지 읽어야 하는 이유 |
| [Unity Render Graph의 타일 메모리 최적화가 이어지는 순서](../content/study/unity-performance-reading.md) | 이전 내용과 이후 사용을 선언하기 / 여러 패스를 타일 안에서 연결하기 / 같은 픽셀의 이전 결과를 읽기 / 메인 메모리 할당도 생략할 수 있는 경우 |
| [Android 검은 화면을 RenderDoc 리플레이로 조사한 과정](../content/study/renderdoc-ai-debugging.md) | 셰이더를 바꾸고 실기기에서 다시 재생하기 / 화면 변화에 수치 근거 붙이기 |
| [Godot 4.8 beta 3의 수정 목록과 배포 조건](../content/study/godot-upgrade-regressions.md) | Highlights에 나열된 동작 변화 / 다운로드 뒤에도 남는 베타 검증 |
| [Godot 렌더러의 CPU 병목을 찾아 고친 두 사례](../content/study/godot-cpu-resource-lifetime.md) | 측정하고 원인을 이해한 뒤 다시 측정하기 / Polygon2D가 매 프레임 메시를 다시 만들던 경우 / SPIR-V를 DXIL로 바꿀 때 생긴 할당 대기 |
| [FLUX 3 Image Klein 추론의 병목과 최적화 순서](../content/study/flux-inference-speed-quality.md) | 디노이징을 먼저 측정한 이유 / 정밀도, attention, 단계 재사용 / GPU를 늘린 뒤 남는 시간 / 성능표에서 실행 설정으로 |
| [MatrixSplat의 순서 독립 합성과 행렬 실행](../content/study/matrixsplat-gpu-parallelism.md) | 합성을 바꿔 행렬 연산으로 옮기기 / 빨라진 구간과 남은 비용 |
| [Neural Render Proxies의 경로 재사용과 조명 편집](../content/study/neural-lighting-proxies.md) | 경로를 모으는 패스와 빛을 더하는 패스 / GatherLight를 작은 미분 가능한 모델로 바꾸기 / 예측에서 조명 파라미터 복원으로 |
| [AnyGameRenderer의 대응 캡션과 객체 단위 평가](../content/study/entity-consistent-rendering.md) | 캡션과 학습에서 고정하는 것 / 검출·추적을 거쳐 읽는 평가값 |
| [DIRT의 깊이 보완·워핑·두 대역 합성](../content/study/depth-based-live-view-synthesis.md) | 목표 화면에서 깊이를 보완하기 / 보이지 않는 색을 제외하고 합치기 |
| [WorldDraft의 통제 실험과 첫 프레임 단서](../content/study/worlddraft-structure-appearance.md) | 같은 동작에서 입력 조건만 바꾸기 / 구조, 외형, 지속성을 따로 측정하기 / 첫 프레임에만 개입하는 Primer |
| [Unity MDI 샘플의 지원 조건과 GPU 그리기 흐름](../content/study/gpu-driven-indirect-drawing.md) | 지원 환경을 확인하고 장면 열기 / GPU가 인자 버퍼와 명령 수를 쓰는 과정 / 거리에 따른 형상과 전환 구간 |
| [RTX Spark의 화면 생성부터 캐릭터 동작까지](../content/study/local-ai-game-budgets.md) | DLSS가 놓이는 그래픽스 파이프라인 / ACE의 로컬 캐릭터 추론 / 렌더링 SDK와 관찰 도구 / MotionBricks의 배포 범위 |
| [GARP의 캐릭터 상태와 로컬 추론 시간표](../content/study/local-npc-async-decisions.md) | 계획을 둘러싼 캐릭터 상태 / 게임 시계가 정하는 추론 예산 / 기억한 약속이 계획에서 빠지는 실패 |
| [UnityBench의 프로젝트 구성과 엔진 평가 과정](../content/study/unity-agent-milestone-tests.md) | 빈 저장소 대신 수정할 Unity 프로젝트 / 작업 종료 후 주입하는 평가기 / 점수 뒤에서 드러나는 공간 오류 |
| [Wizard가 게임 상태를 영상으로 연결하는 과정](../content/study/explicit-state-generative-rendering.md) | 골격과 기하를 짝지은 데이터 / 상태를 바꾸는 제어 계층 / 상태를 따라 그리는 생성 계층 |
| [Android XR의 기반 API와 공간·엔진·오디오 통합](../content/study/android-xr-porting-checklist.md) | 먼저 안정화된 SDK와 에뮬레이터 / 현실의 장소에 콘텐츠 연결하기 / 익숙한 엔진에서 구성과 추적 이어가기 / 화면 밖의 오디오 상호작용 |
| [Mojo Ski의 배포 경로와 일곱 단계 제작 과정](../content/study/ai-prototype-playability.md) | 배포 경로 도입 / 제작 7단계 순서 목록 / 게시 경로와 조회 수 범위 / 원문·독해 범위 |
| [OCTAVE의 역량 분류에서 정적 요구사항 판정까지](../content/study/html5-game-capability-evaluation.md) | 역량을 기준으로 과제 만들기 / 코드 판정과 사람의 조작 결과 / 전체 점수에서 실제 오류로 |

## 원문과 읽은 범위

각 글에서 재독한 원문 파일과 원래 목차, 확인 범위는 내부 기록에 남겼다. 이 기록은 홈페이지 본문에 출력하지 않는다.

- [엔진·최적화 재독 기록](../raw/rewrites/2026-11-18/source-led/engines-report.json)
- [렌더링 연구 재독 기록](../raw/rewrites/2026-11-18/source-led/graphics-report.json)
- [AI·게임 시스템 재독 기록](../raw/rewrites/2026-11-18/source-led/ai-report.json)
- [경로·메타데이터·원문 보존 확인](../raw/rewrites/2026-11-18/source-led/invariant-audit.json)

## 유지한 확인 한계

Unity 전자책은 실제로 읽은 Render Graph 장과 관련 README·목차·일본어 설명을 재독했다. 전체 PDF를 통독한 것으로 바꾸지 않았다. MDI 글은 보관된 공식 README를 기준으로 했으며, 다운로드하지 못한 UGK 포럼을 근거에 추가하지 않았다. 연결된 영상 시청과 구현·벤치마크 재현은 수행하지 않았다.

별도 원문 대조에서는 Neural Render Proxies의 적용 범위를 일반 렌더러 부재가 아닌 미분 가능한 역렌더러의 부재로 좁혔다. 구조 검사와 빌드는 문법·출처 연결·출력을 확인하며, 연구 결과를 독립 재현했다는 의미는 아니다.

## 확인 결과

21편 모두 변경 전후 파일 해시가 달라졌으며 경로·문서 ID·분류·공개 상태·작성일·출처 배열은 유지됐다. 기존 원자료 51개의 경로와 해시도 변하지 않았다. 원문별 전개와 수치·조건은 별도 대조 검토를 거쳤다.

`npm run check:sources`와 `npm run build`는 원자료 52개·Markdown 75개·공개 글 21개에서 오류·경고 없이 통과했다. 브라우저에서는 GARP의 새 본문, Godot 변경 표, Mojo Ski 제작 단계 목록과 출처 링크 표시를 확인했다. 홈페이지 코드는 변경하지 않았다.
