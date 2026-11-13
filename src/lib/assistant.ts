import type { Language } from "./appearance";
import type { Product } from "./catalog";
import { whatsappHref } from "./help";
import { toMajorUnits } from "./money";

/** What the shop's help service says about itself (backend `GET /help`), when it could be read. */
export interface AssistantFacts {
  returnWindowDays?: number;
  whatsapp?: string;
  phone?: string;
  email?: string;
  hours?: string;
}

export interface AssistantLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface AssistantReply {
  text: string;
  /** Products matching the question, best first. */
  products: Product[];
  links: AssistantLink[];
}

/** Lower case, no accents, words separated by single spaces. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const has = (text: string, pattern: RegExp) => pattern.test(text);

/** Words that say what the shopper wants to do, not which product. */
const STOPWORDS = new Set(
  (
    "a au aux avec ce ces cet cette combien coute couter cherche chercher chercherais de des du donne donnez en est et " +
    "il je la le les ma me mes moi mon on ou par pas peux peut pour prix quel quelle quels quelles que qui se sur ta te tes " +
    "ton tu un une veux voudrais voir vous voila trouver trouve montre moins plus budget fcfa cfa franc francs f xof max " +
    "maximum minimum jusqu environ about and any are can find for have i is looking me my need price show the to want what with you " +
    "salut bonjour bonsoir hello hi hey svp stp merci"
  ).split(" "),
);

const UNIT = { k: 1_000, mille: 1_000, m: 1_000_000, million: 1_000_000, millions: 1_000_000 } as const;

export interface BudgetWish {
  amount: number;
  /** "max": at most that much (the default); "min": at least that much. */
  kind: "max" | "min";
  /** The text the amount was read from, to take it out of the product words. */
  matched: string;
}

/**
 * Reads an amount in F CFA out of a question: "500 000", "500k", "1,5 M",
 * "moins de 300000". A bare small number ("iPhone 18") is a model, not a price.
 */
export function parseBudget(question: string): BudgetWish | null {
  const text = question.toLowerCase().replace(/ /g, " ");
  const pattern = /(\d{1,3}(?:[ .]\d{3})+|\d+)(?:[.,](\d+))?\s*(k|mille|millions?|m)?(?![a-z0-9])/g;

  for (const match of text.matchAll(pattern)) {
    const whole = Number(match[1].replace(/[ .]/g, ""));
    const decimals = match[2] ? Number(`0.${match[2]}`) : 0;
    const unit = match[3] ? UNIT[match[3] as keyof typeof UNIT] : 1;
    const amount = (whole + decimals) * unit;

    // Without a unit, only a figure that looks like a price counts.
    if (!match[3] && amount < 10_000) continue;

    const before = normalize(text.slice(Math.max(0, (match.index ?? 0) - 14), match.index));
    const kind = /(plus de|au moins|minimum|over|above|at least)$/.test(before) ? "min" : "max";
    return { amount, kind, matched: match[0] };
  }

  return null;
}

/** The shopper's own product words: brand, model, category. */
export function productWords(question: string, budget: BudgetWish | null): string[] {
  const withoutAmount = budget ? question.toLowerCase().replace(budget.matched, " ") : question;
  return normalize(withoutAmount)
    .split(" ")
    .filter((word) => word.length > 0 && !STOPWORDS.has(word));
}

const stem = (word: string) => word.replace(/[sx]$/, "");

function matches(haystack: string[], word: string): boolean {
  return haystack.some((candidate) => stem(candidate) === stem(word) || candidate.startsWith(word));
}

