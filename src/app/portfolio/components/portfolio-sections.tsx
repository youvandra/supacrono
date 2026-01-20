"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowDownLeft, PieChart } from "lucide-react"
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
import { WithdrawModal } from "@/components/withdraw-modal"

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

const RPC_PROVIDER = new JsonRpcProvider("https://evm-t3.cronos.org")

function simplifyTransactionError(error: unknown, fallback: string): string {
  if (!error) {
    return fallback
  }

  const anyError = error as {
    message?: string
    shortMessage?: string
    reason?: string
    error?: { message?: string }
  }

  let raw = ""

  if (typeof anyError.shortMessage === "string") {
    raw = anyError.shortMessage
  } else if (typeof anyError.reason === "string") {
    raw = anyError.reason
  } else if (typeof anyError.message === "string") {
    raw = anyError.message
  } else if (anyError.error && typeof anyError.error.message === "string") {
    raw = anyError.error.message
  }

  if (!raw) {
    return fallback
  }

  let simplified = raw

  const executionRevertedMatch = simplified.match(
    /execution reverted(?::|: )?\s*(.+)$/i
  )
  if (executionRevertedMatch && executionRevertedMatch[1]) {
    simplified = executionRevertedMatch[1]
  }

  const reasonMatch = simplified.match(/reason="([^"]+)"/)
  if (reasonMatch && reasonMatch[1]) {
    simplified = reasonMatch[1]
  }

  simplified = simplified.replace(/^Error:\s*/i, "")
  simplified = simplified.replace(/^CALL_EXCEPTION.*?:\s*/i, "")
  simplified = simplified.replace(/\s*\(see .*$/i, "")
  simplified = simplified.replace(
    /\s*\[ See: https:\/\/links\.ethers\.org\/[^\]]+\]$/i,
    ""
  )

  simplified = simplified.trim()

  if (!simplified) {
    return fallback
  }

  const mappings: { match: RegExp; message: string }[] = [
    {
      match: /amount exceeds available capital/i,
      message: "Amount exceeds your available capital",
    },
    {
      match: /insufficient funds/i,
      message: "Insufficient balance to cover this transaction",
    },
    {
      match: /user rejected/i,
      message: "Transaction was rejected in your wallet",
    },
  ]

  for (const mapping of mappings) {
    if (mapping.match.test(simplified)) {
      return mapping.message
    }
  }

  if (simplified.length > 160) {
    return `${simplified.slice(0, 157).trimEnd()}...`
  }

  return simplified
}

type PortfolioOverviewSectionProps = {
  account: string | null
}

