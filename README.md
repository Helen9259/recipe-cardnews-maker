# 레시피 카드뉴스 메이커

유튜브 영상/레시피 블로그 URL을 입력하거나 AI가 추천하는 인기 레시피를 선택하면
인스타그램용 레시피 카드뉴스를 자동 생성해주는 개인용 웹 도구입니다.
데스크톱 전용이며 로그인이나 서버 DB 저장 없이 세션(sessionStorage) 상태로만 동작합니다.

## 기술 스택

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- 카드 렌더링: React 컴포넌트로 구성한 SVG (`foreignObject` 기반 텍스트 레이아웃)
- PNG 내보내기: `html-to-image`로 canvas rasterize, SVG는 DOM의 `<svg>`를 그대로 직렬화해서 다운로드
- 외부 API(Gemini/YouTube/Cloudflare)는 전부 서버(API Route)에서만 호출하고 클라이언트에 키를 노출하지 않음

## 로컬 개발

```bash
npm install
cp .env.local.example .env.local   # 아래 "환경 변수" 참고해서 값 채우기
npm run dev
```

[http://localhost:3000](http://localhost:3000) 접속. 데스크톱 전용 도구이므로 브라우저 창 너비가
1024px 이상이어야 정상적으로 보입니다.

## 환경 변수

`.env.local.example`을 복사해서 `.env.local`을 만들고 아래 값을 채워주세요. 이 값들은 절대
클라이언트로 노출되지 않고 API Route(`src/app/api/**`) 안에서만 사용됩니다.

| 변수 | 용도 | 발급처 |
| --- | --- | --- |
| `GEMINI_API_KEY` | 레시피 텍스트/영상 구조화, 추천 레시피 카테고리 분류 | [Google AI Studio](https://aistudio.google.com/) |
| `YOUTUBE_API_KEY` | 영상 설명/댓글 조회, 인기 레시피 검색 | [Google Cloud Console](https://console.cloud.google.com/)에서 YouTube Data API v3 사용 설정 후 발급 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Workers AI 계정 ID | Cloudflare 대시보드 우측 사이드바 |
| `CLOUDFLARE_API_TOKEN` | Workers AI 실행 권한이 있는 API 토큰 | Cloudflare 대시보드 > My Profile > API Tokens |

`GEMINI_MODEL` 환경변수로 사용할 Gemini 모델명을 바꿀 수 있습니다 (기본값 `gemini-2.5-flash`).

### Gemini 호출 큐 & 재시도

무료 티어 RPM 제한 때문에 모든 Gemini 호출은 `src/lib/server/gemini.ts`의 in-memory 큐를 거쳐
**최소 13초 간격**으로 하나씩 순서대로 나갑니다. 429(RESOURCE_EXHAUSTED) 응답을 받으면 에러 바디의
`retryDelay`만큼(없으면 지수 백오프, 최대 90초로 캡) 자동 대기 후 최대 8회까지 재시도합니다. 그래도
안 풀리면 "Gemini 무료 티어 요청 한도를 초과했어요. 1~2분 정도 기다렸다가 다시 시도해주세요"라는
안내 메시지를 반환합니다. 이 큐는 같은 Node 프로세스 안에서만 유지되는 메모리 상태라 서버리스
인스턴스가 새로 뜨면 초기화되며, 완전한 전역 레이트리밋은 아니라는 점을 감안해주세요.

### AI 추천 레시피: 지연 평가(lazy evaluation)

`/api/recommend-recipes`(목록 진입 시 호출)는 유튜브 검색 결과 메타데이터(제목/썸네일/채널명)만
반환하고 **Gemini를 전혀 호출하지 않습니다.** 카테고리 분류와 재료/순서 구조화는 사용자가 후보
중 하나를 실제로 클릭했을 때 `/api/recommend-recipes/select`가 그 영상 하나에 대해서만 수행합니다.
카테고리 분류와 레시피 구조화도 별도 호출로 나누지 않고 `structureRecipeWithCategoryFromYoutubeDetails`
하나의 Gemini 호출에 같이 응답받습니다 (스키마에 `category` 필드를 추가하는 방식). 그 결과:

- 목록 진입 시 Gemini 호출 0회
- 후보 선택 시에만 Gemini 호출 **1회**(카테고리+레시피 구조화를 한 번에)
- 선택하지 않고 넘어간 나머지 후보는 끝까지 Gemini를 타지 않음
- 같은 후보를 다시 클릭해도 캐시된 결과를 재사용하고 다시 호출하지 않음

### 중복 호출 방지 캐시 & 더블클릭 가드

`src/lib/server/resultCache.ts`는 같은 키(유튜브 videoId, 블로그 URL)로 들어온 요청을
in-memory Map으로 memoize한다. 진행 중인 요청과 같은 키가 다시 들어오면 새로 계산하지 않고
**진행 중인 Promise를 그대로 재사용**하고, 이미 끝난 요청이면 그 결과를 재사용해서 Gemini를
다시 부르지 않는다 — `/api/detect-and-extract`, `/api/recommend-recipes/select` 양쪽에 적용됨.
같은 서버 인스턴스가 살아있는 동안에만 유효하지만, 더블클릭/중복 제출/뒤로가기 후 같은 URL·영상
재시도 같은 흔한 낭비를 막아준다. 클라이언트에도 보조적으로 버튼 연타·중복 fetch를 막는 가드를
추가했다 (`src/app/page.tsx`, `src/app/recommend/page.tsx`).

## 카드 자동 스타일링

- **자동 폰트 크기 (`src/lib/autoFontSize.ts`)**: 표지 제목/재료 항목/순서 본문·팁/마무리 문구는
  글자수에 따라 지정된 min~max 범위 안에서 폰트 크기가 자동으로 커지거나 작아집니다. 재료 목록은
  항목별로 따로 조절하면 그리드가 들쭉날쭉해서, 가장 긴 항목 기준으로 전체를 통일합니다.
- **표지 제목 2단 컬러 (`src/lib/titleSplit.ts`)**: 제목이 길어서 두 줄이 될 만하면(띄어쓰기가
  있고 10자 초과) 단어 경계 기준으로 두 줄로 나눠서, 첫 줄은 기본 텍스트색, 둘째 줄은 선택한 메인
  컬러를 기본값으로 넣습니다. 두 줄 다 그냥 일반 `CardLine`이라 화면5 편집 패널에서 줄별로 색을
  자유롭게 바꿀 수 있습니다.

## 추천 영상 길이 필터

`/api/recommend-recipes`는 유튜브 `search.list`의 `videoDuration=medium`과 `videoDuration=long`을
각각 호출해서 합칩니다. API가 범위 지정을 지원하지 않아 "medium 이상"을 표현하려면 이렇게
두 번 나눠 불러야 합니다. `short`(4분 미만, 쇼츠 포함)는 아예 검색하지 않으므로 결과에 나오지 않습니다.

## Vercel 배포

1. GitHub 저장소를 Vercel 프로젝트로 import
2. Vercel 프로젝트 설정 > Environment Variables에 위 4개 값을 동일하게 등록
   (Production/Preview/Development 모두 등록 권장)
3. 별도 빌드 설정 없이 기본 `next build`로 배포됨
4. 배포 후 발급되는 도메인으로 접속 (데스크톱 브라우저 권장)

## 폰트

`pretendard`, `@fontsource/noto-sans-kr`, `@noonnu/dos-gothic`는 npm 패키지로 설치되어 자동 적용됩니다.
BM쿠쿠림체·오케이 딴딴체는 라이선스상 npm 배포가 안 되는 폰트라 저장소에 포함하지 않았습니다.
눈누(noonnu.cc)에서 받은 폰트 파일을 `public/fonts/bmcucuric.woff2`, `public/fonts/okaydandan.woff2`로
넣어주면 적용되고, 없으면 자동으로 손글씨 계열 대체 폰트로 표시됩니다 (`public/fonts/README.md` 참고).

## 알려진 제한사항

- **SVG 다운로드 폰트**: PNG는 브라우저에서 그대로 렌더링해 캡처하므로 항상 정확한 폰트로 나오지만,
  SVG를 파일로 내려받아 다른 프로그램(브라우저 외)에서 열면 폰트 파일이 내장되어 있지 않아
  시스템에 해당 폰트가 없을 경우 대체 서체로 보일 수 있습니다.
- **삽화 투명 배경**: Cloudflare Workers AI(Stable Diffusion XL)는 진짜 알파 투명 배경을 보장하지
  않습니다. 프롬프트로 최대한 깔끔한 배경을 유도하지만 완전한 투명 처리는 별도 배경 제거 처리가 필요합니다.
- **다크모드 삽화**: 삽화 생성 프롬프트 자체는 "검은 얇은 라인" 고정 스타일이며, 다크모드에서는
  렌더링 시 CSS filter(반전)로 밝은 톤처럼 보이게 처리합니다.
- **삽화 프롬프트 언어**: 조리 단계 문구(한국어)를 번역하지 않고 그대로 프롬프트에 넣습니다(번역을
  위해 Gemini를 추가로 호출하면 할당량이 늘어나기 때문). Stable Diffusion XL의 한국어 이해도가
  완벽하지 않아 가끔 의도한 장면과 다르게 나올 수 있습니다.
- **서버리스 함수 타임아웃**: Gemini 요청 큐(최소 13초 간격) 때문에 `/api/recommend-recipes`는
  1~2분 가까이 걸릴 수 있습니다. Vercel Hobby 플랜은 함수 실행시간이 60초로 강제 상한되어 있어
  타임아웃이 날 수 있으니, Pro 플랜(최대 300초)을 쓰거나 `RESULT_COUNT`(추천 개수)를 줄이는 걸
  권장합니다.
