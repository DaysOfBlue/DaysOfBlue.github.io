# Homepage

개인 포트폴리오 홈페이지와 그 근거가 되는 지식 기록을 관리하는 저장소다. 원자료는 보존하고, 출처를 연결한 분석은 wiki에 쌓으며, 홈페이지에 보여 줄 글은 `content/`에서 따로 편집한다.

기본 홈페이지에는 DevBlog 기반의 차분한 회색 디자인과 Noto Sans KR을 적용한다. 홈 상단에는 자기소개 요약을 두고, 그 아래 프로젝트·기술·취미 탭에서 작은 썸네일이 있는 한 줄 목록을 전환한다. 사이드바 메뉴는 홈·소개·프로젝트·기술·취미다. 별도의 대표 프로젝트 영역이나 이메일 구독 폼은 없다.

## 구성

| 위치 | 역할 |
| --- | --- |
| `AGENTS.md` | 에이전트 작업의 기준 지침 |
| `raw/` | 원자료와 원본 해시 목록. 원문은 기본적으로 Git 제외 |
| `wiki/` | 출처 요약, 개념, 프로젝트 내부 기록, 결정과 작업 이력 |
| `content/manifest.json` | 홈페이지에 사용할 검토 완료 공개 문서 목록 |
| `content/projects/`, `content/study/`, `content/reviews/` | 프로젝트, 기술 공부, 취미 감상문 |
| `content/site.json`, `content/categories.json` | 화면 문구와 분야별 카테고리 |
| `content/media/`, `content/post-settings/` | 게시물 첨부와 표시·출처 설정 |
| `src/` | 공개 콘텐츠 로더, HTML·Markdown 렌더러, 디자인 자산 |
| `templates/` | 출처·프로젝트 기록·CV 초안 양식 |
| `docs/`, `scripts/`, `tests/` | 운영법, 구조 검사·빌드·로컬 서버, 동작 검사 |
| `dist/` | 기본 홈페이지 정적 빌드 결과. 직접 편집하지 않음 |
| `build/devblog-preview/` | 비교와 기능 확인을 위한 별도 미리보기 결과 |

wiki와 콘텐츠 초안은 Git 관리 대상이다. 사이트 공개 목록은 웹 빌드의 입력 경계이며 Git 원격 저장소의 공개 범위를 제어하지 않는다. 자세한 규칙은 [콘텐츠 규약](docs/content-model.md)에 있다.

## 로컬에서 실행하기

Node.js 22 이상을 사용한다. 외부 패키지가 없어 `npm install`은 필요 없다.

```powershell
npm run check
npm run check:sources
npm test
npm run dev
```

`check`는 링크, 필수 메타데이터, wiki 인덱스, 공개 목록과 존재하는 원자료의 SHA-256을 검사한다. `check:sources`는 등록된 원자료가 빠져 있어도 실패한다. 원자료가 제외된 새 clone에서는 `check`로 구조를 점검하고 필요한 원문을 별도로 복원한다. 이 검사는 원문의 주장이나 문서의 의미가 사실인지 판정하지 않는다.

