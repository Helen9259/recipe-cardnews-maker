import { CardNewsProject, CardStyle, Recipe } from "@/types/recipe";

export const DEFAULT_STYLE: CardStyle = {
  mode: "light",
  mainColor: "butter",
  mainFont: "pretendard",
  tipFont: "pretendard",
  photoMode: false,
};

export function buildDefaultProject(recipe: Recipe): CardNewsProject {
  return {
    recipe,
    style: { ...DEFAULT_STYLE },
    instaAccountName: "",
    promoText: "",
  };
}
