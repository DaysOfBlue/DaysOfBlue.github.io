# 비교용 한글 글꼴

디자인 테스트에서 Pretendard와 Noto Sans KR을 동일한 크기·굵기로 비교한다. 두 글꼴은 수정하지 않고 공식 저장소에서 입수했다. 모든 파일은 SIL OFL 1.1을 따른다. 라이선스 원문은 각 글꼴 파일 옆에 보존하며, 빌드 시 `fonts.css`의 주석에도 포함한다.

| 글꼴 | 원본 | SHA-256 |
| --- | --- | --- |
| Pretendard Variable 1.3.9 | [공식 파일](https://github.com/orioncactus/pretendard/blob/v1.3.9/packages/pretendard/dist/web/variable/woff2/PretendardVariable.woff2) | `9599f12fd42fc0bce1cd50b47a0c022e108d7aa64dd0d1bb0ed44f3282d900b4` |
| Noto Sans KR Variable | [Google Fonts 파일](https://github.com/google/fonts/blob/7af0d90b4d532ffa4b041937b560c6df4e7b1e95/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf) | `194018e6b2b293a7964f037b25c0249ce1418bc9ab3c971060a03aa57861e252` |

입수일은 2026-11-18(한국시간)이다. 원본 라이선스는 [Pretendard](OFL-Pretendard.txt), [Noto Sans KR](OFL-NotoSansKR.txt)에 있다. 글꼴 파일을 단독 판매할 수 없고, 재배포 시 원래 저작권과 라이선스를 유지해야 한다.

비교용 CSS family 이름만 구분하고 글꼴 내부 이름·윤곽·굵기를 수정하지 않았다. 외부 CDN 없이 테스트 서버에서 직접 제공한다. Noto Sans KR의 원본 TTF는 약 10.4MB다. 정식 적용 시에는 선택한 글꼴의 웹 전송 형식을 별도로 정한다.
