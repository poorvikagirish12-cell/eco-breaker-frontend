import type { Metadata } from "next";
import { Dancing_Script, Lora, Montserrat } from "next/font/google";
import "./globals.css";

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-logo",
  weight: ["600", "700"],
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600"],
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
        className={`${dancingScript.variable} ${lora.variable} ${montserrat.variable} font-sans antialiased bg-slate-950 text-slate-50`}
      >
        {children}
      </body>
    </html>
  );
}
