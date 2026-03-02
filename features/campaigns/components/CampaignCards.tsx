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
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
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
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground">{title}</CardTitle>
          <Badge variant="outline">{pct.toFixed(1)}%</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={pct} className="h-2" />
        <div className="text-sm text-muted-foreground">
          {Number(sold || 0).toLocaleString()} / {Number(target || 0).toLocaleString()} sqm
        </div>
      </CardContent>
    </Card>
  );
}
