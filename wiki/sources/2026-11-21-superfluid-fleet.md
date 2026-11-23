---
id: source-daily-20261121-superfluid-fleet
title: "Superfluid: 여러 로컬 장비에 LLM 요청을 나누는 방법"
type: source
status: reviewed
visibility: internal
created: 2026-11-21
updated: 2026-11-21
sources: ["src-daily-20261121-superfluid-fleet"]
---

# Superfluid: 여러 로컬 장비에 LLM 요청을 나누는 방법

## 원문과 확인 범위

- **원제·출처:** [Distributed Inference for Local AI via Superfluid](https://huggingface.co/blog/basecompute/superfluid-fleet), Base Compute
- **공개일·형식:** 2026-11-20, 영문 기술 글. [연구 프리프린트](https://arxiv.org/abs/2611.17753)는 11월 13일 제출.
- **구현 문서:** [v0.1.14 README](https://raw.githubusercontent.com/basecompute/superfluid/v0.1.14/README.md) · [분산 서빙 문서](https://raw.githubusercontent.com/basecompute/superfluid/v0.1.14/docs/serving/distributed_serving.md)

## 주요 내용

- 모델을 장비에 쪼개지 않습니다. 각 워커가 모델 전체를 담고, 중앙 서버가 세션 하나를 워커 하나에 배정합니다. 대기열과 처리 속도를 반영하고, 대화가 이어질 때는 가장 긴 입력 캐시를 보유한 워커를 우선합니다.
- 워커가 중간에 멈추면 새 워커가 사용자에게 이미 보낸 토큰을 입력에 포함해 이어서 생성합니다. KV 캐시를 옮기는 대신 입력을 다시 계산하므로 장애 복구에는 추가 비용이 있습니다.
- 개발팀의 한 시간 부하 실험에서 Qwen3-4B/llama.cpp로 모의 사용자 64명을 처리했습니다. 장비 1대에서 혼합 장비 6대로 늘릴 때 전체 출력은 초당 112→534토큰, 첫 토큰까지 걸린 시간의 중앙값은 98.5→11.7초였습니다. [논문 표 2와 §4.2](https://arxiv.org/html/2611.17753v1#S4.SS2)에 따르면 이 실험에서 총 5,041건이 실패 없이 완료됐습니다. 워커 하나를 중단한 시점에 전체 장비에서 처리 중이던 61건도 모두 완료됐습니다. 중단된 워커의 요청만 다른 장비에 재배정했으며, 정확한 재배정 건수는 논문에 따로 나와 있지 않습니다.

## 프로젝트에 적용한 해석

게임 제작팀의 공유 AI 도구를 평가한다면 첫 토큰 지연과 전체 토큰 처리량을 분리해서 보세요. 작업이 몰린 시간의 p95, 캐시가 비었을 때의 지연, 워커 중단 시 재계산 비용을 따로 기록하면 단일 장비보다 나은지 판단하기 쉽습니다. 이 글은 게임 런타임 내부 성능 자료가 아닙니다.

## 한계와 이용 조건

개발팀이 정한 모델·하드웨어·부하의 결과입니다. 단일 장비에 모델 전체가 들어가야 하며, 보고된 처리량이나 복구율은 일반적인 보장이 아닙니다. 중앙 서버 장애 복구, Windows 지원, 사용자 장비에서의 성능은 검증하지 않았습니다. 태그의 [Apache 2.0 LICENSE](https://raw.githubusercontent.com/basecompute/superfluid/v0.1.14/LICENSE)와 [NOTICE](https://raw.githubusercontent.com/basecompute/superfluid/v0.1.14/NOTICE)를 확인했습니다. 블로그 글·외부 미디어·모델 가중치에는 이 허가를 적용하지 않습니다.

## 관련 기록

- [링크 메타데이터](../../raw/game-ai/2026-11-21/superfluid-fleet.link.json) (원문 복제본 아님)
- [전체 인덱스](../index.md)
