"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { UserPicker } from "@/components/shared/UserPicker";

import { useCreateAgency } from "../hooks/use-create-agency";
import {
  createAgencySchema,
  toCreateAgencyPayload,
  type CreateAgencyFormValues,
} from "../schemas/agency.schema";
import { getErrorMessage } from "../utils/error-message";

/**
 * POST /admin/agencies.
 *
 * Every agency needs an owner, and the BE offers two ways to supply one:
 * promote an existing user, or create the account here and let the BE email
 * them a temporary password. The v1 form's address, city, state, country and
 * communication-preference fields have no v2 equivalent and are gone — the
 * v2 agency record holds a name, a rate, an owner and two contact fields.
 */
export function AgencyOnboardingForm() {
  const router = useRouter();
  const { mutateAsync: createAgency, isPending } = useCreateAgency();
  const [ownerLabel, setOwnerLabel] = useState<string | null>(null);

  const form = useForm<CreateAgencyFormValues>({
    resolver: zodResolver(createAgencySchema),
    defaultValues: {
      name: "",
      commission_percentage: 5,
      owner_mode: "existing",
      owner_user_id: "",
      new_owner: {
        firstName: "",
        lastName: "",
        email: "",
        userName: "",
        phoneNumber: "",
      },
      contact_email: "",
      contact_phone: "",
    },
  });

  const ownerMode = form.watch("owner_mode");

  const onSubmit = async (values: CreateAgencyFormValues) => {
    try {
      const agency = await createAgency(toCreateAgencyPayload(values));
      toast.success(
        values.owner_mode === "new"
          ? `${agency.name} created (${agency.code}) — the owner has been emailed their sign-in details.`
          : `${agency.name} created (${agency.code})`
      );
      router.push(`/agency/lists/${agency.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create agency"));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="w-full min-w-0 max-w-3xl border border-gray-200">
          <CardHeader>
            <CardTitle>Onboard New Agency</CardTitle>
            <CardDescription>
              The agency code is generated automatically once the agency is created.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agency name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Lagos Realty Pros"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="commission_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commission percentage</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      disabled={isPending}
                      className="sm:max-w-40"
                      {...field}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === "" ? undefined : event.target.valueAsNumber
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Between 0 and 100, up to two decimal places.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="owner_mode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Agency owner</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isPending}
                      className="gap-3"
                    >
                      <div className="flex items-start gap-2">
                        <RadioGroupItem value="existing" id="owner-existing" />
                        <div className="space-y-1">
                          <Label htmlFor="owner-existing" className="font-normal">
                            Use an existing user
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            They must not already own another agency.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <RadioGroupItem value="new" id="owner-new" />
                        <div className="space-y-1">
                          <Label htmlFor="owner-new" className="font-normal">
                            Create a new user
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            They are emailed a temporary password to sign in with.
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {ownerMode === "existing" ? (
              <FormField
                control={form.control}
                name="owner_user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner</FormLabel>
                    <FormControl>
                      <UserPicker
                        value={field.value ?? ""}
                        fallbackLabel={ownerLabel}
                        disabled={isPending}
                        placeholder="Search for the owner by name or email"
                        onChange={(id, option) => {
                          field.onChange(id);
                          setOwnerLabel(option?.label ?? null);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 rounded-md border border-gray-200 p-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="new_owner.firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input disabled={isPending} {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="new_owner.lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input disabled={isPending} {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="new_owner.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          disabled={isPending}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="new_owner.userName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input disabled={isPending} {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="new_owner.phoneNumber"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Phone number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+234…"
                          disabled={isPending}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact email (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="agency@domain.com"
                        disabled={isPending}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      The agency&apos;s own contact address, separate from the owner&apos;s.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact phone (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+234…"
                        disabled={isPending}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => router.push("/agency/lists")}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create agency
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
