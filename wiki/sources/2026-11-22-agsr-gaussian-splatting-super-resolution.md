---
id: source-daily-20261122-agsr-gaussian-splatting-super-resolution
title: "AGSR: 한 장면을 여러 Gaussian 폭으로 렌더링해 초해상도 복원"
type: source
status: reviewed
visibility: internal
created: 2026-11-22
updated: 2026-11-22
sources: ["src-daily-20261122-agsr-gaussian-splatting-super-resolution"]
---

# AGSR: 한 장면을 여러 Gaussian 폭으로 렌더링해 초해상도 복원

## 원문과 확인 범위

- **원제·출처:** [AGSR: Aperture-Guided Super-Resolution for Gaussian Splatting](https://arxiv.org/abs/2611.25934), Ayman Alkhateeb, Hadi Amirpour, Christian Timmerer
- **공개일·형식:** 2026-11-19, arXiv v1. 영문 연구 논문.
- **원문:** [v1 HTML, 방법과 실험 표](https://arxiv.org/html/2611.25934v1)

## 주요 내용

- 학습된 3D Gaussian Splatting 장면을 업스케일할 때 한 장의 저해상도 RGB에만 의존하지 않습니다. 같은 장면에서 Gaussian의 공간 폭을 더 좁혀 렌더한 결과를 함께 써서 기본 래스터화가 흐리게 만든 디테일 후보를 얻습니다. 여기서 aperture는 단순히 카메라 조리개 값을 바꾼 것이 아닙니다.
- 여러 렌더 결과의 차이로 구조가 불확실한 영역을 추정합니다. 단계별 경량 신경망은 투과율과 깊이를 참고해 특징을 합칩니다. 적용 단계 수가 늘어나면 처리량과 복원 품질을 교환할 수 있습니다.
- RTX A6000 단일 이미지 배치, FHD 목표의 래스터화 포함 속도 실험에서 FP16 3단계 결과는 2배(960×540 입력) 27 FPS, 4배(480×270 입력) 76 FPS였습니다. 4배는 입력 픽셀 수가 더 적습니다. 별도 Mip-NeRF 360 품질 평가에서는 학습 입력 해상도를 크게 낮춘 경우 개선 여지가 컸지만, 원래 표현이 좋은 경우에도 항상 이기는 것은 아닙니다.

## 개발에 도움이 되는 이유

스플랫 뷰어에서 해상도를 낮추려면 기본 렌더와 업스케일러를 한 덩어리로 재기보다 래스터화와 신경망 시간을 나눠 보세요. 같은 카메라 경로와 출력 크기에서 기존 방식과 1·2·3단계를 나란히 비교하고, 얇은 물체의 윤곽과 이동 중 안정성을 따로 확인할 만합니다. 속도 표와 품질 표는 서로 다른 실험이므로 하나의 설정에서 속도와 품질이 동시에 보장된다고 읽으면 안 됩니다.

## 한계와 이용 조건

저자 실험을 요약했으며, 엔진 플러그인이나 제품을 설치·실행한 것이 아닙니다. 장면·기기·입력 해상도와 학습 조건이 달라지면 결과도 달라집니다. 논문 열람 권한을 코드·가중치·그림 전반의 재사용 허가로 해석하지 않았고, 이 파일에는 원문 링크와 자체 요약만 담았습니다.

## 로컬 보관 기록

- [링크 메타데이터](../../raw/game-ai/2026-11-22/agsr-gaussian-splatting-super-resolution.link.json) (원문 복제본 아님)
- [전체 인덱스](../index.md)
