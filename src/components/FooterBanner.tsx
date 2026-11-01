import { BannerCarousel } from "@/components/BannerCarousel";
import { getBanners } from "@/lib/banners";

/** The scrolling band above the page footer; renders nothing while no image is set up. */
export async function FooterBanner() {
  const slides = await getBanners("footer");
  if (slides.length === 0) return null;

  return (
    <div className="mx-auto mt-12 w-full max-w-7xl px-4">
      <BannerCarousel slides={slides} label="TechniLium" />
    </div>
  );
}
