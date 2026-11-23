---
id: decision-home-navigation
title: 자기소개와 기술·취미 페이지 연결
type: decision
status: reviewed
visibility: internal
created: 2026-11-18
updated: 2026-11-18
sources: ["src-home-navigation-brief", "src-section-separation-brief"]
---

# 자기소개와 기술·취미 페이지 연결

[사용자 요청](../sources/home-navigation-brief.md)에 따라 메인 본문의 첫 영역을 자기소개로 둔다. 공개 프로필의 요약을 표시하고 요약이 없으면 본문을 사용한다. 프로필이 미공개이면 준비 중 안내만 표시한다.

기술 `/tech/`에는 프로젝트와 기술 공부를 별도 목록으로 모으고, 취미 `/hobby/`에는 감상문을 표시한다. 메인에는 두 영역의 미리보기를 전환하는 탭을 두며 독립 페이지로 가는 링크도 제공한다. 기존 분류와 목록·상세 주소는 유지한다.

전환은 기본 브라우저 표시와 작은 JavaScript 모듈로 구현한다. 클릭·키보드와 해시 주소를 지원한다. 스크립트를 사용하지 못하면 두 영역과 일반 앵커 링크를 제공한다. 원문·초안·내부 wiki는 계속 공개 출력에서 제외한다.

별도 CSS·이미지·애니메이션과 외부 패키지는 추가하지 않는다. 빌드는 지정한 홈 전환 스크립트 한 개만 정적 자산으로 복사한다.
