"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface PoolActivity {
  id: string
  created_at: string
  activity_type: 'OPEN_TRADE' | 'CLOSE_TRADE' | 'DEPOSIT' | 'WITHDRAW'
  role: 'TAKER' | 'ABSORBER' | 'OPERATOR'
  amount: number
  asset: string
  tx_hash: string
  description: string
  pnl?: number
}

export function ActivityAndRiskSection({ activities = [] }: { activities?: PoolActivity[] }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
        <CardContent className="p-0">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-slate-600">
              <Badge
                variant="outline"
                className="mb-3 rounded-full border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-500"
              >
                No Activity Yet
              </Badge>
              <p className="max-w-xs text-balance">
                Real-time trade execution and pool settlement logs will be displayed here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {activities.map((activity) => (
                <li key={activity.id} className="flex items-center justify-between px-4 py-3 text-xs hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                        activity.activity_type === 'DEPOSIT' ? 'border-emerald-100 bg-emerald-50 text-emerald-600' :
                        activity.activity_type === 'WITHDRAW' ? 'border-rose-100 bg-rose-50 text-rose-600' :
                        'border-blue-100 bg-blue-50 text-blue-600'
                    }`}>
                        {activity.activity_type === 'DEPOSIT' && <span className="text-lg leading-none">↓</span>}
                        {activity.activity_type === 'WITHDRAW' && <span className="text-lg leading-none">↑</span>}
                        {(activity.activity_type === 'OPEN_TRADE' || activity.activity_type === 'CLOSE_TRADE') && <span className="text-[10px] font-bold">AI</span>}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{activity.description}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span>{mounted ? new Date(activity.created_at).toLocaleString() : new Date(activity.created_at).toISOString().split('T')[0]}</span>
                            <span>•</span>
                            <a 
                                href={`https://explorer.cronos.org/testnet/tx/${activity.tx_hash}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="hover:text-slate-900 hover:underline"
                            >
                                View Tx
                            </a>
                        </div>
                    </div>
                  </div>
                  <div className="text-right pl-2 shrink-0">
                    <p className={`font-medium ${
                        activity.activity_type === 'DEPOSIT' || (activity.pnl && activity.pnl > 0) ? 'text-emerald-600' :
                        activity.activity_type === 'WITHDRAW' || (activity.pnl && activity.pnl < 0) ? 'text-rose-600' :
                        'text-slate-900'
                    }`}>
                        {activity.activity_type === 'DEPOSIT' ? '+' : activity.activity_type === 'WITHDRAW' ? '-' : ''}
                        {Number(activity.amount || 0).toFixed(2)} {activity.asset}
                    </p>
                    {activity.role && (
                        <p className="text-[10px] text-slate-500 lowercase">{activity.role}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white/95">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Pool documentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4 text-xs text-slate-600">
          <p>
            Review how profits and losses flow between Takers and Absorbers,
            current risk parameters, and protocol circuit breakers.
          </p>
          <p>
            The docs page collects the full specification for waterfalls,
            drawdown rails, and safety mechanisms in one place.
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <p>Read the full specification for risk, roles, and waterfalls.</p>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-full border-slate-200 bg-white px-4 text-xs font-medium hover:bg-slate-50"
            aria-label="Open pool documentation"
          >
            <Link href="/pool/docs">
              Open pool docs
              <ArrowUpRight className="ml-2 h-3 w-3" aria-hidden="true" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.section>
  )
}

