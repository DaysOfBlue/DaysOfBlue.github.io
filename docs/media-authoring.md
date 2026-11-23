# 글·화면 문구와 미디어 편집

글과 화면 문구는 Obsidian·VS Code에서 수정하고, 이미지·영상의 표시 크기와 글 하단 출처는 로컬 브라우저 편집기에서 조절한다. 기본 홈페이지와 별도 DevBlog 미리보기에서 같은 문법과 설정을 사용한다. 로컬 빌드 적용과 원격 배포는 별개다.

## 수정할 파일

| 대상 | 위치 | 작성 방법 |
| --- | --- | --- |
| 본문·제목·요약·카테고리 | `content/projects/`, `content/study/`, `content/reviews/`의 Markdown | 파일 편집 |
| 메뉴·버튼·분야 설명·빈 상태·CV 양식 문구 | [content/site.json](../content/site.json) | 파일 편집 |
| 세부 카테고리 이름과 순서 | [content/categories.json](../content/categories.json) | 파일 편집 |
| 첨부 원본 | `content/media/<게시물-id>/` | 직접 복사하거나 편집기에서 업로드 |
| 미디어 표시 설정·공개용 출처 | `content/post-settings/<게시물-id>.json` | 브라우저 편집기 또는 JSON 파일 편집 |

