import { NextRequest, NextResponse } from "next/server"
import { JsonRpcProvider, Wallet, Contract } from "ethers"
import { SUPA_CP_CONTRACT_ADDRESS, SUPA_CP_ABI } from "@/lib/smart-contract/supa"
import { callCryptoComApi } from "@/lib/crypto-com"

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

    // 2. Sell All CRO (Close Position)
    let closeResult = null
    if (process.env.CRYPTOCOM_API_KEY) {
        try {
            // Get Account Summary to find CRO balance
            const accountRes = await callCryptoComApi("private/get-account-summary", {
                currency: "CRO"
            })
            
            // accountRes structure: { code: 0, result: { accounts: [ { currency: "CRO", balance: 100, available: 100, ... } ] } }
            const croAccount = accountRes?.result?.accounts?.find((a: any) => a.currency === "CRO")
            const availableBalance = Number(croAccount?.available || 0)

            console.log("Available CRO to sell:", availableBalance)

            if (availableBalance > 1) { // Minimum threshold
                 // Round down to 2 decimals or safe precision
                 const quantity = Math.floor(availableBalance * 100) / 100

                 console.log(`Selling ${quantity} CRO...`)
                 closeResult = await callCryptoComApi("private/create-order", {
                    instrument_name: "CRO_USD",
                    side: "SELL",
                    type: "MARKET",
                    quantity: quantity
                })
                console.log("Close Result:", closeResult)
            } else {
                console.log("No significant CRO balance to sell.")
                closeResult = { message: "No CRO balance to sell" }
            }
        } catch (e) {
            console.error("Failed to close position:", e)
            closeResult = { error: String(e) }
        }
    }

    // 3. Unlock Pool in Smart Contract
    const contract = new Contract(SUPA_CP_CONTRACT_ADDRESS, SUPA_CP_ABI, wallet)
    
    // Check operator
    const operatorAddress = await contract.operator()
    if (operatorAddress.toLowerCase() !== wallet.address.toLowerCase()) {
       throw new Error(`Wallet ${wallet.address} is not the operator.`)
    }

    console.log("Unlocking pool...")
    const tx = await contract.unlockGlobal()
    await tx.wait()
    const txHash = tx.hash
    console.log("Pool unlocked:", txHash)

    // 4. Update Supabase (Optional but good for UI consistency)
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
                    position_size_desc: closeResult?.result?.order_id ? `Sold CRO via Order: ${closeResult.result.order_id}` : "No assets to sell.",
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
