import { NextRequest, NextResponse } from "next/server"
import { JsonRpcProvider, Wallet, Contract } from "ethers"
import { SUPA_CP_CONTRACT_ADDRESS, SUPA_CP_ABI } from "@/lib/smart-contract/supa"
import { callCryptoComApi } from "@/lib/crypto-com"
import { recordPoolActivity } from "@/lib/pool-activity"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const privateKey = process.env.OPERATOR_PRIVATE_KEY
    
    if (!privateKey) {
      return NextResponse.json({
        success: false,
        error: "Server configuration error: Missing operator private key"
      }, { status: 500 })
    }

    const provider = new JsonRpcProvider("https://evm-t3.cronos.org")
    const wallet = new Wallet(privateKey, provider)
    
    // 1. Cancel All Open Orders
    let cancelResult = null
    if (process.env.CRYPTOCOM_API_KEY) {
        try {
            console.log("Cancelling all open orders for CRO_USD...")
            cancelResult = await callCryptoComApi("private/cancel-all-orders", {
                instrument_name: "CRO_USD"
            })
            console.log("Cancel Result:", cancelResult)
        } catch (e) {
            console.error("Failed to cancel orders:", e)
        }
    }

    // 2. Fetch Position PnL (Before Closing)
    let pnlCRO = 0
    if (process.env.CRYPTOCOM_API_KEY) {
        try {
            console.log("Fetching position PnL for CROUSD-PERP...")
            // Get Position PnL
            const posRes = await callCryptoComApi("private/get-positions", {
                instrument_name: "CROUSD-PERP"
            })
            
            if (posRes.code === 0 && posRes.result?.data?.[0]) {
                const pos = posRes.result.data[0]
                const pnlUSD = Number(pos.open_position_pnl || 0)
                
                // Get Current Price to convert USD PnL to CRO
                let price = 0.09 // Fallback
                try {
                    const tickerRes = await fetch("https://api.crypto.com/v2/public/get-ticker?instrument_name=CROUSD-PERP")
                    const tickerData = await tickerRes.json()
                    if (tickerData.code === 0 && tickerData.result?.data?.[0]?.a) {
                        price = Number(tickerData.result.data[0].a)
                    }
                } catch (e) { console.warn("Price fetch failed, using fallback 0.09") }

                if (price > 0) {
                    pnlCRO = pnlUSD / price
                }
                console.log(`Estimated PnL: ${pnlUSD} USD (~${pnlCRO} CRO)`)
            }
        } catch (e) {
            console.error("Failed to fetch position PnL:", e)
        }
    }

    // 3. Close Position via Exchange API
    let closeResult = null
    if (process.env.CRYPTOCOM_API_KEY) {
        try {
            console.log("Closing position via private/close-position...")
            // Try CROUSD-PERP first
            closeResult = await callCryptoComApi("private/close-position", {
                instrument_name: "CROUSD-PERP",
                type: "MARKET"
            })
            console.log("Close Result:", closeResult)
        } catch (e) {
            console.error("Failed to close position:", e)
            closeResult = { error: String(e) }
        }
    }

    // 4. Report Profit/Loss & Unlock Pool in Smart Contract
    const contract = new Contract(SUPA_CP_CONTRACT_ADDRESS, SUPA_CP_ABI, wallet)
    
    // Check operator
    const operatorAddress = await contract.operator()
    if (operatorAddress.toLowerCase() !== wallet.address.toLowerCase()) {
       throw new Error(`Wallet ${wallet.address} is not the operator.`)
    }

    // Report Profit/Loss if non-zero
    if (pnlCRO !== 0) {
        try {
            const pnlWei = BigInt(Math.floor(Math.abs(pnlCRO) * 1e18))
            
            if (pnlCRO > 0) {
                console.log(`Reporting Profit: ${pnlCRO} CRO (${pnlWei} wei)`)
                const tx = await contract.reportProfit({ value: pnlWei })
                await tx.wait()
                console.log("Profit Reported:", tx.hash)
            } else {
                console.log(`Reporting Loss: ${Math.abs(pnlCRO)} CRO (${pnlWei} wei)`)
                const tx = await contract.reportLoss(pnlWei)
                await tx.wait()
                console.log("Loss Reported:", tx.hash)
            }
        } catch (e) {
            console.error("Failed to report PnL to contract:", e)
            // Continue to unlock even if reporting fails
        }
    }

    console.log("Unlocking pool...")
    const tx = await contract.unlockGlobal()
    await tx.wait()
    const txHash = tx.hash
    console.log("Pool unlocked:", txHash)

    // Record Pool Activity
    await recordPoolActivity({
        activity_type: 'CLOSE_TRADE',
        role: 'OPERATOR',
        amount: 0, // Could fetch position size if needed
        asset: 'CRO',
        tx_hash: txHash,
        description: `Position Closed. PnL: ${pnlCRO.toFixed(2)} CRO.`,
        pnl: pnlCRO
    })

    // 4. Update Supabase (SKIPPED as per request)
    // User requested to not update AI status when closing pool.
    /*
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
        try {
            const { createClient } = require('@supabase/supabase-js')
            const supabase = createClient(supabaseUrl, supabaseKey)
            
            const { error } = await supabase
                .from('ai_trading_status')
                .insert({
                    current_bias: "Neutral",
                    current_bias_desc: "Position closed by Operator.",
                    position_size: "0% of pool",
                    position_size_desc: "Position closed via Exchange API.",
                    risk_budget: "0%",
                    risk_budget_desc: "Pool is open for deposits/withdrawals.",
                    leverage: "1x",
                    leverage_desc: "No active position.",
                    reasoning: "Manual Close triggered by Admin."
                })
            
            if (error) console.error("Failed to save status to Supabase:", error)
        } catch (dbError) {
             console.error("Database Save Error:", dbError)
        }
    } else {
        console.warn("Supabase credentials missing. Skipping DB save.")
    }
    */

    return NextResponse.json({
      success: true,
      message: `Position Closed. Pool Unlocked (${txHash}).`,
      txHash,
      closeResult
    })

  } catch (error: any) {
    console.error("Failed to process request:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error"
    }, { status: 500 })
  }
}
