"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppearance } from "@/components/AppearanceProvider";
import { ProductTile } from "@/components/ProductTile";
import { reply, type AssistantFacts, type AssistantLink } from "@/lib/assistant";
import { getProducts, type Product } from "@/lib/catalog";
import { finderCategories } from "@/lib/finder";
import { useShop } from "@/components/ShopInfoProvider";
import { getHelpInfo } from "@/lib/help";
import { formatMoneyParts } from "@/lib/money";

interface Message {
  id: number;
  from: "bot" | "me";
  text: string;
  products?: Product[];
  links?: AssistantLink[];
}

/** How long the assistant "types" before answering, so the answer does not land with a jolt. */
const THINKING_MS = 450;

const LINK_CLASS =
  "inline-flex items-center rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-gold";

/**
 * Floating assistant: a round button that opens a small chat. It answers from
 * the live catalogue (model, brand, category, budget) and from what the shop
 * says about delivery, payment, warranty, returns and contact - see lib/assistant.
 */
export function ChatAssistant() {
  const { appearance, tr } = useAppearance();
  const language = appearance.language;
  const shop = useShop();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [returnWindowDays, setReturnWindowDays] = useState<number | undefined>(undefined);
  const loaded = useRef(false);
  const nextId = useRef(1);
  const timer = useRef<number | null>(null);
  const log = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);

  // The catalogue and the shop's facts are read once, the first time the chat opens.
  useEffect(() => {
    if (!open || loaded.current) return;
    loaded.current = true;

    getProducts({ language, perPage: 100 }).then(setProducts).catch(() => setProducts([]));
    getHelpInfo().then((info) => setReturnWindowDays(info?.return_window_days));
  }, [open, language]);

  // What the shop says about itself comes from the backoffice (see ShopInfoProvider).
  const facts = useMemo<AssistantFacts>(
    () => ({
      returnWindowDays,
      whatsapp: shop?.contact.whatsapp,
      phone: shop?.contact.phone,
      email: shop?.contact.email,
      hours: shop?.contact.hours,
      address: shop?.address ?? undefined,
      deliveryInfo: shop?.delivery_info ?? undefined,
    }),
    [returnWindowDays, shop],
  );

  useEffect(() => {
    if (open) field.current?.focus();
  }, [open]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  const ask = useCallback(
    (question: string) => {
      const text = question.trim();
      if (!text || thinking) return;

      const answer = reply(text, products, facts, language);
      setMessages((current) => [...current, { id: nextId.current++, from: "me", text }]);
      setInput("");
      setThinking(true);

      timer.current = window.setTimeout(() => {
        setMessages((current) => [...current, { id: nextId.current++, from: "bot", ...answer }]);
        setThinking(false);
      }, THINKING_MS);
    },
    [products, facts, language, thinking],
  );

  // A few questions to start from: the biggest category, the first product, then the usual service questions.
  const suggestions = useMemo(() => {
    const category = finderCategories(products, 1)[0];
    const first = products.find((product) => product.best_offer?.in_stock);
    return [
      category ? `${tr("Trouver")} ${category.name}` : null,
      first ? `${first.brand} ${first.name}` : null,
      tr("Livraison"),
      tr("Paiement"),
      tr("Garantie"),
    ].filter((text): text is string => Boolean(text));
  }, [products, tr]);

  return (
    <>
      {open ? (
        <div
          role="dialog"
          aria-label={tr("Assistant TechLium")}
          onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
          className="fixed bottom-24 right-3 z-40 flex h-[min(34rem,calc(100vh-8rem))] w-[calc(100vw-1.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl sm:right-4"
        >
          <header className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span className="relative">
              <Image src="/icon-192.png" alt="" width={40} height={40} className="h-10 w-10 rounded-full" />
              <span aria-hidden className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface bg-[#22c55e]" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="font-display text-base font-semibold text-ink">{tr("Assistant TechLium")}</span>
              <span className="text-xs text-ink-soft">{tr("Répond tout de suite")}</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={tr("Fermer le chat")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-bg text-ink transition-colors hover:bg-line"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </header>

          <div ref={log} role="log" aria-live="polite" className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
            <Bubble from="bot">{tr("Salut 👋 Moi c'est l'assistant TechLium. Je connais tout le catalogue : demande-moi un modèle, un budget, un troc ou une info sur la livraison.")}</Bubble>

            {messages.map((message) => (
              <Bubble key={message.id} from={message.from}>
                {message.text}
                {message.products && message.products.length > 0 ? (
                  <span className="mt-2 flex flex-col gap-2">
                    {message.products.map((product) => (
                      <ProductRow key={product.id} product={product} onNavigate={() => setOpen(false)} />
                    ))}
                  </span>
                ) : null}
                {message.links && message.links.length > 0 ? (
                  <span className="mt-2 flex flex-wrap gap-2">
                    {message.links.map((link) =>
                      link.external ? (
                        <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
                          {link.label}
                        </a>
                      ) : (
                        <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={LINK_CLASS}>
                          {link.label}
                        </Link>
                      ),
                    )}
                  </span>
                ) : null}
              </Bubble>
            ))}

            {thinking ? (
              <Bubble from="bot">
                <span className="sr-only">{tr("L'assistant écrit…")}</span>
                <span aria-hidden className="tracking-widest text-ink-soft motion-safe:animate-pulse">•••</span>
              </Bubble>
            ) : null}
          </div>

          <div className="flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {suggestions.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => ask(text)}
                className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-gold"
              >
                {text}
              </button>
            ))}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              ask(input);
            }}
            className="flex items-center gap-2 border-t border-line p-3"
          >
            <input
              ref={field}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={200}
              placeholder={tr("Écris ta question... ex : iPhone 16")}
              aria-label={tr("Ta question")}
              className="min-w-0 flex-1 rounded-full border border-line bg-bg px-4 py-2.5 text-sm text-ink focus:border-gold focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              aria-label={tr("Envoyer")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-white transition-colors hover:bg-gold-bright disabled:opacity-40"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? tr("Fermer le chat") : tr("Ouvrir le chat")}
        className="fixed bottom-4 right-3 z-40 flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold bg-surface shadow-xl transition-transform hover:scale-105 sm:right-4"
      >
        <Image src="/icon-192.png" alt="" width={44} height={44} className="h-11 w-11 rounded-full" />
        {!open ? <span aria-hidden className="absolute right-0.5 top-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface bg-[#22c55e]" /> : null}
      </button>
    </>
  );
}

function Bubble({ from, children }: { from: "bot" | "me"; children: React.ReactNode }) {
  return (
    <div
      className={`max-w-[88%] whitespace-pre-line rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
        from === "me" ? "self-end border-gold bg-gold text-white" : "self-start border-line bg-bg text-ink"
      }`}
    >
      {children}
    </div>
  );
}

function ProductRow({ product, onNavigate }: { product: Product; onNavigate: () => void }) {
  const price = product.best_offer ? formatMoneyParts(product.best_offer.price) : null;

  return (
    <Link
      href={`/produits/${product.slug}`}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2 text-ink transition-colors hover:border-gold"
    >
      <span className="block w-12 shrink-0">
        <ProductTile id={product.id} brand={product.brand} categoryName={null} imageUrl={product.image_url} alt="" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-xs font-semibold">
          {product.brand} {product.name}
        </span>
        {price ? (
          <span className="text-xs font-semibold text-gold-bright">
            {price.amount} {price.label}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
