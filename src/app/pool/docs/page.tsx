"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FooterSection, SiteHeader } from "../../governance/page"

export default function PoolDocsPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-slate-900">
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <Badge className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-800">
              Pool documentation
            </Badge>
            <h1 className="mt-3 text-balance text-2xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-3xl">
              Supacron pool risk, waterfalls, and circuit breakers.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              This page collects the core mechanics that govern how profits and
              losses flow, how risk is budgeted, and how the pool can be paused
              in edge cases.
            </p>
          </div>
          <div className="flex items-center justify-start gap-2 sm:justify-end">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full border-slate-200 bg-white px-4 text-xs font-medium hover:bg-slate-50"
            >
              <Link href="/pool">
                <ArrowLeft className="mr-2 h-3 w-3" aria-hidden="true" />
                Back to pool dashboard
              </Link>
            </Button>
          </div>
        </motion.section>

        <PoolWaterfallDocsSection />
        <RiskAndCircuitDocsSection />
      </main>
      <FooterSection />
    </div>
  )
}

function PoolWaterfallDocsSection() {
  return (
    <motion.section
      className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
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

function RiskAndCircuitDocsSection() {
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
            Current risk parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-4 text-xs text-slate-600 sm:grid-cols-2">
          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Max pool drawdown
            </p>
            <p className="text-sm font-semibold text-slate-900">-20%</p>
            <p className="text-[11px] text-slate-500">
              Hard limit before AI execution is halted and the pool is
              rebalanced.
            </p>
          </div>
          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Daily risk budget
            </p>
            <p className="text-sm font-semibold text-slate-900">2.5% of NAV</p>
            <p className="text-[11px] text-slate-500">
              Cap on net new risk the AI can deploy per day.
            </p>
          </div>
          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Protocol fee on Takers
            </p>
            <p className="text-sm font-semibold text-slate-900">
              18% of profit
            </p>
            <p className="text-[11px] text-slate-500">
              Performance share taken on realized upside from Taker positions.
            </p>
          </div>
          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Absorber target APY
            </p>
            <p className="text-sm font-semibold text-slate-900">8–12% range</p>
            <p className="text-[11px] text-slate-500">
              Governance tunes yield band while keeping drawdown rails intact.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white/95">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Circuit breakers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4 text-xs text-slate-600">
          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold text-slate-900">
              Drawdown soft limit
            </p>
            <p className="text-[11px] text-slate-500">
              At -10% pool drawdown, AI switches to recovery mode with reduced
              position sizes and narrower bias.
            </p>
          </div>
          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold text-slate-900">
              Trading halt threshold
            </p>
            <p className="text-[11px] text-slate-500">
              At -20% drawdown, trading halts and the pool is rebalanced back
              toward neutral.
            </p>
          </div>
          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold text-slate-900">
              Oracle and venue failures
            </p>
            <p className="text-[11px] text-slate-500">
              Governance can trigger an emergency pause if oracles, venues, or
              contracts misbehave.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  )
}

