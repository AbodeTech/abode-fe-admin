"use client";

import { MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatNaira } from "@/lib/utils/format";

import {
  sortedPlans,
  totalSellingPrice,
  type Plan,
  type Size,
} from "../../schemas/asset-detail.schema";
import { useAssetFormStore } from "../../store/asset-form-store";

function planTerms(plan: Plan): string {
  if (plan.tenor_months === 0) return "Paid in full";
  if (plan.tenor_months === 1) return "Single payment";
  return `${formatNaira(plan.initial_payment)} then ${formatNaira(plan.monthly_installment)}/mo`;
}

export function PlansTable({
  size,
  offerType,
}: {
  size: Size;
  offerType: string;
}) {
  const openOfferEdit = useAssetFormStore((state) => state.openOfferEdit);
  const plans = sortedPlans(size.plans);
  // The backend refuses to delete a size's only plan (`LAST_PLAN`), so the
  // action is disabled rather than attempted.
  const isOnlyPlan = plans.length <= 1;

  if (plans.length === 0) {
    return <p className="text-sm text-muted-foreground">No plans on this size.</p>;
  }

  return (
    <>
      <AdminDesktopTableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenor</TableHead>
              <TableHead>Land price</TableHead>
              <TableHead>Terms</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-px" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.tenor_months}>
                <TableCell className="text-sm whitespace-nowrap">
                  {plan.tenor_months === 0 ? (
                    <span className="font-medium">Outright</span>
                  ) : (
                    <span className="tabular-nums">{plan.tenor_months} months</span>
                  )}
                </TableCell>
                <TableCell className="text-sm font-medium tabular-nums">
                  {formatNaira(plan.land_price)}
                  {plan.development_levy > 0 || plan.document_levy > 0 ? (
                    <span className="block text-xs font-normal text-muted-foreground">
                      Total {formatNaira(totalSellingPrice(plan))}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="text-sm tabular-nums text-muted-foreground">
                  {planTerms(plan)}
                </TableCell>
                <TableCell className="text-sm">
                  {plan.is_active === false ? (
                    <span className="text-muted-foreground">Inactive</span>
                  ) : plan.is_promo ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">Promo</span>
                  ) : (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                      Active
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Plan actions">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          openOfferEdit({
                            kind: "plan",
                            offerType,
                            sizeId: size._id,
                            tenor: plan.tenor_months,
                          })
                        }
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={isOnlyPlan}
                        onClick={() =>
                          openOfferEdit({
                            kind: "delete-plan",
                            offerType,
                            sizeId: size._id,
                            tenor: plan.tenor_months,
                          })
                        }
                      >
                        {isOnlyPlan ? "Can't delete the only plan" : "Delete"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminDesktopTableWrap>

      <AdminMobileStack>
        {plans.map((plan) => (
          <AdminMobileCard
            key={plan.tenor_months}
            title={plan.tenor_months === 0 ? "Outright" : `${plan.tenor_months} months`}
            subtitle={formatNaira(plan.land_price)}
          >
            <AdminMobileField label="Terms" value={planTerms(plan)} />
            {plan.development_levy > 0 || plan.document_levy > 0 ? (
              <AdminMobileField label="Total selling price" value={formatNaira(totalSellingPrice(plan))} />
            ) : null}
            {plan.is_promo ? <AdminMobileField label="Promo" value="Yes" /> : null}
          </AdminMobileCard>
        ))}
      </AdminMobileStack>
    </>
  );
}
