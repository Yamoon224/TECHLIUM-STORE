"use client";

import { Tr } from "@/components/Tr";
import { ColorLabel } from "@/components/ColorLabel";
import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { OrderInvoices } from "./OrderInvoices";
import { OrderReceipts } from "./OrderReceipts";
import { OrderReturns } from "./OrderReturns";
import { OrderTimeline } from "./OrderTimeline";
import { formatMoneyParts } from "@/lib/money";
import { getMyOrder, partialLabel, showDeliveryCode, type Order } from "@/lib/orders";
import { formatOrderDate } from "@/lib/orderTimeline";

/**
 * Detailed tracking of one of the signed-in customer's orders: the overall
 * timeline, and - when the order is split between sellers - one timeline per
 * parcel. Receives `params` unresolved and reads it inside the page's
 * Suspense boundary (see OrderConfirmation).
 */
export function OrderTracking({ params }: Pick<PageProps<"/compte/commandes/[orderNumber]">, "params">) {
  const { orderNumber } = use(params);
  const { status, token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    getMyOrder(token, orderNumber)
      .then((found) => {
        if (cancelled) return;
        setOrder(found);
        setState(found ? "ready" : "missing");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [token, orderNumber]);

  if (status === "checking") {
    return <p className="px-4 py-16 text-center text-sm text-ink-soft"><Tr>Vérification de la session…</Tr></p>;
  }

  if (!token) {
    return (
      <main className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-3 px-4">
        <p className="text-ink-soft"><Tr>Connectez-vous pour suivre votre commande.</Tr></p>
        <Link href="/connexion" className="text-sm text-gold-bright underline-offset-4 hover:underline">
          <Tr>Se connecter</Tr>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-4">
      <Link href="/compte" className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-gold">
        <ArrowLeft className="h-4 w-4" aria-hidden /> <Tr>Mes commandes</Tr>
      </Link>

      {state === "loading" ? <p className="text-sm text-ink-soft"><Tr>Chargement…</Tr></p> : null}
      {state === "missing" ? (
        <p className="rounded-sm bg-surface p-6 text-sm text-ink-soft shadow-card border-b-4 border-b-gold"><Tr>Cette commande est introuvable dans votre compte.</Tr></p>
      ) : null}
      {state === "error" ? <p className="text-sm text-danger"><Tr>Le suivi est momentanément indisponible.</Tr></p> : null}
      {state === "ready" && order ? <Tracking order={order} token={token} /> : null}
    </main>
  );
}

function Tracking({ order, token }: { order: Order; token: string }) {
  const total = formatMoneyParts(order.subtotal);
  const placedOn = formatOrderDate(order.created_at);
  const parcels = order.sub_orders ?? [];
  const split = parcels.length > 1;
  const headline = partialLabel(order);

  return (
    <>
      <section className="flex flex-col gap-4 rounded-sm bg-surface p-4 shadow-card border-b-4 border-b-gold sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="font-display text-xl font-semibold text-ink"><Tr>Commande</Tr> {order.order_number}</h1>
            <p className="text-xs text-ink-soft">{placedOn ? <><Tr>Passée le</Tr> {placedOn}</> : ""}</p>
          </div>
          <p className="text-lg font-semibold text-ink">
            {total.amount} {total.label}
          </p>
        </div>

        <OrderTimeline status={order.status} history={order.status_history} />

        {headline ? <p className="text-sm font-medium text-gold-bright"><Tr>{headline}</Tr></p> : null}

        {showDeliveryCode(order) ? (
          <p className="rounded-sm bg-gold-highlight px-3 py-2 text-sm text-gold-bright">
            <Tr>Code de livraison :</Tr> <span className="font-display font-semibold tracking-widest">{order.delivery_code}</span>
            <span className="block text-xs"><Tr>À ne donner au livreur qu&apos;à la remise du colis.</Tr></span>
          </p>
        ) : null}
      </section>

      {split
        ? parcels.map((parcel, index) => {
            const subtotal = formatMoneyParts(parcel.subtotal);
            return (
              <section key={parcel.id} className="flex flex-col gap-3 rounded-sm bg-surface p-4 shadow-card border-b-4 border-b-gold sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="font-display text-base font-semibold text-ink"><Tr>Colis</Tr> {index + 1} - <Tr>{parcel.vendor_id === null ? "expédié par TechLium" : "vendeur vérifié"}</Tr>
                  </h2>
                  <p className="text-sm font-medium text-ink">
                    {subtotal.amount} {subtotal.label}
                  </p>
                </div>

                <OrderTimeline status={parcel.status} history={parcel.status_history ?? undefined} />

                {parcel.items?.length ? (
                  <ul className="flex flex-col divide-y divide-line border-y border-line text-sm">
                    {parcel.items.map((item, itemIndex) => (
                      <li key={`${item.product_name}-${itemIndex}`} className="py-2 text-ink">
                        {item.brand} {item.product_name} <span className="text-ink-soft">× {item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            );
          })
        : (
          <section className="rounded-sm bg-surface p-4 shadow-card border-b-4 border-b-gold sm:p-6">
            <h2 className="mb-3 font-display text-base font-semibold text-ink"><Tr>Articles</Tr></h2>
            <ul className="flex flex-col divide-y divide-line border-y border-line text-sm">
              {order.items.map((item) => {
                const line = formatMoneyParts(item.line_total);
                return (
                  <li key={item.offer_id} className="flex items-center justify-between gap-3 py-2">
                    <span className="text-ink">
                      {item.brand} {item.product_name} <span className="text-ink-soft">× {item.quantity}</span>
                      {item.color ? <ColorLabel color={item.color} /> : null}
                    </span>
                    <span className="shrink-0 text-ink-soft">
                      {line.amount} {line.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

      <OrderReturns order={order} token={token} />

      <section className="flex flex-col gap-3 rounded-sm bg-surface p-4 text-sm shadow-card border-b-4 border-b-gold sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
          <MapPin className="h-4 w-4 text-gold" aria-hidden /> <Tr>Livraison</Tr>
        </h2>
        <p className="text-ink">
          {order.customer_name} - {order.customer_phone}
          <br />
          {order.delivery_address}
          {order.delivery_city ? `, ${order.delivery_city}` : ""}
        </p>
        {order.status !== "pending" && order.status !== "cancelled" ? (
          <>
            <OrderInvoices token={token} orderNumber={order.order_number} />
            <OrderReceipts token={token} orderNumber={order.order_number} />
          </>
        ) : null}
        <p className="text-ink-soft">
          <Tr>Un souci avec cette commande ?</Tr>{" "}
          <Link href="/support" className="text-gold-bright underline-offset-4 hover:underline">
            <Tr>Contacter le support</Tr>
          </Link>
        </p>
      </section>
    </>
  );
}
