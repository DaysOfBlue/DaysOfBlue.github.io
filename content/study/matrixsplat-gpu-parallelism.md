---
id: study-matrixsplat-gpu-parallelism
title: "MatrixSplat의 순서 독립 합성과 행렬 실행"
summary: "순차 의존성을 찾은 뒤 합성 표현과 GPU 실행 단위를 함께 바꾸는 과정을 정리한다."
type: study
category: rendering
status: reviewed
visibility: public
created: 2026-11-18
updated: 2026-11-18
sources: ["src-web-matrixsplat", "src-web-matrixsplat-metadata"]
---

# MatrixSplat의 순서 독립 합성과 행렬 실행

MatrixSplat은 LangSplat의 시간 분해와 GPU stall 분석에서 출발한다. 깊이순 알파 합성에서는 다음 Gaussian의 기여가 앞서 누적한 투과율에 의존한다. 저자들은 이 순차 의존성이 명령 중첩을 막는다는 점을 방법 설계의 근거로 삼는다.

## 합성을 바꿔 행렬 연산으로 옮기기

색·의미 특징·선택적 깊이를 하나의 특징 벡터로 묶고, Gaussian별 가중치를 독립적으로 더한 뒤 정규화한다. 교환 가능한 누적으로 바꾸어 앞선 합성 결과를 기다리는 관계를 없앤다.

이후 워프가 맡은 32픽셀에 기여하는 Gaussian을 16개씩 묶어 Tensor Core의 MMA에 넘긴다. 고차원 특징은 필요한 8채널만 나누어 가져와 공유 메모리가 차원 수와 함께 커지는 문제를 줄인다.

## 빨라진 구간과 남은 비용

논문은 최대 3.8배의 전체 렌더링 가속과 고차원 특징의 최대 36.7배 커널 가속을 별도 조건으로 보고한다. 혼합을 가속해도 전처리·타일 분류와 역전파의 원자 연산은 남는다. 가중 합성은 깊이순 합성의 근사여서 반투명 층이 극단적으로 겹치는 장면에서는 품질이 낮아질 수 있다.

[Yangming Zhang 외의 v1 본문](https://arxiv.org/html/2611.15153v1), 2026-11-11. 방법·평가·한계와 [제출 정보](https://arxiv.org/abs/2611.15153)를 재독했다. 부록 전체 검산과 구현 재현은 하지 않았다.
