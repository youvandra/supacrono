"use client"

import { SiteHeader } from "./components/site-header"
import { FooterSection } from "./components/footer-section"
import { PoolOverviewSection } from "./components/pool-overview-section"
import { PoolAdvancedChartSection } from "./components/pool-advanced-chart-section"
import { AITradingStatusSection } from "./components/ai-trading-status-section"
import { CapitalDistributionSection } from "./components/capital-distribution-section"
import { ActivityAndRiskSection } from "./components/activity-and-risk-section"

export default function PoolPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-slate-900">
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <PoolOverviewSection />
        <PoolAdvancedChartSection />
        <AITradingStatusSection />
        <CapitalDistributionSection />
        <ActivityAndRiskSection />
      </main>
      <FooterSection />
    </div>
  )
}

