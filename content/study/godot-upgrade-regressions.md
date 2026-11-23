---
id: study-godot-upgrade-regressions
title: "Godot 4.8 beta 3의 수정 목록과 배포 조건"
summary: "beta 2 이후 바뀐 동작을 확인하고 다운로드 조건과 버그 보고 안내까지 읽는다."
type: study
category: engine
status: reviewed
visibility: public
created: 2026-11-18
updated: 2026-11-18
sources: ["src-web-godot-beta"]
---

# Godot 4.8 beta 3의 수정 목록과 배포 조건

[Godot 4.8 beta 3 발표](https://godotengine.org/article/dev-snapshot-godot-4-8-beta-3/)(Thaddeus Crews, 2026-11-09)는 릴리스 후보 전 회귀 보고를 요청한다. 소개하는 변경은 4.8 전체가 아니라 beta 2 이후에 한정된다.

## Highlights에 나열된 동작 변화

| 영역 | 변경 내용 |
| --- | --- |
| 애니메이션 | 비활성 애니메이션에 키가 자동 삽입되지 않도록 수정 |
| 에디터 | 포커스 상실 시 저장이 삭제한 열린 씬을 다시 만드는 문제 수정 |
| 입력 | 메뉴에서 마우스 이동이 컨트롤러 입력을 덮는 문제 수정 |
| 물리 | 여러 스레드가 CommandQueueMT를 비울 때의 경쟁 상태 수정 |
| 셰이더 | VisualShader 출력 노드에 light vertex 입력 추가 |

원문은 51명이 74개 수정을 제출했다고 밝히고 전체 변경 목록을 안내한다.

## 다운로드 조건과 회귀 보고

표준 빌드는 GDScript·GDExtension을, .NET 빌드는 C#도 지원한다. 이 .NET 빌드의 최소 요구 버전은 .NET 10이다. 원문은 프리릴리스의 데이터 손실에 대비해 백업과 버전 관리를 권한다.

알려진 회귀 목록은 갱신될 수 있다. 새 문제를 보고하기 전 기존 이슈를 검색하고, 이전 버전에서 되던 동작이 깨졌다면 재현 정보를 남기도록 안내한다. 본문·변경 항목을 재독했다. 엔진 실행과 PR 검증은 하지 않았다.
