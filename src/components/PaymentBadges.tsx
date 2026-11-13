import { Banknote } from "lucide-react";
import { Tr } from "@/components/Tr";
import { ACCEPTED_PAYMENTS, type PaymentBadgeId } from "@/lib/social";

const TILE = "flex h-10 w-14 items-center justify-center overflow-hidden rounded-lg";

/** Simple drawn badges standing for each means of payment (not the official logos). */
function Badge({ id }: { id: PaymentBadgeId }) {
  switch (id) {
    case "mtn":
      return (
        <span className={`${TILE} bg-[#ffcc00] text-[11px] font-black tracking-tight text-black`}>
          <span className="rounded-full border-2 border-black px-1.5">MTN</span>
        </span>
      );
    case "wave":
      return <span className={`${TILE} bg-[#1dc8ff] text-sm font-extrabold lowercase text-white`}>wave</span>;
    case "cash":
      return (
        <span className={`${TILE} bg-white text-[#16a34a]`}>
          <Banknote className="h-6 w-6" aria-hidden />
        </span>
      );
    case "visa":
      return <span className={`${TILE} bg-white text-base font-black italic tracking-tight text-[#1a1f71]`}>VISA</span>;
    case "mastercard":
      return (
        <span className={`${TILE} bg-white`}>
          <svg viewBox="0 0 32 20" className="h-6 w-9" aria-hidden>
            <circle cx="11" cy="10" r="8" fill="#eb001b" />
            <circle cx="21" cy="10" r="8" fill="#f79e1b" />
            <path d="M16 3.5a8 8 0 0 1 0 13 8 8 0 0 1 0-13z" fill="#ff5f00" />
          </svg>
        </span>
      );
    case "orange":
      return <span className={`${TILE} bg-[#ff7900] text-[10px] font-bold lowercase text-white`}>orange</span>;
  }
}

/** "Paiement accepté": the means of payment, scrolling sideways in a loop (see .brand-marquee). */
export function PaymentBadges() {
  // Repeated so one half is wider than any screen; two halves make the loop seamless.
  const half = Array.from({ length: 3 }, () => ACCEPTED_PAYMENTS).flat();

  return (
    <div className="flex flex-col items-center gap-3">
      <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">
        <Tr>Paiement accepté</Tr>
      </h2>
      <div className="brand-marquee w-full max-w-md overflow-hidden py-1">
        <div className="brand-marquee-track flex w-max" style={{ animationDuration: `${half.length * 2.5}s` }}>
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1 ? true : undefined}>
              {half.map((payment, index) => (
                <li key={`${payment.id}-${index}`} title={payment.label} className="px-1.5">
                  <Badge id={payment.id} />
                  <span className="sr-only">{payment.label}</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
