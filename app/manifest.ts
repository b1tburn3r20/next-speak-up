import type { MetadataRoute } from "next";

/** What a phone needs to add Coolbills to its home screen. On an iPhone, notifications only work from there. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Coolbills",
    short_name: "Coolbills",
    description: "Vote on real bills, see if your representatives agree, and know when your city council meets.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
