# GitHub Pages 배포

[DaysOfBlue/DaysOfBlue.github.io](https://github.com/DaysOfBlue/DaysOfBlue.github.io)의 `main` 브랜치를 배포 기준으로 사용한다. 사이트 주소는 [https://daysofblue.github.io/](https://daysofblue.github.io/)다. 저장소의 Pages 게시 방식은 GitHub Actions로 설정한다.

## 수정하고 배포하기

1. Obsidian·VS Code에서 본문과 화면 문구를 수정한다. 첨부와 출처는 `npm run edit`의 로컬 편집기에서도 조절할 수 있다.
2. 새 글은 출처·내용을 검토한 뒤 `reviewed`, `visibility: public`으로 지정하고 `content/manifest.json`에 등록한다. 초안은 등록하지 않는다.
3. `npm test`와 `npm run build`로 검사하고, `npm run dev`에서 화면을 확인한다. 원자료가 모두 있는 로컬 환경에서는 `npm run check:sources`도 실행한다.
4. Git 변경을 검토하고 커밋한 뒤 `main`에 push한다. [배포 워크플로](../.github/workflows/pages.yml)가 테스트와 빌드를 실행하고 성공한 `dist/`를 Pages에 배포한다.
5. [Actions 실행 목록](https://github.com/DaysOfBlue/DaysOfBlue.github.io/actions/workflows/pages.yml)에서 해당 커밋의 결과를 확인한다. 실패한 실행은 로그를 확인해 수정한다.

동일한 소스를 다시 배포하려면 Actions에서 이 워크플로의 `Run workflow`를 열고 `main`을 선택한다. 다른 브랜치에서 수동 실행하면 배포하지 않는다. 배포는 한 번에 하나씩 진행하며 진행 중인 배포를 새 push로 취소하지 않는다.

로컬 편집기에서 저장한 내용은 파일과 로컬 빌드에 반영된다. Git commit·push는 별도로 해야 하며, 브라우저 편집기가 GitHub에 자동으로 게시하지 않는다. 공개 사이트에는 편집기와 쓰기 API가 없어 방문자가 글을 수정할 수 없다.

## 배포되는 파일

Node.js 22와 저장소에 있는 빌드 코드를 사용한다. 외부 npm 의존성이 없어 설치 단계는 필요 없다. 빌드는 구조 검사 후 공개 목록의 문서, 지정한 디자인 자산과 공개 글이 참조한 첨부만 `dist/`에 생성한다. 워크플로는 이 폴더만 업로드한다.

원자료·wiki·미등록 초안·편집용 JSON·로컬 편집기·비교용 테스트 화면은 웹 배포 결과에 넣지 않는다. 기존 임시 저장소의 Jekyll 템플릿과 자산은 사용자 요청에 따라 현재 소스에서 제거했다. 과거 커밋 이력은 유지한다. 저장소 루트 전체를 업로드하거나 Jekyll로 다시 빌드하지 않는다.

원자료 본문은 Git에서 제외하므로 GitHub Actions checkout에는 없다. CI에서는 원자료 누락을 경고로 다루는 일반 구조 검사를 사용한다. 원자료 존재까지 요구하는 `npm run check:sources`는 원문을 복원한 로컬 환경에서 실행한다.

## 저장소 공개와 웹 공개

이 저장소는 공개 저장소다. Git으로 관리하는 wiki, 콘텐츠 초안, 설정과 로컬 편집기 소스는 GitHub에서 읽을 수 있다. `content/manifest.json`은 방문자용 웹사이트의 빌드 범위만 정하며 GitHub의 파일 공개를 제한하지 않는다. 비밀이나 개인정보를 이 파일들에 넣지 않는다.

원자료는 `.gitignore`로 제외하고 `raw/README.md`와 `raw/manifest.json`만 Git으로 관리한다. `dist/`, `build/`, 환경 설정·인증 파일도 Git에서 제외한다. 수정 후에는 커밋할 파일 목록과 웹 빌드 결과를 각각 확인한다.

## 설정과 이용 조건

빌드 작업은 저장소 읽기와 Pages 설정 읽기 권한을 사용한다. 배포 작업만 `pages: write`, `id-token: write` 권한을 가지며 `github-pages` 환경에서 실행한다. 저장소의 환경 규칙도 `main` 배포를 허용해야 한다. 워크플로의 공식 GitHub Actions는 확인한 커밋 SHA에 고정한다.

DevBlog 제작자 링크와 포함된 라이브러리·글꼴의 고지는 배포 결과에서도 유지한다. 디자인과 글꼴의 출처는 [디자인 안내](design-preview.md)를 참고한다.

설정 방식은 [GitHub Pages 사용자 지정 워크플로 공식 문서](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)를 기준으로 한다. 실제 배포 성공 여부와 확인 범위는 [작업 로그](../wiki/log.md)에 기록한다.
