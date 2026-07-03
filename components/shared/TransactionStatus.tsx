interface TransactionStatusProps {
  status?: string | null;
}

// Each entry uses complete, literal class strings (not concatenated) so
// Tailwind's JIT compiler picks up the arbitrary color values.
const STATUS_STYLES: Record<
  string,
  { label: string; wrapper: string; dot: string; text: string }
> = {
  pending: {
    label: "Pending",
    wrapper: "border-[#FEFCCA] bg-[#FEF3F2AB]",
    dot: "bg-[#B4A418]",
    text: "text-[#B4A418]",
  },
  approved: {
    label: "Approved",
    wrapper: "border-[#ABEFC6] bg-[#ECFDF3AB]",
    dot: "bg-[#067647]",
    text: "text-[#067647]",
  },
  "auto-approved": {
    label: "Auto-approved",
    wrapper: "border-[#ABEFC6] bg-[#ECFDF3AB]",
    dot: "bg-[#067647]",
    text: "text-[#067647]",
  },
  completed: {
    label: "Completed",
    wrapper: "border-[#ABEFC6] bg-[#ECFDF3AB]",
    dot: "bg-[#067647]",
    text: "text-[#067647]",
  },
  declined: {
    label: "Declined",
    wrapper: "border-[#FECDCA] bg-[#FEF3F2AB]",
    dot: "bg-[#B42318]",
    text: "text-[#B42318]",
  },
  // System failure — amber, to distinguish from a manual "declined".
  "auto-failed": {
    label: "Auto-failed",
    wrapper: "border-[#FEDF89] bg-[#FFFAEB]",
    dot: "bg-[#B54708]",
    text: "text-[#B54708]",
  },
};

export function TransactionStatus({ status = "pending" }: TransactionStatusProps) {
  const style = STATUS_STYLES[(status ?? "").toLowerCase()];
  if (!style) return null;

  return (
    <div className={`py-0.5 px-2 border rounded-2xl flex items-center w-fit gap-x-1 ${style.wrapper}`}>
      <div className={`w-2 h-2 rounded-full ${style.dot}`} />
      <p className={`text-xs font-medium ${style.text}`}>{style.label}</p>
    </div>
  );
}
