import { afterEach, describe, expect, it, vi } from "vitest";
import { getHelpInfo, hasContact, telHref, whatsappHref } from "./help";

afterEach(() => vi.unstubAllGlobals());

describe("contact links", () => {
  it("keeps only digits and a leading plus in a tel: link", () => {
    expect(telHref("+225 07 00 00 00 00")).toBe("tel:+2250700000000");
    expect(telHref("07-00-00-00-00")).toBe("tel:0700000000");
  });

  it("builds a wa.me link from digits only", () => {
    expect(whatsappHref("+225 07 00 00 00 00")).toBe("https://wa.me/2250700000000");
  });

  it("cannot be turned into a script link", () => {
    expect(telHref("javascript:alert(1)")).toBe("tel:1");
    expect(whatsappHref("javascript:alert(1)")).toBe("https://wa.me/1");
  });
});

describe("hasContact", () => {
  it("is true as soon as one channel is set, hours alone do not count", () => {
    expect(hasContact({})).toBe(false);
    expect(hasContact({ hours: "8h-18h" })).toBe(false);
<<<<<<< HEAD
    expect(hasContact({ email: "aide@TechLium.example" })).toBe(true);
=======
    expect(hasContact({ email: "aide@TechniLium.example" })).toBe(true);
>>>>>>> dde13f7e9ef378354971238907150faefa52b6bb
  });
});

describe("getHelpInfo", () => {
  it("returns what the server sends", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ return_window_days: 7, first_response_hours: 8, contact: {} }) }));

    expect((await getHelpInfo())?.return_window_days).toBe(7);
  });

  it("is null when the server is down or refuses, so the page can still show its text", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    expect(await getHelpInfo()).toBeNull();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await getHelpInfo()).toBeNull();
  });
});
