-- Customs broker status workflow v2 — 8 categorias com ~30 sub-status.
-- Mantém as etapas antigas no enum por compatibilidade com dados existentes.
-- Quando rodar em DB virgem, esses ALTER TYPE são idempotentes via IF NOT EXISTS.

ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'aguarda_docs_originais';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'aguarda_correcao_draft';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'aguarda_bl_original';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'aguarda_confirmacao_embarque';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'embarcado';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'aguarda_chegada_eta';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'carga_chegada';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'aguarda_presenca_carga';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'aguarda_desova_lcl';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'aguarda_deferimento_li';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'aguarda_liberacao_mapa';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'aguarda_valor_numerario';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'di_registrada';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'canal_verde';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'canal_amarelo';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'canal_vermelho';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'canal_cinza';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'em_analise_fiscal';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'aguarda_exoneracao_icms';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'aguarda_pagamento_icms';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'icms_liberado';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'aguarda_pagamento_armazenagem';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'aguarda_liberacao_terminal';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'processo_faturado_terminal';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'aguarda_agendamento_carregamento';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'em_entrega';--> statement-breakpoint
ALTER TYPE "process_stage" ADD VALUE IF NOT EXISTS 'processo_finalizado';
