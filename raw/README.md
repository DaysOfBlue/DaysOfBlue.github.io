# 원자료 보관

입수한 파일을 수정 없이 보관한다. 붙여넣은 LLM Wiki 원문은 `llm-wiki.txt`, 초기 사용자 요청은 `portfolio-brief.txt`, 홈페이지 기본 틀 요청은 `homepage-scaffold-brief.txt`에 저장했다. 게임 개발·AI 자료 모음 7개는 `game-ai/`에 보관하고 [manifest.json](manifest.json)에 등록했다. 새 자료 모음도 같은 폴더에 저장한다.

원자료 본문은 Git에서 제외하며 목록과 이 사용법만 관리한다. clone으로 복원되지 않는 원문은 별도 백업이 필요하다. 파일의 공개나 재배포 권한을 목록 등록으로 가정하지 않는다.

목록의 경로는 저장소 루트 기준이다. `sha256`은 원본 바이트의 해시다. `pending` 자료를 실제로 읽고 요약을 작성한 뒤에만 `ingested`와 `wiki_page`를 설정한다. `provided-text`는 제공된 문서를 읽었다는 범위이며 문서 안의 모든 주장이나 외부 링크를 검증했다는 뜻이 아니다.

새 원문을 추가할 때 사용할 수 있는 PowerShell 명령:

```powershell
(Get-FileHash -LiteralPath 'raw/파일명.txt' -Algorithm SHA256).Hash.ToLowerInvariant()
```

원본의 수정판은 새 파일과 새 ID로 등록한다. 원문 오류의 정정과 해석은 wiki에 기록한다.

웹 원문 사본은 `web/game-ai/2026-11-18/`의 출처별 폴더에 있다. `original.*`는 내려받은 응답 본문이고 `capture.json`은 주소·수집 시각·해시를 기록한다. 연결된 이미지와 영상까지 포함한 완전한 오프라인 사이트는 아니다. [웹 원문 수집 규칙](../docs/source-archiving.md)과 [이번 수집 결과](../docs/game-ai-ingestion.md)를 참고한다.
