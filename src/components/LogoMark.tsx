import Image from "next/image";

/** `hideNameOnMobile`: only the icon on phones (the header is tight); the name returns from the small breakpoint up. */
export function LogoMark({ hideNameOnMobile = false }: { hideNameOnMobile?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <Image src="/icon-192.png" alt="" width={32} height={32} priority className="h-8 w-8" />
      <span className={`font-display text-2xl font-bold tracking-tight text-gold ${hideNameOnMobile ? "hidden sm:inline" : ""}`}>TechniLium</span>
    </span>
  );
}
