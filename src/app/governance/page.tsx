"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, Wallet } from "lucide-react"
import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  formatUnits,
  type Eip1193Provider,
} from "ethers"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SUPA_ABI, SUPA_CONTRACT_ADDRESS } from "@/lib/smart-contract/supa"
import { supabase } from "@/lib/supabaseClient"

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

export const CRONOS_CHAIN_ID_HEX = "0x152"
export const RPC_PROVIDER = new JsonRpcProvider("https://evm-t3.cronos.org")

type ProposalStatus = "upcoming" | "ended"

type ProposalFilter = "all" | ProposalStatus

export type Proposal = {
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

export const PROPOSALS: Proposal[] = [
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
    docsUrl: "/governance/proposals/sp-01",
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
    docsUrl: "/governance/proposals/sp-02",
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
    docsUrl: "/governance/proposals/sp-03",
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
    docsUrl: "/governance/proposals/sp-00",
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
    docsUrl: "/governance/proposals/sp-0x",
  },
]

export type DbProposal = {
  id: string
  short_id: string
  title: string
  description: string
  status: ProposalStatus
  outcome: "pending" | "passed" | "failed"
  docs_url: string | null
  end_time: string | null
  quorum: number | null
  created_at: string
  yes_votes: number | null
  no_votes: number | null
  abstain_votes: number | null
}

export function formatProposalDate(value: string | null) {
  if (!value) {
    return null
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
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

export function formatTokenAmount(value: string) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return value
  }
  return numeric.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })
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

export function SiteHeader() {
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
      <FooterSection />
    </div>
  )
}

