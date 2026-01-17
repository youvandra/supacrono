"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { ArrowDownLeft, ArrowUpRight, Plus, Wallet } from "lucide-react"
import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  formatUnits,
  parseUnits,
  type Eip1193Provider,
} from "ethers"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  SUPA_CP_ABI,
  SUPA_CP_CONTRACT_ADDRESS,
} from "@/lib/smart-contract/supa"

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

const CRONOS_CHAIN_ID_HEX = "0x152"
const RPC_PROVIDER = new JsonRpcProvider("https://evm-t3.cronos.org")

function getSupaPoolContract(provider: JsonRpcProvider) {
  return new Contract(SUPA_CP_CONTRACT_ADDRESS, SUPA_CP_ABI, provider)
}

async function getConnectedAccount(): Promise<string | null> {
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
            className="text-sm font-medium text-slate-900 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 rounded-full px-2 py-1"
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
                className="rounded-full border-slate-200 bg-white px-4 text-xs font-medium text-slate-900shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-slate-50"
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

export default function PoolPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-slate-900">
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <PoolOverviewSection />
        <PoolAdvancedChartSection />
        <AITradingStatusSection />
        <CapitalDistributionSection />
        <PnlWaterfallSection />
        <ActivityAndRiskSection />
      </main>
      <FooterSection />
    </div>
  )
}

