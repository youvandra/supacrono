"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Contract, formatUnits } from "ethers"
import { ArrowLeft } from "lucide-react"

import { supabase } from "@/lib/supabaseClient"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FooterSection,
  RPC_PROVIDER,
  SiteHeader,
  connectWalletCronosEvm,
  formatProposalDate,
  getConnectedAccount,
  type DbProposal,
} from "../../page"
import { SUPA_ABI, SUPA_CONTRACT_ADDRESS } from "@/lib/smart-contract/supa"

type Choice = "yes" | "no" | "abstain"

type ProposalVote = {
  id: string
  voter_address: string
  voting_power: number
  choice: Choice
  created_at: string
}

export default function ProposalDetailPage() {
  const params = useParams<{ id?: string | string[] }>()
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id

  const [proposal, setProposal] = useState<DbProposal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [account, setAccount] = useState<string | null>(null)
  const [votingPower, setVotingPower] = useState<string | null>(null)
  const [isLoadingVotingPower, setIsLoadingVotingPower] = useState(false)

  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null)
  const [isSubmittingVote, setIsSubmittingVote] = useState(false)
  const [voteError, setVoteError] = useState<string | null>(null)
  const [voteSuccess, setVoteSuccess] = useState<string | null>(null)
  const [votes, setVotes] = useState<ProposalVote[]>([])
  const [isLoadingVotes, setIsLoadingVotes] = useState(false)

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
    if (!rawId) {
      setIsLoading(false)
      setLoadError("Proposal not found.")
      return
    }

    const slug = rawId.toString()

    let cancelled = false

    async function loadProposal() {
      setIsLoading(true)
      setLoadError(null)
      try {
        const { data, error } = await supabase
          .from("proposals")
          .select("*")
          .ilike("short_id", slug)
          .maybeSingle()

        if (cancelled) {
          return
        }

        if (error) {
          setLoadError("Failed to load proposal.")
          return
        }

        if (!data) {
          setLoadError("Proposal not found.")
          return
        }

        setProposal(data as DbProposal)
      } finally {
        if (cancelled) {
          return
        }
        setIsLoading(false)
      }
    }

    loadProposal()

    return () => {
      cancelled = true
    }
  }, [rawId])

  useEffect(() => {
    if (!proposal) {
      setVotes([])
      return
    }

    let cancelled = false

    async function loadVotes(currentProposalId: string) {
      setIsLoadingVotes(true)
      try {
        const { data, error } = await supabase
          .from("proposal_votes")
          .select("*")
          .eq("proposal_id", currentProposalId)
          .order("created_at", { ascending: true })

        if (cancelled) {
          return
        }

        if (error) {
          return
        }

        setVotes((data ?? []) as ProposalVote[])
      } finally {
        if (cancelled) {
          return
        }
        setIsLoadingVotes(false)
      }
    }

    loadVotes(proposal.id)

    return () => {
      cancelled = true
    }
  }, [proposal])

  useEffect(() => {
    if (!account) {
      setVotingPower(null)
      return
    }

    let cancelled = false

    async function loadVotingPower() {
      setIsLoadingVotingPower(true)
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
        setVotingPower(formatted)
      } catch {
        if (cancelled) {
          return
        }
        setVotingPower(null)
      } finally {
        if (cancelled) {
          return
        }
        setIsLoadingVotingPower(false)
      }
    }

    loadVotingPower()

    return () => {
      cancelled = true
    }
  }, [account])

  async function handleConnectWallet() {
    setVoteError(null)
    setVoteSuccess(null)
    if (!account) {
      const addr = await connectWalletCronosEvm()
      if (addr) {
        setAccount(addr)
      }
    }
  }

  async function handleVote() {
    if (!proposal) {
      return
    }
    if (!selectedChoice) {
      setVoteError("Please select a voting option.")
      setVoteSuccess(null)
      return
    }
    if (typeof window === "undefined") {
      return
    }

    setVoteError(null)
    setVoteSuccess(null)
    setIsSubmittingVote(true)

    try {
      let activeAccount = account
      if (!activeAccount) {
        const addr = await connectWalletCronosEvm()
        if (!addr) {
          setIsSubmittingVote(false)
          return
        }
        activeAccount = addr
        setAccount(addr)
      }

      const contract = new Contract(
        SUPA_CONTRACT_ADDRESS,
        SUPA_ABI,
        RPC_PROVIDER
      )
      const [balance, decimals] = await Promise.all([
        contract.balanceOf(activeAccount),
        contract.decimals(),
      ])
      const numeric = Number(formatUnits(balance, decimals))
      const weight = Number.isFinite(numeric) ? Math.floor(numeric) : 0

      if (weight <= 0) {
        setVoteError("You have no SUPA voting power.")
        return
      }

      const normalizedAddress = activeAccount.toLowerCase()

      const { data: existingVote } = await supabase
        .from("proposal_votes")
        .select("id")
        .eq("proposal_id", proposal.id)
        .eq("voter_address", normalizedAddress)
        .maybeSingle()

      if (existingVote) {
        setVoteError("You already voted on this proposal.")
        return
      }

      const yes = Number(proposal.yes_votes ?? 0)
      const no = Number(proposal.no_votes ?? 0)
      const abstain = Number(proposal.abstain_votes ?? 0)

      const updated =
        selectedChoice === "yes"
          ? {
              yes_votes: yes + weight,
              no_votes: no,
              abstain_votes: abstain,
            }
          : selectedChoice === "no"
          ? {
              yes_votes: yes,
              no_votes: no + weight,
              abstain_votes: abstain,
            }
          : {
              yes_votes: yes,
              no_votes: no,
              abstain_votes: abstain + weight,
            }

      const { error } = await supabase
        .from("proposals")
        .update(updated)
        .eq("id", proposal.id)

      if (error) {
        setVoteError("Failed to record vote.")
        return
      }

      const { error: voteErrorDb } = await supabase.from("proposal_votes").insert({
        proposal_id: proposal.id,
        voter_address: normalizedAddress,
        voting_power: weight,
        choice: selectedChoice,
      })

      if (voteErrorDb) {
        setVoteError("Failed to record vote.")
        return
      }

      const { data: updatedVotes, error: loadVotesError } = await supabase
        .from("proposal_votes")
        .select("*")
        .eq("proposal_id", proposal.id)
        .order("created_at", { ascending: true })

      if (!loadVotesError) {
        setVotes((updatedVotes ?? []) as ProposalVote[])
      }

      setProposal({
        ...proposal,
        ...updated,
      })
      setVoteSuccess("Vote recorded.")
    } catch {
      setVoteError("Failed to record vote.")
    } finally {
      setIsSubmittingVote(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] text-slate-900">
        <SiteHeader />
        <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl flex-col px-4 pb-16 pt-16 sm:px-6 lg:px-8">
          <p className="text-sm text-slate-600">Loading proposal...</p>
        </main>
        <FooterSection />
      </div>
    )
  }

  if (!proposal || loadError) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] text-slate-900">
        <SiteHeader />
        <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl flex-col px-4 pb-16 pt-16 sm:px-6 lg:px-8">
          <div className="mb-4">
            <Link
              href="/governance"
              className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="mr-1.5 h-3 w-3" aria-hidden="true" />
              Back to governance
            </Link>
          </div>
          <h1 className="text-xl font-semibold text-slate-900">
            Proposal not found
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {loadError ?? "The proposal you are looking for does not exist."}
          </p>
        </main>
        <FooterSection />
      </div>
    )
  }

  const endTimeLabel = formatProposalDate(proposal.end_time)
  const createdAtLabel = formatProposalDate(proposal.created_at)

  const yesVotes = Number(proposal.yes_votes ?? 0)
  const noVotes = Number(proposal.no_votes ?? 0)
  const abstainVotes = Number(proposal.abstain_votes ?? 0)
  const totalVotes = yesVotes + noVotes + abstainVotes

  const yesPercent =
    totalVotes === 0 ? 0 : Math.round((yesVotes / totalVotes) * 100)
  const noPercent =
    totalVotes === 0 ? 0 : Math.round((noVotes / totalVotes) * 100)
  const abstainPercent =
    totalVotes === 0 ? 0 : Math.round((abstainVotes / totalVotes) * 100)

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-slate-900">
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href="/governance"
            className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="mr-1.5 h-3 w-3" aria-hidden="true" />
            Back to governance
          </Link>
          <Badge className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-800">
            Governance proposal
          </Badge>
        </div>

        <section className="flex flex-col gap-4 border-b border-slate-200/80 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-600">
              {proposal.short_id}
            </p>
            <h1 className="mt-2 text-balance text-2xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-3xl">
              {proposal.title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {proposal.description}
            </p>
            {proposal.docs_url ? (
              <p className="mt-3 text-xs">
                <a
                  href={proposal.docs_url}
                  className="font-medium text-slate-900 underline underline-offset-4"
                >
                  View specification
                </a>
              </p>
            ) : null}
          </div>
          <div className="grid gap-2 text-xs text-slate-600 sm:w-64">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Status
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-900">
                {proposal.status === "upcoming" ? "Ongoing" : "Ended"} ·{" "}
                {proposal.outcome}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Quorum
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-900">
                {proposal.quorum ? proposal.quorum.toString() : "Not set"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Card className="border-slate-200 bg-white/95">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Vote on this proposal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs text-slate-600">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Your wallet
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-slate-900">
                    {account
                      ? `${account.slice(0, 6)}...${account.slice(-4)}`
                      : "Not connected"}
                  </p>
                </div>
                {!account ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-full border-slate-200 bg-white px-3 text-[11px] font-medium hover:bg-slate-50"
                    onClick={handleConnectWallet}
                  >
                    Connect wallet
                  </Button>
                ) : null}
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Your voting power
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-900">
                  {account
                    ? isLoadingVotingPower
                      ? "Loading..."
                      : votingPower
                      ? `${votingPower} SUPA`
                      : "0 SUPA"
                    : "Connect wallet to see voting power"}
                </p>
              </div>
              <div className="space-y-2">
                {([
                  { id: "yes", label: "Yes", description: "Support this change" },
                  {
                    id: "no",
                    label: "Against",
                    description: "Do not support this change",
                  },
                  {
                    id: "abstain",
                    label: "Abstain",
                    description: "Record presence without affecting the outcome",
                  },
                ] as { id: Choice; label: string; description: string }[]).map(
                  (option) => {
                    const isActive = selectedChoice === option.id
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedChoice(option.id)}
                        className={`flex w-full items-start justify-between gap-3 rounded-lg border px-3 py-2 text-left ${
                          isActive
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          <p
                            className={`text-xs font-semibold ${
                              isActive ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {option.label}
                          </p>
                          <p
                            className={`mt-1 text-[11px] ${
                              isActive ? "text-slate-100" : "text-slate-600"
                            }`}
                          >
                            {option.description}
                          </p>
                        </div>
                        <span
                          className={`mt-1 h-3 w-3 rounded-full border ${
                            isActive
                              ? "border-white bg-white"
                              : "border-slate-300"
                          }`}
                        />
                      </button>
                    )
                  }
                )}
              </div>
              {voteError ? (
                <p className="text-[11px] text-rose-600">{voteError}</p>
              ) : null}
              {voteSuccess ? (
                <p className="text-[11px] text-emerald-600">{voteSuccess}</p>
              ) : null}
              <Button
                size="sm"
                className="mt-1 w-full rounded-full bg-slate-900 text-[11px] font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmittingVote || !selectedChoice}
                onClick={handleVote}
              >
                {isSubmittingVote ? "Submitting vote..." : "Submit vote"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/95">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Proposal metadata and votes
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 pt-4 text-xs text-slate-600 sm:grid-cols-2">
              <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Created at
                </p>
                <p className="text-xs font-semibold text-slate-900">
                  {createdAtLabel ?? "—"}
                </p>
              </div>
              <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Ends at
                </p>
                <p className="text-xs font-semibold text-slate-900">
                  {endTimeLabel ?? "—"}
                </p>
              </div>
              <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Total votes
                </p>
                <p className="text-xs font-semibold text-slate-900">
                  {totalVotes}
                </p>
              </div>
              <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Breakdown
                </p>
                <p className="text-xs font-semibold text-slate-900">
                  Yes {yesVotes} ({yesPercent}%)
                </p>
                <p className="text-xs font-semibold text-slate-900">
                  Against {noVotes} ({noPercent}%)
                </p>
                <p className="text-xs font-semibold text-slate-900">
                  Abstain {abstainVotes} ({abstainPercent}%)
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
        <section className="mt-8">
          <Card className="border-slate-200 bg-white/95">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Voters
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs text-slate-600">
              {isLoadingVotes ? (
                <p className="text-[11px] text-slate-500">Loading voters...</p>
              ) : votes.length === 0 ? (
                <p className="text-[11px] text-slate-500">
                  No votes have been recorded for this proposal yet.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 text-[11px] font-medium text-slate-500">
                    <span>Address</span>
                    <span className="text-right">Voting power</span>
                    <span className="text-right">Choice</span>
                  </div>
                  {votes.map((vote) => (
                    <div
                      key={vote.id}
                      className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"
                    >
                      <p className="font-mono text-[11px] text-slate-900">
                        {vote.voter_address}
                      </p>
                      <p className="text-right text-[11px] font-medium text-slate-900">
                        {vote.voting_power.toString()}
                      </p>
                      <p className="text-right text-[11px] font-medium text-slate-700">
                        {vote.choice}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
      <FooterSection />
    </div>
  )
}
