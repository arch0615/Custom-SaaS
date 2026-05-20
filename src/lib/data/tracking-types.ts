export type TrackingProvider = "searates" | "vizion" | "manual";
export type TrackingRefKind = "container" | "bl" | "awb" | "booking";

export type TrackingSubscriptionRow = {
  id: string;
  processId: string;
  provider: TrackingProvider;
  refKind: TrackingRefKind;
  externalRef: string;
  lastPolledAt: Date | null;
  lastEventAt: Date | null;
  disabled: string | null;
  createdAt: Date;
};

export const TRACKING_PROVIDER_LABEL: Record<TrackingProvider, string> = {
  searates: "SeaRates",
  vizion: "Vizion",
  manual: "Manual",
};

export const TRACKING_REF_KIND_LABEL: Record<TrackingRefKind, string> = {
  container: "Container",
  bl: "BL",
  awb: "AWB",
  booking: "Booking",
};
