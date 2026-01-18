"use client"

import { Contract, JsonRpcProvider } from "ethers"

import {
  SUPA_CP_ABI,
  SUPA_CP_CONTRACT_ADDRESS,
} from "@/lib/smart-contract/supa"

export type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

export const CRONOS_CHAIN_ID_HEX = "0x152"

export const RPC_PROVIDER = new JsonRpcProvider("https://evm-t3.cronos.org")

export function getSupaPoolContract(provider: JsonRpcProvider) {
  return new Contract(SUPA_CP_CONTRACT_ADDRESS, SUPA_CP_ABI, provider)
}

export async function getConnectedAccount(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null
  }

  const provider = (window as { ethereum?: EthereumProvider }).ethereum

  if (!provider) {
    return null
  }

  const accounts = (await provider.request({
    method: "eth_accounts",
  })) as string[]

  const [first] = accounts
  return first ?? null
}

export async function connectWalletCronosEvm(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null
  }

  const provider = (window as { ethereum?: EthereumProvider }).ethereum

  if (!provider) {
    alert("MetaMask is not available in this browser.")
    return null
  }

  let accounts: string[] = []

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CRONOS_CHAIN_ID_HEX }],
    })
  } catch (switchError: unknown) {
    const errorWithCode = switchError as { code?: number }
    if (errorWithCode && errorWithCode.code === 4902) {
      try {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: CRONOS_CHAIN_ID_HEX,
              chainName: "Cronos testnet",
              nativeCurrency: {
                name: "Cronos Testnet",
                symbol: "tCRO",
                decimals: 18,
              },
              rpcUrls: ["https://evm-t3.cronos.org"],
              blockExplorerUrls: ["https://testnet.cronoscan.com"],
            },
          ],
        })
      } catch (addError: unknown) {
        const message =
          addError instanceof Error ? addError.message : "Unknown error"
        alert(`Failed to add Cronos testnet: ${message}`)
        return null
      }
    } else {
      const message =
        errorWithCode && typeof errorWithCode.code === "number"
          ? `Error code ${errorWithCode.code}`
          : "Unknown error"
      alert(`Failed to switch to Cronos testnet: ${message}`)
      return null
    }
  }

  try {
    const chainId = (await provider.request({
      method: "eth_chainId",
    })) as string
    if (chainId.toLowerCase() !== CRONOS_CHAIN_ID_HEX.toLowerCase()) {
      alert("Please switch MetaMask to Cronos testnet (chainId 338).")
      return null
    }

    accounts = (await provider.request({
      method: "eth_requestAccounts",
    })) as string[]
  } catch (requestError: unknown) {
    const message =
      requestError instanceof Error ? requestError.message : "Unknown error"
    alert(`Failed to connect wallet: ${message}`)
    return null
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CRONOS_CHAIN_ID_HEX }],
    })
  } catch {
    return null
  }
  const [firstAccount] = accounts
  return firstAccount ?? null
}

