"use client"

import {
  FooterSection,
  GovernanceGrid,
  GovernanceHero,
  SiteHeader,
} from "./components/governance-sections"

export {
  CRONOS_CHAIN_ID_HEX,
  PROPOSALS,
  RPC_PROVIDER,
  connectWalletCronosEvm,
  formatProposalDate,
  formatTokenAmount,
  getConnectedAccount,
  FooterSection,
  SiteHeader,
} from "./components/governance-sections"

export type {
  DbProposal,
  EthereumProvider,
  Proposal,
  ProposalFilter,
  ProposalStatus,
} from "./components/governance-sections"

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
