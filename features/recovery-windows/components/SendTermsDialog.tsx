"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { cn } from "@/lib/utils";

import type { MoveProduct, RecoveryDetail, SendTermsPayload } from "../schemas/recovery-window.schema";
import { useSendRecoveryTerms } from "../hooks/use-recovery-actions";
import { useMoveEstates, useMoveEstateTree } from "../hooks/use-recovery-windows";
import { errorText, naira, productLabel } from "./format";

const CHANGE_FEE = 100_000;
const num = (v: string) => Number(String(v).replace(/,/g, "")) || 0;
const money = (n: number) => (n ? n.toLocaleString("en-NG", { maximumFractionDigits: 2 }) : "");
const round2 = (n: number) => Math.round(n * 100) / 100;

const ERROR_TEXT: Record<string, string> = {
  CARRY_OVER_MISMATCH: "The carry-over must add up to everything paid on the current plan.",
  LAND_CARRY_EXCEEDS_PRICE: "What's carried to the land (plus any up-front land) is more than the land price.",
  LEVY_CARRY_EXCEEDS_PRICE: "What's carried to the levy is more than the levy price.",
  TENOR_REQUIRED: "Set a plan length: there's land left to pay.",
  LEVY_TENOR_REQUIRED: "Set the levy months: there's levy left to pay.",
  CUSTOMER_NOTE_REQUIRED_FOR_A_DIFFERENT_OPTION: "Add a note to the customer explaining the different option.",
  PAYMENT_TYPE_REQUIRED: "Pick partially or all-inclusive for the levy.",
  RECOVERY_MOVE_PAYMENT_PENDING: "A move payment is being checked. Decide it on Asset transactions first.",
  SIZE_NOT_AVAILABLE: "That size isn't on sale in this estate any more.",
  ASSET_OFFER_NOT_AVAILABLE: "This estate doesn't sell that product right now.",
  NOT_ENOUGH_UNITS: "Not enough plots of that size are left.",
  CHOOSE_A_DIFFERENT_ESTATE: "That's the estate they're leaving. Pick another.",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: RecoveryDetail;
}

/**
 * Admin's answer to a customer's choice: their choice, or a different option. Every
 * figure is free (admin is the one offering) and either fee can be waived. Starts
 * from the customer's latest choice and the estate's list price.
 */
