"use client";

import { Tr } from "@/components/Tr";
import { ColorLabel } from "@/components/ColorLabel";
import { use, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useAppearance } from "./AppearanceProvider";
import { OrderTimeline } from "./OrderTimeline";
import { formatMoneyParts } from "@/lib/money";
import { getOrder, recallLastOrder, showDeliveryCode, type Order } from "@/lib/orders";

/**
 * Receives the route's `params` promise unresolved and reads it here, inside
 * the page's Suspense boundary: awaiting it at the top of the page would
 * block the static shell (Cache Components).
 */
export function OrderConfirmation({ params }: Pick<PageProps<"/commande/[orderNumber]">, "params">) {
  const { orderNumber } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [checkedSession, setCheckedSession] = useState(false);

  useEffect(() => {
    // sessionStorage isn't available during SSR; deferred to after mount
    // to avoid a client/server markup mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrder(recallLastOrder(orderNumber));
    setCheckedSession(true);
  }, [orderNumber]);

  if (!checkedSession) {
    return null;
  }

  if (!order) {
    return <PhoneLookupForm orderNumber={orderNumber} onFound={setOrder} />;
  }

  return <OrderSummary order={order} />;
}

function PhoneLookupForm({ orderNumber, onFound }: { orderNumber: string; onFound: (order: Order) => void }) {
  const { tr } = useAppearance();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const phone = String(new FormData(event.currentTarget).get("phone") ?? "");

    try {
      const order = await getOrder(orderNumber, phone);
      if (!order) {
        setError(tr("Numéro de commande ou téléphone incorrect."));
        return;
      }
      onFound(order);
    } catch {
      setError(tr("La commande est momentanément indisponible. Réessayez dans un instant."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto my-8 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-4 rounded-sm bg-surface p-5 shadow-card border-b-4 border-b-gold sm:p-8">
      <h1 className="font-display text-xl font-semibold text-ink">
        <Tr>Retrouver ma commande</Tr>
      </h1>
      <p className="text-sm text-ink-soft">
        <Tr>Commande</Tr> <span className="text-ink">{orderNumber}</span>
        <Tr>. Entrez le téléphone utilisé lors de la commande pour la consulter.</Tr>
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="field">
          <input
            name="phone"
            type="tel"
            required
            placeholder="07 00 00 00 00"
            className="rounded-sm border border-line bg-surface px-3 py-2 text-ink focus:border-gold focus:outline-none"
          />
          <span className="field-label">
            <Tr>Téléphone</Tr>
          </span>
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-sm bg-gold px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-bright disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? <Tr>Recherche…</Tr> : <Tr>Afficher ma commande</Tr>}
        </button>
      </form>
    </main>
  );
}

function OrderSummary({ order }: { order: Order }) {
  const subtotal = formatMoneyParts(order.subtotal);

  return (
    <main className="mx-auto my-4 flex w-[calc(100%-2rem)] max-w-2xl flex-1 flex-col gap-6 rounded-sm bg-surface p-5 shadow-card border-b-4 border-b-gold sm:p-8">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-gold">
          <Tr>Commande enregistrée</Tr>
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink">
          <Tr>Merci,</Tr> {order.customer_name.split(" ")[0]} !
        </h1>
        <p className="text-ink-soft">
          <Tr>Commande</Tr> <span className="text-ink">{order.order_number}</span> <Tr>- paiement à la livraison.</Tr>
        </p>
      </div>

      <OrderTimeline status={order.status} history={order.status_history} />

      {showDeliveryCode(order) ? (
        <div className="flex flex-col gap-1 rounded-sm border border-gold-deep p-4">
          <p className="text-sm text-ink-soft">
            <Tr>Code de confirmation de livraison</Tr>
          </p>
          <p className="font-display text-3xl tracking-[0.3em] text-gold-bright">{order.delivery_code}</p>
          <p className="text-xs text-ink-soft">
            <Tr>
              Ne le communiquez au livreur qu&apos;au moment de recevoir votre colis : c&apos;est votre preuve de
              remise.
            </Tr>
          </p>
        </div>
      ) : null}

      <ul className="flex flex-col divide-y divide-line border-y border-line text-sm">
        {order.items.map((item) => {
          const lineTotal = formatMoneyParts(item.line_total);
          return (
            <li key={item.offer_id} className="flex items-center justify-between py-2">
              <span className="text-ink">
                {item.product_name} <span className="text-ink-soft">× {item.quantity}</span>
                {item.color ? <ColorLabel color={item.color} /> : null}
              </span>
              <span className="text-ink">
                {lineTotal.amount} {lineTotal.label}
              </span>
            </li>
          );
        })}
      </ul>

      {order.discount && order.discount.amount > 0 ? (
        <p className="self-end text-sm text-ink-soft">
          <Tr>Remise</Tr>
          {order.coupon_code ? ` (${order.coupon_code})` : ""} : −{formatMoneyParts(order.discount).amount}{" "}
          {formatMoneyParts(order.discount).label}
        </p>
      ) : null}

      <p className="self-end font-display text-lg">
        <Tr>Total :</Tr> <span className="gold-text font-semibold">{subtotal.amount}</span>{" "}
        <span className="text-ink-soft">{subtotal.label}</span>
      </p>

      <div className="flex flex-col gap-1 border-t border-line pt-4 text-sm text-ink-soft">
        <p>
          <Tr>Livraison :</Tr> {order.delivery_address}
          {order.delivery_city ? `, ${order.delivery_city}` : ""}
        </p>
        <p>
          <Tr>Téléphone :</Tr> {order.customer_phone}
        </p>
      </div>

      <Link href="/" className="text-sm text-gold underline-offset-4 hover:underline">
        <Tr>Continuer mes achats</Tr>
      </Link>
    </main>
  );
}
