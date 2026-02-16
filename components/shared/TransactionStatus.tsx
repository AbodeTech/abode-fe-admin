interface TransactionStatusProps {
  status?: string | null;
}

export function TransactionStatus({ status = "pending" }: TransactionStatusProps) {
  if (status === "pending") {
    return (
      <div className="py-0.5 px-2 border border-[#FEFCCA] rounded-2xl bg-[#FEF3F2AB] flex items-center w-fit gap-x-1">
        <div className="w-2 h-2 rounded-full bg-[#B4A418]" />
        <p className="text-xs font-medium text-[#B4A418]">Pending</p>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className="py-0.5 px-2 border border-[#ABEFC6] rounded-2xl bg-[#ECFDF3AB] flex items-center w-fit gap-x-1">
        <div className="w-2 h-2 rounded-full bg-[#067647]" />
        <p className="text-xs font-medium text-[#067647]">Approved</p>
      </div>
    );
  }

  if (status === "declined") {
    return (
      <div className="py-0.5 px-2 border border-[#FECDCA] rounded-2xl bg-[#FEF3F2AB] flex items-center w-fit gap-x-1">
        <div className="w-2 h-2 rounded-full bg-[#B42318]" />
        <p className="text-xs font-medium text-[#B42318]">Declined</p>
      </div>
    );
  }

  return null;
}
