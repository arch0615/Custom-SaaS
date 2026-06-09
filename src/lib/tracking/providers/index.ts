import type { TrackingProvider, TrackingRefKind } from "@/lib/data/tracking-types";

/**
 * Common interface every tracking provider implements. Allows the broker UI
 * to call subscribe/unsubscribe without knowing whether it's SeaRates, Vizion,
 * or just the manual (no-op) provider used for demos.
 *
 * The provider's job is to register the reference (container/BL/AWB/booking)
 * with the upstream service and configure it to push events back to our
 * webhook at /api/webhooks/tracking. We do NOT poll providers from here.
 */
export interface TrackingProviderClient {
  readonly name: TrackingProvider;

  /**
   * Register a new tracking subscription with the provider.
   * Returns the provider-side id so we can cancel it later. Returns null if
   * the provider doesn't expose an id (or is the manual no-op).
   *
   * Should throw a typed error if the provider rejects the request — the
   * server action will surface that to the broker as a field error.
   */
  subscribe(input: {
    refKind: TrackingRefKind;
    externalRef: string;
  }): Promise<{ providerSubscriptionId: string | null }>;

  /**
   * Cancel a previously-created subscription. Pass the id returned by
   * subscribe(). Should be idempotent — if the provider says "not found",
   * succeed quietly.
   */
  unsubscribe(input: { providerSubscriptionId: string | null }): Promise<void>;
}

export class TrackingProviderError extends Error {
  constructor(
    public readonly provider: TrackingProvider,
    public readonly code: "config" | "auth" | "not_found" | "rate_limited" | "upstream" | "network",
    message: string,
  ) {
    super(message);
    this.name = "TrackingProviderError";
  }
}
