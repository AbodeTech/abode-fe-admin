"use client";

import { FieldValues, UseFormReturn, Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface AssetBasicInfoProps<T extends FieldValues> {
  form: UseFormReturn<T>;
}

export function AssetBasicInfo<T extends FieldValues>({ form }: AssetBasicInfoProps<T>) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name={"asset_name" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asset Name</FormLabel>
              <FormControl>
                <Input placeholder="E.g. Lekki Gardens" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={"title" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="E.g. 3 Bedroom Apartment" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={"asset_location" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="E.g. Lagos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={"allocation_qualification" as Path<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Allocation Qualification (%)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name={"description" as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea placeholder="Describe the asset..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={"amenities" as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Amenities (comma separated)</FormLabel>
            <FormControl>
              <Input placeholder="Pool, Gym, Security" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
