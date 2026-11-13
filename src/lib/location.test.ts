import { describe, expect, it } from "vitest";
import { mapDirectionsUrl, mapEmbedUrl, mapOpenUrl } from "./location";

const shop = { latitude: 5.3013244, longitude: -4.0021515 };

describe("map links", () => {
  it("all target the shop's point", () => {
    expect(mapEmbedUrl(shop)).toContain("q=5.3013244,-4.0021515");
    expect(mapOpenUrl(shop)).toContain("query=5.3013244,-4.0021515");
    expect(mapDirectionsUrl(shop)).toContain("destination=5.3013244,-4.0021515");
  });
});
