"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAppearance } from "@/components/AppearanceProvider";
import { getShopInfo, type ShopInfo } from "@/lib/shop";

/** `undefined` until the first answer, then the shop's information or `null` when it could not be read. */
const ShopContext = createContext<ShopInfo | null | undefined>(undefined);

/** Reads the shop's information once (again when the visitor switches language) for the whole storefront. */
export function ShopInfoProvider({ children }: { children: ReactNode }) {
  const { appearance } = useAppearance();
  const [info, setInfo] = useState<ShopInfo | null | undefined>(undefined);

  useEffect(() => {
    let current = true;
    getShopInfo(appearance.language).then((next) => current && setInfo(next));
    return () => {
      current = false;
    };
  }, [appearance.language]);

  return <ShopContext.Provider value={info}>{children}</ShopContext.Provider>;
}

/** The shop's information: `undefined` while loading, `null` when unavailable. */
export function useShop(): ShopInfo | null | undefined {
  return useContext(ShopContext);
}
