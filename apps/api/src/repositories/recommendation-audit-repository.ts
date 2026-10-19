import type { DatabaseSync } from "node:sqlite";
import type { DietaryPreference, OrderMood } from "@verdant/contracts";

export interface RecommendationAuditEvent {
  traceId: string;
  source: "ai" | "fallback";
  mood: OrderMood;
  dietaryPreferences: DietaryPreference[];
  candidateCount: number;
  resultIds: string[];
  latencyMs: number;
  createdAt: string;
}

export interface RecommendationAuditRepository { record(event: RecommendationAuditEvent): void }

export class SqliteRecommendationAuditRepository implements RecommendationAuditRepository {
  constructor(private readonly db: DatabaseSync) {}

  record(event: RecommendationAuditEvent): void {
    this.db.prepare(`INSERT INTO recommendation_events
      (trace_id, source, mood, dietary_flags, candidate_count, result_ids, latency_ms, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(event.traceId, event.source, event.mood, event.dietaryPreferences.join(","), event.candidateCount, event.resultIds.join(","), event.latencyMs, event.createdAt);
  }
}
