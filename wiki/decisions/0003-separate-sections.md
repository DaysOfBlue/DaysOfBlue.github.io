---
id: decision-separate-sections
title: 프로젝트·기술 공부·취미 감상문 분리
type: decision
status: reviewed
visibility: internal
created: 2026-11-18
updated: 2026-11-18
sources: ["src-section-separation-brief", "src-source-led-writing-brief"]
---

# 프로젝트·기술 공부·취미 감상문 분리

## 맥락

[사용자 요청](../sources/section-separation-brief.md)에 따라 프로젝트와 공부를 구분하고 개인적인 감상문을 게시할 공간을 추가한다.

## 결정

프로젝트는 `content/projects/`와 `/projects/`, 기술 공부는 `content/study/`와 `/study/`, 취미 감상문은 `content/reviews/`와 `/reviews/`를 사용한다. 문서 종류는 각각 `project`, `study`, `review`다. 폴더·종류·공개 경로가 다르면 검사와 빌드를 실패시킨다.

홈에서 대표 프로젝트, 최근 기술 공부, 최근 취미 감상문을 별도로 표시한다. 프로젝트 목록은 등록 순서, 공부와 감상문은 각 영역의 작성일순이다. 관련 글은 서로 연결할 수 있지만 목록을 혼합하지 않는다.

영역은 구분하되 기술 공부·감상문에 고정 본문 양식을 두지 않는다. 실제로 읽은 원문·원작과 사용자의 감상에 맞춰 각각 구성한다. 자세한 작성 방침은 [원문에 맞춘 개별 글쓰기](0004-source-led-writing.md)를 따른다. 감상의 원본 메모를 작성 근거로 연결할 수 있으며 주관적 느낌에 외부 증명을 요구하지 않는다. 사용자가 제공하지 않은 취미나 감상은 만들어 넣지 않는다.

## 이행 범위

기존 `content/notes/`에는 README만 있어 `content/study/`로 옮기고 설명을 갱신한다. 기존 공개 문서는 0개다. 이전의 포괄적인 기록 경로와 `article` 종류는 새 구성에서 사용하지 않는다. 원자료와 과거 작업 로그는 보존한다.
