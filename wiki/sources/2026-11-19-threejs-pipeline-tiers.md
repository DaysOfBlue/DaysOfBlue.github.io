---
id: source-daily-20261119-threejs-pipeline-tiers
title: "Three.js 기기별 렌더링 파이프라인과 G-buffer 설계"
type: source
status: reviewed
visibility: internal
created: 2026-11-19
updated: 2026-11-19
sources: ["src-daily-20261119-threejs-pipeline-tiers"]
---

# Three.js 기기별 렌더링 파이프라인과 G-buffer 설계

## 원문과 확인 범위

- 원제: Four Pipeline Tiers for Three.js, and the G-Buffer Each Needs
- 저자·출처: Ben Houston 개인 기술 블로그, 직접 설계한 파이프라인 설명
- 공개일: 2026-11-08 (원문 상단 직접 확인)
- 확인일·배포분: 2026-11-19 KST
- 형식·언어: 기술 글, 영어, 원문 표시 11분
- 원문: https://ben3d.ca/blog/aaa-quality-on-a-web-budget
- 연재 개요: https://ben3d.ca/series/quest-for-aaa-quality-in-threejs
- 분류: WebGPU / Three.js / 렌더링 아키텍처 / 메모리 대역폭

## 주요 내용

- 동일한 조명 기반 위에 Reduced, Baked, Recommended, Enhanced의 네 등급을 두고 저사양 기기에서는 고비용 화면 공간 효과를 제외하는 설계입니다.
- 정적 표면은 라이트맵, 움직이는 객체는 라이트 프로브, 실내 반사는 반사 프로브를 사용하고, 상위 등급에서 SSGI·SSR·GTAO를 추가합니다.
- Recommended 구성은 깊이·법선·재질·모션을 픽셀당 총 16바이트로 저장합니다. 포워드 패스가 재질을 직접 평가하므로 G-buffer에서 albedo를 생략하는 이유를 설명합니다.
- 패스별 읽기·쓰기 비용을 계산해 해상도 축소와 TAAU의 절충을 비교합니다. 이는 실제 GPU 메모리 트래픽 측정값이 아닌 비용 모델입니다.

## 프로젝트에 적용한 해석

웹 3D나 저사양 대응에서 효과를 무작정 켜고 끄는 대신, 어떤 버퍼와 패스를 함께 제거할지 설계하는 데 유용합니다. 엔진 선택과 무관하게 기기 등급별 품질표를 작성할 때 참고할 수 있습니다.

**적용 제안:** 현재 프로젝트의 렌더 타깃 포맷·해상도·수명을 목록화하고, 저사양 등급에서 제거 가능한 패스를 묶어 실기기로 검증하세요. 이는 편집자의 적용 제안입니다.

## 한계와 남은 질문

본문을 읽었으며 코드를 실행하지 않았습니다. 연재에는 구현 완료·검토 중·제안 단계가 섞여 있으므로 전부 정식 Three.js 기능이라고 해석하면 안 됩니다. 11월 8일 자료를 보완 읽을거리로 선정했으며 당일 신작은 아닙니다. 원문 재배포 라이선스를 확인하지 않아 원문·이미지는 저장하지 않고 링크와 이 요약만 기록했습니다.

## 관련 기록

- [링크 메타데이터](../../raw/game-ai/2026-11-19/threejs-pipeline-tiers.link.json) (원문 복제본 아님)
- [전체 인덱스](../index.md)
