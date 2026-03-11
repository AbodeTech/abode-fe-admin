"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { CommissionConfig } from "../hooks/use-commission-config";

function RateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function toPercent(val: number) {
  return `${(val * 100).toFixed(2)}%`;
}

function toNGN(val: number) {
  return `₦${val.toLocaleString()}`;
}

function TierRates({
  label,
  rates,
}: {
  label: string;
  rates: { [key: string]: number };
}) {
  const labelMap: Record<string, string> = {
    founder: "Founder",
    associate_pro: "Associate Pro",
    premium: "Premium",
    default: "Default",
  };

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{label}</p>
      <div className="ml-2">
        {Object.entries(rates).map(([key, val]) => (
          <RateRow key={key} label={labelMap[key] ?? key} value={toPercent(val)} />
        ))}
      </div>
    </div>
  );
}

interface CommissionRatesCardProps {
  config: CommissionConfig;
}

export function CommissionRatesCard({ config }: CommissionRatesCardProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Flex Commission (Direct) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Flex Commission (Direct)</CardTitle>
          <CardDescription>Rates for flex asset sales</CardDescription>
        </CardHeader>
        <CardContent>
          <RateRow label="Founder" value={toPercent(config.flexCommission.direct.founder)} />
          <RateRow label="Associate Pro" value={toPercent(config.flexCommission.direct.associate_pro)} />
          <RateRow label="Premium" value={toPercent(config.flexCommission.direct.premium)} />
          <RateRow label="Default" value={toPercent(config.flexCommission.direct.default)} />
        </CardContent>
      </Card>

      {/* Full Ownership Commission */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Full Ownership Commission</CardTitle>
          <CardDescription>Direct, upline, and topline rates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TierRates label="Direct" rates={config.fullOwnershipCommission.direct as unknown as Record<string, number>} />
          <Separator />
          <TierRates label="Upline" rates={config.fullOwnershipCommission.upline as unknown as Record<string, number>} />
          <Separator />
          <TierRates label="Topline" rates={config.fullOwnershipCommission.topline as unknown as Record<string, number>} />
        </CardContent>
      </Card>

      {/* Removal Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Removal Rates</CardTitle>
          <CardDescription>Commission deduction on asset removal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm font-medium">Flex Removal (Direct)</p>
          <div className="ml-2">
            <RateRow label="Associate Pro" value={toPercent(config.flexRemoval.direct.associate_pro)} />
            <RateRow label="Default" value={toPercent(config.flexRemoval.direct.default)} />
          </div>
          <Separator />
          <p className="text-sm font-medium pt-1">Full Ownership Removal</p>
          <div className="ml-2">
            <TierRates label="Direct" rates={config.fullOwnershipRemoval.direct as unknown as Record<string, number>} />
            <RateRow label="Upline" value={toPercent(config.fullOwnershipRemoval.upline)} />
            <RateRow label="Topline" value={toPercent(config.fullOwnershipRemoval.topline)} />
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">General Settings</CardTitle>
          <CardDescription>Taxes, thresholds, and fees</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <RateRow label="WHT" value={toPercent(config.whtPercentage)} />
          <RateRow label="High Commission Alert" value={toNGN(config.highCommissionAlertThreshold)} />
          <RateRow label="Upgrade Commission" value={toPercent(config.upgradeCommissionPercentage)} />
          <RateRow label="Associate Pro Fee" value={toNGN(config.associateProFee)} />
          <Separator className="my-2" />
          <RateRow label="Version" value={`v${config.version}`} />
          <RateRow
            label="Last Modified"
            value={new Date(config.updatedAt).toLocaleDateString("en-NG", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
