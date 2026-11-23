---
id: study-worlddraft-structure-appearance
title: "WorldDraft의 통제 실험과 첫 프레임 단서"
summary: "구조·외형의 통제 축과 평가 기준을 정한 뒤 Primer와 실패 분석으로 이어지는 논문을 읽는다."
type: study
category: ai
status: reviewed
visibility: public
created: 2026-11-18
updated: 2026-11-18
sources: ["src-web-worlddraft", "src-web-worlddraft-metadata", "src-web-worlddraft-project"]
---

# WorldDraft의 통제 실험과 첫 프레임 단서

## 같은 동작에서 입력 조건만 바꾸기

WorldDraft는 코드가 정한 움직임과 카메라를 영상 모델이 유지하면서 요구한 외형을 구현하는지 평가한다. 48개 월드에서 동작을 고정하고, 초안 상세도와 외형의 일치 여부를 각각 세 단계로 바꿔 432개 사례를 만든다. 두 축을 교차해 구조 정보의 효과와 충돌하는 색·재질의 영향을 분리한다.

## 구조, 외형, 지속성을 따로 측정하기

구조 보존은 객체·궤적·사건·카메라를 검사한다. 외형 평가는 원본 초안을 숨긴 상태에서 목표 속성 구현을 판단한다. 지속성은 처음 올바른 속성이 구현되고 이후에도 유지됐을 때만 점수를 준다. 잘못된 색이 계속 남는 결과는 성공으로 세지 않는다.

## 첫 프레임에만 개입하는 Primer

WorldDraft-Primer는 첫 프레임의 객체 가장자리에 위치·외형 단서를 더하고 나머지 프레임은 그대로 둔다. 논문은 이어 12개 모델을 비교하고, 상세한 초안이 구조를 보존해도 외형 구현을 방해하는 현상과 원본 색의 잔류를 분석한다. Primer의 개선도 해당 모델·평가 조건에서 보고된 결과다.

Zhiyu Hou 외, [v1 본문](https://arxiv.org/html/2611.16217v1), 2026-11-12. 통제 설계·평가·Primer·실패 분석과 [제출 정보](https://arxiv.org/abs/2611.16217)를 재독했다. 부록 전체 검증·모델 실행·비교 영상 시청은 하지 않았다.
