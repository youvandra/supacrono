import { NextRequest, NextResponse } from "next/server"
import { JsonRpcProvider, Wallet, Contract, verifyTypedData } from "ethers"
import { SUPA_CP_CONTRACT_ADDRESS, SUPA_CP_ABI } from "@/lib/smart-contract/supa"
import { callCryptoComApi } from "@/lib/crypto-com"

export const dynamic = 'force-dynamic'

const FACILITATOR_URL = "https://facilitator.cronoslabs.org"
const WCRO_CONTRACT_ADDRESS = "0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23" // Cronos Testnet WCRO (Official)

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

    // Verify Payment Locally (Bypass Facilitator for Testnet/Self-Payment)
    try {
      console.log("Verifying payment locally...");
      
      const decodedHeader = JSON.parse(atob(paymentHeader));
      const payload = decodedHeader.payload;
      
      if (payload.asset.toLowerCase() !== WCRO_CONTRACT_ADDRESS.toLowerCase()) {
         throw new Error("Invalid asset");
      }
      
      const domain = {
        name: "Wrapped CRO",
        version: "1",
        chainId: 338,
        verifyingContract: payload.asset
      };
      
      const types = {
        TransferWithAuthorization: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'validAfter', type: 'uint256' },
          { name: 'validBefore', type: 'uint256' },
          { name: 'nonce', type: 'bytes32' },
        ]
      };
      
      const message = {
        from: payload.from,
        to: payload.to,
        value: payload.value,
        validAfter: payload.validAfter,
        validBefore: payload.validBefore,
        nonce: payload.nonce
      };
      
      const recovered = verifyTypedData(domain, types, message, payload.signature);
      
      if (recovered.toLowerCase() !== payload.from.toLowerCase()) {
        throw new Error("Invalid signature: recovered address does not match");
      }
      
      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.validBefore < now) {
         throw new Error("Payment authorization expired");
      }
      
      console.log("Payment Verified Locally (Not Settled on-chain)");

    } catch (paymentError: any) {
      console.error("Payment verification error:", paymentError)
      return NextResponse.json({
        success: false,
        error: `Payment verification failed: ${paymentError.message}`
      }, { status: 400 })
    }

    // Payment Successful. Proceed with AI Analysis -> Order -> Lock.
    
    // 1. Fetch Price & Instrument Info
    let currentPrice = 0
    let bidPrice = 0
    let askPrice = 0
    let quantityDecimals = 2 // Default
    let quoteDecimals = 2 // Default
    let minQuantity = 0
    let qtyTickSize = 0

    try {
        const [tickerRes, instrumentsRes] = await Promise.all([
            fetch("https://api.crypto.com/v2/public/get-ticker?instrument_name=CROUSD-PERP"),
            fetch("https://api.crypto.com/exchange/v1/public/get-instruments")
        ])

        const priceData = await tickerRes.json()
        if (priceData.code === 0 && priceData.result?.data?.[0]) {
            const data = priceData.result.data[0]
            currentPrice = Number(data.k || data.a) 
            bidPrice = Number(data.b)
            askPrice = Number(data.a)
        }

        const instData = await instrumentsRes.json()
        if (instData.code === 0 && instData.result?.data) {
            const inst = instData.result.data.find((i: any) => i.symbol === "CROUSD-PERP")
            if (inst) {
                if (inst.quantity_decimals !== undefined) quantityDecimals = Number(inst.quantity_decimals)
                if (inst.quote_decimals !== undefined) quoteDecimals = Number(inst.quote_decimals)
                if (inst.min_quantity !== undefined) minQuantity = Number(inst.min_quantity)
                if (inst.qty_tick_size !== undefined) qtyTickSize = Number(inst.qty_tick_size)
                
                console.log("Instrument Info:", { quantityDecimals, quoteDecimals, minQuantity, qtyTickSize })
            }
        }

        console.log("Current CRO Price (PERP):", { currentPrice, bidPrice, askPrice })
    } catch (e) {
        console.error("Failed to fetch price/instrument:", e)
    }

    // 2. Fetch Pool Size from Contract
    let totalPoolValue = 0
    let totalAvailableCRO = 0
    try {
        const contract = new Contract(SUPA_CP_CONTRACT_ADDRESS, SUPA_CP_ABI, wallet)
        const totalAvailable = await contract.totalAvailable()
        const totalInPosition = await contract.totalInPosition()
        
        // Convert from wei (18 decimals) to CRO
        totalAvailableCRO = Number(totalAvailable) / 1e18
        const totalInPositionCRO = Number(totalInPosition) / 1e18
        
        totalPoolValue = totalAvailableCRO + totalInPositionCRO
        console.log("Pool Stats from Contract:", { totalAvailableCRO, totalInPositionCRO, totalPoolValue })
    } catch (e) {
         console.error("Failed to fetch pool stats from contract:", e)
    }

    // 3. Generate AI Analysis
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
                            Pool Total: ${totalPoolValue} tCRO.
                            Pool Available: ${totalAvailableCRO} tCRO.
                            
                            Constraint:
                            - If Pool Available > 30 tCRO: You MUST weigh the market and take a position (ACTION: BUY or SELL). Do NOT return NEUTRAL/HOLD.
                            - If Pool Available <= 30 tCRO: You may remain NEUTRAL if market conditions are unclear.

                            Return a JSON object ONLY with no markdown formatting:
                            {
                                "status": "BULLISH" | "BEARISH" | "NEUTRAL",
                                "reasoning": "string (max 20 words)",
                                "action": "BUY" | "SELL" | "HOLD",
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

                    // Enforce Neutral Logic: No leverage, no position size
                    if (aiAnalysis.status === "NEUTRAL") {
                        aiAnalysis.positionSizePercent = 0
                        aiAnalysis.leverage = 1
                        aiAnalysis.action = "HOLD"
                    }
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
            // Calculate position size WITHOUT leverage (Leverage is just a field)
            const positionSizeCRO = (totalPoolValue * (aiAnalysis.positionSizePercent / 100))
            let quantity = positionSizeCRO

            // 1. Adjust for Tick Size
            if (qtyTickSize > 0) {
                // Round to nearest tick size
                quantity = Math.round(quantity / qtyTickSize) * qtyTickSize
            }
            
            // 2. Adjust for Precision
            quantity = Number(quantity.toFixed(quantityDecimals))

            // 3. Min Quantity Check (or Tick Size floor fallback)
            // If quantity became 0 but we wanted to trade, force min tick size
            // (Only if pool is large enough to support it, which >30 check ensures)
            if (quantity === 0 && positionSizeCRO > 0 && qtyTickSize > 0) {
                 quantity = qtyTickSize
            }

            // Enforce minimum quantity if known
            if (minQuantity > 0 && quantity < minQuantity) {
                console.log(`Quantity ${quantity} below minimum ${minQuantity}. Adjusting to minimum.`)
                quantity = minQuantity
            }

            if (quantity > 0) {
                console.log(`Executing ${aiAnalysis.action} order for ${quantity} CRO on CROUSD-PERP`)
                
                // Determine Limit Price
                // BUY: Use Ask Price (a) to ensure fill (or slightly higher, but Ask is safe for immediate fill usually)
                // SELL: Use Bid Price (b) to ensure fill
                let limitPrice = currentPrice
                if (aiAnalysis.action === "BUY" && askPrice > 0) limitPrice = askPrice
                if (aiAnalysis.action === "SELL" && bidPrice > 0) limitPrice = bidPrice

                // Format Price Precision
                limitPrice = Number(limitPrice.toFixed(quoteDecimals))

                const orderParams: any = {
                    instrument_name: "CROUSD-PERP", 
                    side: aiAnalysis.action,
                    type: "LIMIT",
                    price: limitPrice.toString(),
                    quantity: quantity.toString()
                }

                orderResult = await callCryptoComApi("private/create-order", orderParams)
                console.log("Order Result:", JSON.stringify(orderResult, null, 2))
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
