import type { Metadata } from "next";
import { Space_Grotesk, Share_Tech_Mono, Dancing_Script } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400"],
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-cursive",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "EcoBreaker Archive",
  description: "Contrarian blogging platform and signal synthesis engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${shareTechMono.variable} ${dancingScript.variable} font-sans antialiased bg-[#070d0b] text-[#c9d1c9]`}
      >
        {children}
      </body>
    </html>
  );
}

