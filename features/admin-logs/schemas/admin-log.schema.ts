import { z } from 'zod';

const RawAdminLogSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  admin_id: z.string().nullable().optional(),
  adminId: z.string().nullable().optional(),
  admin_email: z.string().nullable().optional(),
  adminEmail: z.string().nullable().optional(),
  actor_type: z.enum(['admin', 'system']).optional(),
  action: z.string(),
  description: z.string(),
  reason: z.string().nullable().optional(),
  entity: z.string().nullable().optional(),
  entity_id: z.string().nullable().optional(),
  target_user_id: z.string().nullable().optional(),
  metadata: z.unknown().optional(),
  old_state: z.unknown().optional(),
  oldState: z.unknown().optional(),
  new_state: z.unknown().optional(),
  ip_address: z.string().nullable().optional(),
  user_agent: z.string().nullable().optional(),
  timestamp: z.union([z.string(), z.date()]),
});

function asObject(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object'
    ? value as Record<string, unknown>
    : null;
}

export const AdminLogSchema = RawAdminLogSchema.transform((raw) => ({
  id: raw.id ?? raw._id ?? '',
  admin_id: raw.admin_id ?? raw.adminId ?? null,
  admin_email: raw.admin_email ?? raw.adminEmail ?? null,
  actor_type: raw.actor_type ?? 'admin',
  action: raw.action,
  description: raw.description,
  reason: raw.reason ?? undefined,
  entity: raw.entity ?? undefined,
  entity_id: raw.entity_id ?? undefined,
  target_user_id: raw.target_user_id ?? undefined,
  metadata: asObject(raw.metadata),
  old_state: asObject(raw.old_state ?? raw.oldState),
  new_state: asObject(raw.new_state),
  ip_address: raw.ip_address ?? undefined,
  user_agent: raw.user_agent ?? undefined,
  timestamp: raw.timestamp instanceof Date ? raw.timestamp.toISOString() : raw.timestamp,
}));

export type AdminLog = z.infer<typeof AdminLogSchema>;
