"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import {
  PROPOSALS,
  type Proposal,
  SiteHeader,
  FooterSection,
} from "../../page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowUpRight } from "lucide-react"

type ProposalDetail = {
  longDescription: string
  options: {
    id: string
    label: string
    description: string
  }[]
  voters: {
    address: string
    votingPower: string
    choice: string
  }[]
  meta: {
    proposer: string
    startTime: string
    endTime: string
    snapshot: string
    quorum: string
    result: string
  }
}

const PROPOSAL_DETAILS: Record<string, ProposalDetail> = {
  "sp-01": {
    longDescription:
      "Enable a second trading lane focused on low-volatility basis trades for Absorber-focused capital. This lane would run with an independent daily risk budget and its own drawdown guardrails, while sharing the global pool limits.",
    options: [
      {
        id: "for",
        label: "For",
        description:
          "Enable the second lane with the proposed risk budget and guardrails.",
      },
      {
        id: "against",
        label: "Against",
        description:
          "Do not enable the second lane; keep the single-lane configuration.",
      },
      {
        id: "abstain",
        label: "Abstain",
        description:
          "Record presence without affecting the outcome of the proposal.",
      },
    ],
    voters: [
      {
        address: "0x4a1f...92b3",
        votingPower: "120,000 VP",
        choice: "For",
      },
      {
        address: "0x8c09...ee10",
        votingPower: "75,500 VP",
        choice: "For",
      },
      {
        address: "0x19d2...ab77",
        votingPower: "32,000 VP",
        choice: "Against",
      },
      {
        address: "0x7b33...c901",
        votingPower: "18,750 VP",
        choice: "Abstain",
      },
    ],
    meta: {
      proposer: "0x4a1f...92b3",
      startTime: "2025-01-10 09:00 UTC",
      endTime: "2025-01-13 09:00 UTC",
      snapshot: "Cronos block #15,204,118",
      quorum: "250,000 VP",
      result: "Quorum reached, majority For",
    },
  },
  "sp-02": {
    longDescription:
      "Temporarily tighten the daily risk budget from 2.5% to 2.0% of pool NAV while the AI model is retrained. This is intended as a conservative measure while new regimes are validated.",
    options: [
      {
        id: "for",
        label: "For",
        description:
          "Reduce the daily risk budget to 2.0% of NAV until further notice.",
      },
      {
        id: "against",
        label: "Against",
        description:
          "Keep the existing 2.5% daily risk budget during retraining.",
      },
      {
        id: "abstain",
        label: "Abstain",
        description:
          "Record presence without affecting the outcome of the proposal.",
      },
    ],
    voters: [
      {
        address: "0x5f21...aa10",
        votingPower: "98,400 VP",
        choice: "For",
      },
      {
        address: "0x3c77...d004",
        votingPower: "54,200 VP",
        choice: "For",
      },
      {
        address: "0xa102...44e9",
        votingPower: "26,000 VP",
        choice: "Against",
      },
      {
        address: "0x71ff...2201",
        votingPower: "12,300 VP",
        choice: "Abstain",
      },
    ],
    meta: {
      proposer: "0x5f21...aa10",
      startTime: "2025-01-14 12:00 UTC",
      endTime: "2025-01-17 12:00 UTC",
      snapshot: "Cronos block #15,309,882",
      quorum: "200,000 VP",
      result: "Quorum reached, majority For",
    },
  },
  "sp-03": {
    longDescription:
      "Introduce time-based loyalty boosts for Absorber depositors that remain in the pool across multiple epochs. Boosts would increase target APY within the existing 8–12% band while keeping drawdown rails unchanged.",
    options: [
      {
        id: "for",
        label: "For",
        description:
          "Introduce loyalty boosts with the proposed accrual schedule.",
      },
      {
        id: "against",
        label: "Against",
        description:
          "Do not introduce loyalty boosts; keep current Absorber yield policy.",
      },
      {
        id: "abstain",
        label: "Abstain",
        description:
          "Record presence without affecting the outcome of the proposal.",
      },
    ],
    voters: [
      {
        address: "0x9a01...bb21",
        votingPower: "64,800 VP",
        choice: "For",
      },
      {
        address: "0x22ee...c410",
        votingPower: "41,250 VP",
        choice: "For",
      },
      {
        address: "0xd010...008a",
        votingPower: "19,000 VP",
        choice: "Against",
      },
      {
        address: "0x84de...11c2",
        votingPower: "8,900 VP",
        choice: "Abstain",
      },
    ],
    meta: {
      proposer: "0x9a01...bb21",
      startTime: "2025-01-18 08:00 UTC",
      endTime: "2025-01-21 08:00 UTC",
      snapshot: "Cronos block #15,412,007",
      quorum: "180,000 VP",
      result: "Voting in progress",
    },
  },
  "sp-00": {
    longDescription:
      "Define and launch the initial Supacron pool parameters, including drawdown limits, daily risk budgets, fee splits, and guardrails for AI trading. This is the genesis configuration for the protocol.",
    options: [
      {
        id: "for",
        label: "For",
        description:
          "Approve the genesis configuration and launch the Supacron pool.",
      },
      {
        id: "against",
        label: "Against",
        description:
          "Reject the genesis configuration; keep the protocol paused.",
      },
    ],
    voters: [
      {
        address: "0x11aa...ee01",
        votingPower: "140,000 VP",
        choice: "For",
      },
      {
        address: "0x52c3...78ff",
        votingPower: "96,000 VP",
        choice: "For",
      },
      {
        address: "0x88de...0042",
        votingPower: "14,000 VP",
        choice: "For",
      },
      {
        address: "0x39f0...c3aa",
        votingPower: "6,000 VP",
        choice: "Against",
      },
    ],
    meta: {
      proposer: "0x11aa...ee01",
      startTime: "2024-12-01 10:00 UTC",
      endTime: "2024-12-04 10:00 UTC",
      snapshot: "Cronos block #14,980,201",
      quorum: "150,000 VP",
      result: "Passed",
    },
  },
  "sp-0x": {
    longDescription:
      "Enable the governance MVP that hands control of core risk parameters and trading lanes to a multisig council. This proposal activates the governance contracts and associated permissions.",
    options: [
      {
        id: "for",
        label: "For",
        description:
          "Enable the governance MVP and delegate control to the council.",
      },
      {
        id: "against",
        label: "Against",
        description:
          "Keep governance disabled; maintain deployer-controlled configuration.",
      },
      {
        id: "abstain",
        label: "Abstain",
        description:
          "Record presence without affecting the outcome of the proposal.",
      },
    ],
    voters: [
      {
        address: "0x7abc...ff10",
        votingPower: "82,000 VP",
        choice: "For",
      },
      {
        address: "0x44de...c001",
        votingPower: "61,500 VP",
        choice: "Against",
      },
      {
        address: "0x9300...7003",
        votingPower: "48,200 VP",
        choice: "Against",
      },
      {
        address: "0x120f...99a0",
        votingPower: "23,700 VP",
        choice: "For",
      },
    ],
    meta: {
      proposer: "0x7abc...ff10",
      startTime: "2024-12-10 15:00 UTC",
      endTime: "2024-12-13 15:00 UTC",
      snapshot: "Cronos block #15,040,552",
      quorum: "220,000 VP",
      result: "Failed to reach majority",
    },
  },
}