| 명령 | 결과 |
| --- | --- |
| `npm run build` | 검사 후 기본 홈페이지를 `dist/`에 생성 |
| `npm run dev` | 빌드 후 [기본 홈페이지](http://127.0.0.1:4173/) 제공 |
| `npm run edit` | [기본 홈페이지 편집기](http://127.0.0.1:4175/__editor/) 제공. 저장하면 `dist/` 재생성 |
| `npm run build:preview` | 별도 비교용 미리보기 생성 |
| `npm run dev:preview` | [비교용 미리보기](http://127.0.0.1:4174/preview/devblog/) 제공 |
| `npm run edit:preview` | [미리보기 편집기](http://127.0.0.1:4176/__editor/) 제공 |

서버는 `Ctrl+C`로 종료한다. Markdown이나 설정 파일을 직접 수정한 뒤에는 별도 터미널에서 해당 빌드 명령을 실행하고 브라우저를 새로 고침한다. 자동 파일 감시는 제공하지 않는다. 읽기 전용 서버는 `PORT`, 편집기는 `EDITOR_PORT` 환경변수로 포트를 바꿀 수 있다.

빌드는 기존 출력 폴더를 교체한다. 프로젝트 루트 전체를 정적 서버에 노출하지 않는다. 기본 `dist/`에는 공개 목록의 문서, 지정한 디자인 자산과 글이 참조한 첨부만 포함하며 원자료·wiki·초안·편집용 JSON·편집기 코드·테스트 예제는 복사하지 않는다.

## 글과 화면 수정하기

본문·제목·요약은 Obsidian이나 VS Code에서 Markdown으로 수정한다. 메뉴·버튼·빈 상태와 CV 양식 문구는 [content/site.json](content/site.json), 세부 카테고리는 [content/categories.json](content/categories.json)에서 바꾼다. 글마다 frontmatter의 `category`에 해당 분야의 카테고리 ID를 지정한다.

이미지·영상 첨부의 너비·비율·정렬·위치·설명과 글 하단 출처는 `npm run edit`의 로컬 편집기에서 조절한다. 저장 값은 게시물별 JSON에 남으며 기본 홈페이지를 다시 빌드한다. 본문은 브라우저 편집기에서 수정하지 않는다. [글·문구·미디어 편집](docs/media-authoring.md)에 파일 경로와 문법, 저장 절차를 정리했다.

기본 홈페이지는 선택한 Noto Sans KR을 사용한다. 글꼴 비교 버튼과 미디어 예제는 별도 미리보기에서만 제공한다. 화면 구성과 원본 템플릿 이용 조건은 [디자인 안내](docs/design-preview.md)를 참고한다.

## 자료와 글을 쌓는 방법

1. 원자료를 `raw/`에 추가하고 목록에 등록한다.
2. 원문을 읽고 wiki 요약·연결·인덱스·로그를 갱신한다.
3. 공개할 내용은 근거를 대조해 `content/`에서 편집한다.
4. 검토 완료 문서만 공개 목록에 등록하고 빌드한다.

운영 절차는 [워크플로](docs/workflows.md)를 따른다. 기록에는 [출처](templates/source.md), [내부 프로젝트](templates/project-note.md), [공개 프로젝트](templates/publication.md) 양식을 사용할 수 있다. 기술 공부·감상문은 실제로 읽은 원문의 구성과 성격에 맞춰 글마다 작성하며 고정 본문 양식을 사용하지 않는다.

## 현재 콘텐츠와 남은 작업

기술 공부 글 21편을 공개 목록에 등록했으며 출처 28개를 글 하단에 표시한다. 원본 Markdown과 본문 중 근거 링크는 보존하고, 설정에서 대조한 기존 말미 출처 문구만 화면에서 중복 표시하지 않는다. 원문 보관과 재독 범위는 [수집 결과](docs/game-ai-ingestion.md), [재작성 기록](docs/study-rewrite-report.md), [wiki 인덱스](wiki/index.md)에 있다.

실제 소개·프로젝트·취미 감상문은 아직 공개하지 않았다. 홈에는 소개 준비 중 안내를, 소개 페이지에는 [빈 CV 양식](templates/cv.md)을 표시한다. 미공개 프로필 초안이나 자료의 주제로 사용자의 이름·경력을 추정하지 않는다. 실제 정보가 준비되면 [CV 작성 안내](docs/cv-authoring.md)와 [홈페이지 구성](docs/website-plan.md)에 따라 검토 후 등록한다.

## GitHub Pages 배포

[DaysOfBlue/DaysOfBlue.github.io](https://github.com/DaysOfBlue/DaysOfBlue.github.io)의 `main`에 push하면 [배포 워크플로](.github/workflows/pages.yml)가 Node.js 22에서 테스트·빌드를 실행하고 `dist/`만 GitHub Pages에 배포한다. 사이트 주소는 [https://daysofblue.github.io/](https://daysofblue.github.io/)다. 실행 결과는 [Actions](https://github.com/DaysOfBlue/DaysOfBlue.github.io/actions/workflows/pages.yml)에서 확인한다.

로컬 편집기 저장은 GitHub push와 별개다. 웹에는 공개 목록의 글과 지정한 자산만 배포하지만 공개 저장소에서는 Git 관리 대상인 wiki·초안·설정·편집기 소스도 읽을 수 있다. 원자료와 로컬 생성물은 Git에서 제외한다. 수정·검사·커밋·배포 절차와 공개 범위는 [배포 안내](docs/github-pages.md)에 정리했다.
