"use client";

import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegisterUser } from "../../hooks/use-register-user";
import { getErrorMessage } from "../../utils/error-message";

const HOW_YOU_HEARD_OPTIONS = [
  "referral",
  "social-media",
  "billboard",
  "email-newsletter",
  "associate",
  "african-wealth-festival",
  "other",
] as const;

export function RegisterUserModal() {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userName, setUserName] = useState("");
  const [referral, setReferral] = useState("");
  const [howYouHeard, setHowYouHeard] = useState<(typeof HOW_YOU_HEARD_OPTIONS)[number]>("referral");

  const registerUser = useRegisterUser();

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhoneNumber("");
    setUserName("");
    setReferral("");
    setHowYouHeard("referral");
  };

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email || !phoneNumber || !userName) {
      toast.error("Fill all required fields");
      return;
    }

    try {
      const result = await registerUser.mutateAsync({
        firstName,
        lastName,
        email,
        phoneNumber,
        userName,
        user_type: "user",
        referral: referral || undefined,
        howYouHearAboutUs: howYouHeard,
      });

      const generatedPassword = result.adminSignupUser?.data?.generatedPassword;
      toast.success(
        generatedPassword
          ? `User created. Temp password: ${generatedPassword}`
          : result.adminSignupUser?.message || "User registered successfully"
      );
      resetForm();
      setOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to register user"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Register User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register User</DialogTitle>
          <DialogDescription>Create a new user account from admin.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="userName">Username</Label>
            <Input
              id="userName"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="referral">Referral (Optional)</Label>
            <Input
              id="referral"
              value={referral}
              onChange={(event) => setReferral(event.target.value)}
              placeholder="Referral code / user id / email"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="howYouHeard">How User Heard</Label>
            <select
              id="howYouHeard"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={howYouHeard}
              onChange={(event) =>
                setHowYouHeard(event.target.value as (typeof HOW_YOU_HEARD_OPTIONS)[number])
              }
            >
              {HOW_YOU_HEARD_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={registerUser.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={registerUser.isPending}>
            {registerUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