/** Products matching the words (all of them, else the best partial match) and the budget. */
export function searchProducts(products: readonly Product[], words: string[], budget: BudgetWish | null, limit = 3): { found: Product[]; exact: boolean } {
  const sellable = products.filter((product) => product.best_offer?.in_stock);

  const scored = sellable.map((product) => {
    const haystack = normalize(`${product.brand} ${product.name} ${product.category?.name ?? ""}`).split(" ");
    return { product, score: words.filter((word) => matches(haystack, word)).length };
  });

  const best = Math.max(0, ...scored.map((entry) => entry.score));
  const exact = words.length === 0 || best === words.length;
  const pool = words.length === 0 ? scored : scored.filter((entry) => entry.score === best && best > 0);

  const found = pool
    .filter(({ product }) => {
      if (!budget || !product.best_offer) return true;
      const price = toMajorUnits(product.best_offer.price);
      return budget.kind === "max" ? price <= budget.amount : price >= budget.amount;
    })
    .sort((a, b) => b.score - a.score || (a.product.best_offer?.price.amount ?? 0) - (b.product.best_offer?.price.amount ?? 0))
    .slice(0, limit)
    .map((entry) => entry.product);

  return { found, exact };
}

type Intent = "greeting" | "delivery" | "payment" | "warranty" | "returns" | "contact" | "location" | "tracking" | "tradein";

/** The service question being asked, when it is one (otherwise the shopper wants a product). */
export function detectIntent(question: string): Intent | null {
  const text = normalize(question);

  if (has(text, /\b(trocs?|reprises?|trade in|trade-in|echanger mon|vendre mon)\b/)) return "tradein";
  if (has(text, /\b(suivre|suivi|ma commande|mon colis|track|tracking|order status)\b/)) return "tracking";
  if (has(text, /\b(retour|retourner|rembours\w*|return|refund)\b/)) return "returns";
  if (has(text, /\b(garantie|garanti|warranty|sav)\b/)) return "warranty";
  if (has(text, /\b(livraison|livrer|livrez|livre|delai|delivery|deliver|shipping|expedition)\b/)) return "delivery";
  if (has(text, /\b(paiement|payer|paye|payez|mobile money|wave|orange money|mtn|momo|especes|cash|payment|pay)\b/)) return "payment";
  if (has(text, /\b(whatsapp|contact|contacter|appeler|numero|joindre|support|conseiller|humain|agent|call|phone number)\b/)) return "contact";
  if (has(text, /\b(boutique|magasin|adresse|localisation|situe|trouve ou|lieu|map|carte|location|address|where|ou etes|ou es)\b/) && !has(text, /\b(carte (graphique|sd|memoire))\b/)) return "location";
  if (has(text, /^(salut|bonjour|bonsoir|hello|hi|hey|coucou|yo)( .{0,12})?$/)) return "greeting";

  return null;
}

const t = (lang: Language, fr: string, en: string) => (lang === "en" ? en : fr);

function whatsappLink(facts: AssistantFacts, lang: Language): AssistantLink[] {
  return facts.whatsapp ? [{ label: t(lang, "Écrire sur WhatsApp", "Write on WhatsApp"), href: whatsappHref(facts.whatsapp), external: true }] : [];
}

