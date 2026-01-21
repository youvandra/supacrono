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
  title: "Supacron – Pay-to-Compute AI Trading on Cronos EVM",
  description:
    "Supacron is an AI-native pooled trading protocol on Cronos EVM using X402 payment rails to gate autonomous execution for Takers and Absorbers.",
  metadataBase: new URL("https://supacron.example.com"),
  openGraph: {
    title: "Supacron – Pay-to-Compute AI Trading on Cronos EVM",
    description:
      "AI executes trades off-chain gated by X402 payments, while Cronos EVM smart contracts manage pooled capital and risk for Takers and Absorbers.",
    url: "https://supacron.example.com",
    siteName: "Supacron",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Supacron dashboard preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Supacron – Pay-to-Compute AI Trading on Cronos EVM",
    description:
      "Join a trustable, transparent, and self-regulating environment for AI-driven pooled trading with X402 payment rails on Cronos EVM.",
    images: ["/og-image.png"],
  },
}

import { ToastProvider } from "@/components/ui/toast"

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
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
