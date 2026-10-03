import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Charte visuelle (document 11), direction B
        vert: "#14532D",
        action: "#15803D",
        fond: "#FAF7F2",
        encre: "#1C1917",
        secondaire: "#57534E",
        bordure: "#E7E5E4",
        grise: "#F5F5F4",
        ocre: "#FCD34D",
        erreur: "#B91C1C",
        "alerte-fond": "#FFEDD5",
        "alerte-texte": "#7C2D12",
        "succes-fond": "#DCFCE7",
        "neutre-fond": "#E7E5E4",
        "neutre-texte": "#292524",
      },
    },
  },
  plugins: [],
};
export default config;