/** The assistant's answer to one question. Pure: the catalogue and the shop's facts come in as arguments. */
export function reply(question: string, products: readonly Product[], facts: AssistantFacts, lang: Language): AssistantReply {
  const wa = whatsappLink(facts, lang);
  const say = (text: string, links: AssistantLink[] = []): AssistantReply => ({ text, products: [], links });

  switch (detectIntent(question)) {
    case "greeting":
      return say(t(lang, "Salut ! Dis-moi ce que tu cherches : un modèle, un budget, ou une info sur la livraison.", "Hi! Tell me what you are looking for: a model, a budget, or some delivery info."));
    case "delivery":
      return say(
        t(
          lang,
          "On livre à l'adresse que tu indiques à la commande, et tu paies à la réception. Pour le délai et le tarif selon ton quartier, le plus sûr est de nous écrire.",
          "We deliver to the address you give when ordering, and you pay on receipt. For the time and cost in your area, the surest way is to write to us.",
        ),
        [{ label: t(lang, "Suivre ma commande", "Track my order"), href: "/suivi" }, ...wa],
      );
    case "payment":
      return say(
        t(
          lang,
          "À la commande, tu paies à la livraison, quand tu reçois ton produit. Pour un autre moyen (Mobile Money, espèces en boutique…), confirme avec nous avant.",
          "When ordering, you pay on delivery, when you receive your product. For another means (Mobile Money, cash in the shop…), check with us first.",
        ),
        wa,
      );
    case "warranty":
      return say(
        t(
          lang,
          "Chaque appareil est garanti. La durée est indiquée sur la fiche du produit.",
          "Every device is under warranty. The length is shown on the product page.",
        ),
        [{ label: t(lang, "Centre d'aide", "Help centre"), href: "/aide" }],
      );
    case "returns":
      return say(
        facts.returnWindowDays
          ? t(
              lang,
              `Tu peux demander un retour dans les ${facts.returnWindowDays} jours qui suivent la livraison, depuis ton compte.`,
              `You can ask for a return within ${facts.returnWindowDays} days of delivery, from your account.`,
            )
          : t(lang, "Tu peux demander un retour depuis ton compte après la livraison.", "You can ask for a return from your account after delivery."),
        [{ label: t(lang, "Retours et remboursements", "Returns and refunds"), href: "/aide#retours" }, { label: t(lang, "Mon compte", "My account"), href: "/compte" }],
      );
    case "tracking":
      return say(t(lang, "Tu peux suivre ta commande avec ton numéro de commande.", "You can track your order with your order number."), [
        { label: t(lang, "Suivre ma commande", "Track my order"), href: "/suivi" },
      ]);
    case "tradein":
      return say(
        t(
          lang,
          "Pour un troc ou une reprise de ton ancien appareil, un conseiller doit l'évaluer. Écris-nous avec son modèle et son état.",
          "For a trade-in of your old device, an advisor has to assess it. Write to us with its model and condition.",
        ),
        wa,
      );
    case "contact": {
      const parts = [
        facts.phone ? `${t(lang, "Téléphone", "Phone")} : ${facts.phone}` : null,
        facts.email ? `E-mail : ${facts.email}` : null,
        facts.hours ?? null,
      ].filter(Boolean);
      return say(
        [t(lang, "Voilà comment nous joindre.", "Here is how to reach us."), ...parts].join("\n"),
        [...wa, { label: t(lang, "Contacter le support", "Contact support"), href: "/support" }],
      );
    }
    case "location":
      return say(t(lang, "Retrouve notre boutique sur la carte, avec l'itinéraire.", "Find our shop on the map, with directions."), [
        { label: t(lang, "Voir la boutique", "See the shop"), href: "/boutique" },
      ]);
    default:
      break;
  }

  const budget = parseBudget(question);
  const words = productWords(question, budget);

  if (words.length === 0 && !budget) {
    return say(
      t(
        lang,
        "Je n'ai pas bien compris. Essaie avec un modèle (« iPhone »), un budget (« 300 000 ») ou une question sur la livraison, le paiement ou la garantie.",
        "I did not quite get that. Try a model (\"iPhone\"), a budget (\"300,000\") or a question about delivery, payment or warranty.",
      ),
      wa,
    );
  }

  const { found, exact } = searchProducts(products, words, budget);

  if (found.length === 0) {
    return say(
      t(
        lang,
        "Je ne trouve rien qui corresponde en stock. Essaie une autre marque ou un autre budget, ou demande à un conseiller.",
        "I cannot find anything matching in stock. Try another brand or budget, or ask an advisor.",
      ),
      wa,
    );
  }

  const intro = exact
    ? t(lang, "Voilà ce que j'ai trouvé :", "Here is what I found:")
    : t(lang, "Je n'ai pas exactement ça, mais ça pourrait te plaire :", "I do not have exactly that, but you might like these:");

  return { text: intro, products: found, links: [] };
}
