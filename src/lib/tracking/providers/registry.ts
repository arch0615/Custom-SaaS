import type { TrackingProvider } from "@/lib/data/tracking-types";
import type { TrackingProviderClient } from "./index";
import { manualProvider } from "./manual";
import { searatesProvider } from "./searates";

/**
 * Resolve the provider client to use for a given subscription. Add new
 * providers (e.g. Vizion) here as they're implemented.
 */
export function getTrackingProvider(name: TrackingProvider): TrackingProviderClient {
  switch (name) {
    case "searates":
      return searatesProvider;
    case "vizion":
      // Not implemented yet — fall back to manual so the DB row still gets
      // created but no external call happens.
      return manualProvider;
    case "manual":
      return manualProvider;
  }
}
