import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AERYS — monitoramento ambiental urbano",
    short_name: "AERYS",
    description: "Temperatura, umidade e pressão atmosférica das estações AERYS.",
    lang: "pt-BR",
    start_url: "/painel",
    scope: "/",
    display: "standalone",
    background_color: "#0b2b33",
    theme_color: "#0b2b33",
    categories: ["weather", "education", "utilities"],
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
