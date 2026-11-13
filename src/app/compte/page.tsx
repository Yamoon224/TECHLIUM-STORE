"use client";

import { Tr } from "@/components/Tr";
import { ColorLabel } from "@/components/ColorLabel";
import { useAppearance } from "@/components/AppearanceProvider";
import { LogOut, Package } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { OrderInvoices } from "@/components/OrderInvoices";
import { OrderTimeline } from "@/components/OrderTimeline";
import { formatMoneyParts } from "@/lib/money";
import { listMyOrders, OrdersError, partialLabel, showDeliveryCode, type Order } from "@/lib/orders";
import { formatOrderDate } from "@/lib/orderTimeline";

export default function AccountPage() {
  const { tr } = useAppearance();
  const router = useRouter();
  const { status, token, user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!token) return;

    setLoading(true);
    listMyOrders(token)
      .then(setOrders)
      .catch((caught) => setError(caught instanceof OrdersError ? caught.message : tr("Commandes indisponibles.")))
      .finally(() => setLoading(false));
  }, [token, tr]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  if (status === "checking") {
    return <p className="px-4 py-16 text-center text-sm text-ink-soft"><Tr>Vérification de la session…</Tr></p>;
  }

  if (!user || !token) {
    return (
      <main className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-3 px-4">
        <p className="text-ink-soft"><Tr>Connectez-vous pour accéder à votre compte.</Tr></p>
        <Link href="/connexion" className="text-sm text-gold underline-offset-4 hover:underline">
          <Tr>Se connecter</Tr>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-4">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-sm bg-surface p-4 shadow-card border-b-4 border-b-gold sm:p-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{user.name}</h1>
          {user.email ? <p className="text-sm text-ink-soft">{user.email}</p> : null}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/support" className="text-sm font-medium text-gold-bright underline-offset-4 hover:underline">
            <Tr>Un souci ? Contacter le support</Tr>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-sm border border-line px-3 py-1.5 text-sm text-ink transition-colors hover:border-gold"
          >
            <LogOut className="h-4 w-4" aria-hidden /> <Tr>Se déconnecter</Tr>
          </button>
        </div>
      </section>

      <h2 className="flex items-center gap-2 px-1 font-display text-lg font-semibold text-ink">
        <Package className="h-5 w-5 text-gold" aria-hidden /> <Tr>Mes commandes</Tr>
      </h2>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-ink-soft"><Tr>Chargement…</Tr></p>
      ) : orders.length === 0 ? (
        <p className="rounded-sm bg-surface p-6 text-sm text-ink-soft shadow-card border-b-4 border-b-gold">
          <Tr>Aucune commande pour l&apos;instant.</Tr>{" "}
          <Link href="/" className="text-gold-bright underline-offset-4 hover:underline">
            <Tr>Voir le catalogue</Tr>
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((order) => (
            <OrderCard key={order.order_number} order={order} token={token} />
          ))}
        </ul>
      )}
    </main>
  );
}

function OrderCard({ order, token }: { order: Order; token: string }) {
  const total = formatMoneyParts(order.subtotal);
  const placedOn = formatOrderDate(order.created_at);
  const headline = partialLabel(order);

  return (
    <li className="flex flex-col gap-4 rounded-sm bg-surface p-4 shadow-card border-b-4 border-b-gold sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-ink"><Tr>Commande</Tr> {order.order_number}</p>
          <p className="text-xs text-ink-soft">
            {placedOn ? (
              <>
                <Tr>Passée le</Tr> {placedOn}
                {" · "}
              </>
            ) : null}
            {order.items.length} <Tr>{order.items.length > 1 ? "articles" : "article"}</Tr>
          </p>
        </div>
        <p className="text-lg font-semibold text-ink">
          {total.amount} {total.label}
        </p>
      </div>

      <OrderTimeline status={order.status} history={order.status_history} />

      <Link
        href={`/compte/commandes/${encodeURIComponent(order.order_number)}`}
        className="self-start text-sm font-medium text-gold-bright underline-offset-4 hover:underline"
      >
        <Tr>Suivre cette commande en détail</Tr>
      </Link>

      {headline ? <p className="text-sm font-medium text-gold-bright"><Tr>{headline}</Tr></p> : null}
      {order.partial
        ? order.sub_orders?.map((parcel, index) => (
            <p key={parcel.id} className="-mt-2 text-xs text-ink-soft">
              <Tr>Colis</Tr> {index + 1} : <Tr>{STATUS_LABEL[parcel.status] ?? parcel.status}</Tr>
            </p>
          ))
        : null}

      {showDeliveryCode(order) ? (
        <p className="rounded-sm bg-gold-highlight px-3 py-2 text-sm text-gold-bright">
          <Tr>Code de livraison :</Tr> <span className="font-display font-semibold tracking-widest">{order.delivery_code}</span>
          <span className="block text-xs"><Tr>À ne donner au livreur qu&apos;à la remise du colis.</Tr></span>
        </p>
      ) : null}

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

      {order.status !== "pending" && order.status !== "cancelled" ? (
        <OrderInvoices token={token} orderNumber={order.order_number} />
      ) : null}
    </li>
  );
}

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};
