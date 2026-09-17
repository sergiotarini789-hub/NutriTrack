import type { Metadata, Viewport } from "next";
import { ThemeWatcher } from "@/components/app/ThemeWatcher";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "NutriTrack",
    template: "%s — NutriTrack",
  },
  description:
    "Трекер питания: считайте калории, белки, жиры и углеводы каждый день",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef2ec" },
    { media: "(prefers-color-scheme: dark)", color: "#090d0b" },
  ],
};

/**
 * Applies the saved theme (system / light / dark) before hydration to
 * avoid a flash. Legacy values "light"/"dark" keep their meaning.
 */
const themeInitScript = `(function(){try{var t=localStorage.getItem("nutritrack-theme");var d=t==="dark"||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d){document.documentElement.classList.add("dark")}}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ThemeWatcher />
        {children}
      </body>
    </html>
  );
}
