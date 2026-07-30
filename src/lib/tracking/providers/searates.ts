import type { TrackingRefKind } from "@/lib/data/tracking-types";
import { TrackingProviderError, type TrackingProviderClient } from "./index";

/**
 * SeaRates tracking provider.
 *
 * Modelo da API SeaRates (validado contra docs.searates.com):
 *   - É POLLING, não push. Não há endpoint de "subscribe" nem webhook.
 *     Cada `GET /tracking?number=X&type=Y` retorna status + eventos.
 *   - Auth via query param `?api_key=`, NÃO header Authorization.
 *   - Só marítimo: types = CT (container) | BL (bill of lading) | BK (booking).
 *     AWB não é suportado.
 *
 * Quota (trial):
 *   - N chamadas de API + M "unique shipments". A resposta traz
 *     data.metadata.api_calls.{total,used,remaining} e
 *     data.metadata.unique_shipments.{total,used,remaining}.
 *   - Primeira chamada para um número novo consome 1 unique_shipment + 1 api_call.
 *   - Refresh do mesmo número consome só 1 api_call.
 *
 * Setup:
 *   1. `SEARATES_API_KEY` no .env.production
 *   2. (Opcional) `SEARATES_BASE_URL` para overridar em ambiente de teste
 */

const DEFAULT_BASE_URL = "https://tracking.searates.com";

const REF_KIND_TO_SEARATES: Partial<Record<TrackingRefKind, "CT" | "BL" | "BK">> = {
  container: "CT",
  bl: "BL",
  booking: "BK",
  // awb: NÃO suportado — SeaRates é marítimo.
};

export type SearatesQuota = {
  apiCallsRemaining: number | null;
  apiCallsTotal: number | null;
  uniqueShipmentsRemaining: number | null;
  uniqueShipmentsTotal: number | null;
};

