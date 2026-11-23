---
id: study-renderdoc-ai-debugging
title: "Android 검은 화면을 RenderDoc 리플레이로 조사한 과정"
summary: "SPIR-V 교체와 실기기 리플레이, 값 검사로 이어진 CyberAgent의 디버깅 사례를 읽는다."
type: study
category: development
status: reviewed
visibility: public
created: 2026-11-18
updated: 2026-11-18
sources: ["src-web-renderdoc-ai"]
---

# Android 검은 화면을 RenderDoc 리플레이로 조사한 과정

清原(Takayuki-Kiyohara)의 [2026-10-20 사례 글](https://blog.sge-coretech.com/entry/2026/10/20/102300)은 Android에서만 발생한 검은 화면을 조사한다. 셰이더 가설마다 앱을 빌드하면 한 번에 한 시간이 걸리는 환경이었다.

## 셰이더를 바꾸고 실기기에서 다시 재생하기

조사는 저장한 캡처에서 시작한다. RenderDoc Python API로 이벤트의 SPIR-V를 추출하고 Vulkan SDK로 역어셈블한 뒤, 수정·재조립한다. 새 셰이더는 리플레이 중 리소스 교체로 적용한다. 원본 캡처 파일은 바뀌지 않는다.

이어 캡처를 Android 기기로 전송해 그 GPU에서 리플레이한다. 기사 코드는 RenderDoc 1.42와 Vulkan SDK 1.3.296.0에서 사용한 스크립트를 설명용으로 단순화한 것이다.

## 화면 변화에 수치 근거 붙이기

각 패스의 이미지·버퍼를 읽어 NaN·Inf와 값 범위를 비교한다. Claude Code는 스크립트 작성과 반복 검증을 보조하고, 개발자는 다음 가설과 채택할 수정을 판단했다. 효과가 없는 수정안은 버렸다.

저자는 약 30회 교체 뒤 한 시간 이내에 회피책을 찾았으며, 드라이버의 셰이더 컴파일에 원인이 있을 가능성이 높다고 판단했다. 최종 수정은 PR과 사람의 리뷰를 거쳤다.

이 사례에서 확인한 결과는 캡처된 한 프레임에 한정되며, 실제 앱 전체의 검증은 포함하지 않는다. 본문·코드 설명을 재독했으며 스크립트 실행이나 장치 검증은 하지 않았다.
