# 김지훈 포트폴리오

유니티 클라이언트 개발자 김지훈의 포트폴리오 사이트입니다. 빌드 과정 없는 정적 HTML 사이트이며, `main` 브랜치가 GitHub Pages로 자동 배포됩니다.

- 사이트: https://mightychipmunk.github.io/web-porfolio/

## 구성

| 경로 | 내용 |
|---|---|
| `index.html` | 메인 페이지 (About / Education / Experience / Projects / Contact) |
| `playable-detail.html`, `creative-detail.html` | 프로젝트 상세 페이지 |
| `Games/` | 플레이어블 광고 빌드 (Unity PlayWorks 단일 HTML). 메인 페이지에서 iframe으로 로드 |
| `Steam/` | 1인 개발 스팀 게임(핀데모니엄, TaskBar VendingMachine)의 웹용 경량 트레일러(720p)·스크린샷(webp). 원본 패키지는 `Games/*_Portfolio/`에 두되 git에서 제외 |
| `Creatives/` | 크리에이티브 영상. `Creatives/hero/`는 히어로 배경 전용 저용량(540p) 버전 |
| `Appicon/`, `GameScreenShots/`, `CreativeScreenShots/`, `images/` | 이미지 리소스 |
| `css/`, `js/`, `fonts/` | 템플릿 스타일·스크립트 (Bootstrap 4 기반, `css/style.css`에 포함) |
| `css/print.css`, `images/print/` | 인쇄·PDF 전용 스타일과 영상·플레이어블 대표 이미지 |
| `tools/export-pdf.mjs` | PDF 내보내기 스크립트 |

## PDF 내보내기

```bash
node tools/export-pdf.mjs
```

`dist/김지훈_포트폴리오.pdf`로 저장됩니다(git 제외). Node 22 이상과 Chrome 또는 Edge가 필요하며 추가 설치는 없습니다. 출력 경로는 첫 번째 인자로, 브라우저 경로는 `CHROME_PATH` 환경 변수로 바꿀 수 있습니다.

인쇄 화면 구성은 `css/print.css`가 담당합니다. 메뉴·영상 뷰어는 숨기고, 영상과 플레이어블은 `images/print/`의 대표 이미지와 웹 링크로 대체합니다. 브라우저에서 Ctrl+P로 인쇄해도 같은 스타일이 적용되지만, 스크립트는 이미지를 JPEG로 바꿔 넣어 용량이 훨씬 작습니다(WebP는 PDF에 무손실 PNG로 들어감).

## 배포

`main` 브랜치에 push 하면 GitHub Pages가 자동으로 배포합니다. Jekyll 처리는 `.nojekyll`로 비활성화되어 있습니다.

GitHub Pages는 게시 사이트 1GB, 월 대역폭 100GB 제한이 있으므로 페이지에서 실제로 사용하는 영상만 저장소에 두고, 단일 파일은 50MB 이하로 유지합니다.

## 크레딧

Colorlib의 "Ronaldo" Bootstrap 4 템플릿(CC BY 3.0)과 [congchu/web-porfolio](https://github.com/congchu/web-porfolio) 템플릿을 기반으로 제작했습니다.
