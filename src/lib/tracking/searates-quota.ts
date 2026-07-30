import type { SearatesQuota } from "./providers/searates";

/**
 * Snapshot da última resposta do SeaRates com informação de quota.
 * O SeaRates devolve estes campos em toda resposta bem-sucedida de /tracking.
 *
 * Guardado em memória: se o processo reiniciar, some. Isso é aceitável no
 * MVP — o admin vê "—" até a próxima chamada. Se quiser persistir, promover
 * pra tabela `provider_quotas` depois.
 */
export type SearatesQuotaSnapshot = SearatesQuota & {
  observedAt: Date;
};

let latest: SearatesQuotaSnapshot | null = null;

export function recordSearatesQuota(quota: SearatesQuota): void {
  latest = { ...quota, observedAt: new Date() };
}

export function getLatestSearatesQuota(): SearatesQuotaSnapshot | null {
  return latest;
}