export function SendTermsDialog({ open, onOpenChange, record }: Props) {
  const choice = record.choices.at(-1) ?? null;
  const paidLand = record.snapshot.land_paid;
  const paidLevy = record.snapshot.document_paid;
  const carryTotal = round2(paidLand + paidLevy);
  const feeOwed = record.plan?.default_fee_outstanding ?? record.snapshot.default_fee_owed;

  const [type, setType] = useState<MoveProduct>((choice?.asset_type as MoveProduct) ?? "full-ownership");
  const [assetId, setAssetId] = useState(choice?.asset_id ?? "");
  const [size, setSize] = useState(choice ? String(choice.size_sqm) : "");
  const [units, setUnits] = useState(String(choice?.units ?? 1));
  const [landPrice, setLandPrice] = useState(money(choice?.list_land_price ?? 0));
  const [tenor, setTenor] = useState(choice?.tenor_months ? String(choice.tenor_months) : "");
  const [paymentType, setPaymentType] = useState<"all-inclusive" | "partially-inclusive">("all-inclusive");
  const [levyPrice, setLevyPrice] = useState(money(choice?.list_document_price ?? 0));
  const [levyTenor, setLevyTenor] = useState(choice?.tenor_months ? String(choice.tenor_months) : "");
  const startsFlex = (choice?.asset_type ?? "full-ownership") === "flex";
  const [landCarry, setLandCarry] = useState(money(startsFlex ? carryTotal : paidLand));
  const [levyCarry, setLevyCarry] = useState(startsFlex ? "" : money(paidLevy));
  const [upfront, setUpfront] = useState("");
  const [waiveFee, setWaiveFee] = useState(false);
  const [changeFee, setChangeFee] = useState(money(CHANGE_FEE));
  const [waiveChange, setWaiveChange] = useState(false);
  const [holdDays, setHoldDays] = useState("7");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const estates = useMoveEstates(type, open);
  const tree = useMoveEstateTree(assetId);
  const send = useSendRecoveryTerms();
  const isFlex = type === "flex";

  const offer = tree.data?.offers.find((o) => o.offer_type === type);
  const sizes = (offer?.sizes ?? []).filter((s) => s.is_active !== false);
  const sizeRow = sizes.find((s) => String(s.size_sqm) === size);
  const plans = (sizeRow?.plans ?? []).filter((p) => p.is_active !== false);

  // List prices fill in from the change handlers (not effects). Admin can type over them.
  const fill = (nextSize: string, nextUnits: string, nextTenor: string) => {
    const row = sizes.find((s) => String(s.size_sqm) === nextSize);
    if (!row) return;
    const u = Math.max(1, num(nextUnits));
    const options = (row.plans ?? []).filter((p) => p.is_active !== false);
    const plan = options.find((p) => String(p.tenor_months) === nextTenor) ?? options[0];
    if (plan) {
      setLandPrice(money(plan.land_price * u));
      if (!nextTenor) setTenor(String(plan.tenor_months));
    }
    if (!isFlex) {
      setLevyPrice(money((row.document_fee ?? 0) * u));
      if (!levyTenor) setLevyTenor(String(plan?.tenor_months ?? 6));
      if (offer?.payment_type === "partially-inclusive" || offer?.payment_type === "all-inclusive") {
        setPaymentType(offer.payment_type);
      }
    }
  };

  const changeType = (next: MoveProduct) => {
    setType(next);
    setAssetId("");
    setSize("");
    // Flex has no levy: everything paid goes to the plan.
    if (next === "flex") {
      setLandCarry(money(carryTotal));
      setLevyCarry("");
    } else {
      setLandCarry(money(paidLand));
      setLevyCarry(money(paidLevy));
    }
  };
  const changeSize = (next: string) => {
    setSize(next);
    fill(next, units, tenor);
  };
  const changeUnits = (next: string) => {
    setUnits(next);
    fill(size, next, tenor);
  };
  const changeTenor = (next: string) => {
    setTenor(next);
    fill(size, units, next);
  };

  const figures = useMemo(() => {
    const lp = num(landPrice);
    const lc = num(landCarry);
    const dc = isFlex ? 0 : num(levyCarry);
    const up = num(upfront);
    const dp = isFlex ? 0 : num(levyPrice);
    const t = num(tenor);
    const dt = num(levyTenor);
    const landLeft = round2(lp - lc - up);
    const levyLeft = round2(dp - dc);
    const fee = waiveFee ? 0 : feeOwed;
    const change = waiveChange ? 0 : num(changeFee);
    return {
      landLeft,
      levyLeft,
      landMonthly: landLeft > 0 && t > 0 ? round2(landLeft / t) : 0,
      levyMonthly: levyLeft > 0 && dt > 0 ? round2(levyLeft / dt) : 0,
      fee,
      change,
      up,
      dueNow: round2(fee + change + up),
      carry: round2(lc + dc),
    };
  }, [landPrice, landCarry, levyCarry, upfront, levyPrice, tenor, levyTenor, waiveFee, waiveChange, changeFee, feeOwed, isFlex]);

  const differs =
    !choice ||
    choice.asset_id !== assetId ||
    choice.asset_type !== type ||
    String(choice.size_sqm) !== size;
  const needsNote = Boolean(choice) && differs;

  const problems: string[] = [];
  if (figures.carry !== carryTotal) {
    problems.push(`The carry-over is ${naira(figures.carry)}, but ${naira(carryTotal)} was paid on the current plan.`);
  }
  if (figures.landLeft < 0) problems.push("What's carried to the land is more than the land price.");
  if (figures.levyLeft < 0) problems.push("What's carried to the levy is more than the levy price.");
  if (figures.landLeft > 0 && num(tenor) < 1) problems.push("Set a plan length.");
  if (!isFlex && figures.levyLeft > 0 && num(levyTenor) < 1) problems.push("Set the levy months.");

  const canSend =
    assetId &&
    size &&
    num(landPrice) > 0 &&
    problems.length === 0 &&
    reason.trim().length >= 15 &&
    (!needsNote || note.trim().length > 0) &&
    !send.isPending;

  const submit = async () => {
    const payload: SendTermsPayload = {
      asset_id: assetId,
      asset_type: type,
      size_sqm: num(size),
      units: Math.max(1, num(units)),
      land_price: num(landPrice),
      tenor_months: num(tenor),
      land_carry: num(landCarry),
      ...(isFlex
        ? {}
        : {
            document_price: num(levyPrice),
            document_tenor_months: num(levyTenor),
            payment_type: paymentType,
            document_carry: num(levyCarry),
          }),
      ...(num(upfront) > 0 ? { upfront_land: num(upfront) } : {}),
      ...(waiveFee ? { waive_default_fee: true } : {}),
      change_fee: num(changeFee),
      ...(waiveChange ? { waive_change_fee: true } : {}),
      hold_days: Math.max(1, num(holdDays)),
      internal_reason: reason.trim(),
      ...(note.trim() ? { customer_note: note.trim() } : {}),
      ...(record.updated_at ? { expected_updated_at: record.updated_at } : {}),
    };
    try {
      await send.mutateAsync({ id: record.id, payload });
      toast.success(differs && choice ? "Different option sent to the customer" : "Terms sent to the customer");
      onOpenChange(false);
    } catch (err) {
      toast.error(errorText(err, ERROR_TEXT, "Couldn't send the terms"));
    }
  };

  const resetToChoice = () => {
    if (!choice) return;
    setType(choice.asset_type as MoveProduct);
    setAssetId(choice.asset_id);
    setSize(String(choice.size_sqm));
    setUnits(String(choice.units ?? 1));
    setTenor(choice.tenor_months ? String(choice.tenor_months) : "");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{choice ? "Send terms" : "Send an option"}</DialogTitle>
          <DialogDescription>
            {record.customer_name} · {record.asset_name} · {productLabel(record.plan_type)}. Window ends{" "}
            {new Date(record.window_ends_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          {/* Left: where they are now and what they asked for */}
          <div className="space-y-4">
            <section className="space-y-2 rounded-lg border p-4 text-sm">
              <p className="font-semibold">Where they are now</p>
              <Row label="Land paid" value={`${naira(paidLand)} of ${naira(record.snapshot.land_price)}`} />
              {!isFlex || paidLevy > 0 ? (
                <Row label="Levy paid" value={`${naira(paidLevy)} of ${naira(record.snapshot.document_price)}`} />
              ) : null}
              <Row label="To carry over" value={naira(carryTotal)} strong />
              <Row label="Default fee owed" value={record.plan_type === "flex" ? "— (Flex)" : naira(feeOwed)} />
            </section>
            <section className="space-y-2 rounded-lg border p-4 text-sm">
              <p className="font-semibold">They asked for</p>
              {choice ? (
                <>
                  <p>
                    {choice.asset_name} · {choice.size_sqm} sqm · {productLabel(choice.asset_type)}
                    {choice.tenor_months ? ` · ${choice.tenor_months} months` : ""}
                  </p>
                  <p className="text-muted-foreground">
                    List price {naira(choice.list_land_price)}
                    {choice.list_document_price ? ` + levy ${naira(choice.list_document_price)}` : ""}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">No request yet. This goes out as an option.</p>
              )}
            </section>
            <section className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
              <p className="font-semibold">What they’ll get</p>
              <p>
                <span className="mr-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold">
                  {choice && differs ? "A different option" : "Terms ready"}
                </span>
              </p>
              <p className="text-muted-foreground">
                Email: “{choice && differs ? "We’ve suggested a different option for your move" : "Your terms are ready"}”.
                They see the price, the carry-over, what’s left and {naira(figures.dueNow)} to pay now.
              </p>
            </section>
          </div>

          {/* Right: the terms */}
          <div className="space-y-5">
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">Product to offer</p>
                {choice ? (
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-xs font-semibold",
                        differs ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800"
                      )}
                    >
                      {differs ? "Different from what they asked for" : "What they asked for"}
                    </span>
                    {differs ? (
                      <Button variant="ghost" size="sm" className="gap-1" onClick={resetToChoice}>
                        <RotateCcw className="h-3.5 w-3.5" /> Go back to what they asked for
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <Field label="Product">
                  <Select value={type} onValueChange={(v) => changeType(v as MoveProduct)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-ownership">Full Ownership</SelectItem>
                      <SelectItem value="flex">Flex</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Estate" className="sm:col-span-2">
                  <Select
                    value={assetId}
                    onValueChange={(v) => {
                      setAssetId(v);
                      setSize("");
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={estates.isLoading ? "Loading…" : "Choose an estate"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(estates.data ?? [])
                        .filter((a) => a.name !== record.asset_name)
                        .map((a) => (
                          <SelectItem key={a._id} value={a._id}>
                            {a.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Size">
                  <Select value={size} onValueChange={changeSize} disabled={!assetId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      {sizes.map((s) => (
                        <SelectItem key={s.size_sqm} value={String(s.size_sqm)}>
                          {s.size_sqm} sqm{typeof s.units_available === "number" ? ` · ${s.units_available} left` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <p className="text-xs text-muted-foreground">
                The estate they’re leaving ({record.asset_name}) isn’t listed.
              </p>
            </section>

            <section className="grid gap-3 sm:grid-cols-4">
              <Field label="Units">
                <Input inputMode="numeric" value={units} onChange={(e) => changeUnits(e.target.value.replace(/\D/g, ""))} />
              </Field>
              <Field label={isFlex ? "Plan price" : "Land price"} className="sm:col-span-2">
                <MoneyInput value={landPrice} onChange={setLandPrice} />
              </Field>
              <Field label="Plan length (months)">
                {plans.length ? (
                  <Select value={tenor} onValueChange={changeTenor}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Months" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(new Set([...plans.map((p) => p.tenor_months), num(tenor)].filter(Boolean))).map((t) => (
                        <SelectItem key={t} value={String(t)}>
                          {t} months
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input inputMode="numeric" value={tenor} onChange={(e) => setTenor(e.target.value.replace(/\D/g, ""))} />
                )}
              </Field>
              <Field label={isFlex ? "Carried to the plan" : "Carried to the land"} className="sm:col-span-2">
                <MoneyInput value={landCarry} onChange={setLandCarry} />
              </Field>
              <Field label="Land paid now, up front (optional)" className="sm:col-span-2">
                <MoneyInput value={upfront} onChange={setUpfront} placeholder="0" />
              </Field>
            </section>

            {isFlex ? (
              <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                Flex has no development levy: everything paid ({naira(carryTotal)}) is carried to the plan.
              </p>
            ) : (
              <section className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Development levy</p>
                  <RadioGroup
                    value={paymentType}
                    onValueChange={(v) => setPaymentType(v as typeof paymentType)}
                    className="flex gap-4"
                  >
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="partially-inclusive" /> Partially inclusive
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="all-inclusive" /> All-inclusive
                    </label>
                  </RadioGroup>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Levy price">
                    <MoneyInput value={levyPrice} onChange={setLevyPrice} />
                  </Field>
                  <Field label="Carried to the levy">
                    <MoneyInput value={levyCarry} onChange={setLevyCarry} />
                  </Field>
                  <Field label="Levy months">
                    <Input inputMode="numeric" value={levyTenor} onChange={(e) => setLevyTenor(e.target.value.replace(/\D/g, ""))} />
                  </Field>
                </div>
              </section>
            )}

            <section className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Default fee</p>
                  <span className="text-sm tabular-nums">{record.plan_type === "flex" ? "— (Flex)" : naira(feeOwed)}</span>
                </div>
                {feeOwed > 0 ? (
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={waiveFee} onCheckedChange={(v) => setWaiveFee(v === true)} /> Waive the default fee
                  </label>
                ) : null}
              </div>
              <div className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Change fee</p>
                  <MoneyInput value={changeFee} onChange={setChangeFee} className="h-8 w-36" disabled={waiveChange} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={waiveChange} onCheckedChange={(v) => setWaiveChange(v === true)} /> Waive the change fee
                </label>
              </div>
            </section>

            <section className="grid gap-3 rounded-lg bg-muted/50 p-4 text-sm sm:grid-cols-2">
              <div className="space-y-1">
                <Row label={isFlex ? "Left to pay on the plan" : "Land left to pay"} value={naira(Math.max(0, figures.landLeft))} />
                {figures.landMonthly ? <Row label="Monthly" value={`about ${naira(figures.landMonthly)}`} /> : null}
                {!isFlex ? <Row label="Levy left to pay" value={naira(Math.max(0, figures.levyLeft))} /> : null}
              </div>
              <div className="space-y-1">
                {figures.fee ? <Row label="Default fee" value={naira(figures.fee)} /> : null}
                {figures.change ? <Row label="Change fee" value={naira(figures.change)} /> : null}
                {figures.up ? <Row label="Up-front land" value={naira(figures.up)} /> : null}
                <Row label="Due now to move" value={naira(figures.dueNow)} strong />
              </div>
            </section>

            {problems.length ? (
              <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <ul className="space-y-1">
                  {problems.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <section className="grid gap-3 sm:grid-cols-4">
              <Field label="Hold for (days)">
                <Input inputMode="numeric" value={holdDays} onChange={(e) => setHoldDays(e.target.value.replace(/\D/g, ""))} />
              </Field>
              <Field label="Why these terms (admin log, at least 15 characters)" className="sm:col-span-3">
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. What they asked for, at the current Estate B price" />
              </Field>
              <Field
                label={needsNote ? "Note to the customer (required: this isn't what they asked for)" : "Note to the customer (optional)"}
                className="sm:col-span-4"
              >
                <Textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Shown on their screen and in the email"
                />
              </Field>
            </section>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSend} onClick={submit}>
            {send.isPending ? "Sending…" : choice && differs ? "Send the different option" : "Send terms"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3 tabular-nums">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-semibold" : undefined}>{value}</span>
    </div>
  );
}
