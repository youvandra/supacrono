"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, PieChart, Wallet } from "lucide-react"
import { Contract, JsonRpcProvider, formatUnits } from "ethers"

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

function PortfolioOverviewSection({ account }: { account: string | null }) {
  const [isLoadingPool, setIsLoadingPool] = useState(false)
  const [userAvailable, setUserAvailable] = useState<number | null>(null)
  const [userInPosition, setUserInPosition] = useState<number | null>(null)
  const [hasTakerRole, setHasTakerRole] = useState(false)
  const [hasAbsorberRole, setHasAbsorberRole] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadUserPool() {
      if (!account) {
        setUserAvailable(null)
        setUserInPosition(null)
        setHasTakerRole(false)
        setHasAbsorberRole(false)
        return
      }

      setIsLoadingPool(true)

      try {
        const contract = new Contract(
          SUPA_CP_CONTRACT_ADDRESS,
          SUPA_CP_ABI,
          RPC_PROVIDER
        )
        const user = await contract.users(account)

        if (cancelled) {
          return
        }

        const takerAvailable = Number(
          formatUnits(user.taker.available, 18)
        )
        const takerInPosition = Number(
          formatUnits(user.taker.inPosition, 18)
        )
        const absorberAvailable = Number(
          formatUnits(user.absorber.available, 18)
        )
        const absorberInPosition = Number(
          formatUnits(user.absorber.inPosition, 18)
        )

        const totalAvailable = takerAvailable + absorberAvailable
        const totalInPosition = takerInPosition + absorberInPosition

        setUserAvailable(totalAvailable)
        setUserInPosition(totalInPosition)
        setHasTakerRole(takerAvailable > 0 || takerInPosition > 0)
        setHasAbsorberRole(absorberAvailable > 0 || absorberInPosition > 0)
      } catch {
        if (!cancelled) {
          setUserAvailable(null)
          setUserInPosition(null)
          setHasTakerRole(false)
          setHasAbsorberRole(false)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPool(false)
        }
      }
    }

    loadUserPool()

    return () => {
      cancelled = true
    }
  }, [account])

  const totalCommitted =
    userAvailable !== null && userInPosition !== null
      ? userAvailable + userInPosition
      : null

  const withdrawableDisplay = isLoadingPool
    ? "Loading..."
    : userAvailable !== null
      ? `${userAvailable.toLocaleString("en-US", {
          maximumFractionDigits: 4,
        })} tCRO`
      : "0.00 tCRO"

  const activeRoleDisplay = isLoadingPool
    ? "Loading..."
    : hasTakerRole && hasAbsorberRole
      ? "Taker + Absorber"
      : hasTakerRole
        ? "Taker"
        : hasAbsorberRole
          ? "Absorber"
          : "None"

  const totalCommittedDisplay = isLoadingPool
    ? "Loading..."
    : totalCommitted !== null
      ? `${totalCommitted.toLocaleString("en-US", {
          maximumFractionDigits: 4,
        })} tCRO`
      : "0.00 tCRO"

  return (
    <motion.section
      className="flex flex-col gap-6 border-b border-slate-200/80 pb-10 sm:flex-row sm:items-end sm:justify-between"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-xl">
        <Badge className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-800">
          Your Supacron portfolio
        </Badge>
        <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          One view of your Taker and Absorber capital.
        </h1>
        <p className="mt-4 text-balance text-sm leading-relaxed text-slate-600 sm:text-base">
          This page aggregates how your wallets participate in the Supacron
          pool, splitting positions between Takers and Absorbers, tracking
          accrued yield, and summarizing risk against protocol limits.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-xs">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="font-medium uppercase tracking-[0.18em]">
              Demo only
            </span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
            <PieChart className="h-3 w-3" aria-hidden="true" />
            <span>Illustrative balances and PnL for Cronos hackathon</span>
          </span>
        </div>
      </div>
      <div className="grid w-full gap-3 text-xs text-slate-600 sm:w-80 sm:text-sm">
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Total portfolio value
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {totalCommittedDisplay}
          </p>
          <p className="text-[11px] text-emerald-600">+$8,420 (+7.3%)</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Available Capital
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {withdrawableDisplay}
          </p>
          <p className="text-[11px] text-slate-500">
            Available to withdraw from the pool.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Active roles
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {activeRoleDisplay}
          </p>
          <p className="text-[11px] text-slate-500">
            Split exposure across upside and buffer capital.
          </p>
        </div>
      </div>
    </motion.section>
  )
}

