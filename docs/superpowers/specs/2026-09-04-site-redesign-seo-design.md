# Pak Lee's Car — 사이트 전면 재구축 설계

작성일: 2026-09-04
상태: 승인 대기

## 1. 배경과 문제

현재 사이트는 `index.html` 한 장(125KB)에 모든 내용이 들어 있고, 인도네시아어·영어·태국어를 `data-id` / `data-en` / `data-th` 속성으로 두고 JavaScript가 치환한다. 디자인과 SEO 양쪽에 구조적 문제가 있다.

### SEO (우선순위 1)

| 문제 | 결과 |
|---|---|
| 3개 언어가 한 URL, JS 치환 | 구글이 기본 인니어만 색인. 영어·태국어 검색 유입이 구조적으로 0 |
| hreflang 없음 | 언어별 페이지 관계를 검색엔진이 알 수 없음 |
| 페이지가 사실상 1장 | 랭킹 가능한 키워드가 1개. 롱테일 진입점 없음 |
| 이미지 8MB 무압축 (장당 1~2MB) | LCP 실패 → 모바일 랭킹 직격 |
| robots.txt / sitemap.xml 없음 | 크롤링 유도 수단 없음 |
| 스키마가 `LocalBusiness` 하나 | 리치 결과 기회 상실 |
| 내부링크 구조 없음 | 페이지 간 권위 전달 불가 |

### 디자인

브랜드 컬러가 오렌지·골드·그린·네이비 4개로 경쟁하고, 이모지가 헤드라인과 버튼에 산재해 "Staria Lounge 프리미엄"이라는 포지셔닝과 충돌한다. 모든 섹션이 `라벨 → h2 → 서브텍스트 → 카드 그리드`에 가운데 정렬로 반복돼 위계와 리듬이 없다. 무엇보다 **신뢰 증거가 없다** — 후기, 기사님, 손님의 흔적이 화면에 존재하지 않는다.

## 2. 확정된 방향

### 2.1 브랜드의 축은 사람이다

Pak Lee라는 개인이 상품이다. 인스타그램 프로필의 **캐리커처를 브랜드 마크**로 채택한다. 사진과 달리 항상 일정하고, 4개 언어 어디에 놓아도 통하며, 확보되지 않은 인물 사진 문제를 해소한다.

카피는 전부 1인칭으로 쓴다. "저희는 최고의 서비스를 제공합니다"가 아니라 "제가 여덟 시에 출발하는 걸 권합니다".

### 2.2 신뢰는 인스타그램 릴이 만든다

계정 `@paklee.carkorea`에 기사님이 등장하는 실제 릴이 있다. 연출된 브랜딩 사진보다 이쪽이 훨씬 강하다. 릴을 사이트의 1차 사회적 증거로 쓴다.

### 2.3 디자인 톤: 모던 캐주얼

깔끔하되 딱딱하지 않게. 형태와 색으로 부드러움을 만들고, 이모지·만화체로 만들지 않는다.

## 3. 정보 구조

```
/                                    → 302 → /en/        (hreflang x-default)
/{lang}/                             홈
/{lang}/share-tour/                  공유투어 + 캘린더 (기존 share-tour.html 승계)
/{lang}/videos/                       릴 전체 갤러리
/{lang}/tours/nami-island/
/{lang}/tours/seoul-day-tour/
/{lang}/tours/dmz/
/{lang}/tours/gangwon-ski/
/{lang}/tours/kdrama-kpop/
/{lang}/tours/everland/
/{lang}/airport-transfer/
/{lang}/muslim-friendly-korea-tour/
/{lang}/guide/                       가이드 허브
/{lang}/guide/halal-food-seoul/
/{lang}/guide/korea-transport-vs-private-car/
/{lang}/guide/korea-itinerary-4-days/
/sitemap.xml   /robots.txt
```

`lang` ∈ `id`(인도네시아어, 주력) · `en` · `es` · `ja` → **페이지 15종 × 4언어 = 60 URL**

태국어는 기존 번역을 `content/th/`에 보존하되 빌드 대상에서 제외한다. `build.js`의 `LANGS` 배열에 `'th'`를 추가하면 즉시 15 URL이 추가된다.

### 왜 이 구성인가

- **투어 페이지 8장**이 롱테일 진입점을 만든다. `nami island private driver`, `incheon airport pickup service`, `dmz tour private car`, `muslim friendly korea tour` — 현재 구조로는 하나도 노릴 수 없는 키워드다. 각 페이지는 코스·소요시간·가격·포함/불포함·해당 FAQ를 담아 그 자체로 예약 가능한 랜딩페이지가 된다.
- **가이드 3편**이 정보 검색 유입과 백링크를 만들고, 내부링크로 투어 페이지에 권위를 넘긴다. 판매 페이지만 있는 사이트는 상한이 낮다.
- **스페인어·일본어**는 인니어·영어보다 경쟁이 옅어 같은 노력으로 상위 노출 확률이 높다.

