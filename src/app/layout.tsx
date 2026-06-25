import type { Metadata } from "next";
import { Inter, Poppins, Share_Tech_Mono } from "next/font/google";
import { Background3D } from "@/components/Background3D";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["500", "600", "700"],
});

const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "EcoBreaker — Challenge Your Perspective",
  description: "A contrarian blogging platform that helps you break out of your filter bubble.",
};

export default function RootLayout({
  children,
  }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${poppins.variable} ${shareTechMono.variable} antialiased`}
      >
        <Background3D />
        {children}
      </body>
    </html>
  );
}
