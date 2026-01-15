"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, Wallet } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

const CRONOS_CHAIN_ID_HEX = "0x152"

type ProposalStatus = "upcoming" | "ended"

type ProposalFilter = "all" | ProposalStatus

type Proposal = {
  id: string
  title: string
  description: string
  status: ProposalStatus
  yesVotes: number
  noVotes: number
  outcome: "pending" | "passed" | "failed"
  dateAdded: string
  docsUrl: string
}

const PROPOSALS: Proposal[] = [
  {
    id: "SP-01",
    title: "SP-01: Enable second trading lane",
    description:
      "Add a low-volatility basis trade lane for Absorber-focused capital with separate risk budget.",
    status: "upcoming",
    yesVotes: 128,
    noVotes: 12,
    outcome: "pending",
    dateAdded: "2025-01-10",
    docsUrl: "#",
  },
  {
    id: "SP-02",
    title: "SP-02: Tighten daily risk budget",
    description:
      "Reduce the daily risk budget to 2.0% of pool NAV while the AI model is retrained.",
    status: "upcoming",
    yesVotes: 94,
    noVotes: 22,
    outcome: "pending",
    dateAdded: "2025-01-14",
    docsUrl: "#",
  },
  {
    id: "SP-03",
    title: "SP-03: Introduce loyalty boosts",
    description:
      "Boost Absorber yield for depositors that remain in the pool across multiple epochs.",
    status: "upcoming",
    yesVotes: 76,
    noVotes: 9,
    outcome: "pending",
    dateAdded: "2025-01-18",
    docsUrl: "#",
  },
  {
    id: "SP-00",
    title: "SP-00: Launch initial pool parameters",
    description:
      "Set initial drawdown limits, daily risk budgets, and fee splits for the Supacron pool.",
    status: "ended",
    yesVotes: 310,
    noVotes: 4,
    outcome: "passed",
    dateAdded: "2024-12-01",
    docsUrl: "#",
  },
  {
    id: "SP-0X",
    title: "SP-0X: Enable governance MVP",
    description:
      "Deploy multisig governance with authority over risk parameters and trading lanes.",
    status: "ended",
    yesVotes: 145,
    noVotes: 96,
    outcome: "failed",
    dateAdded: "2024-12-10",
    docsUrl: "#",
  },
]

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

function SiteHeader() {
  const [account, setAccount] = useState<string | null>(null)
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false)

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

  const displayAccount =
    account && `${account.slice(0, 6)}...${account.slice(-4)}`

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200">
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
            className="text-sm font-medium text-slate-900 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 rounded-full px-2 py-1"
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
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 rounded-full px-2 py-1"
          >
            Portfolio
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {account ? (
            <div className="relative hidden md:inline-flex">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-slate-200 bg-white px-4 text-xs font-medium text-slate-900 shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-slate-50"
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
                      setAccount(null)
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
              className="hidden rounded-full border-slate-200 bg-white px-4 text-xs font-medium shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-slate-50 md:inline-flex"
              aria-label="Connect wallet"
              onClick={async () => {
                const addr = await connectWalletCronosEvm()
                if (addr) {
                  setAccount(addr)
                }
              }}
            >
              <Wallet className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Connect wallet
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="inline-flex rounded-full border-slate-200 bg-white px-3 text-xs font-medium shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-slate-50 md:hidden"
            aria-label="Open primary menu"
          >
            Menu
          </Button>
        </div>
      </div>
    </header>
  )
}

export default function GovernancePage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-slate-900">
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <GovernanceHero />
        <GovernanceGrid />
      </main>
    </div>
  )
}

function GovernanceHero() {
  return (
    <motion.section
      className="flex flex-col gap-6 border-b border-slate-200/80 pb-10 sm:flex-row sm:items-end sm:justify-between"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-xl">
        <Badge className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-800">
          Protocol governance
        </Badge>
        <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          On-chain risk rails for pooled AI trading.
        </h1>
        <p className="mt-4 text-balance text-sm leading-relaxed text-slate-600 sm:text-base">
          Governance steers the Supacron pool by setting drawdown limits,
          configuring circuit breakers, and defining how PnL waterfalls between
          Takers and Absorbers. This page summarizes the current parameters and
          ongoing changes.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:items-end">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-600">
          Snapshot
        </p>
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 sm:text-sm">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Governance mode
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              Multisig council
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Chain
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              Cronos EVM
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

function GovernanceGrid() {
  const [filter, setFilter] = useState<ProposalFilter>("upcoming")

  const filteredProposals =
    filter === "all"
      ? PROPOSALS
      : PROPOSALS.filter((proposal) => proposal.status === filter)

  return (
    <section className="mt-10 space-y-6">
      <Card className="border-slate-200 bg-white/90">
        <CardHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Proposals
            </CardTitle>
            <div className="inline-flex rounded-full bg-slate-100 p-0.5 text-[11px]">
              {(["all", "upcoming", "ended"] as ProposalFilter[]).map((value) => {
                const isActive = filter === value
                const label =
                  value === "all"
                    ? "All"
                    : value === "upcoming"
                    ? "Ongoing"
                    : "Ended"
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`rounded-full px-3 py-1 font-medium transition-colors ${
                      isActive
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                    aria-pressed={isActive}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 text-sm text-slate-600">
          {filteredProposals.map((proposal) => {
            const statusLabel =
              proposal.status === "upcoming"
                ? "Ongoing"
                : proposal.outcome === "passed"
                ? "Ended · Passed"
                : proposal.outcome === "failed"
                ? "Ended · Failed"
                : "Ended"
            const statusDotColor =
              proposal.status === "upcoming"
                ? "bg-slate-700"
                : proposal.outcome === "passed"
                ? "bg-emerald-500"
                : proposal.outcome === "failed"
                ? "bg-rose-500"
                : "bg-slate-500"
            return (
              <div
                key={proposal.id}
                className="space-y-1 rounded-lg bg-slate-50 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900">
                    {proposal.title}
                  </p>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700"
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${statusDotColor}`}
                    />
                    {statusLabel}
                  </span>
                </div>
                <p className="text-xs">{proposal.description}</p>
                {(() => {
                  const totalVotes = proposal.yesVotes + proposal.noVotes
                  const yesPercent =
                    totalVotes === 0
                      ? 0
                      : Math.round((proposal.yesVotes / totalVotes) * 100)
                  const noPercent = 100 - yesPercent
                  return (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <p className="font-medium text-emerald-700">
                          Yes {yesPercent}% ({proposal.yesVotes})
                        </p>
                        <p className="font-medium text-rose-700">
                          Against {noPercent}% ({proposal.noVotes})
                        </p>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="flex h-2 w-full">
                          <div
                            className="h-2 bg-emerald-500"
                            style={{ width: `${yesPercent}%` }}
                          />
                          <div
                            className="h-2 bg-rose-400"
                            style={{ width: `${noPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })()}
                <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
                  <p className="text-slate-500">
                    Ended on {proposal.dateAdded}
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-full border-slate-200 bg-white px-3 text-[11px] font-medium hover:bg-slate-50"
                    aria-label={`Open docs for ${proposal.id}`}
                  >
                    <a href={proposal.docsUrl}>
                      View proposal
                      <ArrowUpRight className="ml-1.5 h-3 w-3" aria-hidden="true" />
                    </a>
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </section>
  )
}
