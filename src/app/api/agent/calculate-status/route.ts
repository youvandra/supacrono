import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('Missing OPENROUTER_API_KEY environment variable')
    }

    // Initialize OpenAI client for OpenRouter inside handler to ensure env var is present
    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    })

    const body = await req.json()
    const { totalAvailable, totalInPosition, profitPool, lossPool, absorberYieldBps } = body

    // Fetch simple market data (CRO price) - optional but adds context
    let marketPrice = "Unknown"
    try {
        const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=crypto-com-chain&vs_currencies=usd')
        const priceData = await priceRes.json()
        if (priceData['crypto-com-chain']?.usd) {
            marketPrice = `$${priceData['crypto-com-chain'].usd}`
        }
    } catch (e) {
        console.warn("Failed to fetch market price", e)
    }

    const prompt = `
      You are an AI Trading Agent for the SupaCapitalPool (SupaCron) on Cronos chain.
      
      Current Pool State:
      - Total Available Liquidity: ${totalAvailable} tCRO
      - Total In Position: ${totalInPosition} tCRO
      - Profit Pool: ${profitPool} tCRO
      - Loss Pool: ${lossPool} tCRO
      - Absorber Yield: ${absorberYieldBps} BPS
      - Current Market Price (CRO): ${marketPrice}
      
      Based on this data, analyze the market conditions and generate a new trading status.
      The status should include:
      1. Current Bias (e.g., Bullish, Bearish, Neutral)
      2. Position Size (e.g., "Medium (45%)", "High (80%)")
      3. Risk Budget (e.g., "Conservative (2%)")
      4. Leverage (e.g., "1.5x", "2x", "No leverage")
      5. Reasoning (A short paragraph explaining why, referencing the pool metrics)

      Return the result in strictly valid JSON format like this:
      {
        "current_bias": "...",
        "current_bias_desc": "...",
        "position_size": "...",
        "position_size_desc": "...",
        "risk_budget": "...",
        "risk_budget_desc": "...",
        "leverage": "...",
        "leverage_desc": "...",
        "reasoning": "..."
      }
    `

    const completion = await openai.chat.completions.create({
      model: "google/gemini-2.0-flash-001", // Cheap/free model
      messages: [
        { role: "system", content: "You are a professional crypto trading AI. Return valid JSON only." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error("No content received from AI")

    const result = JSON.parse(content)

    // Insert into Supabase
    const { error } = await supabase
      .from('ai_trading_status')
      .insert([
        {
          current_bias: result.current_bias,
          current_bias_desc: result.current_bias_desc,
          position_size: result.position_size,
          position_size_desc: result.position_size_desc,
          risk_budget: result.risk_budget,
          risk_budget_desc: result.risk_budget_desc,
          leverage: result.leverage,
          leverage_desc: result.leverage_desc,
          reasoning: result.reasoning
        }
      ])

    if (error) throw error

    return NextResponse.json({ success: true, data: result })
  } catch (error: unknown) {
    console.error('Agent calculation failed:', error)
    
    let message = 'Unknown error'
    if (error instanceof Error) {
      message = error.message
    } else if (typeof error === 'object' && error !== null) {
      try {
        message = JSON.stringify(error)
      } catch {
        message = 'Unknown error object'
      }
    } else if (typeof error === 'string') {
      message = error
    }

    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
