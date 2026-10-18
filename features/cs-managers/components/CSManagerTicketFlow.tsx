import type { CSManagerDashboard } from "../schemas/cs-manager.schema";

export function CSManagerTicketFlow({ flow }: { flow: CSManagerDashboard["target"]["ticket_flow"] }) {
  const ceiling = Math.max(1, ...flow.flatMap((month) => [month.created, month.resolved]));
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5" aria-label="Ticket flow over six months">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><h2 className="text-sm font-semibold text-gray-900">Tickets in and out</h2><p className="text-xs text-gray-500">Arrivals and resolutions by month, for this manager</p></div>
        <div className="flex gap-3 text-xs text-gray-600"><span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-amber-500" />Arrived</span><span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-[#00695C]" />Resolved</span></div>
      </div>
      <div className="mt-5 grid grid-cols-6 gap-2 sm:gap-4">
        {flow.map((point) => (
          <div key={point.month} className="text-center">
            <div className="flex h-28 items-end justify-center gap-1 rounded bg-gray-50 px-1" title={`${point.month}: ${point.created} arrived, ${point.resolved} resolved`}>
              <div className="w-3 rounded-t bg-amber-500" style={{ height: `${Math.max(2, point.created / ceiling * 100)}%` }} aria-label={`${point.created} arrived`} />
              <div className="w-3 rounded-t bg-[#00695C]" style={{ height: `${Math.max(2, point.resolved / ceiling * 100)}%` }} aria-label={`${point.resolved} resolved`} />
            </div>
            <p className="mt-1 text-[11px] text-gray-600">{point.month.slice(5)}</p>
            <p className="text-[11px] tabular-nums text-gray-500">{point.created} / {point.resolved}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
