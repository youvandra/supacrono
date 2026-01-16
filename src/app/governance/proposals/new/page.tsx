"use client"

import Link from "next/link"
import { useState } from "react"

import { supabase } from "@/lib/supabaseClient"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SiteHeader, FooterSection } from "../../page"

export default function NewProposalPage() {
  const [shortId, setShortId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [docsUrl, setDocsUrl] = useState("")
  const [endTime, setEndTime] = useState("")
  const [quorum, setQuorum] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (
      !shortId.trim() ||
      !title.trim() ||
      !description.trim() ||
      !endTime.trim() ||
      !quorum.trim()
    ) {
      setError("Please fill in all required fields.")
      return
    }

    const parsedQuorum = Number(quorum)
    if (!Number.isFinite(parsedQuorum) || parsedQuorum <= 0) {
      setError("Quorum must be a positive number.")
      return
    }

    const endTimeValue = new Date(endTime)
    if (Number.isNaN(endTimeValue.getTime())) {
      setError("End time is not a valid date.")
      return
    }

    setIsSubmitting(true)

    try {
      const { error: insertError } = await supabase.from("proposals").insert([
        {
          short_id: shortId.trim(),
          title: title.trim(),
          description: description.trim(),
          docs_url: docsUrl.trim() || null,
          end_time: endTimeValue.toISOString(),
          quorum: parsedQuorum,
        },
      ])

      if (insertError) {
        setError(insertError.message)
        return
      }

      setSuccessMessage("Proposal created successfully.")
      setShortId("")
      setTitle("")
      setDescription("")
      setDocsUrl("")
      setEndTime("")
      setQuorum("")
    } catch {
      setError("Failed to create proposal.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-slate-900">
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <section className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Badge className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-800">
              Create proposal
            </Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              New governance proposal
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Submit a new proposal to be tracked and surfaced in the
              governance interface.
            </p>
          </div>
          <Link
            href="/governance"
            className="text-xs font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
          >
            Back to governance
          </Link>
        </section>
        <section>
          <Card className="border-slate-200 bg-white/90">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Proposal details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-sm text-slate-700">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">
                      Proposal ID
                    </label>
                    <input
                      type="text"
                      value={shortId}
                      onChange={(event) => setShortId(event.target.value)}
                      placeholder="e.g. SP-04"
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-0"
                    />
                    <p className="text-[11px] text-slate-500">
                      Short identifier used in the governance list.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">
                      Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="High-level summary of the proposed change"
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-0"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Explain what this proposal changes and why it matters."
                    rows={5}
                    className="block w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">
                    Docs URL (optional)
                  </label>
                  <input
                    type="url"
                    value={docsUrl}
                    onChange={(event) => setDocsUrl(event.target.value)}
                    placeholder="Link to full specification or discussion thread"
                    className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-0"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">
                      End time
                    </label>
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-0"
                    />
                    <p className="text-[11px] text-slate-500">
                      When voting closes for this proposal.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">
                      Quorum (voting power)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={quorum}
                      onChange={(event) => setQuorum(event.target.value)}
                      placeholder="e.g. 180000"
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900 focus:ring-0"
                    />
                    <p className="text-[11px] text-slate-500">
                      Minimum voting power required for this proposal.
                    </p>
                  </div>
                </div>
                {error ? (
                  <p className="text-xs text-rose-600">{error}</p>
                ) : null}
                {successMessage ? (
                  <p className="text-xs text-emerald-600">{successMessage}</p>
                ) : null}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                    onClick={() => {
                      setShortId("")
                      setTitle("")
                      setDescription("")
                      setDocsUrl("")
                      setEndTime("")
                      setQuorum("")
                      setError(null)
                      setSuccessMessage(null)
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="rounded-full bg-slate-900 px-4 text-xs font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Create proposal"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
      <FooterSection />
    </div>
  )
}
