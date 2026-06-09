import type { TrackingRefKind } from "@/lib/data/tracking-types";
import { TrackingProviderError, type TrackingProviderClient } from "./index";

/**
 * SeaRates tracking provider.
 *
 * SETUP CHECKLIST (when you have an API key):
 *   1. Create an account at https://www.searates.com/dashboard
 *   2. Generate an API key in Settings → API
 *   3. In the SeaRates dashboard, configure your webhook URL:
 *        https://aduanasync.com.br/api/webhooks/tracking
 *      and webhook secret = the value of TRACKING_WEBHOOK_SECRET in .env
 *   4. Set SEARATES_API_KEY and SEARATES_BASE_URL in .env
 *   5. Verify the request shapes below against the current SeaRates docs
 *      (they sometimes ship breaking changes; see TODOs)
 *
 * NOTE: as of writing this skeleton, the SeaRates API surface area was not
 * verified against a live account. The endpoint paths and JSON shapes are
 * best-guess based on their public docs and may need 1-line tweaks.
 */

const DEFAULT_BASE_URL = "https://tracking.searates.com/api";

const REF_KIND_TO_SEARATES: Record<TrackingRefKind, string> = {
  // SeaRates accepts container number, BL/booking, or AWB depending on the
  // shipment kind. The exact `type` keyword may differ across plans — confirm
  // against your account's docs before launch.
  container: "CT",
  bl: "BL",
  awb: "AWB",
  booking: "BK",
};

function config() {
  const apiKey = process.env.SEARATES_API_KEY;
  if (!apiKey) {
    throw new TrackingProviderError(
      "searates",
      "config",
      "SEARATES_API_KEY ausente no .env — adicione a chave para usar este provedor.",
    );
  }
  const baseUrl = (process.env.SEARATES_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  return { apiKey, baseUrl };
}

async function searatesFetch(
  path: string,
  init: RequestInit,
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const { apiKey, baseUrl } = config();
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(init.headers ?? {}),
    },
  });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON response */
  }
  return { ok: res.ok, status: res.status, body };
}

export const searatesProvider: TrackingProviderClient = {
  name: "searates",

  async subscribe({ refKind, externalRef }) {
    // TODO(searates-docs): confirm endpoint path + payload shape against the
    // current SeaRates API version. The shape below is the documented
    // "Container Tracking" endpoint.
    const payload = {
      number: externalRef.toUpperCase(),
      type: REF_KIND_TO_SEARATES[refKind],
      // Some SeaRates plans require `sealine` for BL types; leave undefined
      // unless your account requires it.
    };

    const res = await searatesFetch("/tracking", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.status === 401 || res.status === 403) {
      throw new TrackingProviderError("searates", "auth", "Chave do SeaRates inválida.");
    }
    if (res.status === 429) {
      throw new TrackingProviderError(
        "searates",
        "rate_limited",
        "Limite de chamadas do SeaRates atingido. Tente em alguns minutos.",
      );
    }
    if (!res.ok) {
      throw new TrackingProviderError(
        "searates",
        "upstream",
        `SeaRates retornou HTTP ${res.status} ao criar rastreamento.`,
      );
    }

    // TODO(searates-docs): extract the right field name. Common alternatives
    // observed in the wild: `id`, `tracking_id`, `data.id`.
    const body = (res.body ?? {}) as Record<string, unknown>;
    const id =
      (typeof body.id === "string" && body.id) ||
      (typeof body.tracking_id === "string" && body.tracking_id) ||
      (typeof (body.data as Record<string, unknown> | undefined)?.id === "string" &&
        ((body.data as Record<string, unknown>).id as string)) ||
      null;

    return { providerSubscriptionId: id };
  },

  async unsubscribe({ providerSubscriptionId }) {
    if (!providerSubscriptionId) return;
    // TODO(searates-docs): confirm DELETE path. Some accounts use
    // POST /tracking/cancel with the id in the body instead.
    const res = await searatesFetch(`/tracking/${encodeURIComponent(providerSubscriptionId)}`, {
      method: "DELETE",
    });
    if (res.status === 404) return; // already gone — idempotent
    if (res.status === 401 || res.status === 403) {
      throw new TrackingProviderError("searates", "auth", "Chave do SeaRates inválida.");
    }
    if (!res.ok) {
      throw new TrackingProviderError(
        "searates",
        "upstream",
        `SeaRates retornou HTTP ${res.status} ao cancelar rastreamento.`,
      );
    }
  },
};
