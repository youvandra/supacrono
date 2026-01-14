"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

/**
 * Home renders the marketing landing page for the Superior business platform.
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-slate-900">
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        <HeroSection />
        <DashboardSection />
        <FeaturesSection />
        <TestimonialsSection />
      </main>
    </div>
  )
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <a
          href="#hero"
          className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white shadow-sm">
            S
          </div>
          <span className="text-base font-semibold tracking-tight text-slate-900">
            Supacron
          </span>
        </a>

        <nav
          className="hidden items-center gap-8 text-sm text-slate-600 md:flex"
          aria-label="Primary"
        >
          <button className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 rounded-full px-2 py-1">
            <span>Pages</span>
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>
          <a
            href="#about"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 rounded-full px-2 py-1"
          >
            About
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 rounded-full px-2 py-1"
          >
            Pricing
          </a>
          <a
            href="#integrations"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 rounded-full px-2 py-1"
          >
            Integrations
          </a>
          <a
            href="#blog"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 rounded-full px-2 py-1"
          >
            Blog
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden rounded-full border-slate-200 bg-white px-4 text-xs font-medium shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-slate-50 md:inline-flex"
            aria-label="Book a demo"
          >
            Book a demo
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="inline-flex rounded-full border-slate-200 bg-white px-3 text-xs font-medium shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-slate-50 md:hidden"
            aria-label="Open primary menu"
          >
            Menu
          </Button>
        </div>
      </div>
    </header>
  )
}

function HeroSection() {
  return (
    <motion.section
      id="hero"
      className="flex min-h-[60vh] flex-col items-center justify-center text-center"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="flex max-w-xl flex-col items-center">
        <Badge className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700">
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
            New
          </span>
          <span className="text-xs">Cronos EVM hackathon prototype</span>
        </Badge>

        <h1 className="mt-6 text-balance text-5xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
          AI-native pooled trading protocol.
        </h1>

        <p className="mt-4 max-w-md text-balance text-base leading-relaxed text-slate-600 sm:text-lg md:text-xl">
          Supacron lets users co-manage pooled capital on Cronos EVM with an
          AI trading engine, aligning upside-seeking Takers and yield-focused
          Absorbers under transparent, on-chain risk governance.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <motion.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              className="inline-flex w-full items-center justify-center rounded-full px-6 py-5 text-sm font-medium shadow-sm sm:w-auto"
              aria-label="Get started with Supacron"
            >
              Join the pool
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </motion.div>
          <motion.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              className="inline-flex w-full items-center justify-center rounded-full border-slate-200 bg-white px-6 py-5 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 sm:w-auto"
              aria-label="Learn more about Superior"
            >
              Learn more
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}

function DashboardSection() {
  return (
    <section
      aria-labelledby="dashboard-heading"
      className="mt-6 w-full lg:mt-10"
    >
      <h2 id="dashboard-heading" className="sr-only">
        Product dashboard preview
      </h2>
      <DashboardPreview large />
    </section>
  )
}

type DashboardPreviewProps = {
  large?: boolean
}

function DashboardPreview({ large }: DashboardPreviewProps) {
  return (
    <motion.div
      className={`mt-10 w-full max-w-xl lg:mt-0 lg:max-w-none ${
        large ? "" : "hidden lg:block"
      }`}
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
      whileHover={{ y: -4, boxShadow: "0 28px 80px rgba(15, 23, 42, 0.18)" }}
    >
      <Card className="overflow-hidden border-slate-200 bg-white shadow-lg shadow-slate-900/5">
        <div className="flex border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white">
              A
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-900">Acme</span>
              <span className="text-xs text-slate-500">12 members</span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full border border-slate-200 px-2 py-1">
              Dashboard
            </span>
            <span className="rounded-full border border-slate-200 px-2 py-1">
              Analytics
            </span>
          </div>
        </div>

        <div className="flex">
          <aside className="hidden w-52 border-r border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-600 md:block">
            <nav className="space-y-2" aria-label="Dashboard navigation">
              <button className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm outline-none ring-offset-2 ring-offset-slate-50 transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-200">
                <span>Dashboard</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  New
                </span>
              </button>
              <button className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200">
                Calendar
              </button>
              <button className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200">
                Analytics
              </button>
              <button className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200">
                Finance
              </button>
              <button className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200">
                Customers
              </button>
            </nav>
          </aside>

          <div className="flex-1 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                  Overview
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                  Dashboard
                </h3>
                <p className="text-xs text-slate-500">
                  Effortlessly manage your business.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  This week
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  Team plan
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <MetricCard
                label="Revenue"
                value="$50,974"
                trend="up"
                change="+26.2%"
              />
              <MetricCard
                label="Expenses"
                value="$7,620"
                trend="up"
                change="+10.8%"
              />
              <MetricCard
                label="Customers"
                value="1,218"
                trend="down"
                change="-12.4%"
              />
              <MetricCard
                label="Projects"
                value="125"
                trend="up"
                change="+7.6%"
              />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <Card className="border-slate-200 bg-slate-50/60">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Analytics
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    See how your business is performing over time.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="relative h-32">
                    <Image
                      src="/window.svg"
                      alt="Analytics preview"
                      fill
                      className="rounded-lg object-cover"
                      priority
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="text-sm font-semibold text-slate-900">
                    Calendar
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Stay on top of what&apos;s coming next.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 text-xs text-slate-600">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <div>
                        <p className="text-xs font-medium text-slate-900">
                          Creative Session with James
                        </p>
                        <p>6:00 PM – 7:00 PM</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                        Today
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg px-3 py-2">
                      <div>
                        <p className="text-xs font-medium text-slate-900">
                          Collaboration Meeting with Lisa
                        </p>
                        <p>3:00 PM – 3:30 PM</p>
                      </div>
                      <div className="flex -space-x-1">
                        <Avatar className="h-7 w-7 border border-white">
                          <AvatarImage src="/vercel.svg" alt="" />
                          <AvatarFallback>JL</AvatarFallback>
                        </Avatar>
                        <Avatar className="h-7 w-7 border border-white">
                          <AvatarImage src="/next.svg" alt="" />
                          <AvatarFallback>LM</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-slate-100 pt-4 text-xs text-slate-500">
                  <span>See all upcoming events</span>
                  <ArrowUpRight className="ml-2 h-3 w-3" aria-hidden="true" />
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

type MetricCardProps = {
  label: string
  value: string
  change: string
  trend: "up" | "down"
}

function MetricCard({ label, value, change, trend }: MetricCardProps) {
  const isUp = trend === "up"
  const TrendIcon = isUp ? ArrowUpRight : ArrowDownRight
  const trendColor = isUp ? "text-emerald-600" : "text-rose-500"

  return (
    <Card className="border-slate-200">
      <CardHeader className="border-b border-slate-100 pb-2">
        <CardTitle className="text-xs font-medium text-slate-500">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="flex items-end justify-between">
          <p className="text-lg font-semibold text-slate-900">{value}</p>
          <div
            className={`inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium ${trendColor}`}
          >
            <TrendIcon className="mr-1 h-3 w-3" aria-hidden="true" />
            {change}
          </div>
        </div>
        <div className="mt-3 h-10 w-full rounded-md bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100" />
      </CardContent>
    </Card>
  )
}

function FeaturesSection() {
  const features = [
    {
      title: "Dual economic roles",
      description:
        "Takers chase upside with aggressive exposure while Absorbers supply stable capital and earn protected yield.",
    },
    {
      title: "On-chain risk governance",
      description:
        "Smart contracts on Cronos EVM enforce drawdown limits, circuit breakers, and profit / loss waterfalls.",
    },
    {
      title: "AI trading engine",
      description:
        "Off-chain AI trades on Crypto.com Futures with dynamic sizing and bias, fully logged on-chain for auditability.",
    },
  ]

  return (
    <motion.section
      id="about"
      className="mt-16 space-y-8"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="text-center">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
          Features
        </h2>
        <p className="mt-3 text-balance text-xl font-semibold text-slate-900 sm:text-2xl">
          Everything you need to run a modern business.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="border-slate-200 bg-white/80 transition-shadow hover:shadow-md hover:shadow-slate-900/5"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-900">
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-slate-600">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.section>
  )
}

function TestimonialsSection() {
  return (
    <motion.section
      id="blog"
      aria-labelledby="testimonials-heading"
      className="mt-16 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div>
        <h2
          id="testimonials-heading"
          className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600"
        >
          Testimonials
        </h2>
        <p className="mt-3 text-balance text-xl font-semibold text-slate-900 sm:text-2xl">
          Built for serious DeFi and trading teams.
        </p>
        <p className="mt-3 max-w-md text-sm text-slate-600">
          Supacron combines AI execution, capital tranching, and on-chain
          settlement to create a transparent, self-regulating environment for
          pooled trading and hedging on Cronos EVM.
        </p>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex -space-x-2">
            <Avatar className="h-9 w-9 border border-white">
              <AvatarImage src="/file.svg" alt="" />
              <AvatarFallback>AP</AvatarFallback>
            </Avatar>
            <Avatar className="h-9 w-9 border border-white">
              <AvatarImage src="/globe.svg" alt="" />
              <AvatarFallback>MS</AvatarFallback>
            </Avatar>
            <Avatar className="h-9 w-9 border border-white">
              <AvatarImage src="/window.svg" alt="" />
              <AvatarFallback>JT</AvatarFallback>
            </Avatar>
          </div>
          <div className="text-xs text-slate-600">
            <p className="font-semibold text-slate-900">Two-sided market</p>
            <p>aligning Takers and Absorbers in a single pooled engine.</p>
          </div>
        </div>
      </div>

      <Card
        id="pricing"
        className="border-slate-200 bg-white/80 p-6 shadow-sm shadow-slate-900/5"
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            “Supacron makes pooled AI trading actually governable.”
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-sm text-slate-600">
          <p>
            “The protocol encodes drawdown limits, waterfalls, and circuit
            breakers directly in smart contracts. Our team can push AI-driven
            trading while keeping Absorber capital explicitly protected.”
          </p>
        </CardContent>
        <CardFooter className="mt-4 flex items-center justify-between pt-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Lena Park
            </p>
            <p className="text-xs text-slate-500">
              Core contributor, Cronos hackathon team
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-slate-200 bg-white px-4 text-xs font-medium hover:bg-slate-50"
            aria-label="View customer stories"
          >
            View protocol docs
            <ArrowUpRight className="ml-2 h-3 w-3" aria-hidden="true" />
          </Button>
        </CardFooter>
      </Card>
    </motion.section>
  )
}
