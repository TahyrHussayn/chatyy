import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/secret"],
      disallow: ["/secret/*", "/api/*"],
    },
    sitemap: baseUrl ? `${baseUrl}/sitemap.xml` : undefined,
  };
}
