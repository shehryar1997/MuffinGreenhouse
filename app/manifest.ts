import type { MetadataRoute } from "next"

// Lets Android/Chrome "Add to home screen" show the shop's name, icon and colours.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Muffin Plants",
    short_name: "Muffin Plants",
    description: "Indoor plants sourced from around the world and propagated in Karachi, delivered across Pakistan.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F3EA",
    theme_color: "#F7F3EA",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  }
}
