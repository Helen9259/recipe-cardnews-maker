import { CardNewsCard } from "@/types/card";
import { CardStyle } from "@/types/recipe";
import { CardCanvas } from "./CardCanvas";
import { CardHtml } from "./CardHtml";
import { getLine } from "@/lib/cardLines";
import { FONT_FAMILY_STACK } from "@/lib/fontOptions";
import { toProxiedImageUrl } from "@/lib/imageProxy";
import { CARD_WIDTH, CARD_HEIGHT } from "@/lib/cardLayout";

export function CoverCardSvg({ card, style }: { card: CardNewsCard; style: CardStyle }) {
  const fontFamily = FONT_FAMILY_STACK[style.font];
  const title = getLine(card, "title");
  const subtitle = getLine(card, "subtitle");
  const watermark = getLine(card, "watermark");
  const hasImage = Boolean(card.imageUrl);
  const imageUrl = toProxiedImageUrl(card.imageUrl);

  return (
    <CardCanvas mode={style.mode} mainColor={style.mainColor}>
      {imageUrl ? (
        <>
          <image
            href={imageUrl}
            x={0}
            y={0}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            preserveAspectRatio="xMidYMid slice"
          />
          <defs>
            <linearGradient id="cover-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="40%" stopColor="black" stopOpacity="0" />
              <stop offset="100%" stopColor="black" stopOpacity="0.78" />
            </linearGradient>
          </defs>
          <rect x={0} y={0} width={CARD_WIDTH} height={CARD_HEIGHT} fill="url(#cover-gradient)" />
        </>
      ) : (
        <rect x={0} y={0} width={CARD_WIDTH} height={CARD_HEIGHT} fill="var(--card-accent-color)" opacity={0.22} />
      )}

      {watermark?.text && (
        <CardHtml x={0} y={56} width={CARD_WIDTH} height={60}>
          <div
            style={{
              textAlign: "center",
              fontFamily,
              fontSize: 28,
              fontWeight: 600,
              color: hasImage ? "#ffffff" : watermark.color,
            }}
          >
            {watermark.text}
          </div>
        </CardHtml>
      )}

      <CardHtml x={64} y={CARD_HEIGHT - 360} width={CARD_WIDTH - 128} height={300}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, justifyContent: "flex-end", height: "100%" }}>
          {title?.text && (
            <div
              style={{
                fontFamily,
                fontSize: 56,
                fontWeight: 800,
                lineHeight: 1.3,
                wordBreak: "keep-all",
                color: hasImage ? "#ffffff" : title.color,
              }}
            >
              {title.text}
            </div>
          )}
          {subtitle?.text && (
            <div
              style={{
                fontFamily,
                fontSize: 26,
                fontWeight: 400,
                color: hasImage ? "#f5f5f5" : subtitle.color,
              }}
            >
              {subtitle.text}
            </div>
          )}
        </div>
      </CardHtml>
    </CardCanvas>
  );
}
