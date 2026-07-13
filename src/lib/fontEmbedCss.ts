function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * html-to-image(1.11.x)의 자동 웹폰트 감지(getUsedFonts)는 DOM을 순회할 때
 * `child instanceof HTMLElement`로 자식만 따라가는데, 카드 카드 구조는
 * <svg><foreignObject><div>...</div></foreignObject></svg>라 <svg>가 SVGElement라서
 * (HTMLElement가 아님) 그 아래 <foreignObject>/<div>까지 아예 순회를 안 한다.
 * 그 결과 실제로 쓰이는 커스텀 폰트를 "사용 중"으로 감지하지 못해 PNG 내보내기에서
 * @font-face가 전혀 내장되지 않고 대체 폰트로 캡처되는 문제가 생긴다.
 * 그래서 필요한 폰트만 직접 찾아 base64로 내장한 CSS를 만들어 toPng의 fontEmbedCSS로 넘긴다.
 */
export async function buildFontEmbedCSS(familyNames: string[]): Promise<string> {
  const wanted = new Set(familyNames);
  const cssTexts: string[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin 스타일시트는 접근 불가 — 건너뜀
    }

    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const family = rule.style.getPropertyValue("font-family").replace(/["']/g, "").trim();
      if (!wanted.has(family)) continue;

      let cssText = rule.cssText;
      const src = rule.style.getPropertyValue("src");
      const urls = Array.from(src.matchAll(/url\(["']?([^"')]+)["']?\)/g)).map((m) => m[1]);

      for (const url of urls) {
        try {
          const absoluteUrl = new URL(url, window.location.href).href;
          const res = await fetch(absoluteUrl);
          const blob = await res.blob();
          const dataUrl = await blobToDataUrl(blob);
          cssText = cssText.replace(url, dataUrl);
        } catch {
          // 내장 실패 시 원본 URL을 그대로 둔다 (최선 시도)
        }
      }
      cssTexts.push(cssText);
    }
  }

  return cssTexts.join("\n");
}
