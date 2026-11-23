---
id: study-unreal-ai-workflow
title: "UE 5.9 MegaJam Preview의 도구 확장과 실험적 웹 타깃"
summary: "공식 발표의 개발 배경과 기능 소개를 읽고 알려진 문제까지 함께 확인한다."
type: study
category: development
status: reviewed
visibility: public
created: 2026-11-18
updated: 2026-11-18
sources: ["src-web-unreal-preview"]
---

# UE 5.9 MegaJam Preview의 도구 확장과 실험적 웹 타깃

Epic은 이 프리뷰를 약 일주일 동안 준비했으며, 엔지니어가 지시·검토·테스트하는 에이전트 작업으로 AI 도구와 웹 플랫폼 코드를 구현했다고 설명한다. QA는 평소보다 짧았고 웹 렌더러 일부는 프로토타입이었다.

## 에디터에서 확장한 작업 범위

발표는 Unreal MCP의 렌더링·소스 관리·프로파일링·테스트 도구 확장부터 소개한다. 이어 Assistant 패널에서 외부 코딩 에이전트를 연결하고, 오디오·물리·Niagara 등을 다루는 Python API를 늘렸다고 설명한다. Unreal Canvas는 프롬프트와 참조 이미지·장면으로 콘텐츠를 만들고 생성 과정을 연결하는 실험적 도구다.

## 브라우저 실행의 조건

웹 타깃은 WebAssembly와 WebGPU, 모바일 렌더러를 사용한다. 발표에 명시된 조건은 소스 빌드와 C++ 프로젝트이며 긴 쿠킹 시간과 성능 문제가 남아 있다. 이를 일반적인 배포 준비 완료로 해석할 수 없다.

## 저장 데이터 손실과 편집 도구 누락

후속 공식 목록에는 재로드 시 저장 데이터 손실, 메모리 관련 웹 크래시, 스크립트 편집 뒤 Undo의 데이터 손실이 포함된다. UE-412135에서는 MCP 서버가 켜져도 Toolset 플러그인이 꺼져 편집 도구가 없는 상황을 설명한다. MCP 서버에 접속해도 편집 도구가 제공되지 않을 수 있다.

[발표와 알려진 문제 목록](https://forums.unrealengine.com/t/unreal-engine-5-9-megajam-preview/2852840), Flak·Raghib_K, 2026-11-09를 다시 읽었다. 당시 프리뷰에 한정한 기록이며 엔진 설치나 실행은 하지 않았다.
