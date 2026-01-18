"use client"

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
import { Button } from "@/components/ui/button"

export function ActivityAndRiskSection() {
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

