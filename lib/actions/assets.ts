"use server";

import { createFlexAsset, CreateFlexAssetInput, createFullOwnershipAsset, CreateFullOwnershipAssetInput } from "@/lib/api/admin/assets";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

export async function createFlexAssetAction(payload: CreateFlexAssetInput) {
  try {
    await createFlexAsset(payload);
    revalidateTag("assets", "max");
  } catch (error: any) {
    throw new Error(error.message || "Failed to create asset");
  }

  redirect("/assets");
}

export async function createFullOwnershipAssetAction(payload: CreateFullOwnershipAssetInput) {
  try {
    await createFullOwnershipAsset(payload);
    revalidateTag("assets", "max");
  } catch (error: any) {
    throw new Error(error.message || "Failed to create asset");
  }

  redirect("/assets");
}
