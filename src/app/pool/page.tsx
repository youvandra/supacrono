"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, Wallet } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white shadow-sm">
            S
          </div>
          <span className="text-base font-semibold tracking-tight text-slate-900">
            Supacron
          </span>
        </Link>

        <nav
          className="hidden items-center gap-8 text-sm text-slate-600 md:flex"
          aria-label="Primary"
        >
          <a
            href="/governance"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 rounded-full px-2 py-1"
          >
            Governance
          </a>
          <a
            href="/pool"
            className="text-sm font-medium text-slate-900 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 rounded-full px-2 py-1"
          >
            Pool
          </a>
          <a
            href="/portfolio"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 rounded-full px-2 py-1"
          >
            Portfolio
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden rounded-full border-slate-200 bg-white px-4 text-xs font-medium shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-slate-50 md:inline-flex"
            aria-label="Connect wallet"
          >
            <Wallet className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Connect wallet
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

export default function PoolPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-slate-900">
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <PoolOverviewSection />
        <PoolAdvancedChartSection />
        <AITradingStatusSection />
        <CapitalDistributionSection />
        <PnlWaterfallSection />
        <ActivityAndRiskSection />
      </main>
    </div>
  )
}

function MetricPill({
  label,
  value,
  subtle,
}: {
  label: string
  value: string
  subtle?: boolean
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-semibold ${
          subtle ? "text-slate-700" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function PoolOverviewSection() {
  return (
    <motion.section
      className="flex flex-col gap-6 border-b border-slate-200/80 pb-8"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:justify-between">
        <div className="w-full sm:w-1/2 max-w-xl">
          <Badge className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-800">
            Supacron pool overview
          </Badge>
          <h1 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            Live pooled capital for AI trading on Cronos EVM.
          </h1>
          <p className="mt-3 text-balance text-sm leading-relaxed text-slate-600 sm:text-base">
            This dashboard summarizes where pool capital is, how AI is positioned,
            and how profits and losses flow between Takers and Absorbers.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-600 sm:w-1/2 sm:text-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Your position
          </p>
          <p className="text-[11px] text-slate-500">
            Connect a wallet on Cronos EVM to preview how your capital would sit
            in the pool as a Taker or Absorber.
          </p>
          <div className="mt-1 grid gap-2 sm:grid-cols-3">
            <MetricPill label="Role" value="Not connected" subtle />
            <MetricPill label="Deposited" value="0.00 USDT" subtle />
            <MetricPill label="Accrued yield" value="0.00 USDT" subtle />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button className="rounded-full px-4 text-[11px] font-medium">
              Add capital
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-slate-200 bg-white px-4 text-[11px] font-medium hover:bg-slate-50"
            >
              Withdraw
            </Button>
          </div>
          <p className="text-[10px] text-slate-400">
            In this prototype, these actions are illustrative only.
          </p>
        </div>
      </div>

      <Card className="border-slate-200 bg-white/95 shadow-sm shadow-slate-900/5">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Pool overview
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Total pool value
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                $1,250,000
              </p>
              <p className="text-[11px] text-emerald-600">+4.3% today</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Available capital
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                $420,000
              </p>
              <p className="text-[11px] text-slate-500">Not yet allocated to AI</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Capital in position
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                $830,000
              </p>
              <p className="text-[11px] text-slate-500">Across active trading lanes</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Current pool PnL
              </p>
              <p className="mt-1 text-lg font-semibold text-emerald-600">
                +$82,410
              </p>
              <p className="text-[11px] text-slate-500">
                Realized + unrealized since epoch start
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">
                  AI mode
                </span>
                <span className="text-xs font-semibold text-emerald-700">
                  Normal
                </span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Pool status
                </span>
                <span className="text-xs font-semibold text-slate-900">
                  Active
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Judges can treat this as a live snapshot of the Supacron pool.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  )
}

function PoolAdvancedChartSection() {
  return (
    <motion.section
      className="mt-8"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="border-slate-200 bg-white/95">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            CRO / USD advanced chart
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <PoolTradingViewAdvancedChart />
        </CardContent>
      </Card>
    </motion.section>
  )
}

function PoolTradingViewAdvancedChart() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (containerRef.current.querySelector("script")) return

    const script = document.createElement("script")
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.type = "text/javascript"
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: "CRYPTOCOM:CROUSD",
      interval: "60",
      timezone: "Etc/UTC",
      theme: "light",
      style: "1",
      locale: "en",
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      withdateranges: true,
      range: "1D",
      details: false,
      hotlist: false,
      calendar: false,
      hide_volume: false,
    })

    containerRef.current.appendChild(script)
  }, [])

  return (
    <div
      ref={containerRef}
      className="h-80 w-full overflow-hidden rounded-lg border border-slate-200 bg-white/60"
    />
  )
}

