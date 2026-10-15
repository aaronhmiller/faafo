import type { MenuItem, OrderMood } from "@verdant/contracts";

export interface ProviderRecommendation {
  menuItemId: string;
  reason: string;
  confidence: number;
}

export interface RecommendationProviderInput {
  mood: OrderMood;
  candidates: MenuItem[];
}

export interface RecommendationProvider {
  readonly kind: "ai" | "fallback";
  recommend(input: RecommendationProviderInput): Promise<ProviderRecommendation[]>;
}
