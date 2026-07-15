import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORY_LABELS, transactionCategorySchema } from "@/lib/schemas/transaction";
import { updateTransaction } from "@/app/(app)/ledger/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Database } from "@/lib/database.types";

type Row = Database["public"]["Tables"]["transactions"]["Row"];

const editFormSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  ref_number: z.string().min(1, "Reference number is required"),
  counterparty_name: z.string().nullable().optional(),
  counterparty_number: z.string().nullable().optional(),
  category: transactionCategorySchema,
  direction: z.enum(["send", "receive"]),
  fee_computed: z.number().min(0, "Fee cannot be negative"),
  status: z.enum(["needs_review", "confirmed"]),
  notes: z.string().nullable().optional(),
});

type EditFormValues = z.infer<typeof editFormSchema>;

export function EditTransactionDialog({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: Row | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
  });

  useEffect(() => {
    if (transaction) {
      reset({
        amount: Number(transaction.amount),
        ref_number: transaction.ref_number,
        counterparty_name: transaction.counterparty_name,
        counterparty_number: transaction.counterparty_number,
        category: transaction.category,
        direction: transaction.direction,
        fee_computed: Number(transaction.fee_computed),
        status: transaction.status,
        notes: transaction.notes,
      });
    }
  }, [transaction, reset]);

  async function onSubmit(data: EditFormValues) {
    if (!transaction) return;
    const result = await updateTransaction(transaction.id, data);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Transaction updated");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="direction">Direction</Label>
              <select
                id="direction"
                {...register("direction")}
                className="w-full rounded-xl border border-hairline bg-canvas p-2.5 text-sm text-ink outline-none"
              >
                <option value="send">Send (Out)</option>
                <option value="receive">Receive (In)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                {...register("category")}
                className="w-full rounded-xl border border-hairline bg-canvas p-2.5 text-sm text-ink outline-none"
              >
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (₱)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fee_computed">Fee (₱)</Label>
              <Input
                id="fee_computed"
                type="number"
                step="0.01"
                {...register("fee_computed", { valueAsNumber: true })}
              />
              {errors.fee_computed && (
                <p className="text-xs text-destructive">{errors.fee_computed.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ref_number">Reference Number</Label>
            <Input id="ref_number" {...register("ref_number")} />
            {errors.ref_number && (
              <p className="text-xs text-destructive">{errors.ref_number.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="counterparty_name">Counterparty Name</Label>
              <Input id="counterparty_name" {...register("counterparty_name")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="counterparty_number">Counterparty Number</Label>
              <Input id="counterparty_number" {...register("counterparty_number")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              {...register("status")}
              className="w-full rounded-xl border border-hairline bg-canvas p-2.5 text-sm text-ink outline-none"
            >
              <option value="needs_review">Needs Review</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes / Comment</Label>
            <textarea
              id="notes"
              rows={2}
              {...register("notes")}
              className="w-full rounded-xl border border-hairline bg-canvas p-2.5 text-sm text-ink outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
