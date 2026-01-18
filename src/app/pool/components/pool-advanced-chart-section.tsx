"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

export function PoolAdvancedChartSection() {
  const [position, setPosition] = useState<{
    instrument: string
    quantity: number | null
    side: string | null
    notional: number | null
    pnl: number | null
    type: string | null
    isolationType: string | null
    entryPrice: number | null
  } | null>(null)
  const [isLoadingPosition, setIsLoadingPosition] = useState(false)
  const [positionError, setPositionError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadPosition() {
      setIsLoadingPosition(true)
      setPositionError(null)

      try {
        const response = await fetch("/api/crypto-positions")
        if (!response.ok) {
          if (!cancelled) {
            setPosition(null)
          }
          return
        }

        const data = (await response.json()) as {
          position?: {
            instrument: string
            quantity: number | null
            side: string | null
            notional: number | null
            pnl: number | null
            type: string | null
            isolationType: string | null
            entryPrice: number | null
          } | null
          error?: string
        }

        if (cancelled) {
          return
        }

        if (data.error) {
          setPosition(null)
          setPositionError("Unable to load active position")
          return
        }

        if (data.position) {
          setPosition(data.position)
        } else {
          setPosition(null)
        }
      } catch {
        if (!cancelled) {
          setPosition(null)
          setPositionError("Unable to load active position")
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPosition(false)
        }
      }
    }

    loadPosition()

    return () => {
      cancelled = true
    }
  }, [])

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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold text-slate-900">
                {position?.instrument ?? "CROUSD-PERP"}
              </CardTitle>
              {position?.side ? (
                <span
                  className={
                    position.side === "LONG"
                      ? "rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700"
                      : position.side === "SHORT"
                        ? "rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-700"
                        : "rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700"
                  }
                >
                  {position.side}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
              {isLoadingPosition ? (
                <span className="inline-block h-4 w-32 animate-pulse rounded-full bg-slate-200" />
              ) : position ? (
                <>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-700">
                    Size{" "}
                    <span className="font-semibold">
                      {position.quantity !== null
                        ? `${position.quantity} CRO`
                        : "0 CRO"}
                    </span>
                  </span>
                  {position.entryPrice !== null ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-700">
                      Entry{" "}
                      <span className="font-semibold">
                        {position.entryPrice.toFixed(6)}
                      </span>
                    </span>
                  ) : null}
                </>
              ) : positionError ? (
                <span className="text-xs text-rose-600">
                  {positionError}
                </span>
              ) : (
                <span className="text-[11px] text-slate-500">
                  No active CROUSD-PERP position
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <PoolTradingViewAdvancedChart />
        </CardContent>
      </Card>
    </motion.section>
  )
}

