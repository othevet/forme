import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Forme",
    short_name: "Forme",
    description: "Coach running connecté Strava + IA",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      { src: "/icon.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
  };
}
