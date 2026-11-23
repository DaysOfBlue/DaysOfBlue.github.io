---
id: study-unreal-rendering-roadmap
title: "Lumen World Cache·AVBOIT·Nanite를 소개한 짧은 로드맵"
summary: "공식 발표에 적힌 세 가지 변경과, 발표만으로는 알 수 없는 내용을 구분한다."
type: study
category: rendering
status: reviewed
visibility: public
created: 2026-11-18
updated: 2026-11-18
sources: ["src-web-epic-lighting"]
---

# Lumen World Cache·AVBOIT·Nanite를 소개한 짧은 로드맵

Thomas Convard가 2026-11-09에 올린 [Lighting and Rendering Updates](https://forums.unrealengine.com/t/lighting-and-rendering-updates/2853016)는 세 기능을 짧게 소개한다. 원문이 제시한 순서는 조명 캐시, 반투명 표면, 지오메트리 컬링이다.

- Lumen World Cache는 수동 표면 캐시 설정을 자동 갱신되는 GPU 기반 캐시로 대체한다.
- AVBOIT는 겹치는 반투명 표면을 사람이 순서대로 배치하지 않아도 표현하도록 하는 순서 독립 투명도 기법이다.
- Nanite 컬링 개선은 조밀한 지오메트리를 렌더링하는 비용을 낮추는 변경으로 소개된다.

세 항목이 다루는 문제는 설정 부담, 투명 표면의 합성, 그릴 지오메트리의 선별로 서로 다르다. 하나의 공통 성능 향상률로 합칠 근거는 없다. 자동 캐시 갱신의 비용이나 AVBOIT의 구체적인 구현도 이 짧은 게시물에는 설명돼 있지 않다.

최초 게시물 본문을 다시 확인했다. 게시물에는 배포 버전·일정·벤치마크 수치가 제시돼 있지 않다. 뒤에 달린 사용자 댓글은 별도의 경험 보고이며 기능 검증의 근거로 사용하지 않았다.
