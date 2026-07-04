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
