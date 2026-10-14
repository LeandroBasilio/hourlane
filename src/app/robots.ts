import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules:
      process.env.SITE_LAUNCH_READY === "true"
        ? { userAgent: "*", allow: "/", disallow: "/api/" }
        : { userAgent: "*", disallow: "/" },
  };
}
