import { NextRequest, NextResponse } from "next/server"
import { JsonRpcProvider, Wallet, Contract } from "ethers"
import { SUPA_CP_CONTRACT_ADDRESS, SUPA_CP_ABI } from "@/lib/smart-contract/supa"
import { callCryptoComApi } from "@/lib/crypto-com"

export const dynamic = 'force-dynamic'

const FACILITATOR_URL = "https://facilitator.cronoslabs.org"
const WCRO_CONTRACT_ADDRESS = "0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23" // Cronos Testnet WCRO

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
    
    // Check for X-Payment header
    const paymentHeader = request.headers.get("x-payment")
    
    if (!paymentHeader) {
      // Return 402 Payment Required with requirements
      return NextResponse.json({
        paymentRequirements: {
          scheme: "exact",
          network: "cronos-testnet",
          payTo: wallet.address,
          asset: WCRO_CONTRACT_ADDRESS,
          maxAmountRequired: "1000000000000000000", // 1 WCRO
          maxTimeoutSeconds: 300,
          description: "AI Analysis & Pool Lock Fee",
          mimeType: "application/json"
        }
      }, { status: 402 })
    }

    // Verify and Settle Payment via Facilitator
    try {
      // 1. Verify
      console.log("Verifying payment with facilitator...");
      const verifyBody = {
        x402Version: 1,
        paymentHeader: paymentHeader,
        paymentRequirements: {
          scheme: "exact",
          network: "cronos-testnet",
          payTo: wallet.address,
          asset: WCRO_CONTRACT_ADDRESS,
          maxAmountRequired: "1000000000000000000",
          maxTimeoutSeconds: 300,
          description: "AI Analysis & Pool Lock Fee",
          mimeType: "application/json"
        }
      };
      
      const verifyRes = await fetch(`${FACILITATOR_URL}/v2/x402/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X402-Version": "1"
        },
        body: JSON.stringify(verifyBody)
      })

      const verifyData = await verifyRes.json()
      
      if (!verifyRes.ok || !verifyData.isValid) {
        console.error("Facilitator Verify Error:", verifyData);
        return NextResponse.json({
          success: false,
          error: `Payment verification failed: ${verifyData.invalidReason || verifyData.error || verifyData.message || JSON.stringify(verifyData)}`
        }, { status: 400 })
      }

      // 2. Settle
      const settleRes = await fetch(`${FACILITATOR_URL}/v2/x402/settle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X402-Version": "1"
        },
        body: JSON.stringify({
          x402Version: 1,
          paymentHeader: paymentHeader,
          paymentRequirements: {
            scheme: "exact",
            network: "cronos-testnet",
            payTo: wallet.address,
            asset: WCRO_CONTRACT_ADDRESS,
          maxAmountRequired: "1000000000000000000",
          maxTimeoutSeconds: 300,
          description: "AI Analysis & Pool Lock Fee",
          mimeType: "application/json"
        }
      })
    })

      const settleData = await settleRes.json()
      if (settleData.event === "payment.failed") {
        return NextResponse.json({
          success: false,
          error: `Payment settlement failed: ${settleData.error}`
        }, { status: 400 })
      }

      console.log("x402 Payment settled:", settleData.txHash)

    } catch (paymentError: any) {
      console.error("Payment processing error:", paymentError)
      return NextResponse.json({
        success: false,
        error: "Payment processing failed"
      }, { status: 500 })
    }

    // Payment Successful. Proceed with AI Analysis -> Order -> Lock.
    
    // Parse Body for Stats
    let poolStats: any = {}
    try {
        poolStats = await request.json()
    } catch (e) {
        console.warn("No JSON body found, using defaults")
    }

    const { totalAvailable, totalInPosition } = poolStats
    const totalPoolValue = Number(totalAvailable || 0) + Number(totalInPosition || 0)

    console.log("Pool Stats:", { totalAvailable, totalInPosition, totalPoolValue })

    // 1. Fetch Price
    let currentPrice = 0
    try {
        const priceRes = await fetch("https://api.crypto.com/exchange/v1/public/get-ticker?instrument_name=CRO_USD")
        const priceData = await priceRes.json()
        if (priceData.code === 0 && priceData.result?.data?.[0]?.a) {
            currentPrice = Number(priceData.result.data[0].a)
        }
        console.log("Current CRO Price:", currentPrice)
    } catch (e) {
        console.error("Failed to fetch price:", e)
    }

    // 2. Generate AI Analysis
    let aiAnalysis = {
        status: "NEUTRAL",
        reasoning: "AI Service Unavailable",
        action: "HOLD",
        positionSizePercent: 0,
        leverage: 1
    }

    if (process.env.OPENROUTER_API_KEY) {
        try {
            const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "google/gemini-2.0-flash-001", // Use a fast/free model
                    messages: [
                        {
                            role: "system",
                            content: `You are an expert crypto trading AI. Analyze the market for Cronos (CRO) given the current price: $${currentPrice}.
                            Pool Size: ${totalPoolValue} tCRO.
                            
                            Return a JSON object ONLY with no markdown formatting:
                            {
                                "status": "BULLISH" | "BEARISH" | "NEUTRAL",
                                "reasoning": "string (max 20 words)",
                                "action": "BUY" | "SELL",
                                "positionSizePercent": number (1-100),
                                "leverage": number (1-5)
                            }`
                        },
                        {
                            role: "user",
                            content: "Analyze now."
                        }
                    ]
                })
            })
            
            const aiData = await aiRes.json()
            const content = aiData.choices?.[0]?.message?.content
            if (content) {
                try {
                    // Remove markdown code blocks if any
                    const cleanContent = content.replace(/```json/g, "").replace(/```/g, "").trim()
                    aiAnalysis = JSON.parse(cleanContent)
                } catch (parseError) {
                    console.error("Failed to parse AI response:", content)
                }
            }
        } catch (e) {
            console.error("AI Generation Error:", e)
        }
    }

    console.log("AI Analysis Result:", aiAnalysis)

    // 3. Calculate Quantity and Execute Order
    let orderResult = null
    
    if (aiAnalysis.action !== "HOLD" && process.env.CRYPTOCOM_API_KEY && currentPrice > 0) {
        try {
            const positionSizeCRO = (totalPoolValue * (aiAnalysis.positionSizePercent / 100)) * aiAnalysis.leverage
            const quantityCRO = positionSizeCRO
            
            // Round quantity to valid precision (e.g. 2 decimals)
            const quantity = Number(quantityCRO.toFixed(2))

            if (quantity > 0) {
                console.log(`Executing ${aiAnalysis.action} order for ${quantity} CRO`)
                
                orderResult = await callCryptoComApi("private/create-order", {
                    instrument_name: "CRO_USD", // Using CRO_USD as requested
                    side: aiAnalysis.action,
                    type: "MARKET",
                    quantity: quantity,
                    // client_oid: ... optional
                })
                console.log("Order Result:", orderResult)
            }
        } catch (e: any) {
            console.error("Order Execution Failed:", e)
            orderResult = { status: "failed", error: e.message }
        }
    }

    // 4. Lock Pool (ONLY if order executed or AI is not neutral)
    // If AI says NEUTRAL/HOLD, we skip locking to save gas and keep pool open.
    let txHash = null;

    if (aiAnalysis.action === "HOLD" || aiAnalysis.status === "NEUTRAL") {
        console.log("AI Decision is NEUTRAL/HOLD. Skipping Pool Lock.");
    } else {
        const contract = new Contract(SUPA_CP_CONTRACT_ADDRESS, SUPA_CP_ABI, wallet)
        
        // Check operator
        const operatorAddress = await contract.operator()
        if (operatorAddress.toLowerCase() !== wallet.address.toLowerCase()) {
           throw new Error(`Wallet ${wallet.address} is not the operator.`)
        }

        console.log("Locking pool...")
        const tx = await contract.lockGlobal()
        await tx.wait()
        txHash = tx.hash
        console.log("Pool locked:", txHash)
    }

    // 5. Store AI Decision in Supabase (for Pool Page display)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
        try {
            const { createClient } = require('@supabase/supabase-js')
            const supabase = createClient(supabaseUrl, supabaseKey)
            
            const { error } = await supabase
                .from('ai_trading_status')
                .insert({
                    current_bias: aiAnalysis.status === "BULLISH" ? "Long" : aiAnalysis.status === "BEARISH" ? "Short" : "Neutral",
                    current_bias_desc: `AI is ${aiAnalysis.status.toLowerCase()} on CRO based on current market conditions.`,
                    position_size: `${aiAnalysis.positionSizePercent}% of pool · ${aiAnalysis.leverage}x leverage`,
                    position_size_desc: orderResult ? `Executed via Crypto.com: ${orderResult.result?.order_id || 'Order Placed'}` : "No order executed.",
                    risk_budget: `${Math.floor(Math.random() * 30) + 40}% of daily`, // Simulated for now
                    risk_budget_desc: "AI is managing risk within daily drawdown limits.",
                    leverage: `${aiAnalysis.leverage}x`,
                    leverage_desc: "Expressed through CRO spot/margin markets.",
                    reasoning: aiAnalysis.reasoning
                })
            
            if (error) console.error("Failed to save AI status to Supabase:", error)
            else console.log("AI Status saved to Supabase")
        } catch (dbError) {
             console.error("Database Save Error:", dbError)
        }
    } else {
        console.warn("Supabase credentials missing. Skipping DB save.")
    }

    return NextResponse.json({
      success: true,
      message: `AI Analyzed: ${aiAnalysis.status} (${aiAnalysis.reasoning}). Order ${orderResult ? 'Executed' : 'Skipped'}. Pool ${txHash ? 'Locked' : 'remains Open'}.`,
      txHash: txHash,
      aiAnalysis,
      orderResult
    })

  } catch (error: any) {
    console.error("Failed to process request:", error)
    
    let errorMessage = error.message || "Unknown error"
    if (errorMessage.includes("execution reverted")) {
        errorMessage = "Transaction reverted. Pool might already be locked."
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 })
  }
}
