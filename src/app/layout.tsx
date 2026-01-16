import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Supacron – AI-native pooled trading on Cronos EVM",
  description:
    "Supacron is an AI-powered pooled trading protocol on Cronos EVM where Takers chase upside and Absorbers earn protected yield under strict on-chain risk governance.",
  metadataBase: new URL("https://supacron.example.com"),
  openGraph: {
    title: "Supacron – AI-native pooled trading on Cronos EVM",
    description:
      "AI executes trades off-chain while Cronos EVM smart contracts manage pooled capital, waterfalls, and circuit breakers for Takers and Absorbers.",
    url: "https://supacron.example.com",
    siteName: "Supacron",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Superior dashboard preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Supacron – AI-native pooled trading on Cronos EVM",
    description:
      "Join a trustable, transparent, and self-regulating environment for AI-driven pooled trading and hedging on Cronos EVM.",
    images: ["/og-image.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
