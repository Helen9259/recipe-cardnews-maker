import type { Metadata } from "next";
import "pretendard/dist/web/variable/pretendardvariable.css";
import "@fontsource/noto-sans-kr/400.css";
import "@fontsource/noto-sans-kr/700.css";
import "@noonnu/dos-gothic/index.css";
import "./globals.css";
import { AppSessionProvider } from "@/context/AppSessionContext";

export const metadata: Metadata = {
  title: "레시피 카드뉴스 메이커",
  description: "유튜브/블로그 레시피를 인스타그램용 카드뉴스로 자동 변환하는 개인용 도구",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased font-pretendard bg-white text-neutral-900">
        <AppSessionProvider>{children}</AppSessionProvider>
      </body>
    </html>
  );
}
