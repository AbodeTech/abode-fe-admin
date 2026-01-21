"use client";

import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FileUpload } from "@/components/ui/FileUpload";
import { CreateFlexAssetFormValues } from "@/lib/schemas/assets";

interface AssetUploadsProps {
  form: UseFormReturn<any>;
}

export function AssetUploads({ form }: AssetUploadsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Uploads</h3>

      <FormField
        control={form.control}
        name="asset_pictures"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Asset Pictures</FormLabel>
            <FormControl>
              <FileUpload
                onFilesChange={(files) => field.onChange(files)}
                accept={{ "image/*": [".jpeg", ".jpg", ".png"] }}
                maxFiles={10}
                label="Upload Pictures"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="deed_of_assignment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deed of Assignment</FormLabel>
              <FormControl>
                <FileUpload
                  onFilesChange={(files) => field.onChange(files[0])}
                  maxFiles={1}
                  label="Upload Deed"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="survey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Survey</FormLabel>
              <FormControl>
                <FileUpload
                  onFilesChange={(files) => field.onChange(files[0])}
                  maxFiles={1}
                  label="Upload Survey"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contract_of_sales"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contract of Sales</FormLabel>
              <FormControl>
                <FileUpload
                  onFilesChange={(files) => field.onChange(files[0])}
                  maxFiles={1}
                  label="Upload Contract"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
