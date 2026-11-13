"use client";

import { Tr } from "@/components/Tr";
import { ColorLabel } from "@/components/ColorLabel";
import { useAppearance } from "@/components/AppearanceProvider";
import { MapPin, Wallet } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartProvider";
import { ProductTile } from "@/components/ProductTile";
import { formatMoneyParts } from "@/lib/money";
import { CouponError, quoteCoupon, totalAfterDiscount, type CouponQuote } from "@/lib/coupons";
import { CheckoutError, placeOrder, rememberLastOrder } from "@/lib/orders";

export default function CheckoutPage() {
  const { tr, appearance } = useAppearance();
  const router = useRouter();
  const { token, user } = useAuth();
  const { items, subtotalAmount, clear, count } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [couponInput, setCouponInput] = useState("");
  const [quote, setQuote] = useState<CouponQuote | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  if (items.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-start justify-center gap-3 px-4 py-16">
        <h1 className="font-display text-2xl font-semibold text-ink">
          <Tr>Votre panier est vide</Tr>
        </h1>
        <p className="text-ink-soft">
          <Tr>Ajoutez des produits avant de passer commande.</Tr>
        </p>
        <Link href="/" className="text-sm text-gold underline-offset-4 hover:underline">
          <Tr>Voir le catalogue</Tr>
        </Link>
      </main>
    );
  }

  const currency = items[0]?.currency ?? "XOF";
  const subtotal = formatMoneyParts({ amount: subtotalAmount, currency });
  const discount = quote ? formatMoneyParts({ amount: quote.discount_amount, currency }) : null;
  const total = formatMoneyParts({ amount: totalAfterDiscount(subtotalAmount, quote?.discount_amount ?? 0), currency });

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setCheckingCoupon(true);
    setCouponError(null);

    // The phone, when already typed, enables per-customer limits in the preview.
    const phone = formRef.current ? String(new FormData(formRef.current).get("customer_phone") ?? "") : "";

    try {
      setQuote(await quoteCoupon(couponInput, subtotalAmount, phone));
    } catch (caught) {
      setQuote(null);
      setCouponError(caught instanceof CouponError ? caught.message : tr("Code indisponible, réessayez."));
    } finally {
      setCheckingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setQuote(null);
    setCouponInput("");
    setCouponError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);

    try {
      const order = await placeOrder(
        {
          items: items.map((item) => ({ offer_id: item.offerId, quantity: item.quantity, color: item.color?.name })),
          customer_name: String(form.get("customer_name") ?? ""),
          customer_phone: String(form.get("customer_phone") ?? ""),
          customer_email: String(form.get("customer_email") ?? "").trim() || undefined,
          delivery_address: String(form.get("delivery_address") ?? ""),
          delivery_city: String(form.get("delivery_city") ?? "") || undefined,
          notes: String(form.get("notes") ?? "") || undefined,
          coupon_code: quote?.code,
          locale: appearance.language,
        },
        token,
      );

      rememberLastOrder(order);
      clear();
      router.push(`/commande/${order.order_number}`);
    } catch (caught) {
      setError(caught instanceof CheckoutError ? caught.message : tr("La commande n'a pas pu être enregistrée."));
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-4">
      <h1 className="font-display text-2xl font-semibold text-ink">
        <Tr>Finaliser la commande</Tr>
      </h1>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_360px]">
        <section className="flex flex-col gap-4 rounded-sm bg-surface p-4 shadow-card border-b-4 border-b-gold sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
            <MapPin className="h-5 w-5 text-gold" aria-hidden /> <Tr>Livraison</Tr>
          </h2>

          {user ? null : (
            <p className="rounded-sm bg-gold-highlight px-3 py-2 text-sm text-gold-bright">
              <Tr>
                Pas besoin de compte : indiquez seulement votre nom, votre numéro de téléphone et le lieu de livraison.
              </Tr>{" "}
              <Link href="/connexion" className="font-medium underline underline-offset-4">
                <Tr>J&apos;ai déjà un compte</Tr>
              </Link>
            </p>
          )}

          <form id="checkout-form" ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field">
                <input
                  placeholder={tr("Ex. Awa Diallo")}
                  name="customer_name"
                  required
                  defaultValue={user?.name}
                  className="rounded-sm border border-line bg-surface px-3 py-2 text-ink focus:border-gold focus:outline-none"
                />
                <span className="field-label">
                  <Tr>Nom complet</Tr>
                </span>
              </label>

              <label className="field">
                <input
                  name="customer_phone"
                  type="tel"
                  required
                  defaultValue={user?.phone ?? undefined}
                  placeholder="07 00 00 00 00"
                  className="rounded-sm border border-line bg-surface px-3 py-2 text-ink focus:border-gold focus:outline-none"
                />
                <span className="field-label">
                  <Tr>Téléphone</Tr>
                </span>
              </label>
            </div>

            <label className="field">
              <textarea
                name="delivery_address"
                required
                rows={2}
                placeholder={tr("Ex : Cocody Angré, non loin de la pharmacie du carrefour")}
                className="rounded-sm border border-line bg-surface px-3 py-2 text-ink focus:border-gold focus:outline-none"
              />
              <span className="field-label">
                <Tr>Adresse de livraison (quartier, repères)</Tr>
              </span>
            </label>

            <details className="rounded-sm border border-line p-3 text-sm">
              <summary className="cursor-pointer font-medium text-ink">
                <Tr>Ajouter des précisions (ville, e-mail, notes)</Tr>
              </summary>
              <div className="mt-3 flex flex-col gap-4">
                <label className="field">
                  <input
                    name="customer_email"
                    type="email"
                    defaultValue={user?.email ?? undefined}
                    placeholder={tr("vous@exemple.com")}
                    className="rounded-sm border border-line bg-surface px-3 py-2 text-ink focus:border-gold focus:outline-none"
                  />
                  <span className="field-label">
                    <Tr>E-mail (facultatif)</Tr>
                  </span>
                </label>

                <label className="field">
                  <input
                    name="delivery_city"
                    placeholder={tr("Abidjan")}
                    className="rounded-sm border border-line bg-surface px-3 py-2 text-ink focus:border-gold focus:outline-none"
                  />
                  <span className="field-label">
                    <Tr>Ville</Tr>
                  </span>
                </label>

                <label className="field">
                  <textarea
                    placeholder={tr("Ex. Appeler avant de livrer")}
                    name="notes"
                    rows={2}
                    className="rounded-sm border border-line bg-surface px-3 py-2 text-ink focus:border-gold focus:outline-none"
                  />
                  <span className="field-label">
                    <Tr>Notes (optionnel)</Tr>
                  </span>
                </label>
              </div>
            </details>
          </form>

          <div className="flex items-center gap-3 rounded-sm bg-bg p-3 text-sm text-ink">
            <Wallet className="h-5 w-5 shrink-0 text-gold" aria-hidden />
            <span>
              <span className="font-semibold">
                <Tr>Paiement à la livraison.</Tr>
              </span>{" "}
              <Tr>Vous payez au livreur, à la remise du colis.</Tr>
            </span>
          </div>
        </section>

        <aside className="flex flex-col gap-4 rounded-sm bg-surface p-4 shadow-card border-b-4 border-b-gold lg:sticky lg:top-28">
          <h2 className="font-display text-base font-semibold text-ink">
            <Tr>Récapitulatif (</Tr>
            {count})
          </h2>

          <ul className="flex flex-col divide-y divide-line border-y border-line text-sm">
            {items.map((item) => {
              const lineTotal = formatMoneyParts({ amount: item.priceAmount * item.quantity, currency: item.currency });
              return (
                <li key={`${item.offerId}-${item.color?.name ?? ""}`} className="flex items-center gap-3 py-2">
                  <div className="w-12 shrink-0">
                    <ProductTile
                      id={item.offerId}
                      brand={item.brand}
                      categoryName={null}
                      imageUrl={item.imageUrl}
                      alt={item.productName}
                    />
                  </div>
                  <span className="flex-1 text-ink">
                    {item.productName} <span className="text-ink-soft">× {item.quantity}</span>
                    {item.color ? <ColorLabel color={item.color} /> : null}
                  </span>
                  <span className="text-ink">
                    {lineTotal.amount} {lineTotal.label}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-2 rounded-sm border border-line p-3">
            <div className="flex gap-2">
              <label className="field min-w-0 flex-1">
                <input
                  value={couponInput}
                  onChange={(event) => setCouponInput(event.target.value)}
                  disabled={quote !== null}
                  placeholder="BIENVENUE10"
                  className="min-w-0 rounded-sm border border-line bg-surface px-3 py-2 uppercase text-ink focus:border-gold focus:outline-none disabled:opacity-60"
                />
                <span className="field-label">
                  <Tr>Code promotionnel</Tr>
                </span>
              </label>

              {quote ? (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="rounded-sm border border-line px-3 py-2 text-sm text-ink transition-colors hover:border-gold"
                >
                  <Tr>Retirer</Tr>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={checkingCoupon || !couponInput.trim()}
                  className="rounded-sm border border-gold px-3 py-2 text-sm text-gold transition-colors disabled:opacity-50"
                >
                  <Tr>Appliquer</Tr>
                </button>
              )}
            </div>
            {couponError ? <p className="text-sm text-danger">{couponError}</p> : null}
            {quote && discount ? (
              <p className="text-sm text-ink-soft">
                <Tr>Code</Tr> {quote.code} <Tr>appliqué : −</Tr>
                {discount.amount} {discount.label}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1 border-t border-line pt-3 text-sm">
            <p className="flex justify-between text-ink-soft">
              <span>
                <Tr>Sous-total</Tr>
              </span>
              <span>
                {subtotal.amount} {subtotal.label}
              </span>
            </p>
            {quote && discount ? (
              <p className="flex justify-between text-ink-soft">
                <span>
                  <Tr>Remise</Tr>
                </span>
                <span>
                  −{discount.amount} {discount.label}
                </span>
              </p>
            ) : null}
            <p className="flex justify-between text-lg font-semibold text-ink">
              <span>
                <Tr>Total</Tr>
              </span>
              <span>
                {total.amount} {total.label}
              </span>
            </p>
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <button
            type="submit"
            form="checkout-form"
            disabled={submitting}
            className="rounded-sm bg-gold px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Tr>Envoi…</Tr> : <Tr>Confirmer la commande</Tr>}
          </button>
        </aside>
      </div>
    </main>
  );
}
