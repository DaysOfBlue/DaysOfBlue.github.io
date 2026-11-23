---
id: source-daily-20261123-spartan-relax-specular
title: "Spartan Engine: 반사 디노이저를 RELAX로 바꿀 때 함께 손본 입력들"
type: source
status: reviewed
visibility: internal
created: 2026-11-23
updated: 2026-11-23
sources: ["src-daily-20261123-spartan-relax-specular"]
---

# Spartan Engine: 반사 디노이저를 RELAX로 바꿀 때 함께 손본 입력들

## 원문과 확인 범위

- **출처·형식:** [Spartan Engine 공식 GitHub 릴리스](https://github.com/PanosK92/SpartanEngine/releases/tag/2026.11.22.02.23), 자동 생성 영문 프리릴리스와 [구현 커밋](https://github.com/PanosK92/SpartanEngine/commit/e2a394fbc7ab07387e3d9aa2b6eb4e12482ed392).
- **공개일:** 2026-11-22 11:49 KST (GitHub 공개 시각 02:49 UTC). 태그의 02:23은 빌드 시각입니다.

## 주요 내용

- 확률적으로 계산한 반사의 노이즈를 줄이는 NVIDIA NRD에서 Vulkan·Direct3D 12 반사 경로만 `REBLUR_SPECULAR`에서 `RELAX_SPECULAR`로 바꿨습니다. 고대비 반사의 윤곽 번짐과 프레임마다 일렁이는 노이즈를 줄이는 것이 목적입니다.
- 디노이저 선택만 바꾼 것이 아닙니다. 깊이를 점 샘플링 후 선형화하고, 실제 렌더 영역 밖 패딩을 제외하며, 하늘 등 유효한 표면이 없는 곳의 법선에도 적절한 값을 넣었습니다. 반사면이 움직일 때는 화면상 이동과 함께 뷰 공간 깊이 변화도 전달합니다.
- 낮은 프레임률을 고려해 이력 복원에 쓰는 프레임 수가 빠른 누적 한도를 넘지 않도록 제한했습니다. ReSTIR GI 경로는 REBLUR를 유지하며, 해당 경로의 프리패스 설정만 별도로 조정했습니다.

## 개발에 도움이 되는 이유

반사 노이즈를 재현할 때 디노이저를 비교하기 전에 깊이·법선·모션 벡터가 모두 같은 해상도와 좌표계를 쓰는지 확인할 만한 사례입니다. 움직이는 반사면, 렌더 해상도가 바뀌는 장면, 고대비 물체를 따로 기록하고 윤곽 번짐과 시간축 깜빡임을 구분해 보세요. 가능한 경우 효과의 GPU 시간도 함께 비교해야 화질과 비용의 균형을 판단할 수 있습니다.

## 한계와 이용 조건

커밋과 프리릴리스 설명을 검토했으며, 배포 바이너리나 실제 장면은 실행하지 않았습니다. 원문은 정량적인 GPU 시간·화질 개선치를 제시하지 않습니다. [해당 커밋의 라이선스](https://github.com/PanosK92/SpartanEngine/blob/e2a394fbc7ab07387e3d9aa2b6eb4e12482ed392/license.md)는 별도 조건을 둔 Spartan 프로젝트 라이선스입니다. README·코드·미디어·바이너리 복제 없이 원문 링크와 자체 요약만 남깁니다.

## 로컬 보관 기록

- [링크 메타데이터](../../raw/game-ai/2026-11-23/spartan-relax-specular.link.json) (원문 복제본 아님)
- [전체 인덱스](../index.md)