function GovernanceHero() {
  const [totalPower, setTotalPower] = useState<string | null>(null)
  const [isLoadingTotalPower, setIsLoadingTotalPower] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [yourPower, setYourPower] = useState<string | null>(null)
  const [isLoadingYourPower, setIsLoadingYourPower] = useState(false)
  const [isMintOpen, setIsMintOpen] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [mintError, setMintError] = useState<string | null>(null)
  const [mintToastMessage, setMintToastMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadTotalPower() {
      setIsLoadingTotalPower(true)
      try {
        const contract = new Contract(
          SUPA_CONTRACT_ADDRESS,
          SUPA_ABI,
          RPC_PROVIDER
        )
        const [supply, decimals] = await Promise.all([
          contract.totalSupply(),
          contract.decimals(),
        ])
        if (cancelled) {
          return
        }
        const formatted = formatUnits(supply, decimals)
        setTotalPower(formatTokenAmount(formatted))
      } catch {
        if (cancelled) {
          return
        }
        setTotalPower(null)
      } finally {
        if (cancelled) {
          return
        }
        setIsLoadingTotalPower(false)
      }
    }

    loadTotalPower()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function initAccount() {
      const existing = await getConnectedAccount()
      if (cancelled) {
        return
      }
      if (existing) {
        setAccount(existing)
      }
    }

    initAccount()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!account) {
      setYourPower(null)
      return
    }

    let cancelled = false

    async function loadYourPower() {
      setIsLoadingYourPower(true)
      try {
        const contract = new Contract(
          SUPA_CONTRACT_ADDRESS,
          SUPA_ABI,
          RPC_PROVIDER
        )
        const [balance, decimals] = await Promise.all([
          contract.balanceOf(account),
          contract.decimals(),
        ])
        if (cancelled) {
          return
        }
        const formatted = formatUnits(balance, decimals)
        setYourPower(formatTokenAmount(formatted))
      } catch {
        if (cancelled) {
          return
        }
        setYourPower(null)
      } finally {
        if (cancelled) {
          return
        }
        setIsLoadingYourPower(false)
      }
    }

    loadYourPower()

    return () => {
      cancelled = true
    }
  }, [account])

  async function handleMint() {
    if (typeof window === "undefined") {
      return
    }

    try {
      setMintError(null)
      setIsMinting(true)

      let activeAccount = account
      if (!activeAccount) {
        const addr = await connectWalletCronosEvm()
        if (!addr) {
          setIsMinting(false)
          return
        }
        activeAccount = addr
        setAccount(addr)
      }

      const provider = (window as { ethereum?: EthereumProvider }).ethereum
      if (!provider) {
        alert("MetaMask is not available in this browser.")
        setIsMinting(false)
        return
      }
      const browserProvider = new BrowserProvider(
        provider as unknown as Eip1193Provider
      )
      const signer = await browserProvider.getSigner()
      const contract = new Contract(SUPA_CONTRACT_ADDRESS, SUPA_ABI, signer)

      const tx = await contract.mint()
      await tx.wait()

      const [balance, decimals, supply] = await Promise.all([
        contract.balanceOf(activeAccount),
        contract.decimals(),
        contract.totalSupply(),
      ])

      const formattedBalance = formatTokenAmount(
        formatUnits(balance, decimals)
      )
      const formattedSupply = formatTokenAmount(formatUnits(supply, decimals))

      setYourPower(formattedBalance)
      setTotalPower(formattedSupply)
      setIsMintOpen(false)
      setMintToastMessage("You successfully minted SUPA on Cronos testnet.")
    } catch (error) {
      const rawMessage =
        error instanceof Error ? error.message : "Failed to mint SUPA."
      if (rawMessage.includes("Already minted")) {
        setMintError("Only can mint once")
      } else {
        setMintError("Failed to mint SUPA.")
      }
    } finally {
      setIsMinting(false)
    }
  }

  return (
    <>
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
          Voting Power
        </p>
        <div className="flex w-full justify-end">
          <div className="flex w-full max-w-xs flex-col items-start gap-3 text-xs text-slate-600 sm:items-end sm:text-sm">
          <p className="text-right text-[11px] text-slate-500 sm:text-xs">
              Want more influence on Supacron proposals? Mint SUPA to grow your
              voting power.
            </p>
            <Button
              size="sm"
              className="h-7 self-end rounded-full bg-slate-900 px-3 text-[11px] font-medium text-white shadow-sm hover:bg-slate-800"
              aria-label="Mint SUPA to increase your voting power"
              onClick={() => setIsMintOpen(true)}
            >
              Mint SUPA
              <ArrowUpRight className="ml-1.5 h-3 w-3" aria-hidden="true" />
            </Button>
            <div className="grid w-full grid-cols-2 gap-3 text-xs text-slate-600 sm:text-sm">
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Total power
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {isLoadingTotalPower
                    ? "Loading..."
                    : totalPower
                    ? `${totalPower} SUPA`
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Your power
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {account
                    ? isLoadingYourPower
                      ? "Loading..."
                      : yourPower
                      ? `${yourPower} SUPA`
                      : "0 SUPA"
                    : "Connect wallet"}
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>
        {isMintOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Mint SUPA
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Mint your initial SUPA allocation on Cronos testnet to
                  activate governance power.
                </p>
              </div>
              <button
                type="button"
                className="text-xs text-slate-500 hover:text-slate-700"
                onClick={() => {
                  if (!isMinting) {
                    setIsMintOpen(false)
                  }
                }}
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium text-slate-700">
                  Connected wallet
                </span>
                <span className="text-[11px] text-slate-500">
                  {account
                    ? `${account.slice(0, 6)}...${account.slice(-4)}`
                    : "Not connected"}
                </span>
              </div>
              {!account ? (
                <Button
                  size="sm"
                  className="mt-1 w-full rounded-full bg-slate-900 text-[11px] font-medium text-white shadow-sm hover:bg-slate-800"
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
              ) : null}
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  After minting
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Your SUPA balance and total governance power on this page will
                  update once the transaction confirms.
                </p>
              </div>
              {mintError ? (
                <p className="text-[11px] text-rose-600">{mintError}</p>
              ) : null}
            </div>
            <Button
              size="sm"
              className="mt-4 w-full rounded-full bg-slate-900 text-[11px] font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isMinting || !account}
              onClick={handleMint}
            >
              {isMinting ? "Minting..." : "Mint SUPA"}
            </Button>
          </div>
        </div>
        ) : null}
      </motion.section>
      {mintToastMessage ? (
        <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-xs items-start gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-[11px] shadow-lg">
          <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-semibold text-emerald-700">
            ✓
          </div>
          <div className="flex-1 space-y-1">
            <p className="font-semibold text-emerald-700">Mint successful</p>
            <p className="text-slate-600">{mintToastMessage}</p>
          </div>
          <button
            type="button"
            className="pointer-events-auto ml-3 text-[11px] text-slate-400 hover:text-slate-600"
            onClick={() => setMintToastMessage(null)}
          >
            Close
          </button>
        </div>
      ) : null}
    </>
  )
}

