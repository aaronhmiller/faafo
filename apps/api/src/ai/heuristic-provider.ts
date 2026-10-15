import type { MenuItem, OrderMood } from "@verdant/contracts";
import type { ProviderRecommendation, RecommendationProvider, RecommendationProviderInput } from "./recommendation-provider.js";

const categoryForMood: Record<OrderMood, MenuItem["category"]> = {
  bright: "tea",
  cozy: "bakery",
  focused: "coffee",
  adventurous: "tea"
};

export class HeuristicRecommendationProvider implements RecommendationProvider {
  readonly kind = "fallback" as const;

  async recommend({ mood, candidates }: RecommendationProviderInput): Promise<ProviderRecommendation[]> {
    const preferred = categoryForMood[mood];
    return [...candidates]
      .sort((left, right) => Number(right.category === preferred) - Number(left.category === preferred) || Number(right.featured) - Number(left.featured))
      .slice(0, 3)
      .map((item, index) => ({
        menuItemId: item.id,
        reason: index === 0 ? `A ${mood} favorite that fits the moment.` : "A thoughtful match from today’s menu.",
        confidence: Math.max(0.55, 0.82 - index * 0.1)
      }));
  }
}
