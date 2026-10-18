"use client";

import { AssetDetailShell } from "@/features/assets";

/**
 * Header, inventory bar and tab nav wrap all four sub-routes. Each tab's page
 * is code-split, so opening Performance doesn't load the offers editor.
 */
export default function AssetDetailLayout({ children }: { children: React.ReactNode }) {
  return <AssetDetailShell>{children}</AssetDetailShell>;
}
