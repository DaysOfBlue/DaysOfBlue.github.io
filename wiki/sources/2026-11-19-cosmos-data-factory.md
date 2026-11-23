---
id: source-daily-20261119-cosmos-data-factory
title: "Cosmos: 생성·검증·라벨링을 연결하는 AI 학습 데이터 파이프라인"
type: source
status: reviewed
visibility: internal
created: 2026-11-19
updated: 2026-11-19
sources: ["src-daily-20261119-cosmos-data-factory"]
---

# Cosmos: 생성·검증·라벨링을 연결하는 AI 학습 데이터 파이프라인

## 원문과 확인 범위

- 원제: Build Training-Ready Physical AI Datasets with Two Prompts in NVIDIA Cosmos
- 저자·출처: Nakul Arora, NVIDIA Technical Blog
- 공개일: 2026-11-18 (원문 상단 직접 확인)
- 확인일·배포분: 2026-11-19 KST
- 형식·언어: 기술 튜토리얼, 영어; 연결 영상은 시청하지 않음
- 원문: https://developer.nvidia.com/blog/build-training-ready-physical-ai-datasets-with-two-prompts-in-nvidia-cosmos/
- 분류: AI 데이터 제작 / 합성 데이터 / 워크플로 자동화 / 시뮬레이션

## 주요 내용

- Cosmos Data Factory는 큐레이션·증강·생성·자동 라벨링을 연결하는 다섯 참조 워크플로와 여섯 조합형 스킬을 소개합니다.
- 기존 영상의 날씨·조명 변형, 드문 사건의 생성, 결함 이미지 생성 등을 사례로 설명합니다. 결과 생성 후 요청 조건과 동작의 물리적 타당성을 평가하고, 실패한 결과를 다시 생성하는 흐름입니다.
- 3D USD 에셋을 사용하는 결함 이미지 사례는 Isaac Sim 렌더와 마스크를 시작점으로 삼고, 결과의 출처와 생성 설정을 추적하는 manifest를 남깁니다.
- 초기 환경 점검과 실제 설정·실행을 구분합니다. 제목의 ‘두 프롬프트’는 준비된 환경과 워크플로를 전제로 합니다.

## 프로젝트에 적용한 해석

게임 제작 도구 자체는 아니지만, 시뮬레이션 기반 AI 실험과 대량 생성 결과의 품질 관리에 참고할 가치가 있습니다. 특히 생성량보다 검증·실패 처리·출처 기록을 함께 설계한다는 점이 실무적입니다.

**적용 제안:** 내부 합성 데이터 실험에서 입력 에셋, 생성 설정, 평가 결과, 채택 여부를 함께 남기는 작은 작업 흐름부터 검증하세요. 게임 QA·에셋 검증으로의 활용은 편집자의 확장 제안이며 본문이 실증한 게임 개발 결과는 아닙니다.

## 한계와 남은 질문

공식 본문을 읽었지만 모델·스킬을 설치하거나 실행하지 않았습니다. 자동 평가 통과가 물리적 정확성을 보장하지는 않습니다. 입력 데이터 사용 권한, 모델별 라이선스, GPU 비용을 도입 전에 확인해야 합니다. 원문 재배포 라이선스를 확인하지 않아 본문·이미지·영상을 저장하지 않고 링크와 요약만 기록했습니다.

## 관련 기록

- [링크 메타데이터](../../raw/game-ai/2026-11-19/cosmos-data-factory.link.json) (원문 복제본 아님)
- [전체 인덱스](../index.md)
