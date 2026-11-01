import { afterEach, describe, expect, it, vi } from "vitest";
import { getMyOrder, normalizeOrderNumber, parcelLabel, partialLabel, showDeliveryCode, type SubOrder } from "./orders";

const parcel = (status: string, id = 1): SubOrder => ({
  id,
  vendor_id: null,
  status,
  subtotal: { amount: 1, currency: "XOF" },
  delivered_at: null,
});

describe("partialLabel", () => {
  it("is null when the order is not partial", () => {
    expect(partialLabel({ partial: false, sub_orders: [parcel("shipped")] })).toBeNull();
    expect(partialLabel({})).toBeNull();
  });

  it("says partially delivered as soon as one parcel is delivered", () => {
    expect(partialLabel({ partial: true, sub_orders: [parcel("delivered"), parcel("shipped", 2)] })).toBe(
      "Partiellement livrée",
    );
  });

  it("says partially shipped when a parcel left but none arrived", () => {
    expect(partialLabel({ partial: true, sub_orders: [parcel("shipped"), parcel("confirmed", 2)] })).toBe(
      "Partiellement expédiée",
    );
  });

  it("falls back to the plain status when no parcel has moved", () => {
    expect(partialLabel({ partial: true, sub_orders: [parcel("confirmed"), parcel("pending", 2)] })).toBeNull();
  });
});

describe("showDeliveryCode", () => {
  it("shows the code while the parcel is still on its way", () => {
    expect(showDeliveryCode({ delivery_code: "482913", status: "shipped" })).toBe(true);
  });

  it("hides it once delivered or cancelled, or when there is none", () => {
    expect(showDeliveryCode({ delivery_code: "482913", status: "delivered" })).toBe(false);
    expect(showDeliveryCode({ delivery_code: "482913", status: "cancelled" })).toBe(false);
    expect(showDeliveryCode({ delivery_code: null, status: "pending" })).toBe(false);
    expect(showDeliveryCode({ status: "pending" })).toBe(false);
  });
});

describe("parcelLabel", () => {
  it("numbers the parcel and names its seller", () => {
    expect(parcelLabel({ vendor_id: null }, 0)).toBe("Colis 1 - expédié par TechniLium");
    expect(parcelLabel({ vendor_id: 7 }, 1)).toBe("Colis 2 - vendeur vérifié");
  });
});

describe("getMyOrder", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends the token and returns the order", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ order_number: "TCH-1" }) });
    vi.stubGlobal("fetch", fetchMock);

    expect((await getMyOrder("tok", "TCH 1"))?.order_number).toBe("TCH-1");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/orders/mine/TCH%201");
    expect(init.headers.Authorization).toBe("Bearer tok");
  });

  it("is null for an order that is not the customer's", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    expect(await getMyOrder("tok", "X")).toBeNull();
  });

  it("throws on a server error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(getMyOrder("tok", "X")).rejects.toThrow();
  });
});

describe("normalizeOrderNumber", () => {
  it("trims, upper-cases and removes inner spaces", () => {
    expect(normalizeOrderNumber("  tch-2026 1025-abc123 ")).toBe("TCH-20261025-ABC123");
    expect(normalizeOrderNumber("   ")).toBe("");
  });
});
