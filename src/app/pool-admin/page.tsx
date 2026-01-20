"use client"

import { useEffect, useState } from "react"
import {
  BrowserProvider,
  Contract,
  formatUnits,
  parseUnits,
  type Eip1193Provider,
} from "ethers"
import { Loader2 } from "lucide-react"

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
  const [account, setAccount] = useState<string | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // Contract State
  const [totalAvailable, setTotalAvailable] = useState<string>("0")
  const [totalInPosition, setTotalInPosition] = useState<string>("0")
  const [profitPool, setProfitPool] = useState<string>("0")
  const [lossPool, setLossPool] = useState<string>("0")
  const [absorberYieldBps, setAbsorberYieldBps] = useState<string>("0")
  
  // Form States
  const [newOperator, setNewOperator] = useState("")
  const [lossAmount, setLossAmount] = useState("")
  const [profitAmount, setProfitAmount] = useState("")

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

      const [
        _operator,
        _totalAvailable,
        _totalInPosition,
        _profitPool,
        _lossPool,
        _absorberYieldBps,
      ] = await Promise.all([
        contract.operator(),
        contract.totalAvailable(),
        contract.totalInPosition(),
        contract.profitPool(),
        contract.lossPool(),
        contract.ABSORBER_YIELD_BPS(),
      ])

      setOperator(_operator)
      setTotalAvailable(formatUnits(_totalAvailable, 18))
      setTotalInPosition(formatUnits(_totalInPosition, 18))
      setProfitPool(formatUnits(_profitPool, 18))
      setLossPool(formatUnits(_lossPool, 18))
      setAbsorberYieldBps(_absorberYieldBps.toString())
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
    if (!window.ethereum) throw new Error("No crypto wallet found")
    const provider = new BrowserProvider(window.ethereum as Eip1193Provider)
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
      await tx.wait()
      setStatusMessage(`${actionName} confirmed!`)
      fetchContractData()
    } catch (error: unknown) {
      console.error(error)
      const message =
        error instanceof Error ? error.message : "Transaction failed"
      setStatusMessage(`Error: ${message}`)
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
                    Profit Pool
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profitPool}</div>
                  <p className="text-xs text-slate-500">tCRO</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    Loss Pool
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lossPool}</div>
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
