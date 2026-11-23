---
id: project-homepage
title: Homepage 프로젝트
type: project
status: reviewed
visibility: internal
created: 2026-11-18
updated: 2026-11-23
sources: ["src-portfolio-brief", "src-llm-wiki", "src-homepage-scaffold-brief", "src-section-separation-brief", "src-home-navigation-brief"]
---

# Homepage 프로젝트

## 목표와 현재 범위

[초기 요청](../sources/portfolio-brief.md)에 따라 저장소와 지식 기록을 구성했다. 공개 글과 출처를 관리하며 DevBlog 기반의 홈페이지를 GitHub Pages에서 제공한다. 운영 절차는 [배포 안내](../../docs/github-pages.md)에 있다.

[DaysOfBlue/DaysOfBlue.github.io](https://github.com/DaysOfBlue/DaysOfBlue.github.io)의 기존 커밋 이력을 연결했다. 사용자가 임시 템플릿 제거를 요청해 기존 파일을 현재 홈페이지 소스로 교체했다. 원자료는 `raw/`에 보존하며 원본 목록과 안내만 Git으로 관리한다. 외부 자료의 주장을 사용자의 실무 경험으로 취급하지 않는다.

## 적용한 구성

- 원자료 목록과 SHA-256으로 기존 자료를 식별한다.
- 출처·개념·프로젝트·결정 페이지를 wiki에 연결하고 인덱스·로그로 탐색한다.
- 홈페이지용 글은 별도 폴더에 작성하고 명시적인 공개 목록으로 관리한다.
- 에이전트 지침과 템플릿, 로컬 구조 검사기를 제공한다.
- 회색 계열 DevBlog 디자인과 Noto Sans KR, 프로젝트·기술·취미 탭과 세부 카테고리를 제공한다.
- Markdown 본문과 화면 문구를 파일로 관리하고 로컬 편집기에서 미디어 배치와 하단 출처를 저장한다.
- `main` push 후 테스트와 빌드가 성공하면 `dist/`만 GitHub Pages에 배포한다.

이는 [LLM Wiki](../sources/llm-wiki.md)를 포트폴리오 작업에 맞게 적용한 설계다. 상세한 이유는 [콘텐츠 경계](../decisions/0001-content-boundaries.md)와 [홈페이지 기본 틀](../decisions/0002-static-skeleton.md) 결정에 있다.

## 산출물과 확인 한계

사이트 주소는 [https://daysofblue.github.io/](https://daysofblue.github.io/)다. 자기소개 영역 다음에 프로젝트·기술·취미 목록을 전환하며 독립 목록과 세부 카테고리로 이동한다. 공개 기술 글 21편과 하단 출처 28개를 표시한다. 실제 프로필·프로젝트·감상문은 아직 공개하지 않아 안내와 빈 CV 양식을 표시한다. 사용자의 이름·경력·성과나 개인적인 감상은 만들지 않았다.

정적 웹 결과에는 공개 목록에 등록한 글과 지정한 자산·참조한 첨부만 포함한다. 원자료·wiki·초안·편집용 JSON·로컬 편집기·테스트 예제는 웹에서 제공하지 않는다. 공개 Git 저장소에서는 Git으로 관리하는 wiki·초안·설정과 편집기 소스를 읽을 수 있다. 추가 프레임워크나 npm 의존성은 사용하지 않는다.

기계 검사 결과는 [작업 로그](../log.md)에 기록한다. 구조 검사가 통과해도 원자료 주장에 대한 사실 검증이나 웹 동작 검증을 완료한 것으로 취급하지 않는다.

## 다음 작업

[구성 계획](../../docs/website-plan.md)에 따라 실제 소개·프로젝트·감상문을 준비하고 검토 후 공개 목록에 등록한다. 원자료 수집과 wiki 관리는 웹 공개와 구분해 진행한다.