### 내부링크 설계

홈 → 투어 8장 + 가이드 허브 + 영상.
가이드 → 본문 안에서 관련 투어 2~3개.
투어 → 관련 투어 2개 + 공유투어 + 영상.
전 페이지 → 공통 푸터에서 언어 4종 상호 링크.

## 4. 빌드 시스템

```
content/
  {id,en,es,ja,th}/
    home.json
    share-tour.json
    videos.json
    tours/*.json
    guide/*.json
  reels.json          ← 언어 공통. 릴 목록(단일 소스)
templates/
  home.html  tour.html  guide.html  guide-hub.html  videos.html  share-tour.html
  partials/  (nav, footer, reel-strip, chat, rates, cta)
assets/
  img/                ← 원본
build.js              ← node build.js → dist/ 에 60장 + sitemap.xml
```

- 문구·SEO 메타·스키마 데이터를 전부 JSON으로 분리한다. 현재는 번역이 HTML 속성에 박혀 있어 한 줄 고치려면 125KB를 뒤져야 한다.
- 페이지 추가 = JSON 한 장. 언어 추가 = 폴더 한 개.
- 산출물은 순수 정적 HTML. Vercel 정적 배포 그대로이며 런타임 의존성이 없다.
- 기존 `api/` (Supabase 예약)와 `admin.html`은 건드리지 않는다. `share-tour` 페이지가 지금처럼 같은 API를 호출한다.

### 도메인

당분간 `pakleecar.vercel.app`을 유지한다. 단, canonical·sitemap·hreflang·OG URL이 참조하는 **베이스 URL은 `build.config.js`의 상수 한 곳**에만 둔다. 나중에 자체 도메인을 사면 한 줄만 바꾸면 된다.

## 5. 디자인 시스템

### 타이포그래피

`Figtree` 단일 서체 (400/500/600/700/800). 획 끝이 살짝 둥글어 친근하면서 기하학적 산세리프의 현대성을 유지한다. 세리프는 쓰지 않는다.

- h1 `clamp(38px, 4.4vw, 56px)` / weight 700 / tracking −0.026em
- h2 `clamp(28px, 3.1vw, 38px)` / weight 700 / tracking −0.026em
- 본문 15~17.5px / line-height 1.55~1.62

큰 사이즈에서 weight 800과 과한 음수 자간은 글자를 부딪히게 만들어 아마추어처럼 보이게 한다. 금지한다.

### 색

```
--ink   #16211C   본문/헤드라인
--g7    #3C4A44   보조 텍스트(진함)
--g6    #5C6B64   보조 텍스트
--g5    #8B9A93   캡션
--g3    #DCE6E1   테두리(강)
--g2    #E9F0EC   테두리/구분선
--g1    #F3F8F5   섹션 배경
--ac    #16A063   유일한 브랜드 악센트 (WhatsApp CTA와 동일 계열)
--mint  #E7F5EE   섹션 배경 틴트
--sun   #FFCE52   스티커
--peach #FFE3D2   아이콘 칩
--coral #FF8A5B   손그림 밑줄
```

원칙: **악센트는 그린 하나**. 헤드라인에 색을 넣지 않는다. `sun`/`peach`/`coral`은 장식 요소에서만 소량 쓴다. 차가운 회색을 쓰지 않고 그린 계열로 틴트된 중성색을 쓰는 것이 "딱딱함"을 없애는 핵심이다.

### 형태

- 버튼: 알약(`999px`) + 아래쪽 단색 그림자(눌리는 느낌)
- 카드/사진: `20~30px`
- 그림자는 얕게 한 겹. 테두리는 1px 한 가지.
- 사진·릴 카드를 ±1.4° 기울이고 hover 시 정렬 — 절제된 장난기

### 금지 사항

1. 복잡한 사진 위에 헤드라인 얹기 — 사진은 프레임 안에 넣는다
2. 헤드라인·버튼의 이모지 — 스티커와 아이콘 칩 등 고정된 소형 자리에만 허용
3. 베이지 계열 배경
4. 4칸 숫자 통계 줄의 무분별한 반복

## 6. 홈 구성

`히어로 → 메시지로 시작합니다 → 인스타 영상 → 차량 → 요금 → CTA`

- **히어로**: 좌측 카피 + 우측 4:5 프레임에 실제 릴 썸네일. 노란 스티커, 마스코트 말풍선("Halo! Saya Pak Lee / Ask me anything"), "I'll drive it." 아래 코랄 손그림 밑줄. 하단에 아이콘 칩 4개(좌석/시간/포함/응답시간).
- **메시지로 시작합니다**: 실제 문의 흐름을 대화 UI로 보여준다. 예약 절차가 아니라 "이 사람과 이야기하면 이런 느낌"을 보여주는 것이 목적. 마지막에 릴 첨부 카드.
- **인스타 영상**: 9:16 카드 6개 + `@paklee.carkorea` 링크.
- **요금**: 차량 단위 가격표. 포함/불포함 칩.

