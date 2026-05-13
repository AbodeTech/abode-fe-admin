import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
}

export function DashboardCard({ title, value, icon: Icon }: DashboardCardProps) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex min-w-0 flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="min-w-0 flex-1 text-sm font-medium capitalize leading-snug wrap-break-word pr-1">
          {title}
        </CardTitle>
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      </CardHeader>
      <CardContent className="min-w-0">
        <div className="min-w-0 max-w-full text-xl font-bold tabular-nums leading-tight tracking-tight break-all sm:text-2xl">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
