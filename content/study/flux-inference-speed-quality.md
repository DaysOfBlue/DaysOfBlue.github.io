---
id: study-flux-inference-speed-quality
title: "FLUX 3 Image Klein 추론의 병목과 최적화 순서"
summary: "파이프라인 측정에서 attention·캐시·다중 GPU와 배포 설정으로 이어지는 원문을 읽는다."
type: study
category: ai
status: reviewed
visibility: public
created: 2026-11-18
updated: 2026-11-18
sources: ["src-web-flux-blackwell"]
---

# FLUX 3 Image Klein 추론의 병목과 최적화 순서

## 디노이징을 먼저 측정한 이유

FLUX 3 Image Klein은 텍스트 조건 처리, DiT의 디노이징, 오토인코더의 이미지 복원으로 이어진다. NVIDIA는 B200의 파이프라인 시간을 먼저 분해한다. 2048×2048 NVFP4 Base T2I에서는 디노이징이 전체의 96.8%여서 이후 최적화가 DiT에 집중된다.

## 정밀도, attention, 단계 재사용

원문은 NVFP4 체크포인트에서 시작해 GEMM과 후처리의 결합, 양자화·희소 attention, Cache-DiT 순서로 설명한다. 희소 attention은 초반 일부 단계를 dense로 유지하고, 캐시는 인접 디노이징 단계의 중간 출력을 재사용한다. 두 설정 모두 지연과 출력 차이를 바꾸므로 LPIPS를 해당 기준 출력과 함께 제시한다.

## GPU를 늘린 뒤 남는 시간

Base는 CFG 분기를 GPU 그룹에 나누고 Ulysses로 시퀀스를 분할한다. distilled 모델은 CFG 없이 Ulysses만 사용한다. 디노이징이 빨라져도 다른 단계가 남아 전체 생성 시간의 개선은 제한된다.

## 성능표에서 실행 설정으로

단일 B200의 최대 3.46배 T2I 가속은 여러 최적화를 결합해 비컴파일 BF16과 비교한 제조사 보고다. 이어지는 오프라인·서빙 예제는 동일 설정을 YAML로 제시하며, 측정 지연에서 프롬프트 확장을 제외했다고 명시한다.

[원문](https://developer.nvidia.com/blog/speed-up-image-generation-with-flux-3-image-klein-on-nvidia-blackwell-gpus/): Olivia Stoner 외, 2026-11-06. 본문과 설정을 재독했으며 실행·성능 재현은 하지 않았다.
