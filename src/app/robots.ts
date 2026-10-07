import type { MetadataRoute } from "next";

// Les espaces privés et la page de diagnostic ne doivent pas être indexés.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/agent", "/boutique"],
    },
  };
}
