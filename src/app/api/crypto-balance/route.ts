import { NextResponse } from "next/server"
import crypto from "crypto"

const API_URL = "https://api.crypto.com/exchange/v1/private/user-balance"

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

type UserBalanceResult = {
  data?: Array<Record<string, unknown>>
  [key: string]: unknown
}

type UserBalanceResponse = {
  result?: UserBalanceResult
  [key: string]: unknown
}

function extractTotalUsdValue(result: UserBalanceResult | undefined) {
  if (!result) {
    return null
  }

  const directTotals: number[] = []

  for (const key of [
    "total_equity",
    "total_margin_balance",
    "total_cash_balance",
  ]) {
    const value = (result as Record<string, unknown>)[key]
    if (typeof value === "number") {
      directTotals.push(value)
    } else if (typeof value === "string") {
      const numeric = Number(value)
      if (Number.isFinite(numeric)) {
        directTotals.push(numeric)
      }
    }
  }

  if (directTotals.length > 0) {
    return directTotals.reduce((acc, value) => acc + value, 0)
  }

  const data = result.data
  if (!Array.isArray(data)) {
    return null
  }

  const stableTickers = new Set(["USD", "USD_Stable_Coin", "USDT"])
  let total = 0
  let found = false

  for (const entry of data) {
    const name = (entry as Record<string, unknown>).instrument_name
    if (typeof name !== "string") {
      continue
    }
    if (!stableTickers.has(name)) {
      continue
    }

    const fields = [
      "total_cash_balance",
      "total_margin_balance",
      "equity",
      "total_equity",
    ]

    for (const field of fields) {
      const raw = (entry as Record<string, unknown>)[field]
      if (typeof raw === "number") {
        total += raw
        found = true
        break
      }
      if (typeof raw === "string") {
        const numeric = Number(raw)
        if (Number.isFinite(numeric)) {
          total += numeric
          found = true
          break
        }
      }
    }
  }

  if (!found) {
    return null
  }

  return total
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
  const id = Date.now()
  const nonce = Date.now()
  const params: Record<string, unknown> = {}

  const requestBody = {
    id,
    method: "private/user-balance",
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
      return NextResponse.json(
        { error: "Failed to fetch user balance" },
        { status: 502 }
      )
    }

    const data = (await response.json()) as UserBalanceResponse
    const totalUsdValue = extractTotalUsdValue(data.result)

    return NextResponse.json({ totalUsdValue })
  } catch {
    return NextResponse.json(
      { error: "Unexpected error fetching user balance" },
      { status: 500 }
    )
  }
}
