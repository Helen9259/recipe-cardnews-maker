import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // 사이트 UI 전용 뉴트럴 액션 컬러 (버튼/로딩바/체크/토글).
        // 사용자가 고른 메인 컬러와는 절대 섞이지 않는다.
        "ui-action": "#262626", // neutral-800
        "ui-surface": "#f5f5f5", // neutral-100
        "ui-muted": "#737373", // neutral-500
        // 카드뉴스 렌더링 컴포넌트 전용. 사이트 UI는 절대 참조하지 않는다.
        "card-accent": "var(--card-accent-color)",
      },
      fontFamily: {
        pretendard: ["var(--font-pretendard)", "sans-serif"],
        notosans: ["var(--font-notosans)", "sans-serif"],
        okaydandan: ["var(--font-okaydandan)", "cursive"],
        ggubulrim: ["var(--font-ggubulrim)", "cursive"],
        dosgothic: ["var(--font-dosgothic)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
