import type { PaymentBadgeId } from "./shop";

/** The drawn means of payment, with their names (the backoffice picks which ones the footer shows). */
export const PAYMENT_LABELS: Record<PaymentBadgeId, string> = {
  mtn: "MTN Mobile Money",
  wave: "Wave",
  cash: "Espèces",
  visa: "Visa",
  mastercard: "Mastercard",
  orange: "Orange Money",
};
