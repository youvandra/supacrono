"use client"

import { motion } from "framer-motion"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AITradingStatusSection() {
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
            <p className="text-sm font-semibold text-emerald-700">
              58% of daily
            </p>
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
            conditions, then picks a bias and size under the pool&apos;s risk
            budget.
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

