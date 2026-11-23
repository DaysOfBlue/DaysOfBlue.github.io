# 홈페이지 콘텐츠

이 폴더에는 공개할 수 있는 내용만 작성한다. 초안도 Git 관리 대상이다. `visibility: public`은 의도한 독자를 뜻하며 게시 여부는 [manifest.json](manifest.json)의 목록으로 정한다.

프로젝트·기술·취미의 세부 카테고리는 [categories.json](categories.json)에서 설정한다. 각 글의 frontmatter에 `category: rendering`처럼 해당 분야의 ID 하나를 지정하며 생략하면 미분류다. 기본 홈페이지와 디자인 미리보기에서 같은 분류를 사용한다. 추가·변경 방법은 [설정 안내](../docs/categories.md)에 있다.

메뉴·버튼·분야 설명·빈 상태 문구는 [site.json](site.json)에서 수정한다. 글 본문은 Markdown으로 작성하고, 첨부는 `media/<게시물-id>/`, 미디어 배치와 공개용 출처는 `post-settings/<게시물-id>.json`에서 관리한다. `npm run edit`의 [로컬 편집기](http://127.0.0.1:4175/__editor/)에서도 첨부와 출처를 저장할 수 있다. 저장하면 기본 홈페이지를 다시 생성한다. 별도 비교용 편집기는 `npm run edit:preview`로 실행한다. [작성 안내](../docs/media-authoring.md)를 참고한다.

기술 공부 글 21편을 공개 목록에 등록했다. [소개](profile.md)와 [홈페이지 프로젝트](projects/homepage.md)는 확인된 범위와 필요한 정보를 적은 `draft` 문서다. [기술 공부](study/README.md)와 [취미 감상문](reviews/README.md)은 별도 폴더와 글 형식을 사용한다. 예시 경력이나 가상 감상을 채워 넣지 않았다.

검토를 끝낸 문서만 `reviewed`로 바꾸고 공개 목록에 등록한다. 정적 빌드는 해당 목록에 등록된 문서만 읽는다. 프로젝트는 `/projects/<slug>`, 기술 공부는 `/study/<slug>`, 취미 감상문은 `/reviews/<slug>`, 소개는 `/about`에 연결한다. `featured`는 호환 메타데이터이며 현재 화면에 별도의 대표 프로젝트 영역은 없다. 초안·내부 문서·원자료는 출력하지 않는다. 테스트용 미디어 예제도 기본 홈페이지에는 포함하지 않는다.
