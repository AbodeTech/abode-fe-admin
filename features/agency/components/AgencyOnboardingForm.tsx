"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useCreateAgency } from "../hooks/use-create-agency";

export function AgencyOnboardingForm() {
  const router = useRouter();
  const { mutateAsync: createAgency, isPending } = useCreateAgency();

  const [commissionType, setCommissionType] = useState("5");
  const [communicationPreference, setCommunicationPreference] = useState("agency");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const customRate = Number(formData.get("customCommission"));
    const selectedRate = Number(commissionType);
    const commission_percentage = commissionType === "custom" ? customRate : selectedRate;

    if (!Number.isFinite(commission_percentage) || commission_percentage <= 0) {
      toast.error("Enter a valid commission rate");
      return;
    }

    try {
      await createAgency({
        agency_name: String(formData.get("agency_name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        phoneNumber: String(formData.get("phoneNumber") || "").trim(),
        address: String(formData.get("address") || "").trim() || undefined,
        country: String(formData.get("country") || "").trim() || undefined,
        state: String(formData.get("state") || "").trim() || undefined,
        city: String(formData.get("city") || "").trim() || undefined,
        commission_percentage,
        communication_preference: communicationPreference,
      });
      toast.success("Agency created successfully");
      router.push("/agency/lists");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to create agency");
    }
  };

  return (
    <Card className="border border-gray-200 max-w-3xl">
      <CardHeader>
        <CardTitle>Onboard New Agency</CardTitle>
        <CardDescription>
          Add a new agency partner and set their initial commission preferences.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="agency_name">Agency Name</Label>
            <Input id="agency_name" name="agency_name" required placeholder="e.g. Lagos Realty Pros" disabled={isPending} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="agency@domain.com" disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input id="phoneNumber" name="phoneNumber" required placeholder="+234..." disabled={isPending} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" placeholder="Office address" disabled={isPending} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" placeholder="Nigeria" disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" placeholder="Lagos" disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" placeholder="Ikeja" disabled={isPending} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Communication Preference</Label>
              <Select value={communicationPreference} onValueChange={setCommunicationPreference}>
                <SelectTrigger>
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agency">Agency</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Commission Rate</Label>
              <div className="flex gap-2">
                <Select value={commissionType} onValueChange={setCommissionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2.5">2.5%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="7.5">7.5%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {commissionType === "custom" && (
                  <Input
                    name="customCommission"
                    type="number"
                    min={0.1}
                    step={0.1}
                    placeholder="Rate %"
                    required
                    disabled={isPending}
                    className="max-w-32"
                  />
                )}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/agency/lists")} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Agency
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
