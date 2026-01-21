import { NextResponse } from "next/server"
import { JsonRpcProvider, Contract, formatUnits } from "ethers"
import { SUPA_CP_CONTRACT_ADDRESS, SUPA_CP_ABI } from "@/lib/smart-contract/supa"

export const dynamic = 'force-dynamic' // Ensure this route is not cached statically

export async function GET() {
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
    
    return NextResponse.json({
      success: true,
      data: {
        totalAvailable: Number(formatUnits(totalAvailable, 18)),
        totalInPosition: Number(formatUnits(totalInPosition, 18)),
        totalTakerInPosition: Number(formatUnits(totalTakerInPosition, 18)),
        totalAbsorberInPosition: Number(formatUnits(totalAbsorberInPosition, 18)),
      }
    })
  } catch (error: any) {
    console.error("Failed to fetch pool stats:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
