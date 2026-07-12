import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/inter";
import "./globals.css";
import AmbientBackground from "@/components/fx/AmbientBackground";
import SplashSeedling from "@/components/fx/SplashSeedling";

export const metadata: Metadata = {
  title: "WaterDem",
  description:
    "A collaborative houseplant care app — AI plant identification, weather-aware watering, and shareable gardens.",
};

export const viewport: Viewport = {
  themeColor: "#081C0E",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AmbientBackground />
        <SplashSeedling />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
