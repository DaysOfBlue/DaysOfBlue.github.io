---
id: study-android-xr-porting-checklist
title: "Android XR의 기반 API와 공간·엔진·오디오 통합"
summary: "공식 발표가 SDK 기반에서 공간 고정과 게임 엔진, 오디오 상호작용으로 확장되는 순서를 따라 읽는다."
type: study
category: development
status: reviewed
visibility: public
created: 2026-11-18
updated: 2026-11-18
sources: ["src-web-android-xr"]
---

# Android XR의 기반 API와 공간·엔진·오디오 통합

## 먼저 안정화된 SDK와 에뮬레이터

Android의 공식 발표는 XREAL AURA를 소개한 뒤 개발 기반의 안정화부터 설명한다. Jetpack SceneCore는 장면 그래프, ARCore for Jetpack XR은 환경 인식, XR Runtime은 세션 관리를 담당한다. 에뮬레이터로는 기기 없이 화면 구성을 반복해서 확인할 수 있다.

## 현실의 장소에 콘텐츠 연결하기

Geospatial API는 콘텐츠를 현실 좌표에 고정한다. 원문은 시각 위치 확인과 기기 추적을 결합한다고 설명한다. 관련 Unity 강연은 공간 매핑, 세션 간 배치 유지, 여러 사용자 사이의 공유를 다루는 자료로 소개된다. 강연의 구현 세부는 확인하지 않았다.

## 익숙한 엔진에서 구성과 추적 이어가기

Engine Hub는 Unity·Godot·Unreal의 OpenXR 확장과 검증된 프로젝트 설정을 준비한다. 시스템 추적, 발열 한계와 CPU·GPU 프레임 예산을 살피는 작업도 다룬다. 원문은 Jigsaw Night의 협업형 혼합현실 이식을 사례로 든다.

## 화면 밖의 오디오 상호작용

ML Kit의 기기 내 음성 합성 API와 소리 설계 지침은 음성 중심 경험을 다룬다. 원문은 Earcon 같은 소리 신호로 사용자를 안내하는 방식과 Gemini Nano를 활용하는 관련 강연도 소개한다.

Amy Zeppenfeld·Vinny DaSilva의 [공식 글](https://developer.android.com/blog/posts/build-android-xr-devices-tools)(2026-11-06)을 다시 읽었다. 연결된 강연·자막, SDK 실행과 실기기 성능은 검증하지 않았다.