function RoleBreakdownSection({ account }: { account: string | null }) {
  const [isLoading, setIsLoading] = useState(false)
  const [userTakerInPosition, setUserTakerInPosition] = useState<number | null>(
    null
  )
  const [userAbsorberInPosition, setUserAbsorberInPosition] = useState<
    number | null
  >(null)
  const [totalTakerInPosition, setTotalTakerInPosition] = useState<
    number | null
  >(null)
  const [totalAbsorberInPosition, setTotalAbsorberInPosition] = useState<
    number | null
  >(null)

  useEffect(() => {
    let cancelled = false

    async function loadRoleBreakdown() {
      if (!account) {
        setUserTakerInPosition(null)
        setUserAbsorberInPosition(null)
        setTotalTakerInPosition(null)
        setTotalAbsorberInPosition(null)
        return
      }

      setIsLoading(true)

      try {
        const contract = new Contract(
          SUPA_CP_CONTRACT_ADDRESS,
          SUPA_CP_ABI,
          RPC_PROVIDER
        )

        const [user, totalTakerRaw, totalAbsorberRaw] = await Promise.all([
          contract.users(account),
          contract.totalTakerInPosition(),
          contract.totalAbsorberInPosition(),
        ])

        if (cancelled) {
          return
        }

        const takerInPosition = Number(
          formatUnits(user.taker.inPosition, 18)
        )
        const absorberInPosition = Number(
          formatUnits(user.absorber.inPosition, 18)
        )

        setUserTakerInPosition(takerInPosition)
        setUserAbsorberInPosition(absorberInPosition)
        setTotalTakerInPosition(Number(formatUnits(totalTakerRaw, 18)))
        setTotalAbsorberInPosition(Number(formatUnits(totalAbsorberRaw, 18)))
      } catch {
        if (!cancelled) {
          setUserTakerInPosition(null)
          setUserAbsorberInPosition(null)
          setTotalTakerInPosition(null)
          setTotalAbsorberInPosition(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadRoleBreakdown()

    return () => {
      cancelled = true
    }
  }, [account])

  const takerAmount =
    userTakerInPosition !== null && userTakerInPosition > 0
      ? userTakerInPosition
      : 0
  const absorberAmount =
    userAbsorberInPosition !== null && userAbsorberInPosition > 0
      ? userAbsorberInPosition
      : 0

  const takerAmountDisplay = isLoading
    ? "Loading..."
    : `${takerAmount.toLocaleString("en-US", {
        maximumFractionDigits: 4,
      })} tCRO`

  const absorberAmountDisplay = isLoading
    ? "Loading..."
    : `${absorberAmount.toLocaleString("en-US", {
        maximumFractionDigits: 4,
      })} tCRO`

  const takerSharePercent =
    totalTakerInPosition !== null &&
    totalTakerInPosition > 0 &&
    takerAmount > 0
      ? (takerAmount / totalTakerInPosition) * 100
      : null

  const absorberSharePercent =
    totalAbsorberInPosition !== null &&
    totalAbsorberInPosition > 0 &&
    absorberAmount > 0
      ? (absorberAmount / totalAbsorberInPosition) * 100
      : null

  const takerShareDisplay =
    takerSharePercent !== null ? `${takerSharePercent.toFixed(2)}%` : "0.00%"
  const absorberShareDisplay =
    absorberSharePercent !== null
      ? `${absorberSharePercent.toFixed(2)}%`
      : "0.00%"

  return (
    <motion.section
      className="mt-10"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="border-slate-200 bg-white/95">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Allocation by role
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-xs text-slate-600 sm:text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-lg bg-emerald-50 px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">
                Taker capital
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {takerAmountDisplay}
              </p>
              <p className="text-[11px] text-emerald-700">
                Upside-exposed share tokens that participate in AI trading
                gains after Absorber yield and protocol fees.
              </p>
            </div>
            <div className="space-y-2 rounded-lg bg-slate-50 px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-700">
                Absorber capital
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {absorberAmountDisplay}
              </p>
              <p className="text-[11px] text-emerald-600">
                Buffer capital that earns priority yield while absorbing
                downside within configured drawdown limits.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Taker share of pool
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {takerShareDisplay}
              </p>
              <p className="text-[11px] text-slate-500">
                Portion of total Taker supply you own.
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Absorber share of pool
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {absorberShareDisplay}
              </p>
              <p className="text-[11px] text-slate-500">
                Portion of total Absorber supply you own.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  )
}

function PerformanceAndRiskSection() {
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
            Portfolio performance
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-xs text-slate-600">
          <div className="mb-4 h-40 rounded-lg border border-slate-100 bg-slate-50">
            <MiniPerformanceChart />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                30d PnL
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-600">
                +$2,980
              </p>
              <p className="text-[11px] text-slate-500">Blended across roles.</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Max drawdown
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                -6.4%
              </p>
              <p className="text-[11px] text-slate-500">
                Versus protocol hard limit at -20%.
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Yield paid to date
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                $1,940
              </p>
              <p className="text-[11px] text-slate-500">
                Absorber yield already realized.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white/95">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Risk and health
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-xs text-slate-600">
          <div className="space-y-3">
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Utilized risk budget
              </p>
              <p className="text-sm font-semibold text-slate-900">43% of cap</p>
              <p className="text-[11px] text-slate-500">
                Portion of protocol risk budget touched by your positions.
              </p>
            </div>
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Circuit breaker distance
              </p>
              <p className="text-sm font-semibold text-slate-900">
                13.6% to halt
              </p>
              <p className="text-[11px] text-slate-500">
                Further pool drawdown before trading is forcibly stopped.
              </p>
            </div>
            <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Concentration risk
              </p>
              <p className="text-sm font-semibold text-slate-900">
                Moderate (2/5)
              </p>
              <p className="text-[11px] text-slate-500">
                Majority of capital sits in a single Taker lane.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <p>Use governance page to see full protocol risk configuration.</p>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-slate-200 bg-white px-4 text-xs font-medium hover:bg-slate-50"
          >
            Open governance
            <ArrowUpRight className="ml-2 h-3 w-3" aria-hidden="true" />
          </Button>
        </CardFooter>
      </Card>
    </motion.section>
  )
}

function ActivitySection() {
  return (
    <motion.section
      className="mt-10"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="border-slate-200 bg-white/95">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900">
            Recent portfolio activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-xs text-slate-600">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">
                  Deposited to Taker role
                </p>
                <p>Added $15,000 to Taker pool at current share price.</p>
              </div>
              <p className="whitespace-nowrap text-slate-500">3 hours ago</p>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">
                  Yield paid to Absorber
                </p>
                <p>Epoch yield of $420 realized to Absorber wallet.</p>
              </div>
              <p className="whitespace-nowrap text-slate-500">1 day ago</p>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">
                  Rebalanced between roles
                </p>
                <p>Shifted $5,000 from Taker to Absorber allocation.</p>
              </div>
              <p className="whitespace-nowrap text-slate-500">4 days ago</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <p>This activity log is illustrative for the Cronos hackathon demo.</p>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-slate-200 bg-white px-4 text-xs font-medium hover:bg-slate-50"
          >
            Export history
          </Button>
        </CardFooter>
      </Card>
    </motion.section>
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

function MiniPerformanceChart() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (containerRef.current.querySelector("canvas")) return

    const canvas = document.createElement("div")
    canvas.className =
      "h-full w-full bg-gradient-to-tr from-emerald-100 via-emerald-50 to-slate-50"
    containerRef.current.appendChild(canvas)
  }, [])

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden rounded-lg"
    />
  )
}
