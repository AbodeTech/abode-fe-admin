import { ResetPasswordForm } from "@/components/features/auth/ResetPasswordForm";
import { Suspense } from "react";
import Image from "next/image";

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col items-center justify-center pt-9 text-center">
      <div className="mb-6 w-36 mx-auto">
        <Image
          src="/logo.svg"
          alt="Abode Logo"
          width={193}
          height={46}
          priority
        />
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
