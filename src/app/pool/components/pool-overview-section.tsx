"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowDownLeft, Plus } from "lucide-react"
import {
  BrowserProvider,
  Contract,
  formatUnits,
  parseUnits,
  type Eip1193Provider,
} from "ethers"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { WithdrawModal } from "@/components/withdraw-modal"

import {
  RPC_PROVIDER,
  getConnectedAccount,
  getSupaPoolContract,
  type EthereumProvider,
} from "../pool-helpers"

import {
  SUPA_CP_ABI,
  SUPA_CP_CONTRACT_ADDRESS,
} from "@/lib/smart-contract/supa"

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
  } else if (
    anyError.error &&
    typeof anyError.error.message === "string"
  ) {
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

export function PoolOverviewSection({
  initialOnchainTotals,
}: {
  initialOnchainTotals?: {
    totalAvailable: number
    totalInPosition: number
    totalTakerInPosition: number
    totalAbsorberInPosition: number
  } | null
}) {
  const { toast } = useToast()
  const [totalPoolValue, setTotalPoolValue] = useState<string | null>(null)
  const [totalPoolValueUsd, setTotalPoolValueUsd] = useState<number | null>(
    null
  )
  const [isLoadingTotalPoolValue, setIsLoadingTotalPoolValue] = useState(false)
  const [positionNotional, setPositionNotional] = useState<number | null>(null)
  const [positionPnl, setPositionPnl] = useState<number | null>(null)
  const [onchainTotals, setOnchainTotals] = useState<{
    totalAvailable: number
    totalInPosition: number
    totalTakerInPosition: number
    totalAbsorberInPosition: number
  } | null>(initialOnchainTotals ?? null)
  const [isLoadingOnchainTotals, setIsLoadingOnchainTotals] = useState(
    !initialOnchainTotals
  )
  const [account, setAccount] = useState<string | null>(null)
  const [userAvailable, setUserAvailable] = useState<number | null>(null)
  const [userInPosition, setUserInPosition] = useState<number | null>(null)
  const [isLoadingUserPosition, setIsLoadingUserPosition] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  const [depositError, setDepositError] = useState<string | null>(null)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositRole, setDepositRole] = useState<"taker" | "absorber">("taker")
  const [depositAmount, setDepositAmount] = useState("1")
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawRole, setWithdrawRole] = useState<"taker" | "absorber">(
    "taker"
  )
  const [withdrawAmount, setWithdrawAmount] = useState("")

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
          setTotalPoolValueUsd(data.totalUsdValue)
          const formatted = data.totalUsdValue.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2,
          })
          setTotalPoolValue(formatted)
        } else {
          setTotalPoolValueUsd(null)
          setTotalPoolValue(null)
        }
      } catch {
        if (!cancelled) {
          setTotalPoolValueUsd(null)
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
      // If we already have initial data, don't show loading state
      if (!onchainTotals) {
        setIsLoadingOnchainTotals(true)
      }

      try {
        const response = await fetch("/api/pool-stats")
        if (!response.ok) throw new Error("Failed to fetch pool stats")
        
        const result = await response.json()
        if (!result.success) throw new Error(result.error || "Failed to fetch pool stats")

        if (cancelled) return

        setOnchainTotals(result.data)
      } catch (err) {
        console.error("Failed to load on-chain totals:", err)
        // Only set to null if we don't have any data at all (initial or current)
        if (!cancelled && !onchainTotals) {
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

  const poolPnlClass =
    positionPnl !== null && positionPnl !== 0
      ? positionPnl > 0
        ? "text-emerald-600"
        : "text-rose-600"
      : "text-slate-900"

  const poolPnlPercent =
    positionPnl !== null &&
    totalPoolValueUsd !== null
      ? (() => {
          const startingValue = totalPoolValueUsd - positionPnl
          if (!Number.isFinite(startingValue) || startingValue <= 0) {
            return null
          }
          return (positionPnl / startingValue) * 100
        })()
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

  const userAvailableDisplay =
    userAvailable !== null
      ? `${userAvailable.toLocaleString("en-US", {
          maximumFractionDigits: 4,
        })} tCRO`
      : "0.00 tCRO"

  const userInPositionDisplay =
    userInPosition !== null
      ? `${userInPosition.toLocaleString("en-US", {
          maximumFractionDigits: 4,
        })} tCRO`
      : "0.00 tCRO"

  function handleOpenWithdraw() {
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

      // FIX: Align withdraw role mapping with deposit mapping (Taker=0, Absorber=1)
      const role = withdrawRole === "taker" ? 0 : 1

      const tx = await contract.withdraw(role, value)
      toast("Withdraw transaction submitted", "info")
      await tx.wait()
      toast("Withdrawal confirmed!", "success")

      const updatedUser = await contract.users(signerAddress)
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

      const totalAvailable =
        updatedTakerAvailable + updatedAbsorberAvailable
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
      // FIX: Taker should be 0, Absorber should be 1 based on common enum patterns.
      // But let's check the contract logic. If the user says "Taker" is going to "Absorber",
      // it means the current mapping (Taker=1) is likely inverted.
      // Changing Taker to 0 and Absorber to 1.
      const role = depositRole === "taker" ? 0 : 1

      const tx = await contract.deposit(role, { value })
      toast("Deposit transaction submitted", "info")
      await tx.wait()
      toast("Capital added successfully!", "success")

      setAccount(signerAddress)

      const user = await contract.users(signerAddress)
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
      setShowDepositModal(false)
    } catch (error) {
      const message = simplifyTransactionError(error, "Failed to add capital.")
      setDepositError(message)
      toast(`Error: ${message}`, "error")
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
              Add capital to Supacron
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
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Available capital
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {isLoadingUserPosition ? (
                      <span className="inline-block h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                    ) : (
                      userAvailableDisplay
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Capital in position
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {isLoadingUserPosition ? (
                      <span className="inline-block h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                    ) : (
                      userInPositionDisplay
                    )}
                  </p>
                </div>
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
                onClick={handleOpenWithdraw}
                disabled={isWithdrawing}
              >
                <ArrowDownLeft className="mr-1.5 h-3 w-3" aria-hidden="true" />
                Withdraw
              </Button>
            </div>
          </div>
          {withdrawError || depositError ? (
            <p className="text-[10px] text-rose-600">
              {withdrawError || depositError}
            </p>
          ) : null}
          <p className="text-[10px] text-slate-400">
            In this prototype, these actions are illustrative only.
          </p>
        </div>
      </div>

      <Card className="border-slate-200 bg-white/95 shadow-sm shadow-slate-900/5">
        <CardHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Pool overview
            </CardTitle>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Pool status
              </span>
              <span className="text-xs font-semibold text-slate-900">
                {poolStatus}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Total pool value
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {isLoadingTotalPoolValue ? (
                  <span className="inline-block h-5 w-24 animate-pulse rounded-full bg-slate-200" />
                ) : (
                  totalPoolValue ?? "$0.00"
                )}
              </p>
              <p className={`text-[11px] ${poolPnlPercentClass}`}>
                {poolPnlPercentDisplay}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Current pool PnL
              </p>
              <p className={`mt-1 text-lg font-semibold ${poolPnlClass}`}>
                {poolPnlDisplay}
              </p>
              <p className="text-[11px] text-slate-500">
                Realized + unrealized since epoch start
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 text-xs text-slate-600 sm:text-sm">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              On-chain capital (Supacron)
            </p>
            <div className="mt-2 grid gap-3 md:grid-cols-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Available
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {isLoadingOnchainTotals ? (
                    <span className="inline-block h-4 w-20 animate-pulse rounded-full bg-slate-200" />
                  ) : (
                    onchainTotalAvailableDisplay
                  )}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  In position
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {isLoadingOnchainTotals ? (
                    <span className="inline-block h-4 w-20 animate-pulse rounded-full bg-slate-200" />
                  ) : (
                    onchainTotalInPositionDisplay
                  )}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Taker in position
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {isLoadingOnchainTotals ? (
                    <span className="inline-block h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                  ) : (
                    onchainTakerInPositionDisplay
                  )}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Absorber in position
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {isLoadingOnchainTotals ? (
                    <span className="inline-block h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                  ) : (
                    onchainAbsorberInPositionDisplay
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  )
}
