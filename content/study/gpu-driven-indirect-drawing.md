---
id: study-gpu-driven-indirect-drawing
title: "Unity MDI 샘플의 지원 조건과 GPU 그리기 흐름"
summary: "지원 환경과 샘플 실행 조건부터 간접 명령 압축·셀 컬링·LOD 순서로 README를 읽는다."
type: study
category: rendering
status: reviewed
visibility: public
created: 2026-11-18
updated: 2026-11-18
sources: ["src-web-unity-mdi-sample"]
---

# Unity MDI 샘플의 지원 조건과 GPU 그리기 흐름

## 지원 환경을 확인하고 장면 열기

공식 README는 Unity 6000.7.0b9 이상을 요구한다. MDI는 UGK의 Vulkan 경로에서 지원하며, count buffer에는 추가 기기 기능이 필요하다. 미지원 환경에서는 셀·LOD별 간접 그리기로 돌아간다. MDI-Demo 장면의 HUD에서 sub-draw와 인스턴스 수를 확인할 수 있다. 플랫폼을 바꾸면 압축 형식이 유지되는 텍스처 배열을 다시 구워야 한다.

## GPU가 인자 버퍼와 명령 수를 쓰는 과정

식생 종류와 LOD가 공유하는 정점·인덱스 버퍼를 준비하고, compute가 살아남은 인스턴스 수를 간접 인자에 기록한다. count buffer 지원 시에는 비어 있지 않은 명령을 압축하고 그 개수도 GPU에서 결정한다.

셀 컬링에서는 셀을 완전한 안쪽·바깥쪽·경계로 구분한다. 바깥 셀은 버리고 안쪽 셀은 개별 검사를 생략하며, 경계 셀의 인스턴스만 추가 검사한다. 셀을 세분화하면 컬링이 정밀해지지만 sub-draw 수는 늘어난다.

## 거리에 따른 형상과 전환 구간

LOD는 거리에 따라 정점 범위를 바꾼다. 전환 구간은 두 LOD를 함께 그리고 디더링으로 섞으므로 중복 그리기 비용도 있다. README의 인스턴스·정점 감소와 프레임 시간은 샘플 조건의 보고다.

[Unity Technologies의 MDI README](https://github.com/Unity-Technologies/mdi-sample), 발행일 미표기. 전체 본문·코드·표를 재독했다. 보관하지 못한 UGK 포럼은 근거에서 제외했고 샘플 실행은 하지 않았다.
