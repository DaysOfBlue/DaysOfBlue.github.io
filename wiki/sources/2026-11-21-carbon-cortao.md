---
id: source-daily-20261121-carbon-cortao
title: "CORTAO: 깊이·법선으로 원형 가림막을 만들어 실시간 AO 계산하기"
type: source
status: reviewed
visibility: internal
created: 2026-11-21
updated: 2026-11-21
sources: ["src-daily-20261121-carbon-cortao"]
---

# CORTAO: 깊이·법선으로 원형 가림막을 만들어 실시간 AO 계산하기

## 원문과 확인 범위

- **원제·출처:** [Fenris Creations의 CORTAO 공개](https://fenris.com/news/2026/fenris-creations-reveals-cortao-open-source-rendering-technology-for-dynamic-game-worlds), 구현자 Daniel Isheden
- **공개일·형식:** 2026-11-12 기업 발표와 [Carbon 기술 README](https://github.com/carbonengine/CORTAO/blob/ac41967b65080fe200e3a46bee3be9c7e0cb920a/README.md). README의 1.00 기록은 11월 5일로, Git 태그 날짜는 아닙니다. 이번 회차의 렌더링 보완 자료.
- **비교 대상:** [저자의 별도 참조 구현](https://github.com/theagentd/CORTAO/tree/420b168d88dd6f9276077ba62f3711cac9d7b46c)

## 주요 내용

- 주변 깊이와 뷰 공간 법선으로 표면을 작은 원형 가림막으로 근사합니다. 이 근사 형상에 화면 공간에서 광선을 쏴 주변광 차폐(AO)를 계산합니다. 전체 장면의 지오메트리를 추적하는 하드웨어 레이 트레이싱은 아닙니다.
- 프리패스에서 선형 깊이와 법선을 밉맵 버퍼에 압축하고, 메인 패스가 가림 정도와 선택적 굽은 법선(덜 가려진 방향)을 출력합니다. 필요할 때만 공간 필터로 노이즈를 줄입니다.
- Carbon 구현은 HLSL·원근 투영용입니다. 문서에 나온 시험 대상은 DX12와 워크어라운드를 적용한 DX11입니다. 직교 투영과 GLSL 지원은 별도 참조 구현의 범위입니다.

## 프로젝트에 적용한 해석

외부 셰이더를 붙일 때는 알고리즘만 보기보다 깊이 선형화, 법선 좌표계, 기존 AO·후처리 사이의 삽입 지점을 먼저 확인하세요. 기존 AO와 같은 기기·해상도·카메라 경로에서 프리패스와 메인 패스 시간을 따로 재고, 가장자리 후광과 이동 중 깜빡임을 함께 비교하면 전환 비용을 평가하기 좋습니다.

## 한계와 이용 조건

화면 밖 형상은 입력에 없고 개발사의 비교 장면은 일반 성능을 보장하지 않습니다. 셰이더를 설치하거나 테스트하지 않았습니다. [지정 커밋의 MIT 라이선스](https://github.com/carbonengine/CORTAO/blob/ac41967b65080fe200e3a46bee3be9c7e0cb920a/LICENSE.md)는 소프트웨어와 동봉 문서를 대상으로 합니다. 발표 페이지, 연결 영상, 이미지와 벤치마크 그래프는 별도 권리이므로 링크만 남깁니다.

## 관련 기록

- [링크 메타데이터](../../raw/game-ai/2026-11-21/carbon-cortao.link.json) (원문 복제본 아님)
- [전체 인덱스](../index.md)
