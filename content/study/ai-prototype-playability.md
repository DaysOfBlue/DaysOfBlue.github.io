---
id: study-ai-prototype-playability
title: "Mojo Ski의 배포 경로와 일곱 단계 제작 과정"
summary: "Web Lens 배포 배경과 제작자가 다듬은 플레이·연출·재방문·용량의 순서를 따라간다."
type: study
category: development
status: reviewed
visibility: public
created: 2026-11-18
updated: 2026-11-18
sources: ["src-web-mojo-ski"]
---

# Mojo Ski의 배포 경로와 일곱 단계 제작 과정

Iakov Sumygin의 회고는 Snapchat 안에서 Web Lens를 여는 배포 경로로 시작한다. 웹 게임을 ZIP으로 올리며 별도 앱 설치 단계를 줄인다는 설명이다. 이어 제작자는 스노보드 게임을 다듬은 순서를 제시한다.

1. LLM으로 약 15분 만에 조작 가능한 초안을 얻었다. 초기 화면은 단순했고 반복해서 할 이유가 부족했다.
2. 꾸미기 전에 플레이 루프를 다듬었다. 빨간 깃발로 목표를 읽기 쉽게 하고, 30~60초의 짧은 판과 한 번의 재시작 조작을 택했다.
3. 하늘·산·나무를 더했다. 배경 그림 아래쪽의 색을 안개에 사용해 경사면과 먼 풍경을 연결했다.
4. 플레이어의 Bitmoji를 등장시켜 캐릭터를 개인화했다.
5. 자주 발생하는 충돌에 래그돌·눈·카메라·소리의 반응을 붙였다. 오디오는 파일 대신 코드로 생성했다.
6. 친구 순위표와 저장되는 보드 해금 목표를 더해 다시 돌아올 동기를 만들었다.
7. 필요한 PlayCanvas 클래스만 포함해 용량을 줄였다. 제작자가 보고한 ZIP은 1.3MB, 엔진과 게임 코드는 약 315KB다.

원문은 마지막에 Web Lens 제작·게시 경로를 안내한다. 제목의 3억 조회는 제작자의 보고이며 고유 플레이어나 유지율을 뜻하지 않는다.

[Reaching 300 Million Views on Snapchat With PlayCanvas](https://blog.playcanvas.com/building-mojo-ski-300m-views-in-seven-hours/), Iakov Sumygin, 2026-11-09. 배포 설명과 제작 7단계를 다시 읽었다. 직접 플레이·성과 재현·외부 서비스 조건 검증은 하지 않았다.
