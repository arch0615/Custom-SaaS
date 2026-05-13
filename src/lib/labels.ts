export const CUSTOMER_TYPE_LABEL = {
  importer: "Importador",
  exporter: "Exportador",
  both: "Importador/Exportador",
} as const;

export const CUSTOMER_TYPE_OPTIONS = [
  { value: "importer", label: CUSTOMER_TYPE_LABEL.importer },
  { value: "exporter", label: CUSTOMER_TYPE_LABEL.exporter },
  { value: "both", label: CUSTOMER_TYPE_LABEL.both },
] as const;
