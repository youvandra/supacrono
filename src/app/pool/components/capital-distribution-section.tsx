"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { formatUnits } from "ethers"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { RPC_PROVIDER, getSupaPoolContract } from "../pool-helpers"

export function CapitalDistributionSection() {
  const [onchainTotals, setOnchainTotals] = useState<{
    totalInPosition: number
    totalTakerInPosition: number
    totalAbsorberInPosition: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadOnchainRoleTotals() {
      setIsLoading(true)

      try {
        const contract = getSupaPoolContract(RPC_PROVIDER)
        const [
          totalInPositionRaw,
          totalTakerInPositionRaw,
          totalAbsorberInPositionRaw,
        ] = await Promise.all([
          contract.totalInPosition(),
          contract.totalTakerInPosition(),
          contract.totalAbsorberInPosition(),
        ])

        if (cancelled) {
          return
        }

        const toNumber = (value: bigint) => Number(formatUnits(value, 18))

        setOnchainTotals({
          totalInPosition: toNumber(totalInPositionRaw),
          totalTakerInPosition: toNumber(totalTakerInPositionRaw),
          totalAbsorberInPosition: toNumber(totalAbsorberInPositionRaw),
        })
      } catch {
        if (!cancelled) {
          setOnchainTotals(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadOnchainRoleTotals()

    return () => {
      cancelled = true
    }
  }, [])

  const totalInPosition =
    onchainTotals !== null ? onchainTotals.totalInPosition : 0
  const takerInPosition =
    onchainTotals !== null ? onchainTotals.totalTakerInPosition : 0
  const absorberInPosition =
    onchainTotals !== null ? onchainTotals.totalAbsorberInPosition : 0

  const takerPercent =
    totalInPosition > 0 ? (takerInPosition / totalInPosition) * 100 : null
  const absorberPercent =
    totalInPosition > 0 ? (absorberInPosition / totalInPosition) * 100 : null

  const takerPercentDisplay =
    takerPercent !== null ? `${takerPercent.toFixed(1)}%` : "—"
  const absorberPercentDisplay =
    absorberPercent !== null ? `${absorberPercent.toFixed(1)}%` : "—"

  const takerAmountDisplay = isLoading
    ? "Loading..."
    : `${takerInPosition.toLocaleString("en-US", {
        maximumFractionDigits: 2,
      })} tCRO`

  const absorberAmountDisplay = isLoading
    ? "Loading..."
    : `${absorberInPosition.toLocaleString("en-US", {
        maximumFractionDigits: 2,
      })} tCRO`

  const takerBarWidth =
    takerPercent !== null
      ? `${Math.max(0, Math.min(100, takerPercent))}%`
      : "0%"
  const absorberBarWidth =
    absorberPercent !== null
      ? `${Math.max(0, Math.min(100, absorberPercent))}%`
      : "0%"

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
                <p className="text-slate-600">
                  {takerAmountDisplay} · {takerPercentDisplay} of in-position
                  capital
                </p>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-emerald-500"
                  style={{ width: takerBarWidth }}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Bears more PnL volatility; receives upside after Absorber yield
                and protocol fees.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <p className="font-medium text-slate-900">Absorber capital</p>
                <p className="text-slate-600">
                  {absorberAmountDisplay} · {absorberPercentDisplay} of
                  in-position capital
                </p>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-slate-900"
                  style={{ width: absorberBarWidth }}
                />
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

