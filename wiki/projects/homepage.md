---
id: project-homepage
title: Homepage 프로젝트
type: project
status: reviewed
visibility: internal
created: 2026-11-18
updated: 2026-11-18
sources: ["src-portfolio-brief", "src-llm-wiki", "src-homepage-scaffold-brief", "src-section-separation-brief", "src-home-navigation-brief"]
---

# Homepage 프로젝트

## 목표와 현재 범위

[초기 요청](../sources/portfolio-brief.md)에 따라 저장소와 지식 기록을 구성했다. [후속 요청](../sources/homepage-scaffold-brief.md)에 따라 디자인을 제외한 로컬 홈페이지 기본 틀과 페이지 구성을 추가한다.

기존 Git 저장소가 있었으며 커밋과 원격 설정은 없었다. 게임·AI 자료 7개는 사용자 요청에 따라 `raw/game-ai/`로 옮기고 원본 바이트를 보존했다. 해당 자료의 외부 주장이나 사용자의 실무 경험은 확인하지 않았다.

## 적용한 구성

- 원자료 목록과 SHA-256으로 기존 자료를 식별한다.
- 출처·개념·프로젝트·결정 페이지를 wiki에 연결하고 인덱스·로그로 탐색한다.
- 홈페이지용 글은 별도 폴더에 작성하고 명시적인 공개 목록으로 관리한다.
- 에이전트 지침과 템플릿, 로컬 구조 검사기를 제공한다.

이는 [LLM Wiki](../sources/llm-wiki.md)를 포트폴리오 작업에 맞게 적용한 설계다. 상세한 이유는 [콘텐츠 경계](../decisions/0001-content-boundaries.md)와 [홈페이지 기본 틀](../decisions/0002-static-skeleton.md) 결정에 있다.

## 산출물과 확인 한계

현재 산출물에는 문서 구조·검사 도구와 정적 빌드·로컬 서버가 있다. 메인의 자기소개 다음에 기술·취미 미리보기를 전환하며 각 독립 페이지로 이동한다. 기술 안에서도 프로젝트와 기술 공부를 구분한다. 기존 목록과 상세 주소는 유지한다. 분류는 [영역 분리 결정](../decisions/0003-separate-sections.md), 페이지 연결은 [메인 구성 결정](../decisions/0005-home-navigation.md)을 따른다. 프레임워크·추가 패키지·시각 디자인·배포는 포함하지 않는다. 사용자의 이름·경력·프로젝트 성과나 개인적인 감상을 대신 작성하지 않았다.

기계 검사 결과는 [작업 로그](../log.md)에 기록한다. 구조 검사가 통과해도 원자료 주장에 대한 사실 검증이나 웹 동작 검증을 완료한 것으로 취급하지 않는다.

## 다음 작업

[구성 계획](../../docs/website-plan.md)에 따라 소개와 실제 프로젝트 자료를 확보한다. 공개 글을 검토하고 공개 목록에 등록한다. 이후 디자인과 호스팅을 선택한다. 자료 모음 7개는 필요할 때 한 건씩 수집한다.
