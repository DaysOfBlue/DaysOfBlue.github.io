---
id: source-daily-20261120-stride-443-shader-compile
title: "Stride 4.4.3: 렌더링 API별 셰이더 컴파일 시간 비교"
type: source
status: reviewed
visibility: internal
created: 2026-11-20
updated: 2026-11-20
sources: ["src-daily-20261120-stride-443-shader-compile"]
---

# Stride 4.4.3: 렌더링 API별 셰이더 컴파일 시간 비교

## 원문과 확인 범위

- **출처:** Stride 엔진 유지보수팀의 공식 GitHub 릴리스
- **공개일:** 2026-11-17 18:33 KST. GitHub Releases API의 공개 시각은 09:33 UTC입니다.
- **형식:** 영문 릴리스 노트·벤치마크. 이번 회차의 보완 읽을거리입니다.
- **원문:** [Stride 4.4.3 릴리스](https://github.com/stride3d/stride/releases/tag/releases/4.4.3)

## 주요 내용

유지보수팀이 428개 효과를 컴파일한 시간입니다. 같은 작업의 버전 비교이며 런타임 FPS가 아닙니다.

| 렌더링 API | 4.3 | 4.4.2 | 4.4.3 |
| --- | ---: | ---: | ---: |
| Vulkan | 166초 | 35초 | 6.1초 |
| Direct3D 12 | 120초 | 39초 | 9.5초 |
| Direct3D 11 | 120초 | 59초 | 28초 |

SDSL 셰이더 클래스 조합의 메모리 할당을 줄이고, 중간 셰이더 저장소를 압축적으로 바꾸고, 디스어셈블리 및 오류 위치 문자열 생성은 실패한 경우에만 수행합니다. D3D11의 헤드셋 검은 화면 수정도 별도 항목입니다.

## 프로젝트에 적용한 해석

컴파일을 자주 반복하는 프로젝트에서 그래픽스 API별로 결과를 분리하고, 성공 경로에서 불필요한 진단 처리나 중복 작업을 찾는 사례입니다. 동일한 셰이더 집합과 캐시 조건에서 전체 시간, 파이프라인 단계별 시간, 오류 경로를 따로 기록하세요. 유지보수팀 측정 결과를 독립 재현하지는 않았습니다.

## 한계와 남은 질문

[해당 태그의 라이선스](https://raw.githubusercontent.com/stride3d/stride/releases/4.4.3/LICENSE.md)는 적용 대상 소프트웨어와 동봉 문서의 MIT 라이선스를 명시합니다. 릴리스 페이지나 별도 그래프 이미지의 복제 허용은 확인하지 않았습니다. 공개된 측정값을 자체 표로 정리했고, 원본 그래프·본문·코드 사본은 저장하지 않았습니다.

## 관련 기록

- [링크 메타데이터](../../raw/game-ai/2026-11-20/stride-443-shader-compile.link.json) (원문 복제본 아님)
- [전체 인덱스](../index.md)
