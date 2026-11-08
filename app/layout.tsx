import type { Metadata } from "next";
import { Inter, Libre_Baskerville, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
  weight: ["700"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "Praya Dental Care",
  description:
    "Senyum Sehat, Hidup Lebih Bahagia bersama Praya Dental Care.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${libreBaskerville.variable} ${playfairDisplay.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
