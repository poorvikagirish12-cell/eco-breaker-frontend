import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import TopNavbar from "@/components/TopNavbar";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "EchoBreaker",
  description: "Contrarian blogging platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.variable} font-sans antialiased bg-slate-950 text-slate-50`}
      >
        <TopNavbar />
        {children}
      </body>
    </html>
  );
}
