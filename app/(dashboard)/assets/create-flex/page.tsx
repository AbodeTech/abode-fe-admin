import { CreateFlexAssetForm } from "@/features/assets";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function CreateAssetPage() {
  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" className="shrink-0" asChild>
          <Link href="/assets">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="min-w-0 text-xl font-bold tracking-tight sm:text-2xl">Create Flex Asset</h1>
      </div>

      <div className="min-w-0 rounded-xl border bg-white p-4 shadow-sm sm:p-6">
        <CreateFlexAssetForm />
      </div>
    </div>
  );
}
