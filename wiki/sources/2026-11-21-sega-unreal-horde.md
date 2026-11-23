---
id: source-daily-20261121-sega-unreal-horde
title: "세가의 Unreal Engine Horde 운용기: 제출 전에 빌드 깨짐 잡기"
type: source
status: reviewed
visibility: internal
created: 2026-11-21
updated: 2026-11-21
sources: ["src-daily-20261121-sega-unreal-horde"]
---

# 세가의 Unreal Engine Horde 운용기: 제출 전에 빌드 깨짐 잡기

## 원문과 확인 범위

- **출처·저자:** [SEGA TECH Blog의 Horde 도입기](https://techblog.sega.jp/entry/Horde-20261113), 세가 개발기술부 가도와키(門脇)
- **공개일·형식:** 2026-11-13, 일본어 기술 블로그. 최근 다시 소개된 보완 자료.
- **관련 원문:** [Epic의 Horde 문서](https://dev.epicgames.com/documentation/unreal-engine/horde-in-unreal-engine)

## 주요 내용

- Horde의 Preflight는 Perforce에 변경사항을 제출하기 전에 빌드 그래프로 검사합니다. 세가의 한 프로젝트는 특정 스트림, PS5 Test 구성, 일부 프로그래머에 한해 먼저 적용했습니다. 로컬과 다른 컴파일러를 쓰는 플랫폼에서 놓치던 오류도 사전에 걸러냈다고 합니다.
- 처음부터 모든 플랫폼과 구성을 넣으면 검사가 길어지고 BuildGraph 유지 비용이 커집니다. 어느 작업을 고르며 기존 흐름에 어떻게 붙였는지, 호스트·에이전트 구성과 설정 버전 관리에서 무엇이 어려웠는지도 다룹니다.
- 같은 도구 묶음의 Unreal Build Accelerator(UBA)는 컴파일 작업 분산에 쓰입니다. 제출 전 검증과 컴파일 가속은 목적이 달라 각각 도입할 수 있습니다.

## 프로젝트에 적용한 해석

빌드 공유가 자주 막힌다면 한 스트림의 실제로 실패하기 쉬운 대상부터 검사하세요. 차단된 실패 건수뿐 아니라 검사를 거친 제출 비율, 대기 시간, 검사에서 놓친 사후 실패도 함께 보면 파일럿의 가치를 판단할 수 있습니다. 이미 있는 CI와 비교할 때도 단일 파일럿의 검출률을 전사 규모로 그대로 늘려 해석하지 않는 편이 좋습니다.

## 한계와 이용 조건

특정 회사의 제한된 운영 사례이며 재현 테스트를 수행하지 않았습니다. 세가 글·그림의 별도 복제 허가를 확인하지 못했으므로 원문 전문과 도표는 포함하지 않고 링크만 제공합니다.

## 관련 기록

- [링크 메타데이터](../../raw/game-ai/2026-11-21/sega-unreal-horde.link.json) (원문 복제본 아님)
- [전체 인덱스](../index.md)
