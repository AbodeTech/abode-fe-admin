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
    <Card className="border border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {note ? <p className="text-xs text-gray-500 mt-1">{note}</p> : null}
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
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Badge variant="outline">{pct.toFixed(1)}%</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={pct} className="h-2" />
        <div className="text-sm text-gray-600">
          {Number(sold || 0).toLocaleString()} / {Number(target || 0).toLocaleString()} sqm
        </div>
      </CardContent>
    </Card>
  );
}
