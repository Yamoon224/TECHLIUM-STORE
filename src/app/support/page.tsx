"use client";

import { Tr } from "@/components/Tr";
import { useAppearance } from "@/components/AppearanceProvider";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { listMyOrders, type Order } from "@/lib/orders";
import {
  CATEGORY_LABEL,
  SupportError,
  TICKET_STATUS_LABEL,
  canReply,
  getTicket,
  listTickets,
  needsYourReply,
  openTicket,
  replyToTicket,
  type Ticket,
  type TicketCategory,
} from "@/lib/support";

export default function HelpPage() {
  const { tr } = useAppearance();
  const { status, token, user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!token) return;
    listTickets(token)
      .then(setTickets)
      .catch((caught) => setError(caught instanceof SupportError ? caught.message : tr("Tickets indisponibles.")));
  }, [token, tr]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!token) return;
    listMyOrders(token)
      .then(setOrders)
      .catch(() => setOrders([]));
  }, [token]);

  async function open(ticket: Ticket) {
    if (!token) return;
    setError(null);
    try {
      setSelected(await getTicket(token, ticket.id));
    } catch (caught) {
      setError(caught instanceof SupportError ? caught.message : tr("Conversation indisponible."));
    }
  }

  if (status === "checking") {
    return (
      <p className="px-4 py-16 text-center text-sm text-ink-soft">
        <Tr>Vérification de la session…</Tr>
      </p>
    );
  }

  if (!user || !token) {
    return (
      <main className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-3 px-4">
        <p className="text-ink-soft">
          <Tr>Connectez-vous pour contacter le support.</Tr>
        </p>
        <Link href="/connexion" className="text-sm text-gold underline-offset-4 hover:underline">
          <Tr>Se connecter</Tr>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto my-4 flex w-[calc(100%-2rem)] max-w-2xl flex-1 flex-col gap-8 rounded-sm bg-surface p-5 shadow-card border-b-4 border-b-gold sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">
          <Tr>Aide et support</Tr>
        </h1>
        <Link href="/compte" className="text-sm text-gold underline-offset-4 hover:underline">
          <Tr>Mon compte</Tr>
        </Link>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {selected ? (
        <Conversation
          ticket={selected}
          onBack={() => {
            setSelected(null);
            refresh();
          }}
          onReply={async (body) => {
            setSelected(await replyToTicket(token, selected.id, body));
          }}
        />
      ) : (
        <>
          <NewTicketForm
            orders={orders}
            onSubmit={async (input) => {
              const created = await openTicket(token, input);
              refresh();
              setSelected(created);
            }}
          />

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-semibold text-ink">
              <Tr>Mes demandes</Tr>
            </h2>
            {tickets.length === 0 ? (
              <p className="text-sm text-ink-soft">
                <Tr>Aucune demande pour l&apos;instant.</Tr>
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-line border-y border-line text-sm">
                {tickets.map((ticket) => (
                  <li key={ticket.id}>
                    <button
                      type="button"
                      onClick={() => open(ticket)}
                      className="flex w-full items-center justify-between gap-3 py-3 text-left"
                    >
                      <span className="flex flex-col gap-0.5">
                        <span className="text-ink">{ticket.subject}</span>
                        <span className="text-xs text-ink-soft">
                          {ticket.number} · <Tr>{CATEGORY_LABEL[ticket.category]}</Tr>
                        </span>
                      </span>
                      <span
                        className={`text-xs ${needsYourReply(ticket.status) ? "text-gold-bright" : "text-ink-soft"}`}
                      >
                        <Tr>{TICKET_STATUS_LABEL[ticket.status]}</Tr>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function NewTicketForm({
  orders,
  onSubmit,
}: {
  orders: Order[];
  onSubmit: (input: {
    subject: string;
    category: TicketCategory;
    message: string;
    order_number?: string;
  }) => Promise<void>;
}) {
  const { tr } = useAppearance();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        subject: String(data.get("subject") ?? ""),
        category: String(data.get("category") ?? "other") as TicketCategory,
        message: String(data.get("message") ?? ""),
        order_number: String(data.get("order_number") ?? "") || undefined,
      });
      form.reset();
    } catch (caught) {
      setError(caught instanceof SupportError ? caught.message : tr("Votre demande n'a pas pu être envoyée."));
    } finally {
      setSubmitting(false);
    }
  }

  const field = "rounded-sm border border-line bg-surface px-3 py-2 text-ink focus:border-gold focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-semibold text-ink">
        <Tr>Nouvelle demande</Tr>
      </h2>

      <label className="field">
        <input placeholder={tr("Ex. Ma commande n'est pas arrivée")} name="subject" required minLength={3} maxLength={150} className={field} />
        <span className="field-label">
          <Tr>Sujet</Tr>
        </span>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field">
          <select name="category" defaultValue="other" className={field}>
            {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                <Tr>{label}</Tr>
              </option>
            ))}
          </select>
          <span className="field-label">
            <Tr>Catégorie</Tr>
          </span>
        </label>

        <label className="field">
          <select name="order_number" defaultValue="" className={field}>
            <option value="">
              <Tr>Aucune</Tr>
            </option>
            {orders.map((order) => (
              <option key={order.order_number} value={order.order_number}>
                {order.order_number}
              </option>
            ))}
          </select>
          <span className="field-label">
            <Tr>Commande concernée (optionnel)</Tr>
          </span>
        </label>
      </div>

      <label className="field">
        <textarea placeholder={tr("Décrivez votre demande")} name="message" required minLength={3} maxLength={5000} rows={4} className={field} />
        <span className="field-label">
          <Tr>Votre message</Tr>
        </span>
      </label>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-sm bg-gold px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-bright disabled:opacity-60"
      >
        {submitting ? <Tr>Envoi…</Tr> : <Tr>Envoyer</Tr>}
      </button>
    </form>
  );
}

function Conversation({
  ticket,
  onBack,
  onReply,
}: {
  ticket: Ticket;
  onBack: () => void;
  onReply: (body: string) => Promise<void>;
}) {
  const { tr } = useAppearance();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    try {
      await onReply(body.trim());
      setBody("");
    } catch (caught) {
      setError(caught instanceof SupportError ? caught.message : tr("Le message n'a pas pu être envoyé."));
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="self-start text-sm text-gold underline-offset-4 hover:underline"
      >
        <Tr>← Mes demandes</Tr>
      </button>

      <div>
        <h2 className="font-display text-lg font-semibold text-ink">{ticket.subject}</h2>
        <p className="text-xs text-ink-soft">
          {ticket.number} · <Tr>{TICKET_STATUS_LABEL[ticket.status]}</Tr>
          {ticket.order_number ? (
            <>
              {" · "}
              <Tr>commande</Tr> {ticket.order_number}
            </>
          ) : null}
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {(ticket.messages ?? []).map((message) => (
          <li
            key={message.id}
            className={`max-w-[85%] rounded-sm border border-line p-3 text-sm ${
              message.from === "customer" ? "self-end bg-surface" : "self-start"
            }`}
          >
            <p className="mb-1 text-xs text-ink-soft">
<<<<<<< HEAD
              {message.from === "customer" ? <Tr>Vous</Tr> : <Tr>Support TechLium</Tr>}
=======
              {message.from === "customer" ? <Tr>Vous</Tr> : <Tr>Support TechniLium</Tr>}
>>>>>>> dde13f7e9ef378354971238907150faefa52b6bb
            </p>
            <p className="whitespace-pre-wrap text-ink">{message.body}</p>
          </li>
        ))}
      </ul>

      {canReply(ticket.status) ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <label className="field">
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={3}
              maxLength={5000}
              placeholder={tr("Écrivez votre réponse…")}
              className="rounded-sm border border-line bg-surface px-3 py-2 text-ink focus:border-gold focus:outline-none"
            />
            <span className="field-label">
              {ticket.status === "resolved" ? <Tr>Répondre rouvrira la demande…</Tr> : <Tr>Votre réponse…</Tr>}
            </span>
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="self-start rounded-sm bg-gold px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-bright disabled:opacity-60"
          >
            {sending ? <Tr>Envoi…</Tr> : <Tr>Répondre</Tr>}
          </button>
        </form>
      ) : (
        <p className="text-sm text-ink-soft">
          <Tr>Cette demande est close. Ouvrez-en une nouvelle si besoin.</Tr>
        </p>
      )}
    </section>
  );
}
