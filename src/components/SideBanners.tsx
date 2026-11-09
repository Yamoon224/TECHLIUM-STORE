import { SideBannerRail } from "@/components/SideBannerRail";
import { getBanners } from "@/lib/banners";

/**
 * Vertical banners in the empty margins left and right of the centered content,
 * on wide screens only (2xl and up). Renders nothing for a side without image.
 */
export async function SideBanners() {
  const [left, right] = await Promise.all([getBanners("left"), getBanners("right")]);
  if (left.length === 0 && right.length === 0) return null;

  return (
    <>
      {left.length > 0 ? <SideBannerRail slides={left} side="left" /> : null}
      {right.length > 0 ? <SideBannerRail slides={right} side="right" /> : null}
    </>
  );
}
