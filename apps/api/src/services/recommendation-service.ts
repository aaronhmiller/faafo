import { randomUUID } from "node:crypto";
import type { MenuItem, RecommendationRequest, RecommendationResponse } from "@verdant/contracts";
import type { RecommendationProvider } from "../ai/recommendation-provider.js";
import type { MenuRepository } from "../repositories/menu-repository.js";
import type { RecommendationAuditRepository } from "../repositories/recommendation-audit-repository.js";

export class RecommendationService {
  constructor(
    private readonly menu: MenuRepository,
    private readonly primary: RecommendationProvider,
    private readonly fallback: RecommendationProvider,
    private readonly audit: RecommendationAuditRepository,
    private readonly createId: () => string = randomUUID,
    private readonly now: () => Date = () => new Date()
  ) {}

  async recommend(input: RecommendationRequest): Promise<RecommendationResponse> {
    const startedAt = performance.now();
    const traceId = this.createId();
    const cartIds = new Set(input.cartItemIds);
    const candidates = this.menu.listAvailable().filter((item) => !cartIds.has(item.id) && matchesDietaryPreferences(item, input.dietaryPreferences));
    let source = this.primary.kind;
    let raw;
    try {
      raw = await this.primary.recommend({ mood: input.mood, candidates });
    } catch (error) {
      console.warn("Recommendation provider failed; using fallback", { traceId, error: error instanceof Error ? error.name : "unknown" });
      source = "fallback";
      raw = await this.fallback.recommend({ mood: input.mood, candidates });
    }
    const candidatesById = new Map(candidates.map((item) => [item.id, item]));
    const seen = new Set<string>();
    const recommendations = raw.filter(({ menuItemId }) => candidatesById.has(menuItemId) && !seen.has(menuItemId) && seen.add(menuItemId)).slice(0, 3);
    this.audit.record({
      traceId,
      source,
      mood: input.mood,
      dietaryPreferences: input.dietaryPreferences,
      candidateCount: candidates.length,
      resultIds: recommendations.map(({ menuItemId }) => menuItemId),
      latencyMs: Math.round(performance.now() - startedAt),
      createdAt: this.now().toISOString()
    });
    return { recommendations, source, traceId };
  }
}

function matchesDietaryPreferences(item: MenuItem, preferences: RecommendationRequest["dietaryPreferences"]): boolean {
  return preferences.every((preference) => item.dietaryPreferences.includes(preference));
}
