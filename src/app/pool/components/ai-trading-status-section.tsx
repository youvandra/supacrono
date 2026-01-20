"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"

type AITradingStatus = {
  current_bias: string
  current_bias_desc: string
  position_size: string
  position_size_desc: string
  risk_budget: string
  risk_budget_desc: string
  last_action: string
  last_action_desc: string
  reasoning: string
}

export function AITradingStatusSection() {
  const [status, setStatus] = useState<AITradingStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStatus() {
      try {
        const { data, error } = await supabase
          .from("ai_trading_status")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) {
          console.error("Supabase error:", error)
          return
        }

        if (data) {
          setStatus(data as AITradingStatus)
        }
      } catch (err) {
        console.error("Failed to load AI trading status", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadStatus()
  }, [])

  const displayStatus = status || {
    current_bias: "Long",
    current_bias_desc:
      "AI is tilted long CRO per current momentum and volatility regime.",
    position_size: "66% of pool · 2.1x leverage",
    position_size_desc:
      "Expressed through CRO perpetuals on Crypto.com Futures.",
    risk_budget: "58% of daily",
    risk_budget_desc:
      "AI can still deploy additional risk before today's cap is hit.",
    last_action: "Reduced exposure · 6 min ago",
    last_action_desc: "AI trimmed long size after volatility spike on CRO/USD.",
    reasoning:
      "The engine scores short-term CRO trend, volatility, and funding conditions, then picks a bias and size under the pool's risk budget.\n\nRight now it is net long with moderated size after a volatility uptick, keeping Absorber buffer within the configured drawdown envelope.",
  }

  if (isLoading) {
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
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="space-y-1 rounded-lg bg-slate-50 px-3 py-2"
              >
                <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                <div className="mt-1 h-4 w-32 animate-pulse rounded bg-slate-200" />
                <div className="mt-1 h-3 w-full animate-pulse rounded bg-slate-200" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-slate-50/80">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Why AI is positioned this way
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4 text-xs text-slate-600">
            <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
          </CardContent>
        </Card>
      </motion.section>
    )
  }

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
            <p className="text-sm font-semibold text-slate-900">
              {displayStatus.current_bias}
            </p>
            <p className="text-xs">{displayStatus.current_bias_desc}</p>
          </div>
          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Position size
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {displayStatus.position_size}
            </p>
            <p className="text-xs">{displayStatus.position_size_desc}</p>
          </div>
          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Risk budget remaining
            </p>
            <p className="text-sm font-semibold text-emerald-700">
              {displayStatus.risk_budget}
            </p>
            <p className="text-xs">{displayStatus.risk_budget_desc}</p>
          </div>
          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Last action
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {displayStatus.last_action}
            </p>
            <p className="text-xs">{displayStatus.last_action_desc}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-slate-50/80">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Why AI is positioned this way
          </CardTitle>
        </CardHeader>
        <CardContent className="whitespace-pre-wrap pt-4 text-xs text-slate-600">
          {displayStatus.reasoning}
        </CardContent>
      </Card>
    </motion.section>
  )
}

