"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Wallet } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ActivitySection,
  PerformanceAndRiskSection,
  PortfolioOverviewSection,
  RoleBreakdownSection,
} from "./components/portfolio-sections"

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

const CRONOS_CHAIN_ID_HEX = "0x152"

async function connectWalletCronosEvm(): Promise<string | null> {
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

type SiteHeaderProps = {
  account: string | null
  onConnect: () => void | Promise<void>
  onDisconnect: () => void
}

function SiteHeader({ account, onConnect, onDisconnect }: SiteHeaderProps) {
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false)

  const displayAccount =
    account && `${account.slice(0, 6)}...${account.slice(-4)}`

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white shadow-sm">
            S
          </div>
          <span className="text-base font-semibold tracking-tight text-slate-900">
            Supacron
          </span>
        </Link>

        <nav
          className="hidden items-center gap-8 text-sm text-slate-600 md:flex"
          aria-label="Primary"
        >
          <a
            href="/governance"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 rounded-full px-2 py-1"
          >
            Governance
          </a>
          <a
            href="/pool"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 rounded-full px-2 py-1"
          >
            Pool
          </a>
          <a
            href="/portfolio"
            className="text-sm font-medium text-slate-900 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 rounded-full px-2 py-1"
          >
            Portfolio
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {account ? (
            <div className="relative inline-flex">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-slate-200 bg-white px-4 text-xs font-medium text-slate-900 shadow-sm hover:bg-slate-50"
                aria-label="Connected wallet"
                onClick={() => setIsWalletMenuOpen((open) => !open)}
              >
                <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500" />
                {displayAccount}
              </Button>
              {isWalletMenuOpen ? (
                <div className="absolute right-0 top-full z-30 mt-2 w-40 rounded-lg border border-slate-200 bg-white py-1 text-xs shadow-lg">
                  <button
                    type="button"
                    className="flex w-full items-center px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      onDisconnect()
                      setIsWalletMenuOpen(false)
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-slate-200 bg-white px-4 text-xs font-medium text-slate-900 hover:bg-slate-50"
              onClick={async () => {
                await onConnect()
              }}
            >
              <Wallet className="mr-2 h-4 w-4" aria-hidden="true" />
              Connect wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

export default function PortfolioPage() {
  const [account, setAccount] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    const provider = (window as { ethereum?: EthereumProvider }).ethereum
    if (!provider) {
      return
    }
    provider
      .request({ method: "eth_accounts" })
      .then((result) => {
        const accounts = result as string[]
        const [first] = accounts
        if (first) {
          setAccount(first)
        }
      })
      .catch(() => {})
  }, [])

  const isConnected = !!account

  const handleConnect = async () => {
    const addr = await connectWalletCronosEvm()
    if (addr) {
      setAccount(addr)
    }
  }

  const handleDisconnect = () => {
    setAccount(null)
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-slate-900">
      <SiteHeader
        account={account}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />
      {isConnected ? (
        <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
          <PortfolioOverviewSection account={account} />
          <RoleBreakdownSection account={account} />
          <PerformanceAndRiskSection />
          <ActivitySection />
        </main>
      ) : (
        <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col items-center justify-center px-4 pb-16 pt-10 text-center sm:px-6 lg:px-8">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-md space-y-4"
          >
            <Badge className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-800">
              Wallet required
            </Badge>
            <h1 className="text-balance text-2xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-3xl">
              Connect your wallet to see your Supacron portfolio.
            </h1>
            <p className="text-sm leading-relaxed text-slate-600">
              Link a Cronos EVM wallet to view your Taker and Absorber balances,
              yield, and risk metrics in one place.
            </p>
            <div className="mt-4 flex justify-center">
              <Button
                size="sm"
                className="inline-flex items-center rounded-full bg-slate-900 px-4 text-xs font-medium text-white shadow-sm hover:bg-slate-800"
                onClick={handleConnect}
              >
                <Wallet className="mr-2 h-4 w-4" aria-hidden="true" />
                Connect wallet
              </Button>
            </div>
          </motion.section>
        </main>
      )}
      <FooterSection />
    </div>
  )
}

function FooterSection() {
  return (
    <footer className="border-t border-slate-200 bg-white/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
            S
          </div>
          <span className="text-sm font-semibold text-slate-900">
            Supacron
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span>© {new Date().getFullYear()} Supacron. All rights reserved.</span>
          <div className="flex items-center gap-3">
            <a
              href="/governance"
              className="transition-colors hover:text-slate-900"
            >
              Governance
            </a>
            <a href="/pool" className="transition-colors hover:text-slate-900">
              Pool
            </a>
            <a
              href="/portfolio"
              className="transition-colors hover:text-slate-900"
            >
              Portfolio
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

