import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  if (
    process.env.SITE_LAUNCH_READY !== "true" ||
    !process.env.APP_ORIGIN?.startsWith("https://")
  )
    return [];
  return ["", "/impressum", "/datenschutz"].map((path) => ({
    url: `${process.env.APP_ORIGIN}${path}`,
  }));
}
