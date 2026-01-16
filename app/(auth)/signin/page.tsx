import { SignInForm } from "@/components/features/auth/SignInForm";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center  p-4 sm:p-8">
      <div className="mb-6 w-36">
        <Image
          src="/logo.svg"
          alt="Abode Logo"
          width={193}
          height={46}
          priority
        />
      </div>

      <div className="mb-8 text-center">
        <h3 className="text-2xl font-medium text-foreground mb-2">Welcome, Admin</h3>
        <p className="text-base text-(--auth-header-text)">Login to your dashboard</p>
      </div>

      <SignInForm />
    </div>
  );
}