export function PortfolioOverviewSection({
  account,
}: PortfolioOverviewSectionProps) {
  const [isLoadingPool, setIsLoadingPool] = useState(false)
  const [userAvailable, setUserAvailable] = useState<number | null>(null)
  const [userInPosition, setUserInPosition] = useState<number | null>(null)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawRole, setWithdrawRole] = useState<"taker" | "absorber">(
    "taker"
  )
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadUserPool() {
      if (!account) {
        setUserAvailable(null)
        setUserInPosition(null)
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

        const takerAvailable = Number(formatUnits(user.taker.available, 18))
        const takerInPosition = Number(formatUnits(user.taker.inPosition, 18))
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
      } catch {
        if (!cancelled) {
          setUserAvailable(null)
          setUserInPosition(null)
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

  const withdrawableDisplay =
    userAvailable !== null
      ? `${userAvailable.toLocaleString("en-US", {
          maximumFractionDigits: 4,
        })} tCRO`
      : "0.00 tCRO"

  const totalCommittedDisplay =
    totalCommitted !== null
      ? `${totalCommitted.toLocaleString("en-US", {
          maximumFractionDigits: 4,
        })} tCRO`
      : "0.00 tCRO"

  function handleOpenWithdraw() {
    if (!account) {
      alert("Connect a wallet on Cronos EVM to withdraw.")
      return
    }
    setWithdrawError(null)
    setShowWithdrawModal(true)
  }

  async function handleConfirmWithdraw() {
    if (typeof window === "undefined") {
      return
    }

    const trimmedAmount = withdrawAmount.trim()
    if (!trimmedAmount) {
      setWithdrawError("Enter an amount")
      return
    }

    try {
      setWithdrawError(null)
      setIsWithdrawing(true)

      const provider = (window as { ethereum?: EthereumProvider }).ethereum
      if (!provider) {
        alert("MetaMask is not available in this browser.")
        setIsWithdrawing(false)
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
      if (value <= BigInt(0)) {
        setWithdrawError("Enter a positive amount")
        setIsWithdrawing(false)
        return
      }

      const role = withdrawRole === "taker" ? 1 : 0

      const tx = await contract.withdraw(role, value)
      await tx.wait()

      const viewContract = new Contract(
        SUPA_CP_CONTRACT_ADDRESS,
        SUPA_CP_ABI,
        RPC_PROVIDER
      )
      const updatedUser = await viewContract.users(signerAddress)

      const updatedTakerAvailable = Number(
        formatUnits(updatedUser.taker.available, 18)
      )
      const updatedTakerInPosition = Number(
        formatUnits(updatedUser.taker.inPosition, 18)
      )
      const updatedAbsorberAvailable = Number(
        formatUnits(updatedUser.absorber.available, 18)
      )
      const updatedAbsorberInPosition = Number(
        formatUnits(updatedUser.absorber.inPosition, 18)
      )

      const totalAvailable = updatedTakerAvailable + updatedAbsorberAvailable
      const totalInPosition =
        updatedTakerInPosition + updatedAbsorberInPosition

      setUserAvailable(totalAvailable)
      setUserInPosition(totalInPosition)
      setShowWithdrawModal(false)
    } catch (error) {
      const message = simplifyTransactionError(
        error,
        "Failed to withdraw capital."
      )
      setWithdrawError(message)
    } finally {
      setIsWithdrawing(false)
    }
  }

  return (
    <>
      <WithdrawModal
        open={showWithdrawModal}
        role={withdrawRole}
        amount={withdrawAmount}
        error={withdrawError}
        isSubmitting={isWithdrawing}
        onClose={() => setShowWithdrawModal(false)}
        onConfirm={handleConfirmWithdraw}
        onRoleChange={setWithdrawRole}
        onAmountChange={setWithdrawAmount}
      />
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
              {isLoadingPool ? (
                <span className="inline-block h-5 w-28 animate-pulse rounded-full bg-slate-200" />
              ) : (
                totalCommittedDisplay
              )}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Available Capital
            </p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-lg font-semibold text-slate-900">
                {isLoadingPool ? (
                  <span className="inline-block h-5 w-24 animate-pulse rounded-full bg-slate-200" />
                ) : (
                  withdrawableDisplay
                )}
              </p>
              <Button
                variant="outline"
                className="inline-flex items-center rounded-full border-slate-200 bg-white px-3 py-1 text-[11px] font-medium hover:bg-slate-50"
                onClick={handleOpenWithdraw}
                disabled={isWithdrawing}
              >
                <ArrowDownLeft className="mr-1.5 h-3 w-3" aria-hidden="true" />
                Withdraw
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Capital in position
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {isLoadingPool ? (
                <span className="inline-block h-5 w-28 animate-pulse rounded-full bg-slate-200" />
              ) : userInPosition !== null ? (
                `${userInPosition.toLocaleString("en-US", {
                  maximumFractionDigits: 4,
                })} tCRO`
              ) : (
                "0.00 tCRO"
              )}
            </p>
          </div>
        </div>
      </motion.section>
    </>
  )
}

type RoleBreakdownSectionProps = {
  account: string | null
}

export function RoleBreakdownSection({ account }: RoleBreakdownSectionProps) {
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

  const takerAmountDisplay = `${takerAmount.toLocaleString("en-US", {
    maximumFractionDigits: 4,
  })} tCRO`

  const absorberAmountDisplay = `${absorberAmount.toLocaleString("en-US", {
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
                {isLoading ? (
                  <span className="inline-block h-5 w-24 animate-pulse rounded-full bg-emerald-200" />
                ) : (
                  takerAmountDisplay
                )}
              </p>
              <p className="text-[11px] text-emerald-700">
                Upside-exposed share tokens that participate in AI trading gains
                after Absorber yield and protocol fees.
              </p>
            </div>
            <div className="space-y-2 rounded-lg bg-slate-50 px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-700">
                Absorber capital
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {isLoading ? (
                  <span className="inline-block h-5 w-24 animate-pulse rounded-full bg-slate-200" />
                ) : (
                  absorberAmountDisplay
                )}
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

export function PerformanceAndRiskSection() {
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
          <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
              Coming soon
            </p>
            <p className="mt-2 max-w-xs text-xs text-slate-600">
              Personalized performance charts and PnL analytics for your
              Supacron portfolio will appear here.
            </p>
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
          <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
              Coming soon
            </p>
            <p className="mt-2 max-w-xs text-xs text-slate-600">
              Portfolio-level risk scores and health indicators will surface
              once live trading metrics are connected.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  )
}

export function ActivitySection() {
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
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-xs text-slate-600">
          <Badge
            variant="outline"
            className="mb-3 rounded-full border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-500"
          >
            Coming Soon
          </Badge>
          <p className="max-w-xs text-balance">
            Detailed transaction history and yield logs will be available here.
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
          <p>This activity log is currently under development.</p>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="rounded-full border-slate-200 bg-white px-4 text-xs font-medium opacity-50"
          >
            Export history
          </Button>
        </CardFooter>
      </Card>
    </motion.section>
  )
}
