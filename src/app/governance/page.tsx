"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

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
        <Link href="/" className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200">
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
            className="text-sm font-medium text-slate-900 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 rounded-full px-2 py-1"
          >
            Governance
          </a>
          <span className="text-sm font-medium text-slate-400 rounded-full px-2 py-1">
            Pool
          </span>
          <span className="text-sm font-medium text-slate-400 rounded-full px-2 py-1">
            Portfolio
          </span>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden rounded-full border-slate-200 bg-white px-4 text-xs font-medium shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-slate-50 md:inline-flex"
            aria-label="Connect wallet"
          >
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

export default function GovernancePage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-slate-900">
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <GovernanceHero />
        <GovernanceGrid />
      </main>
    </div>
  )
}

function GovernanceHero() {
  return (
    <motion.section
      className="flex flex-col gap-6 border-b border-slate-200/80 pb-10 sm:flex-row sm:items-end sm:justify-between"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-xl">
        <Badge className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-800">
          Protocol governance
        </Badge>
        <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          On-chain risk rails for pooled AI trading.
        </h1>
        <p className="mt-4 text-balance text-sm leading-relaxed text-slate-600 sm:text-base">
          Governance steers the Supacron pool by setting drawdown limits,
          configuring circuit breakers, and defining how PnL waterfalls between
          Takers and Absorbers. This page summarizes the current parameters and
          upcoming changes.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:items-end">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-600">
          Snapshot
        </p>
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 sm:text-sm">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Governance mode
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              Multisig council
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Chain
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              Cronos EVM
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

function GovernanceGrid() {
  return (
    <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Card className="border-slate-200 bg-white/90">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Current risk parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4 text-sm text-slate-600 sm:grid-cols-2">
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Max pool drawdown
              </p>
              <p className="text-sm font-semibold text-slate-900">-20%</p>
              <p className="text-xs">
                Hard limit enforced before AI execution is halted and the pool
                is rebalanced.
              </p>
            </div>
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Daily risk budget
              </p>
              <p className="text-sm font-semibold text-slate-900">2.5% pool NAV</p>
              <p className="text-xs">
                AI position sizing is capped by this budget across all trading
                lanes.
              </p>
            </div>
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Taker performance fee
              </p>
              <p className="text-sm font-semibold text-slate-900">18% of PnL</p>
              <p className="text-xs">
                Paid after Absorber yield and protocol fees, aligned with
                on-chain waterfall.
              </p>
            </div>
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Absorber base APY
              </p>
              <p className="text-sm font-semibold text-slate-900">8–12% target</p>
              <p className="text-xs">
                Yield priority before Taker upside, funded from net pool
                performance.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/90">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Circuit breakers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4 text-sm text-slate-600">
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold text-slate-900">
                Drawdown soft limit
              </p>
              <p className="text-xs">
                At -10% pool drawdown, AI switches to recovery mode with reduced
                position sizes and narrower bias.
              </p>
            </div>
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold text-slate-900">
                Trading halt
              </p>
              <p className="text-xs">
                At -20% pool drawdown, all new positions are blocked and only
                risk-reducing orders are allowed.
              </p>
            </div>
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold text-slate-900">
                Oracle or venue failure
              </p>
              <p className="text-xs">
                When price feeds or the venue are unstable, AI execution is
                paused until governance unpauses.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white/90">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Upcoming proposals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 text-sm text-slate-600">
          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold text-slate-900">
              SP-01: Enable second trading lane
            </p>
            <p className="text-xs">
              Add a low-volatility basis trade lane for Absorber-focused
              capital with separate risk budget.
            </p>
          </div>
          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold text-slate-900">
              SP-02: Tighten daily risk budget
            </p>
            <p className="text-xs">
              Reduce the daily risk budget to 2.0% of pool NAV while the AI
              model is retrained.
            </p>
          </div>
          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold text-slate-900">
              SP-03: Introduce loyalty boosts
            </p>
            <p className="text-xs">
              Boost Absorber yield for depositors that remain in the pool across
              multiple epochs.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <div>
            <p className="font-medium text-slate-900">Governance docs</p>
            <p>View the full specification for Supacron governance and roles.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-slate-200 bg-white px-4 text-xs font-medium hover:bg-slate-50"
            aria-label="Open governance documentation"
          >
            Open docs
            <ArrowUpRight className="ml-2 h-3 w-3" aria-hidden="true" />
          </Button>
        </CardFooter>
      </Card>
    </section>
  )
}