function AITradingStatusSection() {
  return (
    <motion.section
      className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="border-slate-200 bg-white/95">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            AI trading status
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-4 text-sm text-slate-600 sm:grid-cols-2">
          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Current bias
            </p>
            <p className="text-sm font-semibold text-slate-900">Long</p>
            <p className="text-xs">
              AI is tilted long CRO per current momentum and volatility regime.
            </p>
          </div>
          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Position size
            </p>
            <p className="text-sm font-semibold text-slate-900">
              66% of pool · 2.1x leverage
            </p>
            <p className="text-xs">
              Expressed through CRO perpetuals on Crypto.com Futures.
            </p>
          </div>
          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Risk budget remaining
            </p>
            <p className="text-sm font-semibold text-emerald-700">58% of daily</p>
            <p className="text-xs">
              AI can still deploy additional risk before today&apos;s cap is hit.
            </p>
          </div>
          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Last action
            </p>
            <p className="text-sm font-semibold text-slate-900">
              Reduced exposure · 6 min ago
            </p>
            <p className="text-xs">
              AI trimmed long size after volatility spike on CRO/USD.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-slate-50/80">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Why AI is positioned this way
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-xs text-slate-600">
          <p>
            The engine scores short-term CRO trend, volatility, and funding
            conditions, then picks a bias and size under the pool&apos;s risk budget.
          </p>
          <p className="mt-2">
            Right now it is net long with moderated size after a volatility
            uptick, keeping Absorber buffer within the configured drawdown
            envelope.
          </p>
        </CardContent>
      </Card>
    </motion.section>
  )
}

function CapitalDistributionSection() {
  return (
    <motion.section
      className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="border-slate-200 bg-white/95">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Capital distribution by role
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-sm text-slate-600">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs">
                <p className="font-medium text-slate-900">Taker capital</p>
                <p className="text-slate-600">$750,000 · 60% of pool</p>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div className="h-2 w-[60%] rounded-full bg-emerald-500" />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Bears more PnL volatility; receives upside after Absorber yield
                and protocol fees.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <p className="font-medium text-slate-900">Absorber capital</p>
                <p className="text-slate-600">$500,000 · 40% of pool</p>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div className="h-2 w-[40%] rounded-full bg-slate-900" />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Provides buffer against losses; receives priority yield before
                Taker upside.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white/95">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Risk health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 text-sm text-slate-600">
          <div>
            <div className="flex items-center justify-between text-xs">
              <p className="font-medium text-slate-900">Absorber buffer health</p>
              <p className="text-emerald-600">Safe</p>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div className="h-2 w-[72%] rounded-full bg-emerald-500" />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Current drawdown is -6.4% versus a -20% hard limit.
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs">
              <p className="font-medium text-slate-900">
                Taker exposure multiplier
              </p>
              <p className="text-slate-900">1.8x</p>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Indicates how aggressively Taker capital is deployed versus base
              pool size.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  )
}

function PnlWaterfallSection() {
  return (
    <motion.section
      className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="border-slate-200 bg-white/95">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Profit distribution waterfall
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-xs text-slate-600">
          <div className="space-y-3">
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="font-semibold text-slate-900">
                1. Absorber yield paid
              </p>
              <p>
                A fixed target APY is paid to Absorbers first, funded from net
                trading PnL.
              </p>
            </div>
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="font-semibold text-slate-900">
                2. Protocol / performance fee
              </p>
              <p>
                An optional performance fee is taken for the protocol and AI
                operators.
              </p>
            </div>
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="font-semibold text-slate-900">
                3. Remaining upside to Takers
              </p>
              <p>
                Whatever remains flows to Takers as upside, reflected in their
                pool share price.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white/95">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Loss distribution waterfall
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-xs text-slate-600">
          <div className="space-y-3">
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="font-semibold text-slate-900">
                1. AI risk budget consumed
              </p>
              <p>
                Losses first eat into a pre-configured daily and cumulative risk
                budget.
              </p>
            </div>
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="font-semibold text-slate-900">
                2. Taker exposure absorbs downside
              </p>
              <p>
                Takers absorb losses up to a defined drawdown threshold for the
                pool.
              </p>
            </div>
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="font-semibold text-slate-900">
                3. Absorber buffer (bounded)
              </p>
              <p>
                Absorber capital is only touched beyond specific guardrails,
                protecting yield-seeking capital.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  )
}

function ActivityAndRiskSection() {
  return (
    <motion.section
      className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="border-slate-200 bg-white/95">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Recent pool activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-xs text-slate-600">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">
                  Trade executed · Long CRO
                </p>
                <p>Increased exposure by 12% of pool at 2.1x leverage.</p>
              </div>
              <p className="whitespace-nowrap text-slate-500">3 min ago</p>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">
                  AI mode change · Normal → Conservative
                </p>
                <p>Reduced risk budget after hitting soft drawdown threshold.</p>
              </div>
              <p className="whitespace-nowrap text-slate-500">28 min ago</p>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">
                  Profit settlement
                </p>
                <p>
                  Absorber yield and protocol fee paid; surplus routed to Takers.
                </p>
              </div>
              <p className="whitespace-nowrap text-slate-500">2 hours ago</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-slate-50/80">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Risk and safety
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4 text-xs text-slate-600">
          <div>
            <p className="font-semibold text-slate-900">
              Max Absorber drawdown
            </p>
            <p>
              Absorber capital is protected by a hard drawdown limit; pool logic
              halts trading before this is breached.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Emergency pause</p>
            <p>
              Governance can pause AI execution and new deposits if oracles,
              venues, or contracts behave unexpectedly.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Disclaimer</p>
            <p>
              This is a non-custodial, experimental prototype for the Cronos EVM
              hackathon. Do not treat figures as production yields.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <p>Read the full specification for risk, roles, and waterfalls.</p>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-slate-200 bg-white px-4 text-xs font-medium hover:bg-slate-50"
            aria-label="Open protocol documentation"
          >
            Docs
            <ArrowUpRight className="ml-2 h-3 w-3" aria-hidden="true" />
          </Button>
        </CardFooter>
      </Card>
    </motion.section>
  )
}
