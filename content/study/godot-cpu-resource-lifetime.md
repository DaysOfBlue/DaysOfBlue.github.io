---
id: study-godot-cpu-resource-lifetime
title: "Godot 렌더러의 CPU 병목을 찾아 고친 두 사례"
summary: "프로파일링 방법을 먼저 읽고 Polygon2D 메시 갱신과 D3D12 셰이더 변환의 개선을 따라간다."
type: study
category: rendering
status: reviewed
visibility: public
created: 2026-11-18
updated: 2026-11-18
sources: ["src-web-godot-cpu"]
---

# Godot 렌더러의 CPU 병목을 찾아 고친 두 사례

Clay John은 [Optimizing CPU-side Rendering Code](https://godotengine.org/article/rendering-cpu-optimizations/)(2026-09-15)에서 CPU 최적화의 진행을 보여 준다. CPU와 GPU 중 느린 쪽이 전체 성능을 제한하므로 한쪽의 개선만으로 판단하지 않는다.

## 측정하고 원인을 이해한 뒤 다시 측정하기

저자는 프로파일러로 병목을 찾고 주변 코드를 이해한 다음 수정안을 비교한다. 계산을 건너뛰는 분기가 벡터화를 막거나 캐시가 메모리 읽기를 늘릴 수 있어, 예상만으로 최적화를 채택하지 않는다.

## Polygon2D가 매 프레임 메시를 다시 만들던 경우

애니메이션 문제로 시작한 조사에서 메시 생성·해제가 비싼 것으로 드러났다. 정점 수가 일정한 경우 기존 메시 데이터를 갱신하도록 바꿨다. Ryzen 5 9600X의 예시 장면에서 프레임 시간이 약 35ms에서 13ms로 줄었다는 보고다.

거의 모든 정점이 매 프레임 움직였으므로 부분 갱신을 추적하는 추가 최적화는 이 장면에서 유리하다고 볼 근거가 없었다.

## SPIR-V를 DXIL로 바꿀 때 생긴 할당 대기

다른 사례에서는 다중 스레드 작업 중 실행이 끊기는 구간을 추적했다. 스레드가 공유 힙에서 메모리를 요청하며 서로 기다리고 있었다. 스레드마다 별도 힙을 준 뒤 TPS 데모 로딩 시간이 11초 줄었다. 앞 사례의 프레임 시간과는 다른 측정이다.

원문 방법론과 두 사례의 본문을 재독했다. 수치는 저자의 측정 조건에서 나온 결과이며 엔진 빌드·PR 재현·독립 벤치마크는 수행하지 않았다.
