import crypto from "crypto"

export function getCredentials() {
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

export function buildObjectString(obj: Record<string, unknown>): string {
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

export function buildSignaturePayload(body: {
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

export function signRequest(payload: string, apiSecret: string) {
  return crypto.createHmac("sha256", apiSecret).update(payload).digest("hex")
}

export async function callCryptoComApi(method: string, params: Record<string, unknown> = {}) {
  const credentials = getCredentials()
  if (!credentials) {
    throw new Error("Missing Crypto.com API credentials")
  }
  const { apiKey, apiSecret } = credentials

  const nonce = Date.now()
  const id = nonce
  
  const body = {
    id,
    method,
    api_key: apiKey,
    params,
    nonce,
  }

  const payload = buildSignaturePayload(body)
  const sig = signRequest(payload, apiSecret)

  const requestBody = {
    ...body,
    sig,
  }

  const response = await fetch("https://api.crypto.com/exchange/v1/private/" + method.replace("private/", ""), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })

  const data = await response.json()
  
  if (data.code !== 0) {
    throw new Error(`Crypto.com API Error: ${data.message || JSON.stringify(data)}`)
  }

  return data
}