export type SearatesTrackingSnapshot = {
  status: string | null;
  updatedAt: string | null;
  events: Array<{
    orderId: number | null;
    description: string;
    date: string;
    containerNumber: string | null;
  }>;
  quota: SearatesQuota;
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

async function searatesGetTracking(params: {
  number: string;
  type: "CT" | "BL" | "BK";
  sealine?: string;
  forceUpdate?: boolean;
}): Promise<{ ok: boolean; status: number; body: unknown }> {
  const { apiKey, baseUrl } = config();
  const url = new URL(`${baseUrl}/tracking`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("number", params.number);
  url.searchParams.set("type", params.type);
  if (params.sealine) url.searchParams.set("sealine", params.sealine);
  if (params.forceUpdate) url.searchParams.set("force_update", "true");

  const res = await fetch(url.toString(), { method: "GET" });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON response */
  }
  return { ok: res.ok, status: res.status, body };
}

function assertMappable(refKind: TrackingRefKind): "CT" | "BL" | "BK" {
  const mapped = REF_KIND_TO_SEARATES[refKind];
  if (!mapped) {
    throw new TrackingProviderError(
      "searates",
      "config",
      `SeaRates não rastreia ${refKind.toUpperCase()} — use um provedor aéreo (ex: vizion) ou registre manualmente.`,
    );
  }
  return mapped;
}

function parseQuota(metadata: Record<string, unknown> | undefined): SearatesQuota {
  const api = (metadata?.api_calls ?? {}) as Record<string, unknown>;
  const uniq = (metadata?.unique_shipments ?? {}) as Record<string, unknown>;
  return {
    apiCallsRemaining: typeof api.remaining === "number" ? api.remaining : null,
    apiCallsTotal: typeof api.total === "number" ? api.total : null,
    uniqueShipmentsRemaining: typeof uniq.remaining === "number" ? uniq.remaining : null,
    uniqueShipmentsTotal: typeof uniq.total === "number" ? uniq.total : null,
  };
}

function normalizeResponse(body: unknown): SearatesTrackingSnapshot {
  const data = ((body ?? {}) as Record<string, unknown>).data as
    | Record<string, unknown>
    | undefined;
  const metadata = (data?.metadata ?? {}) as Record<string, unknown>;
  const containers = (data?.containers ?? []) as Array<Record<string, unknown>>;

  const events: SearatesTrackingSnapshot["events"] = [];
  for (const c of containers) {
    const containerNumber =
      typeof c.number === "string" ? (c.number as string) : null;
    const rawEvents = (c.events ?? []) as Array<Record<string, unknown>>;
    for (const e of rawEvents) {
      if (typeof e.description !== "string" || typeof e.date !== "string") continue;
      events.push({
        orderId: typeof e.order_id === "number" ? (e.order_id as number) : null,
        description: e.description as string,
        date: e.date as string,
        containerNumber,
      });
    }
  }

  return {
    status: typeof metadata.status === "string" ? (metadata.status as string) : null,
    updatedAt:
      typeof metadata.updated_at === "string" ? (metadata.updated_at as string) : null,
    events,
    quota: parseQuota(metadata),
  };
}

function throwForHttp(status: number, action: string): never {
  if (status === 401 || status === 403) {
    throw new TrackingProviderError("searates", "auth", "Chave do SeaRates inválida.");
  }
  if (status === 402) {
    throw new TrackingProviderError(
      "searates",
      "rate_limited",
      "Cota do SeaRates esgotada. Aguarde o próximo ciclo ou faça upgrade do plano.",
    );
  }
  if (status === 429) {
    throw new TrackingProviderError(
      "searates",
      "rate_limited",
      "Muitas chamadas ao SeaRates em pouco tempo. Tente novamente em instantes.",
    );
  }
  if (status === 404) {
    throw new TrackingProviderError(
      "searates",
      "not_found",
      "SeaRates não encontrou este número. Verifique se o BL/container está correto.",
    );
  }
  throw new TrackingProviderError(
    "searates",
    "upstream",
    `SeaRates retornou HTTP ${status} ao ${action}.`,
  );
}

/**
 * SeaRates retorna HTTP 200 mesmo pra erros — o discriminador é
 * `body.status`. Aqui traduzimos as mensagens conhecidas em erros
 * tipados que a UI pode exibir.
 */
function throwForBodyError(body: unknown): void {
  const b = (body ?? {}) as Record<string, unknown>;
  if (b.status !== "error") return;
  const message = typeof b.message === "string" ? (b.message as string) : "UNKNOWN";
  switch (message) {
    case "API_KEY_WRONG":
    case "API_KEY_MISSING":
      throw new TrackingProviderError("searates", "auth", "Chave do SeaRates inválida.");
    case "WRONG_NUMBER":
    case "NOT_FOUND":
      throw new TrackingProviderError(
        "searates",
        "not_found",
        "SeaRates não encontrou este número. Verifique se o container/BL está correto.",
      );
    case "LIMIT_REACHED":
    case "QUOTA_EXCEEDED":
      throw new TrackingProviderError(
        "searates",
        "rate_limited",
        "Cota do SeaRates esgotada. Aguarde o próximo ciclo ou faça upgrade do plano.",
      );
    default:
      throw new TrackingProviderError(
        "searates",
        "upstream",
        `SeaRates retornou erro: ${message}`,
      );
  }
}

/**
 * Busca o snapshot atual de um embarque no SeaRates.
 * CONSOME QUOTA: 1 api_call por chamada, e 1 unique_shipment se o número
 * for novo pra esta conta.
 */
export async function fetchSearatesSnapshot(input: {
  refKind: TrackingRefKind;
  externalRef: string;
  forceUpdate?: boolean;
}): Promise<SearatesTrackingSnapshot> {
  const type = assertMappable(input.refKind);
  const res = await searatesGetTracking({
    number: input.externalRef.toUpperCase(),
    type,
    forceUpdate: input.forceUpdate,
  });
  if (!res.ok) throwForHttp(res.status, "consultar embarque");
  throwForBodyError(res.body);
  return normalizeResponse(res.body);
}

export const searatesProvider: TrackingProviderClient = {
  name: "searates",

  /**
   * SeaRates não tem endpoint de "subscribe". A primeira consulta ao número
   * já registra o embarque no lado deles (unique_shipment) e retorna o status.
   * Aqui só validamos que a chave existe e o tipo é suportado — a chamada
   * de verdade acontece quando o broker abre o processo e clica "Atualizar".
   *
   * providerSubscriptionId = null: não há id upstream a manter.
   */
  async subscribe({ refKind }) {
    // Valida config e mapeamento sem gastar quota.
    config();
    assertMappable(refKind);
    return { providerSubscriptionId: null };
  },

  /**
   * SeaRates não tem cancelamento. Basta parar de consultar.
   */
  async unsubscribe() {
    return;
  },
};
