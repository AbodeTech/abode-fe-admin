import { useMutation, useQueryClient } from "@tanstack/react-query";

import { executeRaw } from "@/lib/graphql-client";
import { userKeys } from "./query-keys";

const ADMIN_SIGNUP_USER_MUTATION = `
  mutation AdminSignupUser($adminSignupInput: AdminSignupInput!) {
    adminSignupUser(adminSignupInput: $adminSignupInput) {
      success
      message
      data {
        generatedPassword
        user {
          _id
          firstName
          lastName
          email
        }
      }
    }
  }
`;

export interface RegisterUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  userName: string;
  user_type: string;
  referral?: string;
  howYouHearAboutUs?: string;
}

interface RegisterUserResponse {
  adminSignupUser?: {
    success?: boolean;
    message?: string;
    data?: {
      generatedPassword?: string;
      user?: {
        _id?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
      };
    };
  };
}

export const useRegisterUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterUserInput) =>
      executeRaw<RegisterUserResponse>(ADMIN_SIGNUP_USER_MUTATION, {
        adminSignupInput: input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.overview() });
    },
  });
};