function getProposalAndDetail(idParam: string | undefined | null): {
  proposal: Proposal | null
  detail: ProposalDetail | null
} {
  if (!idParam) {
    return { proposal: null, detail: null }
  }
  const slug = idParam.toString().toLowerCase()
  const proposal =
    PROPOSALS.find((p) => p.id.toLowerCase() === slug) ?? null
  const detail = PROPOSAL_DETAILS[slug] ?? null
  return { proposal, detail }
}

export default function ProposalDetailPage() {
  const params = useParams<{ id?: string | string[] }>()
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id
  const { proposal, detail } = getProposalAndDetail(rawId)

  if (!proposal || !detail) {
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
            The proposal you are looking for does not exist in this demo.
          </p>
        </main>
        <FooterSection />
      </div>
    )
  }

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
              {proposal.id}
            </p>
            <h1 className="mt-2 text-balance text-2xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-3xl">
              {proposal.title.replace(`${proposal.id}: `, "")}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {detail.longDescription}
            </p>
          </div>
          <div className="grid gap-2 text-xs text-slate-600 sm:w-64">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Proposer
              </p>
              <p className="mt-1 font-mono text-xs text-slate-900">
                {detail.meta.proposer}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Result
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-900">
                {detail.meta.result}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Card className="border-slate-200 bg-white/95">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Proposal metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 pt-4 text-xs text-slate-600 sm:grid-cols-2">
              <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Start time
                </p>
                <p className="text-xs font-semibold text-slate-900">
                  {detail.meta.startTime}
                </p>
              </div>
              <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  End time
                </p>
                <p className="text-xs font-semibold text-slate-900">
                  {detail.meta.endTime}
                </p>
              </div>
              <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Last snapshot
                </p>
                <p className="text-xs font-semibold text-slate-900">
                  {detail.meta.snapshot}
                </p>
              </div>
              <div className="space-y-1 rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Quorum
                </p>
                <p className="text-xs font-semibold text-slate-900">
                  {detail.meta.quorum}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/95">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Voting options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs text-slate-600">
              {detail.options.map((option) => (
                <div
                  key={option.id}
                  className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      {option.label}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-600">
                      {option.description}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-full border-slate-200 bg-white px-3 text-[11px] font-medium hover:bg-slate-50"
                    aria-label={`Cast ${option.label} vote`}
                  >
                    Vote
                  </Button>
                </div>
              ))}
              <p className="mt-1 text-[11px] text-slate-500">
                Voting actions are illustrative only for this Cronos hackathon
                demo.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Card className="border-slate-200 bg-white/95">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Voters and voting power
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs text-slate-600">
              <div className="mb-3 grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 text-[11px] font-medium text-slate-500">
                <span>Voter</span>
                <span className="text-right">Voting power</span>
                <span className="text-right">Choice</span>
              </div>
              <div className="space-y-2">
                {detail.voters.map((voter) => (
                  <div
                    key={voter.address}
                    className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <p className="font-mono text-[11px] text-slate-900">
                      {voter.address}
                    </p>
                    <p className="text-right text-[11px] font-medium text-slate-900">
                      {voter.votingPower}
                    </p>
                    <p className="text-right text-[11px] font-medium text-slate-700">
                      {voter.choice}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/95">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900">
                View on explorer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs text-slate-600">
              <p>
                In a full deployment, this section would link to the on-chain
                governance contracts and execution transactions for this
                proposal.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-slate-200 bg-white px-4 text-xs font-medium hover:bg-slate-50"
                aria-label="Open governance explorer"
              >
                Open explorer
                <ArrowUpRight className="ml-2 h-3 w-3" aria-hidden="true" />
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
      <FooterSection />
    </div>
  )
}
