---
id: decision-static-skeleton
title: 정적 홈페이지 기본 틀
type: decision
status: reviewed
visibility: internal
created: 2026-11-18
updated: 2026-11-18
sources: ["src-homepage-scaffold-brief", "src-llm-wiki", "src-section-separation-brief", "src-home-navigation-brief"]
---

# 정적 홈페이지 기본 틀

## 맥락

[후속 요청](../sources/homepage-scaffold-brief.md)은 디자인을 제외한 홈페이지 기본 틀과 구성 설명이다. 로그인·데이터 입력·서버 저장은 현재 범위에 없다. 공개 글은 Markdown과 명시적 목록으로 관리한다.

## 결정

Node.js 내장 모듈로 공개 목록을 검사하고 일반 HTML을 `dist/`에 생성한다. 웹 프레임워크와 외부 패키지를 추가하지 않는다. CSS·이미지·애니메이션 없이 문서 구조와 링크를 확인할 수 있게 한다.

기본 경로는 홈, 기술, 취미, 소개와 기존 프로젝트·기술 공부·감상문 목록이다. 공개 문서를 등록하면 각 영역의 상세 경로를 생성한다. 메인은 소개를 먼저 표시하고 기술·취미 미리보기를 전환한다. 대표 작업은 공개 목록의 `featured: true`로 고르고 공부와 감상문은 각 영역의 작성일 내림차순으로 표시한다. 분류는 [영역 분리 결정](0003-separate-sections.md), 페이지 연결은 [메인 구성 결정](0005-home-navigation.md)을 따른다.

초안을 읽어 채우거나 내부 wiki를 복사하지 않는다. 공개 문서의 메타데이터 중 제목·요약·날짜만 화면에 사용하고 내부 출처 ID는 출력하지 않는다. 상대 Markdown 링크는 공개 목록의 경로로 변환한다. 공개하지 않은 문서를 가리키면 빌드를 실패시킨다.

Markdown은 제목·문단·단순 목록·인용·코드·강조·링크·단순 표를 지원한다. HTML은 문자로 표시하며 이미지와 중첩 목록은 지원하지 않는다. 표현 기능을 늘릴 필요가 생기면 렌더러와 검증을 함께 확장하거나 검토한 라이브러리로 바꾼다.

## 제약과 후속 작업

기본 틀은 로컬에서 실행한다. 실제 소개·역할·성과·연락처는 확인된 자료가 있을 때 작성한다. 디자인과 배포는 이후 별도 범위로 진행한다. 자세한 페이지별 구성은 [홈페이지 계획](../../docs/website-plan.md)에 있다.
