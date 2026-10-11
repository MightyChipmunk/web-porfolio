# 김지훈 포트폴리오

유니티 클라이언트 개발자 김지훈의 포트폴리오 사이트입니다. 빌드 과정 없는 정적 HTML 사이트이며, `main` 브랜치가 GitHub Pages로 자동 배포됩니다.

- 사이트: https://mightychipmunk.github.io/web-porfolio/

## 구성

| 경로 | 내용 |
|---|---|
| `index.html` | 메인 페이지 (About / Education / Experience / Projects / Contact) |
| `playable-detail.html`, `creative-detail.html` | 프로젝트 상세 페이지 |
| `Games/` | 플레이어블 광고 빌드 (Unity PlayWorks 단일 HTML). 메인 페이지에서 iframe으로 로드 |
| `Creatives/` | 크리에이티브 영상. `Creatives/hero/`는 히어로 배경 전용 저용량(540p) 버전 |
| `Appicon/`, `GameScreenShots/`, `CreativeScreenShots/`, `images/` | 이미지 리소스 |
| `css/`, `js/`, `fonts/` | 템플릿 스타일·스크립트 (Bootstrap 4 기반, `css/style.css`에 포함) |

## 배포

`main` 브랜치에 push 하면 GitHub Pages가 자동으로 배포합니다. Jekyll 처리는 `.nojekyll`로 비활성화되어 있습니다.

GitHub Pages는 게시 사이트 1GB, 월 대역폭 100GB 제한이 있으므로 페이지에서 실제로 사용하는 영상만 저장소에 두고, 단일 파일은 50MB 이하로 유지합니다.

## 크레딧

Colorlib의 "Ronaldo" Bootstrap 4 템플릿(CC BY 3.0)과 [congchu/web-porfolio](https://github.com/congchu/web-porfolio) 템플릿을 기반으로 제작했습니다.
