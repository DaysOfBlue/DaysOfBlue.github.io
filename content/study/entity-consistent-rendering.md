---
id: study-entity-consistent-rendering
title: "AnyGameRenderer의 대응 캡션과 객체 단위 평가"
summary: "객체 대응을 명시하는 캡션, 학습 쌍의 구성, 검출 기반 평가를 원문 순서로 살핀다."
type: study
category: ai
status: reviewed
visibility: public
created: 2026-11-18
updated: 2026-11-18
sources: ["src-web-anygame-renderer", "src-web-anygame-renderer-metadata"]
---

# AnyGameRenderer의 대응 캡션과 객체 단위 평가

AnyGameRenderer는 거친 게임 영상과 캡션, 선택적인 기준 이미지를 받아 외형을 바꾸는 영상 편집 방식이다. 원문은 먼저 입력 객체의 위치·크기·등장 시점과 개수를 유지하는 대응 관계를 정의한다.

## 캡션과 학습에서 고정하는 것

캡션은 도형이 나타내는 실제 대상을 지정하고 유지할 정보를 명시한다. 등장하지 않는 캐릭터 이름도 일부러 포함해, 존재 여부는 영상에서 판단하도록 학습한다. MiniMax-H3 본체를 고정하고 LoRA만 조정한다.

학습 쌍은 에이전트 제작 게임, Unreal 장면, 실제 플레이 기록에서 만든다. 엔진 렌더는 같은 시뮬레이션을 여러 표현으로 출력하고, 실제 기록은 검출한 3D 상자를 거친 입력으로 바꾼다. 모든 자료를 약 5.17초의 같은 형식으로 맞춘다.

## 검출·추적을 거쳐 읽는 평가값

평가는 59개 사례의 753개 객체를 기준으로 생성 영상의 검출·추적 결과를 매칭한다. 12프레임 미만 존재하는 객체는 제외하며 정답 영상도 같은 평가기를 통과시킨다.

저자들은 temporal match가 50.9%에서 62.9%로 개선됐지만 hallucination rate는 46.0%로 남았다고 보고한다. 실제 기록과 장르별 개선 폭도 달라 완전한 대응 보존으로 해석할 수 없다.

Ruicong Liu 외, [v3 본문](https://arxiv.org/html/2610.31466v3). 최초 2026-10-22·개정 2026-10-28. 방법·데이터·평가와 [버전 정보](https://arxiv.org/abs/2610.31466)를 재독했으며 모델 실행과 영상 시청은 하지 않았다.
