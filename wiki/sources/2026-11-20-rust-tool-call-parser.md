---
id: source-daily-20261120-rust-tool-call-parser
title: "Rust로 스트리밍 AI 도구 호출 파서 만들기"
type: source
status: reviewed
visibility: internal
created: 2026-11-20
updated: 2026-11-20
sources: ["src-daily-20261120-rust-tool-call-parser"]
---

# Rust로 스트리밍 AI 도구 호출 파서 만들기

## 원문과 확인 범위

- **원제:** Build Tool-Calling Parsers in Rust with AI Agents
- **출처·저자:** NVIDIA Technical Blog, Keiven Chang 외 4인
- **공개일:** 2026-11-19, 원문 표시 기준
- **형식:** 영문 기술 튜토리얼
- **원문:** [NVIDIA 기술 글](https://developer.nvidia.com/blog/build-tool-calling-parsers-in-rust-with-ai-agents/)
- **연결 자료:** [frontend-crates](https://github.com/ai-dynamo/frontend-crates)

## 주요 내용

- 모델의 스트리밍 토큰에서 사용자에게 보여줄 텍스트와 구조화된 도구 호출을 분리합니다. 호출의 시작·끝 표시가 청크 경계에서 나뉘거나 인수가 잘려도, 어떤 부분을 기다리고 어떤 부분을 내보낼지 명시합니다.
- 형식 오류와 의미 오류를 분리합니다. 완성되지 않은 호출은 만들어 내지 않고, 형식은 맞지만 사용할 수 없는 도구는 서빙 계층에서 권한·스키마·정책을 확인합니다.
- 여러 모델의 입력과 기대 결과를 짝지은 테스트 모음으로 정상·절단·중복·섞인 호출과 스트림 종료를 테스트합니다. 모델을 교체해도 사건 순서와 파싱 규칙을 회귀 테스트할 수 있습니다.

## 프로젝트에 적용한 해석

NPC 대사나 QA 보조 도구가 스트리밍 텍스트와 구조화된 이벤트를 함께 받을 때, 글자 표시와 게임 로직을 분리하는 데 유용합니다. 읽기 전용 퀘스트 조회를 예로 들어 정상 응답, 표시 문자열 중간 분할, 인수 절단, 존재하지 않는 도구명을 테스트해 보세요. 파서가 응답을 잘 읽는 것과 실제 게임 상태를 변경할 권한은 별개입니다.

## 한계와 남은 질문

연결된 GitHub 저장소는 Apache-2.0으로 표시됩니다. 해당 라이선스를 NVIDIA 블로그 본문, 도표 또는 외부 자산에 그대로 적용할 수는 없습니다. 이 파일에는 원문·코드 사본 대신 링크와 독자적인 요약만 담았습니다. 예제를 설치하거나 실행하지 않았습니다.

## 관련 기록

- [링크 메타데이터](../../raw/game-ai/2026-11-20/rust-tool-call-parser.link.json) (원문 복제본 아님)
- [전체 인덱스](../index.md)
