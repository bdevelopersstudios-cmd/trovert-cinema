import type { Metadata, Viewport } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Trovert Cinema — Private Cinema Booking, DHA 5 Lahore",
    template: "%s · Trovert Cinema",
  },
  description:
    "Book the whole hall to yourself. 11 recliners, a wall-to-wall screen and ten slots a day — pick your seats in 3D and lock the room in under a minute.",
  keywords: [
    "private cinema Lahore",
    "home cinema DHA 5",
    "Trovert Space",
    "cinema booking",
    "birthday screening Lahore",
  ],
  openGraph: {
    title: "Trovert Cinema — Private Cinema Booking",
    description:
      "11 recliners. Ten slots a day. Pick your seats in 3D and the hall is yours.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Pinch-zoom stays available on purpose — capping it breaks accessibility.
  viewportFit: "cover",
  themeColor: "#0b0708",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${playfair.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