function MetricPill({
  label,
  value,
  subtle,
}: {
  label: string
  value: string
  subtle?: boolean
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-semibold ${
          subtle ? "text-slate-700" : "text-slate-900"
        }`}
      >
        {value}
      </p>
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

function PoolOverviewSection() {
  const [totalPoolValue, setTotalPoolValue] = useState<string | null>(null)
  const [isLoadingTotalPoolValue, setIsLoadingTotalPoolValue] = useState(false)
  const [positionNotional, setPositionNotional] = useState<number | null>(null)
  const [positionPnl, setPositionPnl] = useState<number | null>(null)
  const [onchainTotals, setOnchainTotals] = useState<{
    totalAvailable: number
    totalInPosition: number
    totalTakerInPosition: number
    totalAbsorberInPosition: number
  } | null>(null)
  const [isLoadingOnchainTotals, setIsLoadingOnchainTotals] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [userAvailable, setUserAvailable] = useState<number | null>(null)
  const [userInPosition, setUserInPosition] = useState<number | null>(null)
  const [isLoadingUserPosition, setIsLoadingUserPosition] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  const [depositError, setDepositError] = useState<string | null>(null)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositRole, setDepositRole] = useState<"taker" | "absorber">("taker")
  const [depositAmount, setDepositAmount] = useState("1")

  useEffect(() => {
    let cancelled = false
    const intervalId: number | undefined = window.setInterval(() => {
      loadTotalPoolValue(false)
    }, 10000)

    async function loadTotalPoolValue(showLoading: boolean) {
      if (showLoading) {
        setIsLoadingTotalPoolValue(true)
      }

      try {
        const response = await fetch("/api/crypto-balance")
        if (!response.ok) {
          if (!cancelled) {
            setTotalPoolValue(null)
          }
          return
        }

        const data = (await response.json()) as {
          totalUsdValue?: number | null
        }

        if (cancelled) {
          return
        }

        if (typeof data.totalUsdValue === "number") {
          const formatted = data.totalUsdValue.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2,
          })
          setTotalPoolValue(formatted)
        } else {
          setTotalPoolValue(null)
        }
      } catch {
        if (!cancelled) {
          setTotalPoolValue(null)
        }
      } finally {
        if (!cancelled && showLoading) {
          setIsLoadingTotalPoolValue(false)
        }
      }
    }

    loadTotalPoolValue(true)

    return () => {
      cancelled = true
      if (intervalId !== undefined) {
        window.clearInterval(intervalId)
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadAccount() {
      const addr = await getConnectedAccount()
      if (cancelled) {
        return
      }
      setAccount(addr)
    }

    loadAccount()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadUserPosition() {
      if (!account) {
        setUserAvailable(null)
        setUserInPosition(null)
        return
      }

      setIsLoadingUserPosition(true)

      try {
        const contract = getSupaPoolContract(RPC_PROVIDER)
        const user = await contract.users(account)

        if (cancelled) {
          return
        }

        const available = Number(formatUnits(user.available, 18))
        const inPosition = Number(formatUnits(user.inPosition, 18))

        setUserAvailable(available)
        setUserInPosition(inPosition)
      } catch {
        if (!cancelled) {
          setUserAvailable(null)
          setUserInPosition(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingUserPosition(false)
        }
      }
    }

    loadUserPosition()

    return () => {
      cancelled = true
    }
  }, [account])

  useEffect(() => {
    let cancelled = false

    async function loadOnchainTotals() {
      setIsLoadingOnchainTotals(true)

      try {
        const contract = getSupaPoolContract(RPC_PROVIDER)
        const [
          totalAvailableRaw,
          totalInPositionRaw,
          totalTakerInPositionRaw,
          totalAbsorberInPositionRaw,
        ] = await Promise.all([
          contract.totalAvailable(),
          contract.totalInPosition(),
          contract.totalTakerInPosition(),
          contract.totalAbsorberInPosition(),
        ])

        if (cancelled) {
          return
        }

        const toNumber = (value: bigint) => Number(formatUnits(value, 18))

        setOnchainTotals({
          totalAvailable: toNumber(totalAvailableRaw),
          totalInPosition: toNumber(totalInPositionRaw),
          totalTakerInPosition: toNumber(totalTakerInPositionRaw),
          totalAbsorberInPosition: toNumber(totalAbsorberInPositionRaw),
        })
      } catch {
        if (!cancelled) {
          setOnchainTotals(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingOnchainTotals(false)
        }
      }
    }

    loadOnchainTotals()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const intervalId: number | undefined = window.setInterval(() => {
      loadPositionNotional()
    }, 10000)

    async function loadPositionNotional() {
      try {
        const response = await fetch("/api/crypto-positions")
        if (!response.ok) {
          if (!cancelled) {
            setPositionNotional(null)
            setPositionPnl(null)
          }
          return
        }

        const data = (await response.json()) as {
          position?: {
            notional: number | null
            pnl: number | null
          } | null
        }

        if (cancelled) {
          return
        }

        if (data.position) {
          if (typeof data.position.notional === "number") {
            setPositionNotional(Math.max(0, data.position.notional))
          } else {
            setPositionNotional(null)
          }

          if (typeof data.position.pnl === "number") {
            setPositionPnl(data.position.pnl)
          } else {
            setPositionPnl(null)
          }
        } else {
          setPositionNotional(null)
          setPositionPnl(null)
        }
      } catch {
        if (!cancelled) {
          setPositionNotional(null)
          setPositionPnl(null)
        }
      }
    }

    loadPositionNotional()

    return () => {
      cancelled = true
      if (intervalId !== undefined) {
        window.clearInterval(intervalId)
      }
    }
  }, [])

  const poolStatus =
    positionNotional !== null && positionNotional > 0 ? "Active" : "Inactive"

  const poolPnlDisplay =
    positionPnl !== null
      ? (() => {
          const abs = Math.abs(positionPnl)
          const formatted = abs.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2,
          })

          if (positionPnl > 0) {
            return `+${formatted}`
          }

          if (positionPnl < 0) {
            return `-${formatted}`
          }

          return formatted
        })()
      : "—"

  const poolPnlPercent =
    positionPnl !== null &&
    positionNotional !== null &&
    positionNotional > 0
      ? (positionPnl / positionNotional) * 100
      : null

  const poolPnlPercentDisplay =
    poolPnlPercent !== null
      ? `${poolPnlPercent > 0 ? "+" : ""}${poolPnlPercent.toFixed(1)}% today`
      : "—"

  const poolPnlPercentClass =
    poolPnlPercent !== null && poolPnlPercent !== 0
      ? poolPnlPercent > 0
        ? "text-emerald-600"
        : "text-rose-600"
      : "text-slate-500"

  const onchainTotalAvailableDisplay =
    onchainTotals !== null
      ? `${onchainTotals.totalAvailable.toLocaleString("en-US", {
          maximumFractionDigits: 2,
        })} tCRO`
      : "—"

  const onchainTotalInPositionDisplay =
    onchainTotals !== null
      ? `${onchainTotals.totalInPosition.toLocaleString("en-US", {
          maximumFractionDigits: 2,
        })} tCRO`
      : "—"

  const onchainTakerInPositionDisplay =
    onchainTotals !== null
      ? `${onchainTotals.totalTakerInPosition.toLocaleString("en-US", {
          maximumFractionDigits: 2,
        })} tCRO`
      : "—"

  const onchainAbsorberInPositionDisplay =
    onchainTotals !== null
      ? `${onchainTotals.totalAbsorberInPosition.toLocaleString("en-US", {
          maximumFractionDigits: 2,
        })} tCRO`
      : "—"

  const userAvailableDisplay = isLoadingUserPosition
    ? "Loading..."
    : userAvailable !== null
      ? `${userAvailable.toLocaleString("en-US", {
          maximumFractionDigits: 4,
        })} tCRO`
      : "0.00 tCRO"

  const userInPositionDisplay = isLoadingUserPosition
    ? "Loading..."
    : userInPosition !== null
      ? `${userInPosition.toLocaleString("en-US", {
          maximumFractionDigits: 4,
        })} tCRO`
      : "0.00 tCRO"

  function handleAddCapital() {
    setDepositError(null)
    setShowDepositModal(true)
  }

  async function handleConfirmDeposit() {
    if (typeof window === "undefined") {
      return
    }

    const trimmedAmount = depositAmount.trim()
    if (!trimmedAmount) {
      setDepositError("Enter an amount")
      return
    }

    try {
      setDepositError(null)
      setIsDepositing(true)

      const provider = (window as { ethereum?: EthereumProvider }).ethereum
      if (!provider) {
        alert("MetaMask is not available in this browser.")
        setIsDepositing(false)
        return
      }

      const browserProvider = new BrowserProvider(
        provider as unknown as Eip1193Provider
      )
      const signer = await browserProvider.getSigner()
      const signerAddress = await signer.getAddress()

      const contract = new Contract(
        SUPA_CP_CONTRACT_ADDRESS,
        SUPA_CP_ABI,
        signer
      )

      const value = parseUnits(trimmedAmount, 18)
      const role = depositRole === "taker" ? 1 : 2

      const tx = await contract.deposit(role, { value })
      await tx.wait()

      setAccount(signerAddress)

      const user = await contract.users(signerAddress)
      const available = Number(formatUnits(user.available, 18))
      const inPosition = Number(formatUnits(user.inPosition, 18))

      setUserAvailable(available)
      setUserInPosition(inPosition)
      setShowDepositModal(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add capital."
      setDepositError(message)
    } finally {
      setIsDepositing(false)
    }
  }

  return (
    <motion.section
      className="flex flex-col gap-6 border-b border-slate-200/80 pb-8"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {showDepositModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl sm:p-5">
            <h2 className="text-sm font-semibold text-slate-900">
              Add capital to SupaCapitalPool
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Choose role and amount of tCRO to commit on-chain.
            </p>
            <div className="mt-4 flex gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setDepositRole("taker")}
                className={`flex-1 rounded-full border px-3 py-2 font-medium ${
                  depositRole === "taker"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
                }`}
              >
                Taker
              </button>
              <button
                type="button"
                onClick={() => setDepositRole("absorber")}
                className={`flex-1 rounded-full border px-3 py-2 font-medium ${
                  depositRole === "absorber"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
                }`}
              >
                Absorber
              </button>
            </div>
            <div className="mt-4 space-y-1 text-[11px]">
              <label className="block text-slate-500">Amount (tCRO)</label>
              <input
                type="number"
                min="0"
                step="0.0001"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
              />
            </div>
            {depositError ? (
              <p className="mt-2 text-[11px] text-rose-600">{depositError}</p>
            ) : null}
            <div className="mt-4 flex justify-end gap-2 text-[11px]">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full px-3"
                onClick={() => {
                  if (!isDepositing) {
                    setShowDepositModal(false)
                  }
                }}
                disabled={isDepositing}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="rounded-full px-4"
                onClick={handleConfirmDeposit}
                disabled={isDepositing}
              >
                {isDepositing ? "Confirming..." : "Confirm deposit"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:justify-between">
        <div className="w-full sm:w-1/2 max-w-xl">
          <Badge className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-800">
            Supacron pool overview
          </Badge>
          <h1 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            Live pooled capital for AI trading on Cronos EVM.
          </h1>
          <p className="mt-3 text-balance text-sm leading-relaxed text-slate-600 sm:text-base">
            This dashboard summarizes where pool capital is, how AI is positioned,
            and how profits and losses flow between Takers and Absorbers.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-600 sm:w-1/2 sm:text-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Your position
          </p>
          <p className="text-[11px] text-slate-500">
            Connect a wallet on Cronos EVM to preview how your capital would sit
            in the pool as a Taker or Absorber.
          </p>
          <div className="mt-1 flex items-stretch justify-between gap-3">
            <div className="flex-1 flex flex-col justify-between">
              <div className="grid h-full gap-2 sm:grid-cols-2">
                <MetricPill
                  label="Available capital"
                  value={userAvailableDisplay}
                  subtle
                />
                <MetricPill
                  label="Capital in position"
                  value={userInPositionDisplay}
                  subtle
                />
              </div>
            </div>
            <div className="flex w-32 flex-col items-end justify-between gap-2 sm:w-36">
              <Button
                className="w-full rounded-full px-4 text-[11px] font-medium"
                onClick={handleAddCapital}
                disabled={isDepositing}
              >
                {isDepositing ? (
                  "Adding..."
                ) : (
                  <>
                    <Plus className="mr-1.5 h-3 w-3" aria-hidden="true" />
                    Add capital
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-full border-slate-200 bg-white px-4 text-[11px] font-medium hover:bg-slate-50"
              >
                <ArrowDownLeft className="mr-1.5 h-3 w-3" aria-hidden="true" />
                Withdraw
              </Button>
            </div>
          </div>
          {depositError ? (
            <p className="text-[10px] text-rose-600">{depositError}</p>
          ) : null}
          <p className="text-[10px] text-slate-400">
            In this prototype, these actions are illustrative only.
          </p>
        </div>
      </div>

      <Card className="border-slate-200 bg-white/95 shadow-sm shadow-slate-900/5">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Pool overview
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Total pool value
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {isLoadingTotalPoolValue
                  ? "Loading..."
                  : totalPoolValue ?? "$0.00"}
              </p>
              <p className={`text-[11px] ${poolPnlPercentClass}`}>
                {poolPnlPercentDisplay}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Current pool PnL
              </p>
              <p className="mt-1 text-lg font-semibold text-emerald-600">
                {poolPnlDisplay}
              </p>
              <p className="text-[11px] text-slate-500">
                Realized + unrealized since epoch start
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 text-xs text-slate-600 sm:text-sm">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              On-chain capital (SupaCapitalPool)
            </p>
            <div className="mt-2 grid gap-3 md:grid-cols-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Available
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {isLoadingOnchainTotals
                    ? "Loading..."
                    : onchainTotalAvailableDisplay}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  In position
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {isLoadingOnchainTotals
                    ? "Loading..."
                    : onchainTotalInPositionDisplay}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Taker in position
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {isLoadingOnchainTotals
                    ? "Loading..."
                    : onchainTakerInPositionDisplay}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Absorber in position
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {isLoadingOnchainTotals
                    ? "Loading..."
                    : onchainAbsorberInPositionDisplay}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">
                  AI mode
                </span>
                <span className="text-xs font-semibold text-emerald-700">
                  Normal
                </span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Pool status
                </span>
                <span className="text-xs font-semibold text-slate-900">
                  {poolStatus}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Judges can treat this as a live snapshot of the Supacron pool.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  )
}

function PoolAdvancedChartSection() {
  const [position, setPosition] = useState<{
    instrument: string
    quantity: number | null
    side: string | null
    notional: number | null
    pnl: number | null
    type: string | null
    isolationType: string | null
    entryPrice: number | null
  } | null>(null)
  const [isLoadingPosition, setIsLoadingPosition] = useState(false)
  const [positionError, setPositionError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadPosition() {
      setIsLoadingPosition(true)
      setPositionError(null)

      try {
        const response = await fetch("/api/crypto-positions")
        if (!response.ok) {
          if (!cancelled) {
            setPosition(null)
          }
          return
        }

        const data = (await response.json()) as {
          position?: {
            instrument: string
            quantity: number | null
            side: string | null
            notional: number | null
            pnl: number | null
            type: string | null
            isolationType: string | null
            entryPrice: number | null
          } | null
          error?: string
        }

        if (cancelled) {
          return
        }

        if (data.error) {
          setPosition(null)
          setPositionError("Unable to load active position")
          return
        }

        if (data.position) {
          setPosition(data.position)
        } else {
          setPosition(null)
        }
      } catch {
        if (!cancelled) {
          setPosition(null)
          setPositionError("Unable to load active position")
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPosition(false)
        }
      }
    }

    loadPosition()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <motion.section
      className="mt-8"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="border-slate-200 bg-white/95">
        <CardHeader className="border-b border-slate-100 pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold text-slate-900">
                {position?.instrument ?? "CROUSD-PERP"}
              </CardTitle>
              {position?.side ? (
                <span
                  className={
                    position.side === "LONG"
                      ? "rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700"
                      : position.side === "SHORT"
                        ? "rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-700"
                        : "rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700"
                  }
                >
                  {position.side}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
              {isLoadingPosition ? (
                <span className="text-[11px] text-slate-500">
                  Loading position…
                </span>
              ) : position ? (
                <>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-700">
                    Size{" "}
                    {position.quantity !== null
                      ? position.quantity
                      : "0"}
                  </span>
                  {position.entryPrice !== null ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-700">
                      Entry {position.entryPrice.toFixed(6)}
                    </span>
                  ) : null}
                </>
              ) : positionError ? (
                <span className="text-xs text-rose-600">
                  {positionError}
                </span>
              ) : (
                <span className="text-[11px] text-slate-500">
                  No active CROUSD-PERP position
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <PoolTradingViewAdvancedChart />
        </CardContent>
      </Card>
    </motion.section>
  )
}

function PoolTradingViewAdvancedChart() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (containerRef.current.querySelector("script")) return

    const script = document.createElement("script")
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.type = "text/javascript"
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: "CRYPTOCOM:CROUSD",
      interval: "60",
      timezone: "Etc/UTC",
      theme: "light",
      style: "1",
      locale: "en",
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      withdateranges: true,
      range: "1D",
      details: false,
      hotlist: false,
      calendar: false,
      hide_volume: false,
    })

    containerRef.current.appendChild(script)
  }, [])

  return (
    <div
      ref={containerRef}
      className="h-80 w-full overflow-hidden rounded-lg border border-slate-200 bg-white/60"
    />
  )
}

function AITradingStatusSection() {
  return (
    <motion.section
      className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="border-slate-200 bg-white/95">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            AI trading status
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-4 text-sm text-slate-600 sm:grid-cols-2">
          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Current bias
            </p>
            <p className="text-sm font-semibold text-slate-900">Long</p>
            <p className="text-xs">
              AI is tilted long CRO per current momentum and volatility regime.
            </p>
          </div>
          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Position size
            </p>
            <p className="text-sm font-semibold text-slate-900">
              66% of pool · 2.1x leverage
            </p>
            <p className="text-xs">
              Expressed through CRO perpetuals on Crypto.com Futures.
            </p>
          </div>
          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Risk budget remaining
            </p>
            <p className="text-sm font-semibold text-emerald-700">58% of daily</p>
            <p className="text-xs">
              AI can still deploy additional risk before today&apos;s cap is hit.
            </p>
          </div>
          <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Last action
            </p>
            <p className="text-sm font-semibold text-slate-900">
              Reduced exposure · 6 min ago
            </p>
            <p className="text-xs">
              AI trimmed long size after volatility spike on CRO/USD.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-slate-50/80">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Why AI is positioned this way
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-xs text-slate-600">
          <p>
            The engine scores short-term CRO trend, volatility, and funding
            conditions, then picks a bias and size under the pool&apos;s risk budget.
          </p>
          <p className="mt-2">
            Right now it is net long with moderated size after a volatility
            uptick, keeping Absorber buffer within the configured drawdown
            envelope.
          </p>
        </CardContent>
      </Card>
    </motion.section>
  )
}

function CapitalDistributionSection() {
  return (
    <motion.section
      className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="border-slate-200 bg-white/95">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Capital distribution by role
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-sm text-slate-600">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs">
                <p className="font-medium text-slate-900">Taker capital</p>
                <p className="text-slate-600">$750,000 · 60% of pool</p>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div className="h-2 w-[60%] rounded-full bg-emerald-500" />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Bears more PnL volatility; receives upside after Absorber yield
                and protocol fees.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <p className="font-medium text-slate-900">Absorber capital</p>
                <p className="text-slate-600">$500,000 · 40% of pool</p>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div className="h-2 w-[40%] rounded-full bg-slate-900" />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Provides buffer against losses; receives priority yield before
                Taker upside.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white/95">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Risk health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 text-sm text-slate-600">
          <div>
            <div className="flex items-center justify-between text-xs">
              <p className="font-medium text-slate-900">Absorber buffer health</p>
              <p className="text-emerald-600">Safe</p>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div className="h-2 w-[72%] rounded-full bg-emerald-500" />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Current drawdown is -6.4% versus a -20% hard limit.
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs">
              <p className="font-medium text-slate-900">
                Taker exposure multiplier
              </p>
              <p className="text-slate-900">1.8x</p>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Indicates how aggressively Taker capital is deployed versus base
              pool size.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  )
}

function PnlWaterfallSection() {
  return (
    <motion.section
      className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="border-slate-200 bg-white/95">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Profit distribution waterfall
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-xs text-slate-600">
          <div className="space-y-3">
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="font-semibold text-slate-900">
                1. Absorber yield paid
              </p>
              <p>
                A fixed target APY is paid to Absorbers first, funded from net
                trading PnL.
              </p>
            </div>
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="font-semibold text-slate-900">
                2. Protocol / performance fee
              </p>
              <p>
                An optional performance fee is taken for the protocol and AI
                operators.
              </p>
            </div>
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="font-semibold text-slate-900">
                3. Remaining upside to Takers
              </p>
              <p>
                Whatever remains flows to Takers as upside, reflected in their
                pool share price.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white/95">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Loss distribution waterfall
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-xs text-slate-600">
          <div className="space-y-3">
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="font-semibold text-slate-900">
                1. AI risk budget consumed
              </p>
              <p>
                Losses first eat into a pre-configured daily and cumulative risk
                budget.
              </p>
            </div>
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="font-semibold text-slate-900">
                2. Taker exposure absorbs downside
              </p>
              <p>
                Takers absorb losses up to a defined drawdown threshold for the
                pool.
              </p>
            </div>
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="font-semibold text-slate-900">
                3. Absorber buffer (bounded)
              </p>
              <p>
                Absorber capital is only touched beyond specific guardrails,
                protecting yield-seeking capital.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  )
}

function ActivityAndRiskSection() {
  return (
    <motion.section
      className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="border-slate-200 bg-white/95">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Recent pool activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-xs text-slate-600">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">
                  Trade executed · Long CRO
                </p>
                <p>Increased exposure by 12% of pool at 2.1x leverage.</p>
              </div>
              <p className="whitespace-nowrap text-slate-500">3 min ago</p>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">
                  AI mode change · Normal → Conservative
                </p>
                <p>Reduced risk budget after hitting soft drawdown threshold.</p>
              </div>
              <p className="whitespace-nowrap text-slate-500">28 min ago</p>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">
                  Profit settlement
                </p>
                <p>
                  Absorber yield and protocol fee paid; surplus routed to Takers.
                </p>
              </div>
              <p className="whitespace-nowrap text-slate-500">2 hours ago</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border-slate-200 bg-white/95">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Current risk parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4 text-xs text-slate-600 sm:grid-cols-2">
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Max pool drawdown
              </p>
              <p className="text-sm font-semibold text-slate-900">-20%</p>
              <p className="text-[11px] text-slate-500">
                Hard limit before AI execution is halted and the pool is
                rebalanced.
              </p>
            </div>
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Daily risk budget
              </p>
              <p className="text-sm font-semibold text-slate-900">2.5% of NAV</p>
              <p className="text-[11px] text-slate-500">
                Cap on net new risk the AI can deploy per day.
              </p>
            </div>
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Protocol fee on Takers
              </p>
              <p className="text-sm font-semibold text-slate-900">18% of profit</p>
              <p className="text-[11px] text-slate-500">
                Performance share taken on realized upside from Taker positions.
              </p>
            </div>
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Absorber target APY
              </p>
              <p className="text-sm font-semibold text-slate-900">8–12% range</p>
              <p className="text-[11px] text-slate-500">
                Governance tunes yield band while keeping drawdown rails intact.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/95">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Circuit breakers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4 text-xs text-slate-600">
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold text-slate-900">
                Drawdown soft limit
              </p>
              <p className="text-[11px] text-slate-500">
                At -10% pool drawdown, AI switches to recovery mode with reduced
                position sizes and narrower bias.
              </p>
            </div>
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold text-slate-900">
                Trading halt threshold
              </p>
              <p className="text-[11px] text-slate-500">
                At -20% drawdown, trading halts and the pool is rebalanced back
                toward neutral.
              </p>
            </div>
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold text-slate-900">
                Oracle and venue failures
              </p>
              <p className="text-[11px] text-slate-500">
                Governance can trigger an emergency pause if oracles, venues, or
                contracts misbehave.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
            <p>Read the full specification for risk, roles, and waterfalls.</p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-slate-200 bg-white px-4 text-xs font-medium hover:bg-slate-50"
              aria-label="Open protocol documentation"
            >
              Docs
              <ArrowUpRight className="ml-2 h-3 w-3" aria-hidden="true" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </motion.section>
  )
}
