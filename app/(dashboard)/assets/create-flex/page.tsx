import { CreateFlexAssetForm } from "@/components/features/assets/CreateFlexAssetForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function CreateAssetPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/assets">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Create Flex Asset</h1>
      </div>

      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <CreateFlexAssetForm />
      </div>
    </div>
  );
}
