"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface MetricCardProps {
  title: string;
  value: string | number;
  note?: string;
}

export function MetricCard({ title, value, note }: MetricCardProps) {
  return (
    <Card className="min-w-0 overflow-hidden border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="wrap-break-word text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">
        <div className="min-w-0 max-w-full break-all text-xl font-bold tabular-nums text-foreground sm:text-2xl">{value}</div>
        {note ? <p className="mt-1 text-xs text-muted-foreground">{note}</p> : null}
      </CardContent>
    </Card>
  );
}

interface ProgressCardProps {
  title: string;
  sold?: number | null;
  target?: number | null;
  percentage?: number | null;
}

export function ProgressCard({ title, sold, target, percentage }: ProgressCardProps) {
  const pct = Math.max(0, Math.min(100, Number(percentage || 0)));
  return (
    <Card className="min-w-0 overflow-hidden border-border bg-card">
      <CardHeader>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="min-w-0 wrap-break-word text-foreground">{title}</CardTitle>
          <Badge variant="outline" className="w-fit shrink-0">
            {pct.toFixed(1)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={pct} className="h-2" />
        <div className="wrap-break-word text-sm text-muted-foreground">
          {Number(sold || 0).toLocaleString()} / {Number(target || 0).toLocaleString()} sqm
        </div>
      </CardContent>
    </Card>
  );
}
