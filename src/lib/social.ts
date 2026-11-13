/** The shop's public pages, shown in the footer. */
export const TIKTOK_URL = "https://www.tiktok.com/@techliumgroupe0";

/** The means of payment shown in the footer strip, in order. */
export type PaymentBadgeId = "mtn" | "wave" | "cash" | "visa" | "mastercard" | "orange";

export const ACCEPTED_PAYMENTS: readonly { id: PaymentBadgeId; label: string }[] = [
  { id: "mtn", label: "MTN Mobile Money" },
  { id: "wave", label: "Wave" },
  { id: "cash", label: "Espèces" },
  { id: "visa", label: "Visa" },
  { id: "mastercard", label: "Mastercard" },
  { id: "orange", label: "Orange Money" },
];
