import type { TrackingProviderClient } from "./index";

/**
 * Manual provider — no external service. Used for demos and when the broker
 * wants to receive events from an external system (e.g. an integrator script)
 * without going through SeaRates/Vizion.
 *
 * Both methods are no-ops; the subscription only exists in our DB.
 */
export const manualProvider: TrackingProviderClient = {
  name: "manual",
  async subscribe() {
    return { providerSubscriptionId: null };
  },
  async unsubscribe() {
    // nothing to do
  },
};
