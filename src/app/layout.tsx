import type { Metadata, Viewport } from "next";
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

/** Applies the saved (or system) theme before hydration to avoid a flash. */
const themeInitScript = `(function(){try{var s=localStorage.getItem("nutritrack-theme");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d){document.documentElement.classList.add("dark")}}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
      </body>
    </html>
  );
}
