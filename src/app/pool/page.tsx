import { JsonRpcProvider, Contract, formatUnits } from "ethers"
import { SUPA_CP_CONTRACT_ADDRESS, SUPA_CP_ABI } from "@/lib/smart-contract/supa"
import { getRecentPoolActivity } from "@/lib/pool-activity"
import { SiteHeader } from "./components/site-header"
import { FooterSection } from "./components/footer-section"
import { PoolOverviewSection } from "./components/pool-overview-section"
import { PoolAdvancedChartSection } from "./components/pool-advanced-chart-section"
import { AITradingStatusSection } from "./components/ai-trading-status-section"
import { CapitalDistributionSection } from "./components/capital-distribution-section"
import { ActivityAndRiskSection } from "./components/activity-and-risk-section"

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getInitialPoolData() {
  try {
    const provider = new JsonRpcProvider("https://evm-t3.cronos.org")
    const contract = new Contract(SUPA_CP_CONTRACT_ADDRESS, SUPA_CP_ABI, provider)

    const [
      totalAvailable,
      totalInPosition,
      totalTakerInPosition,
      totalAbsorberInPosition
    ] = await Promise.all([
      contract.totalAvailable(),
      contract.totalInPosition(),
      contract.totalTakerInPosition(),
      contract.totalAbsorberInPosition(),
    ])
    
    return {
      totalAvailable: Number(formatUnits(totalAvailable, 18)),
      totalInPosition: Number(formatUnits(totalInPosition, 18)),
      totalTakerInPosition: Number(formatUnits(totalTakerInPosition, 18)),
      totalAbsorberInPosition: Number(formatUnits(totalAbsorberInPosition, 18)),
    }
  } catch (error) {
    console.error("Failed to fetch initial pool data:", error)
    return null
  }
}

export default async function PoolPage() {
  const initialData = await getInitialPoolData()
  const recentActivities = await getRecentPoolActivity(5) // Fetch last 5 activities

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-slate-900">
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <PoolOverviewSection initialOnchainTotals={initialData} />
        <PoolAdvancedChartSection />
        <AITradingStatusSection />
        <CapitalDistributionSection />
        <ActivityAndRiskSection activities={recentActivities as any[]} />
      </main>
      <FooterSection />
    </div>
  )
}
