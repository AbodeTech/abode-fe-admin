"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Stacked cards for &lt; lg; pair with {@link AdminDesktopTableWrap}. */
export function AdminMobileStack({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-3 lg:hidden", className)}>{children}</div>;
}

export function AdminMobileCard({
  title,
  subtitle,
  children,
  className,
  onClick,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const hasHeader = title != null || subtitle != null;
  return (
    <Card
      className={cn(
        "border border-[#E5EAEF] shadow-sm",
        onClick && "cursor-pointer transition-colors hover:bg-muted/40",
        className
      )}
      onClick={onClick}
    >
      {hasHeader && (
        <CardHeader className="space-y-1 pb-2">
          {title != null && <CardTitle className="text-base font-semibold leading-tight">{title}</CardTitle>}
          {subtitle != null && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </CardHeader>
      )}
      <CardContent className={cn(hasHeader ? "pt-0" : "pt-4", "space-y-2")}>{children}</CardContent>
    </Card>
  );
}

export function AdminMobileField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <div className="min-w-0 text-right font-medium wrap-break-word text-foreground">{value}</div>
    </div>
  );
}

/** Desktop table region: hidden below lg breakpoint. */
export function AdminDesktopTableWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("hidden min-w-0 lg:block", className)}>{children}</div>;
}
