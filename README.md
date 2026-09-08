# Pak Lee Car — 다국어 정적 사이트

한국 프라이빗 드라이버 서비스 사이트. `content/*.json`을 `templates/*.js`로 렌더링해
`dist/`에 15개 페이지 × 4개 언어 = 60페이지, `sitemap.xml`, `robots.txt`를 생성하는
정적 사이트 빌드 시스템이다.

## 빌드하기

```bash
npm run build     # scripts/images.js (이미지 최적화) → build.js (dist/ 생성)
npm test          # node --test — 회귀 테스트 포함 전체 테스트 실행
```

`dist/`가 배포 산출물이다. `assets/img/**/opt/`(최적화된 이미지)와 `dist/`는
모두 gitignore 대상이며 커밋하지 않는다 — 매 빌드마다 재생성된다.

## 문구 수정하기

각 언어·페이지의 텍스트는 `content/{lang}/*.json`에 있다. 예: 홈페이지 영문 카피는
`content/en/home.json`. 투어 페이지는 `content/{lang}/tours/*.json`, 가이드는
`content/{lang}/guide/*.json`. JSON을 고치고 `npm run build`만 다시 돌리면 된다 —
템플릿(`templates/*.js`)은 구조만 담당하고 문구는 건드리지 않는다.

## 언어 추가하기

1. `content/<lang>/` 폴더를 만들고 기존 언어(예: `content/en/`)와 동일한 파일 구조로
   전체 15개 페이지 JSON을 작성한다.
2. `build.config.js`의 `LANGS` 배열에 `'<lang>'`를 추가한다.
3. `npm run build`로 새 언어 URL(`/<lang>/...`)이 생성되는지, `npm test`가 통과하는지
   확인한다.

## 태국어 재활성화하기

`content/th/`는 이미 존재하지만(과거 태스크에서 작성) 현재 `LANGS`에서 빠져 있어
빌드되지 않는다. 재활성화하려면 `build.config.js`의 `LANGS`에 `'th'`만 추가하면
된다 — 콘텐츠는 이미 준비되어 있다.

## 릴(Reels) 추가하기

1. 썸네일 이미지를 `assets/img/reels/<id>.jpg`에 넣는다.
2. `content/reels.json`에 항목을 추가한다 — `id`(파일명과 일치), `thumb` 경로,
   `duration`(ISO 8601, 예: `PT15S`), `uploadDate`, 그리고 `title`/`place`를
   4개 언어(`en`/`id`/`es`/`ja`) 모두 채운다.
3. `npm run build`로 홈/투어/가이드 페이지의 릴 스트립에 반영되는지 확인한다.

## Vercel 배포 설정

- **Build Command**: `npm run build`
- **Output Directory**: `dist`

`api/`, `lib/`, `admin.html`은 이 정적 빌드 시스템과 무관한 별도 기능(예약 API,
관리자 페이지)이므로 수정하지 않는다.
