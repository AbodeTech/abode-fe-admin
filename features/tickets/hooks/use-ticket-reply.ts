'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';
import { uploadTicketAttachment } from '@/lib/utils/upload';

import { TicketDetailSchema } from '../schemas/ticket.schema';
import { ticketKeys } from './query-keys';

export interface ReplyToTicketInput {
  ticketId: string;
  body: string;
  cc?: string[];
  /** Uploaded to Cloudinary before the reply is posted; the BE takes urls, not files. */
  files?: File[];
}

/** `ReplyAttachmentDto` — all seven fields required. */
interface ReplyAttachment {
  url: string;
  filename: string;
  mime: string;
  size: number;
  public_id: string;
  resource_type: string;
  format: string;
}

/**
 * Only `secure_url`: the DTO refuses anything but https. `format` is absent on
 * a raw upload (a .docx), so it falls back to the extension, clamped to the
 * DTO's 30 characters, as the filename is to its 200.
 */
const uploadReplyAttachment = async (ticketId: string, file: File): Promise<ReplyAttachment> => {
  const uploaded = await uploadTicketAttachment(file, `support-tickets/outbound/${ticketId}`);
  const url: string | undefined = uploaded?.secure_url;
  if (!url) throw new Error(`${file.name} uploaded but returned no URL`);
  const extension = file.name.includes('.') ? (file.name.split('.').pop() ?? '') : '';
  return {
    url,
    filename: file.name.slice(0, 200),
    mime: file.type || 'application/octet-stream',
    size: uploaded.bytes ?? file.size,
    public_id: uploaded.public_id,
    resource_type: uploaded.resource_type ?? 'raw',
    format: String(uploaded.format || extension).slice(0, 30),
  };
};

/**
 * Answer the customer, from inside the app.
 *
 * The BE attempts the send before recording anything, but writes the message
 * either way — a failed delivery has to be visible in the conversation rather
 * than swallowed. It then throws, so the agent finds out now instead of from
 * the customer a week later. Returns the refreshed detail, so the thread
 * updates without a second round trip.
 *
 * Files upload first, all of them: the BE refuses the whole reply over one bad
 * file, so a partial set is never worth sending.
 */
export const useReplyToTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, body, cc = [], files = [] }: ReplyToTicketInput) => {
      const attachments = await Promise.all(
        files.map((file) => uploadReplyAttachment(ticketId, file))
      );
      return apiPost(
        `/admin/tickets/${ticketId}/reply`,
        {
          body,
          ...(cc.length ? { cc } : {}),
          ...(attachments.length ? { attachments } : {}),
        },
        TicketDetailSchema
      );
    },
    onSuccess: (detail, v) => {
      queryClient.setQueryData(ticketKeys.detail(v.ticketId), detail);
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
};
