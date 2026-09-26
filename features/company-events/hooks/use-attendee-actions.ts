'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { parse } from 'graphql';
import { execute } from '@/lib/graphql-client';

import { companyEventKeys } from './query-keys';

// NOTE: excluded from codegen (see codegen.ts) until the allocation-events
// backend lands on staging. See the note in use-event-registrations.ts.

/**
 * Acting on one attendee, for the two things the public form cannot do.
 *
 * The form is token-gated and single-use, so somebody who confirms by phone
 * could never be recorded, and a pickup point chosen once could never be
 * changed. Both are ordinary situations — people ring their realtor instead of
 * clicking a link, and stops get withdrawn — and both used to end in a row
 * nobody could touch.
 */

const REGISTER_ATTENDEE_MUTATION = parse(`
  mutation RegisterAttendeeOnBehalf($eventId: ID!, $input: RegisterAttendeeInput!) {
    registerAttendeeOnBehalf(eventId: $eventId, input: $input) {
      registered
      pass_sent
      registration {
        id
        name
        email
        phone
        category
        pickup_location
        status
      }
    }
  }
`) as unknown as TypedDocumentNode<
  {
    registerAttendeeOnBehalf: {
      registered: boolean;
      pass_sent: boolean;
      registration: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        category: string;
        pickup_location: string | null;
        status: string;
      };
    };
  },
  { eventId: string; input: Record<string, unknown> }
>;

export interface RegisterAttendeeInput {
  eventId: string;
  /** The attendance row being filled in. */
  registrationId: string;
  /** Required wherever the event has pickup points — which is the usual case. */
  pickupLocationId?: string;
  /** Defaults, server-side, from the account's referral status. */
  category?: string;
  /** Only where the account's own details are wrong or missing. */
  name?: string;
  phone?: string;
  email?: string;
}

/**
 * `registerAttendeeOnBehalf` — records a confirmation that arrived by phone.
 *
 * Mints the attendee's pass and emails it, so this is not a silent write: the
 * customer hears about it immediately.
 */
export const useRegisterAttendeeOnBehalf = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      registrationId,
      pickupLocationId,
      category,
      name,
      phone,
      email,
    }: RegisterAttendeeInput) =>
      execute(REGISTER_ATTENDEE_MUTATION, {
        eventId,
        input: {
          registrationId,
          // Only send what was actually supplied: an empty string would
          // override the account's details with nothing.
          ...(pickupLocationId ? { pickupLocationId } : {}),
          ...(category ? { category } : {}),
          ...(name?.trim() ? { name: name.trim() } : {}),
          ...(phone?.trim() ? { phone: phone.trim() } : {}),
          ...(email?.trim() ? { email: email.trim() } : {}),
        },
      }),
    onSuccess: () => {
      // The row, the funnel and the pickup load all move together.
      queryClient.invalidateQueries({ queryKey: companyEventKeys.all });
    },
  });
};

const SET_ATTENDEE_PICKUP_MUTATION = parse(`
  mutation SetAttendeePickup($eventId: ID!, $input: SetAttendeePickupInput!) {
    setAttendeePickup(eventId: $eventId, input: $input) {
      updated
      pass_sent
      pickup_location
    }
  }
`) as unknown as TypedDocumentNode<
  {
    setAttendeePickup: {
      updated: boolean;
      pass_sent: boolean;
      pickup_location: string | null;
    };
  },
  { eventId: string; input: Record<string, unknown> }
>;

export interface SetAttendeePickupInput {
  eventId: string;
  registrationId: string;
  pickupLocationId: string;
  /**
   * Defaults true server-side. Their pass names the old stop, so a corrected
   * one goes out unless the customer has already been told another way.
   */
  notify?: boolean;
}

/** `setAttendeePickup` — moves one attendee to a different stop. */
export const useSetAttendeePickup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, registrationId, pickupLocationId, notify }: SetAttendeePickupInput) =>
      execute(SET_ATTENDEE_PICKUP_MUTATION, {
        eventId,
        input: {
          registrationId,
          pickupLocationId,
          ...(notify === false ? { notify: false } : {}),
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyEventKeys.all });
    },
  });
};
