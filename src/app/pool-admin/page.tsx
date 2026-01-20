"use client"

import { useEffect, useState } from "react"
import {
  BrowserProvider,
  Contract,
  formatUnits,
  parseUnits,
  type Eip1193Provider,
} from "ethers"
import { Loader2, Bot } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/toast"

import {
  SUPA_CP_ABI,
  SUPA_CP_CONTRACT_ADDRESS,
} from "@/lib/smart-contract/supa"
import {
  connectWalletCronosEvm,
  getConnectedAccount,
  RPC_PROVIDER,
} from "../pool/pool-helpers"
import { SiteHeader } from "../pool/components/site-header"
import { FooterSection } from "../pool/components/footer-section"

export default function PoolAdminPage() {
  const { toast } = useToast()
  const [account, setAccount] = useState<string | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // Contract State
  const [totalAvailable, setTotalAvailable] = useState<string>("0")
  const [totalInPosition, setTotalInPosition] = useState<string>("0")
  const [operatorBalance, setOperatorBalance] = useState<string>("0")
  const [absorberYieldBps, setAbsorberYieldBps] = useState<string>("0")
  
  // New Contract State Fields
  const [totalTakerInPosition, setTotalTakerInPosition] = useState<string>("0")
  const [totalAbsorberInPosition, setTotalAbsorberInPosition] = useState<string>("0")
  const [takerSnapshot, setTakerSnapshot] = useState<string>("0")
  const [absorberSnapshot, setAbsorberSnapshot] = useState<string>("0")

  // Form States
  const [newOperator, setNewOperator] = useState("")
  const [lossAmount, setLossAmount] = useState("")
  const [profitAmount, setProfitAmount] = useState("")
  const [withdrawOperatorAmount, setWithdrawOperatorAmount] = useState("")

  // AI Agent State
  const [isAgentLoading, setIsAgentLoading] = useState(false)
  const [agentStatus, setAgentStatus] = useState<string | null>(null)

  useEffect(() => {
    getConnectedAccount().then(setAccount)
    fetchContractData()
  }, [])

  const fetchContractData = async () => {
    try {
      const contract = new Contract(
        SUPA_CP_CONTRACT_ADDRESS,
        SUPA_CP_ABI,
        RPC_PROVIDER
      )

      // Fetch basic data first
      const [
        _operator,
        _totalAvailable,
        _totalInPosition,
        _operatorBalance,
        _absorberYieldBps,
      ] = await Promise.all([
        contract.operator().catch(() => "0x000..."),
        contract.totalAvailable().catch(() => BigInt(0)),
        contract.totalInPosition().catch(() => BigInt(0)),
        contract.operatorBalance().catch(() => BigInt(0)),
        contract.ABSORBER_YIELD_BPS().catch(() => BigInt(0)),
      ])

      setOperator(_operator)
      setTotalAvailable(formatUnits(_totalAvailable, 18))
      setTotalInPosition(formatUnits(_totalInPosition, 18))
      setOperatorBalance(formatUnits(_operatorBalance, 18))
      setAbsorberYieldBps(_absorberYieldBps.toString())

      // Fetch new fields separately to prevent crashing if they don't exist yet
      try {
        const [
          _totalTakerInPosition,
          _totalAbsorberInPosition,
          _takerSnapshot,
          _absorberSnapshot,
        ] = await Promise.all([
          contract.totalTakerInPosition(),
          contract.totalAbsorberInPosition(),
          contract.takerSnapshot(),
          contract.absorberSnapshot(),
        ])

        setTotalTakerInPosition(formatUnits(_totalTakerInPosition, 18))
        setTotalAbsorberInPosition(formatUnits(_totalAbsorberInPosition, 18))
        setTakerSnapshot(formatUnits(_takerSnapshot, 18))
        setAbsorberSnapshot(formatUnits(_absorberSnapshot, 18))
      } catch (err) {
        console.warn("New contract fields not available:", err)
      }

    } catch (error) {
      console.error("Failed to fetch contract data:", error)
    }
  }

  const handleConnect = async () => {
    const connected = await connectWalletCronosEvm()
    if (connected) {
      setAccount(connected)
    }
  }

  const getSigner = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      throw new Error("No crypto wallet found")
    }
    const provider = new BrowserProvider((window as any).ethereum)
    return await provider.getSigner()
  }

  const executeTransaction = async (
    actionName: string,
    action: (contract: Contract) => Promise<unknown>
  ) => {
    setIsLoading(true)
    setStatusMessage(null)
    try {
      const signer = await getSigner()
      const contract = new Contract(
        SUPA_CP_CONTRACT_ADDRESS,
        SUPA_CP_ABI,
        signer
      )

      const tx = (await action(contract)) as {
        hash: string
        wait: () => Promise<unknown>
      }
      setStatusMessage(`${actionName} transaction submitted: ${tx.hash}`)
      toast(`${actionName} transaction submitted`, "info")
      await tx.wait()
      setStatusMessage(`${actionName} confirmed!`)
      toast(`${actionName} confirmed!`, "success")
      fetchContractData()
    } catch (error: unknown) {
      console.error(error)
      const message =
        error instanceof Error ? error.message : "Transaction failed"
      setStatusMessage(`Error: ${message}`)
      toast(`Error: ${message}`, "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangeOperator = () => {
    if (!newOperator) return
    executeTransaction("Change Operator", (contract) =>
      contract.changeOperator(newOperator)
    )
  }

  const handleLockGlobal = () => {
    executeTransaction("Lock Global", (contract) => contract.lockGlobal())
  }

  const handleUnlockGlobal = () => {
    executeTransaction("Unlock Global", (contract) => contract.unlockGlobal())
  }

  const handleReportLoss = () => {
    if (!lossAmount) return
    executeTransaction("Report Loss", (contract) =>
      contract.reportLoss(parseUnits(lossAmount, 18))
    )
  }

  const handleReportProfit = () => {
    if (!profitAmount) return
    executeTransaction("Report Profit", (contract) =>
      contract.reportProfit({ value: parseUnits(profitAmount, 18) })
    )
  }

  const handleWithdrawOperator = () => {
    if (!withdrawOperatorAmount) return
    executeTransaction("Withdraw Operator", (contract) =>
      contract.withdrawOperator(parseUnits(withdrawOperatorAmount, 18))
    )
  }

  const handleCalculateAgent = async () => {
    setIsAgentLoading(true)
    setAgentStatus(null)
    try {
      const response = await fetch("/api/agent/calculate-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalAvailable,
          totalInPosition,
          operatorBalance,
          absorberYieldBps,
          operator
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.statusText}`)
      }

      setAgentStatus("AI Agent successfully updated trading status!")
      toast("AI Agent successfully updated trading status!", "success")
    } catch (error: unknown) {
      console.error(error)
      const message = error instanceof Error ? error.message : "Agent calculation failed"
      setAgentStatus(`Error: ${message}`)
      toast(`Error: ${message}`, "error")
    } finally {
      setIsAgentLoading(false)
    }
  }

  const isOperator =
    account && operator && account.toLowerCase() === operator.toLowerCase()

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-slate-900">
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-4xl flex-col gap-8 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div>
          <Badge className="rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-[11px] font-medium text-purple-800">
            Admin Panel
          </Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
            Pool Administration
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Control the Supacron smart contract. Restricted to the
            Operator address.
          </p>
        </div>

        {!account ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="mb-4 text-sm text-slate-600">
                Connect your wallet to access admin functions.
              </p>
              <Button onClick={handleConnect}>Connect Wallet</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {!isOperator && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <strong>Warning:</strong> You are not connected as the current
                Operator ({operator}). Write transactions will likely fail.
              </div>
            )}

            {/* AI Agent Interface */}
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium text-purple-900">
                    AI Trading Agent
                  </CardTitle>
                  <CardDescription className="text-purple-700">
                    Autonomous pool monitoring and optimization system
                  </CardDescription>
                </div>
                <Bot className="h-6 w-6 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-purple-900">
                      {agentStatus || "Ready to analyze pool status and suggest actions."}
                    </p>
                  </div>
                  <Button 
                    onClick={handleCalculateAgent} 
                    disabled={isAgentLoading}
                    className="bg-purple-600 text-white hover:bg-purple-700"
                  >
                    {isAgentLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Bot className="mr-2 h-4 w-4" />
                    )}
                    Analyze
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Status Overview */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    Total Available
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalAvailable}</div>
                  <p className="text-xs text-slate-500">tCRO</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    Total In Position
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalInPosition}</div>
                  <p className="text-xs text-slate-500">tCRO</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    Operator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="truncate text-sm font-mono font-medium">
                    {operator}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    Operator Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{operatorBalance}</div>
                  <p className="text-xs text-slate-500">tCRO</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    Absorber Yield
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{absorberYieldBps}</div>
                  <p className="text-xs text-slate-500">BPS</p>
                </CardContent>
              </Card>

              {/* New Cards for Taker/Absorber Data */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    Taker In Position
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTakerInPosition}</div>
                  <p className="text-xs text-slate-500">tCRO</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    Absorber In Position
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalAbsorberInPosition}</div>
                  <p className="text-xs text-slate-500">tCRO</p>
                </CardContent>
              </Card>
            </div>

            {/* Admin Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Operator Actions</CardTitle>
                <CardDescription>
                  Execute administrative functions on the contract.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="reporting" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="reporting">Reporting</TabsTrigger>
                    <TabsTrigger value="controls">Controls</TabsTrigger>
                    <TabsTrigger value="config">Config</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="reporting" className="space-y-4 pt-4">
                    <div className="grid gap-4 rounded-lg border border-slate-200 p-4">
                      <div className="space-y-2">
                        <Label>Report Profit (Payable)</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Amount in tCRO"
                            value={profitAmount}
                            onChange={(e) => setProfitAmount(e.target.value)}
                          />
                          <Button 
                            onClick={handleReportProfit} 
                            disabled={isLoading || !profitAmount}
                            className="w-32"
                          >
                            {isLoading ? <Loader2 className="animate-spin" /> : "Submit"}
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500">
                          Sends tCRO to the contract as profit.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 rounded-lg border border-slate-200 p-4">
                      <div className="space-y-2">
                        <Label>Report Loss</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Amount in tCRO"
                            value={lossAmount}
                            onChange={(e) => setLossAmount(e.target.value)}
                          />
                          <Button 
                            onClick={handleReportLoss} 
                            disabled={isLoading || !lossAmount}
                            variant="destructive"
                            className="w-32"
                          >
                            {isLoading ? <Loader2 className="animate-spin" /> : "Report"}
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500">
                          Registers a loss in the system (does not move funds).
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="controls" className="space-y-4 pt-4">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                        <div>
                          <h3 className="font-medium">Lock Global</h3>
                          <p className="text-sm text-slate-500">
                            Pause all deposits and withdrawals.
                          </p>
                        </div>
                        <Button 
                          onClick={handleLockGlobal} 
                          disabled={isLoading}
                          variant="secondary"
                        >
                          Lock
                        </Button>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                        <div>
                          <h3 className="font-medium">Unlock Global</h3>
                          <p className="text-sm text-slate-500">
                            Resume normal operations.
                          </p>
                        </div>
                        <Button 
                          onClick={handleUnlockGlobal} 
                          disabled={isLoading}
                          variant="outline"
                        >
                          Unlock
                        </Button>
                      </div>

                      <div className="grid gap-4 rounded-lg border border-slate-200 p-4">
                        <div className="space-y-2">
                          <Label>Withdraw Operator</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Amount in tCRO"
                              value={withdrawOperatorAmount}
                              onChange={(e) => setWithdrawOperatorAmount(e.target.value)}
                            />
                            <Button 
                              onClick={handleWithdrawOperator} 
                              disabled={isLoading || !withdrawOperatorAmount}
                              variant="destructive"
                              className="w-32"
                            >
                              {isLoading ? <Loader2 className="animate-spin" /> : "Withdraw"}
                            </Button>
                          </div>
                          <p className="text-xs text-slate-500">
                            Withdraws funds from the Operator Balance.
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="config" className="space-y-4 pt-4">
                    <div className="grid gap-4 rounded-lg border border-slate-200 p-4">
                      <div className="space-y-2">
                        <Label>Change Operator</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="New Operator Address (0x...)"
                            value={newOperator}
                            onChange={(e) => setNewOperator(e.target.value)}
                          />
                          <Button 
                            onClick={handleChangeOperator} 
                            disabled={isLoading || !newOperator}
                          >
                            Change
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {statusMessage && (
              <div className="rounded-lg bg-slate-900 p-4 text-sm text-white shadow-lg">
                <p className="font-mono">{statusMessage}</p>
              </div>
            )}
          </>
        )}
      </main>
      <FooterSection />
    </div>
  )
}