게시물 ID는 Markdown frontmatter의 `id`다. URL의 slug와 다를 수 있다. 기존 공개 글의 원본 Markdown은 유지한다. 별도의 [미디어 테스트 페이지](http://127.0.0.1:4174/preview/devblog/media-lab/)에 둔 이미지와 3초 영상은 기능 확인용이며 기본 홈페이지에는 포함하지 않는다.

## 시작과 저장

기본 홈페이지는 다음 명령으로 연다.

```powershell
npm run dev
```

[기본 홈페이지](http://127.0.0.1:4173/)의 기본 포트는 4173이다. 브라우저에서 첨부와 출처를 수정하려면 별도 터미널에서 다음 명령을 실행한다.

```powershell
npm run edit
```

[로컬 편집기](http://127.0.0.1:4175/__editor/)의 기본 포트는 4175다. 공개 목록에 등록된 프로젝트·기술 공부·감상문을 표시하며 소개 초안이나 저장소의 임의 파일은 편집하지 않는다. 편집 화면과 API는 로컬 서버에서만 제공하고 정적 출력에는 복사하지 않는다.

1. 편집할 글을 고른다.
2. 파일을 첨부하거나 외부 미디어 URL을 추가한다.
3. 첨부를 선택하고 너비·비율·정렬·위치·설명을 조절한다. 미리보기에는 저장 전에 바로 표시된다.
4. 필요한 공개용 출처를 입력한다.
5. `파일에 저장`을 누른다. 게시물별 JSON을 저장하고 기본 홈페이지의 `dist/`를 다시 빌드한다.

파일 첨부는 업로드 시 파일과 초기 표시 설정을 저장하고 기본 홈페이지를 다시 생성한다. 이후 조절한 값은 `파일에 저장`을 눌러야 반영된다. 첨부 목록에서 제거해도 원본 파일은 삭제하지 않는다. 다른 편집으로 설정이 바뀌면 새로 고침한 뒤 다시 저장한다.

Markdown 본문은 편집기에서 수정하지 않는다. Obsidian·VS Code에서 본문·문구 설정·JSON 파일을 직접 바꾼 뒤에는 다음 명령으로 기본 홈페이지를 다시 만들고 브라우저를 새로 고침한다. 자동 파일 감시와 재빌드는 제공하지 않는다.

```powershell
npm run check
npm run build
```

별도 비교용 화면은 `npm run dev:preview`로 [4174 포트](http://127.0.0.1:4174/preview/devblog/)에서 연다. `npm run edit:preview`는 [4176 포트의 편집기](http://127.0.0.1:4176/__editor/)를 제공하며 공개 글과 기능 예제를 편집하고 별도 미리보기를 다시 생성한다. 파일을 직접 수정한 경우 `npm run build:preview`로 갱신한다. 두 편집기는 같은 공개 글의 설정 파일을 사용하므로 동시 수정은 피한다. 기능 예제는 이 비교용 경로에서만 제공한다.

## 화면 문구 바꾸기

`content/site.json`의 `title`·`description`은 사이트 이름과 설명, `sidebar`는 사이드바, `navigation`은 메뉴 이름, `labels`는 버튼과 공통 안내, `sections`는 분야별 제목·설명·빈 상태, `cv`는 빈 CV 양식 문구다. 실제 공개 프로필은 계속 `content/profile.md`와 공개 목록으로 관리한다.

예를 들어 `labels.readMore`를 바꾸면 목록의 `계속 읽기` 문구를 바꿀 수 있고, `labels.references`는 글 하단 출처 제목을 바꾼다. 메뉴 이름을 바꾸어도 연결 경로나 문서 종류는 바뀌지 않는다.

설정 객체는 필요한 항목만 지정하면 나머지를 기본값과 합친다. `cv.sections` 배열을 지정하면 CV 항목 목록 전체를 대체한다. 항목의 `period`는 생략하거나 빈 문자열로 둘 수 있다. 다른 문구는 비어 있지 않은 문자열로 작성한다. 문구에 적은 HTML은 실행하지 않고 문자로 표시한다.

`{count}`는 공개 글 수, `{section}`은 분야 이름, `{category}`는 카테고리 이름, 탭 안내의 `{projects}`·`{tech}`·`{hobby}`는 각 분야 이름으로 바뀐다. 해당 설정을 수정할 때 치환 표시를 유지한다.

## 본문에 이미지·영상 넣기

첨부는 해당 글의 `content/media/<게시물-id>/`에 둔다. 예를 들어 ID가 `study-example`이면 파일은 `content/media/study-example/diagram.webp`에 보관한다. 본문에 넣지 않고 편집기에서 추가한 첨부는 표시 설정의 위치에 따라 배치된다.

이미지는 별도의 한 줄로 작성하고 앞뒤에 빈 줄을 둔다. `/media/`로 시작하는 공개 첨부 경로나 글 파일 기준의 상대경로를 사용할 수 있다.

```markdown
앞 문단입니다.

![이미지를 설명하는 대체 텍스트](/media/study-example/diagram.webp)

다음 문단입니다.
```

`content/study/`의 글에서 같은 파일을 상대경로로 적으면 다음과 같다.

```markdown
![이미지를 설명하는 대체 텍스트](../media/study-example/diagram.webp)
```

이미지 뒤에 따옴표 제목을 적으면 초기 캡션으로 사용한다. 브라우저 편집기에서 캡션과 대체 설명을 따로 바꿀 수 있다.

```markdown
![처리 순서도](/media/study-example/diagram.webp "순서도 설명")
```

MP4·WebM 영상은 다음 블록을 사용한다. `:::video` 뒤에 파일 경로나 HTTPS 영상 파일 URL을 쓰고 `:::`로 닫는다. 가운데 문장은 캡션이다.

```markdown
:::video /media/study-example/demo.mp4
영상에 대한 설명입니다.
:::
```

YouTube는 영상 주소를 다음 블록에 넣는다.

```markdown
:::youtube https://www.youtube.com/watch?v=영상ID
영상에 대한 설명입니다.
:::
```

위 `영상ID` 자리는 실제 영상 ID로 바꾼다. 외부 첨부는 HTTPS를 사용하고, 영상 파일은 MP4·WebM URL을 사용한다. YouTube는 영상 ID가 확인되는 주소를 사용한다. 브라우저 업로드는 PNG·JPG·WebP·GIF·MP4·WebM을 파일당 최대 20MB까지 받는다. 큰 영상은 외부 영상 파일 URL이나 YouTube 주소로 연결한다. 영상은 재생 컨트롤을 제공하며 자동 재생하지 않는다.

본문에 작성한 첨부의 원래 위치는 `inline`이다. 편집기에서 다른 위치로 옮기거나 너비를 조절할 수 있다. 본문 첨부 자체를 제거하려면 Markdown의 이미지 줄이나 영상 블록을 지운다. 일반 HTML의 `<img>`·`<video>`·`<iframe>`를 직접 실행하는 방식은 지원하지 않는다.

## 표시 설정 JSON

브라우저에서 저장한 값은 다음 형태다. JSON을 직접 수정할 수도 있다. 이 예의 파일 경로와 제목은 작성 방법을 보여 주는 자리이며 실제 첨부 경로로 바꿔야 한다.

```json
{
  "version": 1,
  "media": [
    {
      "src": "/media/study-example/diagram.webp",
      "kind": "image",
      "alt": "이미지의 내용을 설명합니다.",
      "caption": "그림 아래에 표시할 설명입니다.",
      "width": 75,
      "ratio": "16:9",
      "fit": "contain",
      "align": "center",
      "position": "after:1"
    }
  ],
  "references": [
    {
      "title": "참고 자료 제목",
      "url": "https://example.com/article",
      "note": "어느 내용을 참고했는지 적습니다."
    }
  ]
}
```

| 항목 | 값 |
| --- | --- |
| `kind` | `image`, `video`, `youtube` |
| `width` | 본문 너비의 25~100% |
| `ratio` | `auto`(원본), `16:9`, `4:3`, `1:1` |
| `fit` | `contain`(전체 표시), `cover`(프레임 채우기) |
| `align` | `left`, `center`, `right` |
| `position` | `inline`(본문 위치), `start`(본문 앞), `end`(본문 뒤), `after:N`(N번째 문단 뒤) |

지정한 문단 번호가 없으면 글 끝에 표시한다. 표시 설정은 원본 이미지·영상의 바이트를 바꾸지 않는다. `media`와 `references`는 없어도 되는 개별 항목을 담는 배열이며 사용하지 않으면 `[]`로 둔다.

## 글 하단 출처

출처가 있으면 본문 다음에 출처 영역을 표시하며, 없으면 영역을 숨긴다. 본문 목차나 필수 소제목은 정하지 않는다.

- `title`, `url`: 출처 제목과 공개 가능한 HTTP(S) 링크.
- `author`: 확인한 작성자. 선택 항목이다.
- `published`: 확인한 발행일을 `YYYY-MM-DD`로 작성한다. 모르면 비운다.
- `note`: 참고한 범위나 확인 한계를 적는다. 선택 항목이다.

본문 frontmatter의 `sources`는 내부 원자료 ID이므로 공개용 `references`와 별개다. 내부 `raw/manifest.json`을 그대로 출처 영역으로 출력하지 않는다. 본문 중 근거를 설명하는 링크도 그대로 유지한다.

기존 기술 글 21편은 작성자·날짜·링크·확인 범위를 대조해 출처 28개를 하단 영역에 등록했다. 원본 Markdown은 유지하며, 게시물별 JSON의 선택 필드 `referenceBlocks`에 명시한 말미 문구만 기본 홈페이지와 미리보기 본문에서 제외한다. 설명과 확인 범위가 한 문단에 섞인 경우 확인 범위에 해당하는 마지막 문장만 옮긴다. 일반 편집기로 출처를 수정·저장해도 이 이동 설정은 보존된다.

`referenceBlocks`는 본문에서 옮긴 정확한 말미 문자열의 배열이다. 새 글에 필수인 항목은 아니며 일반 링크를 자동으로 찾아 숨기는 기능도 아니다. 원본의 해당 문구를 고치거나 뒤에 새 문단을 추가하면 일치 검사가 오류를 알리므로, 원문과 출처 영역을 다시 대조해 이동 설정을 갱신한다. 본문에서 출처 문구를 직접 제거했다면 그에 맞춰 `referenceBlocks`도 제거한다. 이동 설정이 있는 동안에는 대체 출처를 하나 이상 남겨야 한다.

게시물별 JSON이 없는 경우 frontmatter에 한 줄 JSON 배열로 작성한 `references`도 읽는다. 여러 줄 YAML 객체 문법은 지원하지 않는다. 편집기에서 저장하면 게시물별 JSON이 기준이 되므로 평소에는 한 곳에서 관리하는 편이 낫다.

```yaml
references: [{"title":"참고 자료 제목","url":"https://example.com/article"}]
```

## 공개 범위

기본 홈페이지는 공개 목록에 등록된 글이 실제 참조하는 첨부만 출력한다. 별도 미리보기는 전용 테스트 예제가 참조하는 첨부도 포함한다. `raw/`, `wiki/`, 미등록 초안, 미디어 폴더 전체, 편집용 JSON과 편집기 코드는 통째로 복사하지 않는다. 새 글은 계속 초안·검토·공개 목록 등록 절차를 따른다.

미디어와 출처 화면은 기본 `dist/` 빌드에서도 지원한다. 빌드는 로컬 정적 결과만 생성하며 GitHub push나 원격 배포를 수행하지 않는다.
