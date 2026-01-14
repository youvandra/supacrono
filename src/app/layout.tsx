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
  title: "Superior – The most powerful business platform",
  description:
    "Superior is the next-level SaaS platform for modern teams to manage revenue, projects, and customers in one unified dashboard.",
  metadataBase: new URL("https://superior.example.com"),
  openGraph: {
    title: "Superior – The most powerful business platform",
    description:
      "Unlock the potential of your business with real-time analytics, collaborative workflows, and enterprise-ready security.",
    url: "https://superior.example.com",
    siteName: "Superior",
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
    title: "Superior – The most powerful business platform",
    description:
      "Transform your workflows and unlock the potential of your business with Superior.",
    images: ["/og-image.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
