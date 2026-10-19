import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MenuItem } from "@verdant/contracts";
import type { RecommendationProvider } from "../ai/recommendation-provider.js";
import type { MenuRepository } from "../repositories/menu-repository.js";
import type { RecommendationAuditEvent, RecommendationAuditRepository } from "../repositories/recommendation-audit-repository.js";
import { RecommendationService } from "./recommendation-service.js";

const items: MenuItem[] = [
  { id: "oat-latte", name: "Oat Latte", description: "Soft", category: "coffee", priceCents: 600, accent: "#fff", icon: "☕", featured: true, dietaryPreferences: ["dairy-free", "vegan", "nut-free"] },
  { id: "milk-latte", name: "Milk Latte", description: "Classic", category: "coffee", priceCents: 550, accent: "#fff", icon: "☕", featured: false, dietaryPreferences: ["nut-free"] }
];

function setup(primary: RecommendationProvider) {
  let event: RecommendationAuditEvent | undefined;
  const menu: MenuRepository = { listAvailable: () => items, findAvailableByIds: () => [] };
  const fallback: RecommendationProvider = { kind: "fallback", recommend: async ({ candidates }) => candidates.map((item) => ({ menuItemId: item.id, reason: "Fallback", confidence: 0.5 })) };
  const audit: RecommendationAuditRepository = { record: (value) => { event = value; } };
  const service = new RecommendationService(menu, primary, fallback, audit, () => "trace-1", () => new Date("2026-01-01T00:00:00Z"));
  return { service, getEvent: () => event };
}

describe("RecommendationService", () => {
  it("filters dietary conflicts and grounds model output to candidates", async () => {
    const primary: RecommendationProvider = { kind: "ai", recommend: async () => [
      { menuItemId: "oat-latte", reason: "Bright and smooth", confidence: 0.9 },
      { menuItemId: "invented-item", reason: "Hallucinated", confidence: 1 }
    ] };
    const { service, getEvent } = setup(primary);
    const result = await service.recommend({ mood: "bright", dietaryPreferences: ["vegan"], cartItemIds: [] });
    assert.deepEqual(result.recommendations.map(({ menuItemId }) => menuItemId), ["oat-latte"]);
    assert.equal(result.source, "ai");
    assert.deepEqual(getEvent()?.resultIds, ["oat-latte"]);
  });

  it("falls back without leaking provider errors", async () => {
    const primary: RecommendationProvider = { kind: "ai", recommend: async () => { throw new Error("upstream secret detail"); } };
    const { service, getEvent } = setup(primary);
    const result = await service.recommend({ mood: "cozy", dietaryPreferences: [], cartItemIds: ["milk-latte"] });
    assert.equal(result.source, "fallback");
    assert.deepEqual(result.recommendations.map(({ menuItemId }) => menuItemId), ["oat-latte"]);
    assert.equal(getEvent()?.source, "fallback");
  });
});
