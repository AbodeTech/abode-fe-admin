"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useCompanyEventAssets } from "../hooks/use-company-event-assets";
import { useCreateCompanyEvent } from "../hooks/use-create-company-event";
import { COMPANY_EVENT_TYPES } from "../schemas/company-event.schema";
import { PickupLocationInput } from "./PickupLocationInput";

const SIZE_UNITS = ["sqm", "plots"] as const;

const formSchema = z
  .object({
    type: z.enum(COMPANY_EVENT_TYPES),
    title: z.string().trim().min(3, "Title must be at least 3 characters"),
    assets: z.array(z.string()).min(1, "Select at least one site"),
    date: z.string().min(1, "Date is required"),
    time: z.string().min(1, "Time is required"),
    available_size: z.union([z.number(), z.nan()]).optional(),
    size_unit: z.string().optional(),
    pickup_locations: z.array(z.string()),
  })
  .superRefine((values, ctx) => {
    if (values.type !== "allocation") return;
    if (!values.available_size || Number.isNaN(values.available_size) || values.available_size <= 0) {
      ctx.addIssue({
        path: ["available_size"],
        code: z.ZodIssueCode.custom,
        message: "Available size is required for an allocation day",
      });
    }
    if (values.pickup_locations.length === 0) {
      ctx.addIssue({
        path: ["pickup_locations"],
        code: z.ZodIssueCode.custom,
        message: "Add at least one pickup location",
      });
    }
  });

type CompanyEventFormValues = z.infer<typeof formSchema>;

export function CompanyEventForm() {
  const router = useRouter();
  const { data: assets, isLoading: assetsLoading } = useCompanyEventAssets();
  const createEvent = useCreateCompanyEvent();


  const form = useForm<CompanyEventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "site_inspection",
      title: "",
      assets: [],
      date: "",
      time: "",
      available_size: undefined,
      size_unit: "sqm",
      pickup_locations: [],
    },
  });

  // useWatch rather than form.watch() — the latter returns a fresh function
  // each render, which makes React Compiler skip memoising this component.
  const activeType = useWatch({ control: form.control, name: "type" });

  // Most estates exist as both a flex and a full-ownership asset, so the
  // name alone repeats — the type is what distinguishes the two rows, the
  // same way features/allocation's asset filter labels them.
  //
  // Location rides along as a label but is deliberately not filtered on: it
  // is near-1:1 with the site and the stored strings vary for one place
  // ("Agbowa-Ikorodu" vs "Agbowa-Ikorodu, Lagos"), so a filter would hide
  // valid sites. As a label it still helps — "The WoodGate" and
  // "The Woodgate" are different places.
  const visibleAssets = (assets ?? []).filter((asset) => asset.selectable);

  function onSubmit(values: CompanyEventFormValues) {
    createEvent.mutate(
      {
        title: values.title,
        type: values.type,
        assets: values.assets,
        date: values.date,
        time: values.time,
        ...(values.type === "allocation"
          ? {
              availableSize: values.available_size,
              sizeUnit: values.size_unit,
              pickupLocations: values.pickup_locations,
            }
          : {}),
      },
      {
        onSuccess: ({ createCompanyEvent: event }) => {
          toast.success(`${event.title} created`);
          router.push(`/company-events/${event.id}`);
        },
        onError: (error) => toast.error(error.message || "Failed to create event"),
      }
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs
          value={activeType}
          onValueChange={(value) => form.setValue("type", value as CompanyEventFormValues["type"], { shouldValidate: true })}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="site_inspection" className="cursor-pointer">Site Inspection</TabsTrigger>
            <TabsTrigger value="allocation" className="cursor-pointer">Allocation</TabsTrigger>
          </TabsList>
        </Tabs>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Empire Park — October Allocation" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="assets"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sites</FormLabel>
              <FormControl>
                <MultiSelect
                  options={visibleAssets.map((asset) => ({
                    value: asset._id,
                    label: `${asset.name}${asset.type ? ` (${asset.type})` : ""}${
                      asset.location ? ` \u2014 ${asset.location}` : ""
                    }`,
                  }))}
                  selected={field.value}
                  onChange={field.onChange}
                  placeholder={assetsLoading ? "Loading sites..." : "Select one or more sites"}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                One estate is two records — flex and full-ownership. Pick both to
                run a single day across both products.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {activeType === "allocation" && (
          <div className="space-y-4 rounded-lg border border-dashed p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="available_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available size</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10000"
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="size_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size unit</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SIZE_UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="pickup_locations"
              render={({ field }) => (
                <FormItem>
                  <Label>Preferred pickup locations</Label>
                  <PickupLocationInput value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <Button type="submit" disabled={createEvent.isPending} className="w-full sm:w-auto">
          {createEvent.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create event"
          )}
        </Button>
      </form>
    </Form>
  );
}
