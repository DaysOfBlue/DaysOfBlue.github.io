---
id: study-unity-performance-reading
title: "Unity Render Graph의 타일 메모리 최적화가 이어지는 순서"
summary: "타일 메모리의 비용에서 로드·스토어, 패스 머지, 페치와 메모리리스로 이어지는 장을 읽는다."
type: study
category: rendering
status: reviewed
visibility: public
created: 2026-11-18
updated: 2026-11-18
sources: ["src-web-unity-performance", "src-web-unity-performance-ko", "src-web-unity-rendergraph-ko", "src-web-unity-rendergraph-ja"]
---

# Unity Render Graph의 타일 메모리 최적화가 이어지는 순서

『Unity Performance Tuning Tips 2026』의 이 장은 모바일 GPU의 대역폭 제약에서 출발한다. 타일 안에서 처리하더라도 경계를 넘는 메인 메모리 왕복은 비용이 된다.

## 이전 내용과 이후 사용을 선언하기

로드는 이전 내용이 필요할 때, 스토어는 결과를 나중에 사용할 때 발생한다. 부분 쓰기일 수 있는 Write와 전체 덮어쓰기를 뜻하는 WriteAll은 다른 선언이다. Render Graph는 리소스 사용 정보를 모아 액션을 결정한다.

## 여러 패스를 타일 안에서 연결하기

조건에 맞는 논리적 패스가 하나의 Native Render Pass로 머지되면 중간 결과를 타일 메모리에 남길 수 있다. 해상도·MSAA 차이나 일반 텍스처 사용은 머지를 끊을 수 있다.

## 같은 픽셀의 이전 결과를 읽기

프레임 버퍼 페치는 같은 픽셀의 이전 결과를 입력 어태치먼트로 읽는다. 주변 픽셀이 필요한 블러나 왜곡에는 적용할 수 없으며, 미지원 환경의 폴백은 같은 대역폭 절감을 보장하지 않는다.

## 메인 메모리 할당도 생략할 수 있는 경우

로드·스토어 없이 하나의 Native Render Pass 안에서 사용이 끝나면 메모리리스가 성립한다. 메모리 사용량 절감과 대역폭 절감은 구분해 확인해야 한다.

[공식 저장소](https://github.com/CyberAgentGameEntertainment/UnityPerformanceTuningTips2026)·[목차](https://cyberagentgameentertainment.github.io/UnityPerformanceTuningTips2026/ko/index.html)와 Kiyohara Takayuki의 [한국어 1장](https://cyberagentgameentertainment.github.io/UnityPerformanceTuningTips2026/ko/kiyohara-takayuki-1.html)을 재독하고, 관련 API 설명을 [일본어판](https://cyberagentgameentertainment.github.io/UnityPerformanceTuningTips2026/ja/kiyohara-takayuki-1.html)과 대조했다. 발행일은 미확인이다. 전체 PDF 통독과 실기기 측정은 하지 않았다.
