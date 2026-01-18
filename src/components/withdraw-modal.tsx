import { Button } from "@/components/ui/button"

type WithdrawModalProps = {
  open: boolean
  role: "taker" | "absorber"
  amount: string
  error: string | null
  isSubmitting: boolean
  onClose: () => void
  onConfirm: () => void
  onRoleChange: (role: "taker" | "absorber") => void
  onAmountChange: (value: string) => void
}

export function WithdrawModal({
  open,
  role,
  amount,
  error,
  isSubmitting,
  onClose,
  onConfirm,
  onRoleChange,
  onAmountChange,
}: WithdrawModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl sm:p-5">
        <h2 className="text-sm font-semibold text-slate-900">
          Withdraw from SupaCapitalPool
        </h2>
        <p className="mt-1 text-[11px] text-slate-500">
          Choose role and amount of tCRO to withdraw on-chain.
        </p>
        <div className="mt-4 flex gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => onRoleChange("taker")}
            className={`flex-1 rounded-full border px-3 py-2 font-medium ${
              role === "taker"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
            }`}
          >
            Taker
          </button>
          <button
            type="button"
            onClick={() => onRoleChange("absorber")}
            className={`flex-1 rounded-full border px-3 py-2 font-medium ${
              role === "absorber"
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
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
          />
        </div>
        {error ? (
          <p className="mt-2 text-[11px] text-rose-600">{error}</p>
        ) : null}
        <div className="mt-4 flex justify-end gap-2 text-[11px]">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full px-3"
            onClick={() => {
              if (!isSubmitting) {
                onClose()
              }
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="rounded-full px-4"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Confirming..." : "Confirm withdraw"}
          </Button>
        </div>
      </div>
    </div>
  )
}

