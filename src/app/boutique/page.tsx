import type { Metadata } from "next";
import { ShopLocation } from "@/components/ShopLocation";

export const metadata: Metadata = { title: "Notre boutique" };

export default function ShopPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 py-4">
      <ShopLocation headingLevel={1} />
    </main>
  );
}
