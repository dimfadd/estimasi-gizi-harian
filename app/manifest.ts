import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sekepal — takaran makan pakai tangan",
    short_name: "Sekepal",
    description: "Kebutuhan kalori & protein harian dalam kepal, telapak, dan ibu jari. Catat makan tanpa timbangan.",
    lang: "id",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F3EEE3",
    theme_color: "#F3EEE3",
    categories: ["health", "food", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Catat makan", url: "/#catat", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Isi piring", url: "/#piring", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