export function FooterSection() {
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

function GovernanceGrid() {
  const [proposals, setProposals] = useState<DbProposal[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ProposalFilter>("upcoming")

  useEffect(() => {
    let cancelled = false

    async function loadProposals() {
      setIsLoading(true)
      setLoadError(null)
      try {
        const { data, error } = await supabase
          .from("proposals")
          .select("*")
          .order("created_at", { ascending: false })

        if (cancelled) {
          return
        }

        if (error) {
          setLoadError("Failed to load proposals.")
          return
        }

        setProposals((data ?? []) as DbProposal[])
      } finally {
        if (cancelled) {
          return
        }
        setIsLoading(false)
      }
    }

    loadProposals()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredProposals =
    proposals === null
      ? []
      : filter === "all"
      ? proposals
      : proposals.filter((proposal) => proposal.status === filter)

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
          {isLoading ? (
            <p className="text-xs text-slate-500">Loading proposals...</p>
          ) : loadError ? (
            <p className="text-xs text-rose-600">{loadError}</p>
          ) : filteredProposals.length === 0 ? (
            <p className="text-xs text-slate-500">
              No proposals found. Create one to get started.
            </p>
          ) : (
            filteredProposals.map((proposal) => {
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

              const endTimeLabel = formatProposalDate(proposal.end_time)
              const createdAtLabel = formatProposalDate(proposal.created_at)
              const yesPower = Number(proposal.yes_votes ?? 0)
              const noPower = Number(proposal.no_votes ?? 0)
              const abstainPower = Number(proposal.abstain_votes ?? 0)
              const totalPower = yesPower + noPower + abstainPower
              const quorumValue = Number(proposal.quorum ?? 0)
              const hasQuorum =
                Number.isFinite(quorumValue) &&
                quorumValue > 0 &&
                totalPower >= quorumValue
              const quorumPercent =
                Number.isFinite(quorumValue) && quorumValue > 0
                  ? Math.min(
                      100,
                      Math.round((totalPower / quorumValue) * 100)
                    )
                  : 0

              return (
                <div
                  key={proposal.id}
                  className="space-y-1 rounded-lg bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wide text-white">
                        {proposal.short_id}
                      </span>
                      <p className="text-xs font-semibold text-slate-900">
                        {proposal.title}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${statusDotColor}`}
                      />
                      {statusLabel}
                    </span>
                  </div>
                  <p className="text-xs">{proposal.description}</p>
                  <div className="mt-2 grid gap-2 text-[11px] text-slate-500 sm:grid-cols-2">
                    <p>
                      {endTimeLabel
                        ? `Ends on ${endTimeLabel}`
                        : createdAtLabel
                        ? `Created on ${createdAtLabel}`
                        : null}
                    </p>
                    {proposal.quorum ? (
                      <p className="sm:text-right">
                        {hasQuorum ? "Quorum reached" : "Quorum progress"} ·{" "}
                        {quorumPercent}% (
                        {totalPower.toLocaleString("en-US")} /{" "}
                        {proposal.quorum.toString()})
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex flex-1 flex-col gap-1 text-[11px] text-slate-500">
                      {(() => {
                        const yes = yesPower
                        const no = noPower
                        const total = yes + no
                        if (total === 0) {
                          return <span>No votes yet</span>
                        }
                        const yesPercent = Math.round((yes / total) * 100)
                        const noPercent = 100 - yesPercent
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-emerald-700">
                                Yes {yesPercent}%
                              </span>
                              <span className="font-medium text-rose-700">
                                Against {noPercent}%
                              </span>
                            </div>
                            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
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
                          </>
                        )
                      })()}
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-full border-slate-200 bg-white px-3 text-[11px] font-medium hover:bg-slate-50"
                      aria-label={`Open details for ${proposal.short_id}`}
                    >
                      <Link
                        href={`/governance/proposals/${encodeURIComponent(
                          proposal.short_id
                        )}`}
                      >
                        View proposal
                        <ArrowUpRight
                          className="ml-1.5 h-3 w-3"
                          aria-hidden="true"
                        />
                      </Link>
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </section>
  )
}