기존의 "하루의 시간표(How a day usually runs)" 섹션은 홈에서 제외한다. 대신 **투어 페이지 본문의 기본 구조**로 쓴다 — 시간대별 코스 서술이 구글이 원하는 구체적 콘텐츠를 자연스럽게 강제하기 때문이다.

## 7. 인스타그램 릴 연동

### 데이터

`content/reels.json` — 단일 소스.

```json
[{
  "id": "DY3AtNlolDz",
  "thumb": "assets/img/reels/DY3AtNlolDz.jpg",
  "place": { "en": "Guests", "id": "Tamu", "es": "Invitados", "ja": "ゲスト" },
  "title": { "en": "Terima kasih, keluarga Rina", ... },
  "duration": "PT14S",
  "uploadDate": "2026-05-27"
}]
```

현재 확인된 릴 6개: `DciyJZzI3Rq`, `DcP3w5VIoPf`, `DcAjNy9I9L4`, `Dbw32ZWoFpA`, `DY3AtNlolDz`, `DYoUwpto3-8`.

### 재생 방식 (파사드)

평소에는 **썸네일 이미지만** 렌더링한다. 클릭 시 라이트박스를 열고 그때 `https://www.instagram.com/reel/{id}/embed/captioned/` iframe을 생성한다.

- 인스타 공식 위젯을 그냥 붙이면 외부 스크립트 수백 KB가 항상 로드돼 Core Web Vitals가 무너진다
- Instagram Graph API 자동 연동은 Facebook 앱 등록과 토큰 갱신이 필요하고, 토큰 만료 시 갤러리가 통째로 사라진다
- 파사드 방식은 `VideoObject` 스키마를 붙일 수 있어 구글 영상 검색 진입이 가능하다. 위젯 방식은 불가능하다

라이트박스는 Prev/Next로 릴을 연속 시청할 수 있고, 방향키·ESC·배경 클릭을 지원한다. 히어로의 재생 버튼과 대화창 첨부 클립도 같은 라이트박스를 연다.

**동작 검증 완료** — 프리뷰에서 임베드 로드 및 재생을 확인했다.

### 다국어 처리

릴 캡션은 전부 인도네시아어다. 영상은 그대로 두고, **카드 밑에 붙는 한 줄 설명만** 각 언어로 제공한다.

### 노출하지 않을 것

팔로워 수(현재 4명). 계정이 성장한 뒤 판단한다.

## 8. 성능

- 이미지 전량 AVIF + WebP로 변환, 3개 사이즈(480 / 960 / 1440) 생성
- `<picture>` + `srcset` + `width`/`height` 명시로 CLS 방지
- 히어로 이미지만 `preload`, 나머지는 `loading="lazy"`
- 페이지당 HTML은 해당 섹션만 포함 → 125KB → 20KB대
- 폰트는 `preconnect` + `display=swap`, 필요한 웨이트만
- 목표: LCP ≤ 2.5s, CLS ≤ 0.1, 모바일 Lighthouse 성능 90+

## 9. 구조화 데이터

| 페이지 | 스키마 |
|---|---|
| 전 페이지 | `BreadcrumbList`, `Organization`(마스코트를 `logo`로) |
| 홈 | `LocalBusiness` + `hasOfferCatalog` |
| 투어 | `TouristTrip` + `Offer`, 해당 페이지 `FAQPage` |
| 공유투어 | `Product` + `AggregateOffer` |
| 영상 · 릴 노출 페이지 | `VideoObject` (릴별) |
| 가이드 | `Article` |

## 10. 범위 밖

- 자체 도메인 구매 및 연결
- 태국어 페이지 빌드 (데이터는 보존, 스위치만 꺼둠)
- 예약 API·관리자 페이지 개편 — 현행 유지
- 유료 광고, 인스타 자동 동기화

## 11. 필요한 것

1. **기사님 사진** — 있으면 좋다. 없어도 캐리커처로 진행 가능하다.
2. **목적지 사진** — 투어 페이지 8장에 들어갈 남이섬·DMZ·에버랜드 등. 확보 전까지는 자리를 비워두고 구조부터 만든다. 이미지 검색도 유입원이다.
3. **투어별 실제 코스 정보** — 시간대별 동선. 내용이 얇으면 60장이 오히려 사이트 전체 평가를 깎는다.

## 12. 성공 기준

- 4개 언어 60 URL이 각각 고유한 title/description/canonical/hreflang을 갖고 정적 파일로 존재한다
- `sitemap.xml`에 60 URL이 hreflang 대체 링크와 함께 등재된다
- 모바일 Lighthouse 성능 90+, LCP 2.5초 이하
- 리치 결과 테스트에서 FAQ·VideoObject·TouristTrip이 오류 없이 인식된다
- 문구 수정이 JSON 한 곳에서 끝나고, 언어 추가가 폴더 하나로 가능하다
