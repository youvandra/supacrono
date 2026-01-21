import { NextResponse } from "next/server"
import crypto from "crypto"

const API_URL = process.env.CRYPTOCOM_API_URL || "https://api.crypto.com/exchange/v1/private/get-positions"
const INSTRUMENT = "CROUSD-PERP"

function getCredentials() {
  const apiKey = process.env.CRYPTOCOM_API_KEY
  const apiSecret = process.env.CRYPTOCOM_API_SECRET

  if (!apiKey || !apiSecret) {
    return null
  }

  return { apiKey, apiSecret }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" && value !== null && !Array.isArray(value)
  )
}

function buildArrayString(values: unknown[]): string {
  let result = ""

  for (const value of values) {
    if (value === undefined || value === null) {
      continue
    }
    if (Array.isArray(value)) {
      result += buildArrayString(value)
    } else if (isPlainObject(value)) {
      result += buildObjectString(value)
    } else {
      result += String(value)
    }
  }

  return result
}

function buildObjectString(obj: Record<string, unknown>): string {
  const keys = Object.keys(obj).sort()
  let result = ""

  for (const key of keys) {
    const value = obj[key]
    if (value === undefined || value === null) {
      continue
    }
    if (Array.isArray(value)) {
      result += key + buildArrayString(value)
    } else if (isPlainObject(value)) {
      result += key + buildObjectString(value)
    } else {
      result += key + String(value)
    }
  }

  return result
}

function buildSignaturePayload(body: {
  id: number
  method: string
  api_key: string
  nonce: number
  params: Record<string, unknown>
}) {
  const paramsString = buildObjectString(body.params)

  const payload =
    body.method +
    String(body.id) +
    body.api_key +
    paramsString +
    String(body.nonce)

  return payload
}

function signRequest(payload: string, apiSecret: string) {
  return crypto.createHmac("sha256", apiSecret).update(payload).digest("hex")
}

type PositionsResult = {
  data?: Array<Record<string, unknown>>
  [key: string]: unknown
}

type PositionsResponse = {
  result?: PositionsResult
  [key: string]: unknown
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === "string") {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : null
  }
  return null
}

function extractActivePosition(result: PositionsResult | undefined) {
  if (!result) {
    return null
  }

  const data = result.data
  if (!Array.isArray(data)) {
    return null
  }

  const matching = data.filter((entry) => {
    if (!entry || typeof entry !== "object") {
      return false
    }
    const instrumentName = (entry as Record<string, unknown>).instrument_name
    return instrumentName === INSTRUMENT
  })

  if (matching.length === 0) {
    return null
  }

  const [firstRaw] = matching
  const first = firstRaw as Record<string, unknown>

  const quantity = parseNumber(first.quantity)
  const cost = parseNumber(first.cost)
  const openCost = parseNumber(first.open_pos_cost)
  const pnl = parseNumber(first.open_position_pnl)
  const type =
    typeof first.type === "string" ? (first.type as string) : null
  const isolationType =
    typeof first.isolation_type === "string"
      ? (first.isolation_type as string)
      : null

  let side: string | null = null
  if (quantity !== null) {
    if (quantity > 0) {
      side = "LONG"
    } else if (quantity < 0) {
      side = "SHORT"
    } else {
      side = "FLAT"
    }
  }

  const notional =
    quantity !== null && cost !== null ? Math.abs(cost) : null

  const entryPrice =
    quantity !== null &&
    quantity !== 0 &&
    openCost !== null
      ? Math.abs(openCost / quantity)
      : null

  return {
    instrument: INSTRUMENT,
    quantity,
    side,
    notional,
    pnl,
    type,
    isolationType,
    entryPrice,
  }
}

export async function GET() {
  const credentials = getCredentials()

  if (!credentials) {
    return NextResponse.json(
      { error: "Missing Crypto.com API credentials" },
      { status: 500 }
    )
  }

  const { apiKey, apiSecret } = credentials
  console.log(`Fetching positions from ${API_URL} using API Key: ${apiKey.substring(0, 4)}...`)

  const id = Date.now()
  const nonce = Date.now()
  const params: Record<string, unknown> = {}

  const requestBody = {
    id,
    method: "private/get-positions",
    api_key: apiKey,
    params,
    nonce,
  }

  const payload = buildSignaturePayload(requestBody)
  const sig = signRequest(payload, apiSecret)

  const bodyWithSig = {
    ...requestBody,
    sig,
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyWithSig),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Crypto.com API Error:", response.status, errorText)
      
      let errorMessage = "Failed to fetch positions"
      if (response.status === 401) {
        errorMessage = "Authentication failed. Check API keys and IP whitelisting."
      } else if (response.status === 403) {
        errorMessage = "Access forbidden. IP might not be whitelisted."
      }

      return NextResponse.json(
        { 
          error: errorMessage, 
          details: errorText,
          upstreamStatus: response.status 
        },
        { status: 502 }
      )
    }

    const data = (await response.json()) as PositionsResponse
    const position = extractActivePosition(data.result)

    return NextResponse.json({ position })
  } catch {
    return NextResponse.json(
      { error: "Unexpected error fetching positions" },
      { status: 500 }
    )
  }
}
