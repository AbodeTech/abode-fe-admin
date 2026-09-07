/**
 * ABO-27 — Lifecycle email designs (HTML only).
 * Delivery / scheduling is BE (ABO-70–73). These templates are the FE design source
 * for preview in Admin and handoff to BE.
 */

export type EventEmailKind =
  | 'registration'
  | 'reminder'
  | 'qr'
  | 'pickup'
  | 'review'
  | 'waitlist';

export type EventEmailSample = {
  first_name: string;
  programme_name: string;
  cohort_label: string;
  event_date: string;
  venue: string;
  city: string;
  join_url: string;
  register_url: string;
  qr_image_url: string;
  pickup_point: string;
  pickup_time: string;
  review_url: string;
  waitlist_position: number;
  support_email: string;
};

export const DEFAULT_EMAIL_SAMPLE: EventEmailSample = {
  first_name: 'Ada',
  programme_name: 'Realtor Certification Program',
  cohort_label: 'September 2026',
  event_date: 'Thursday, 25 Sep 2026 · 9:00 AM WAT',
  venue: 'Abode HQ, Lekki Phase 1',
  city: 'Lagos',
  join_url: 'https://abodewebinar.abodeflex.ng/join/rcp-sep-session-2',
  register_url: 'https://abodewebinar.abodeflex.ng/register?cohort=rcp-september-2026',
  qr_image_url:
    'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=abode-checkin-reg_1',
  pickup_point: 'CMS Bus Park, Lagos Island',
  pickup_time: '7:30 AM WAT',
  review_url: 'https://abodewebinar.abodeflex.ng/company-events/demo/review',
  waitlist_position: 12,
  support_email: 'academy@abodeflex.ng',
};

export const EVENT_EMAIL_META: Record<
  EventEmailKind,
  { title: string; subject: string; description: string }
> = {
  registration: {
    title: 'Registration confirmation',
    subject: 'You’re registered — {{programme_name}} ({{cohort_label}})',
    description: 'Sent after a successful cohort registration.',
  },
  reminder: {
    title: 'Session / event reminder',
    subject: 'Reminder: {{programme_name}} starts {{event_date}}',
    description: 'Pre-session reminder for online or physical attendance.',
  },
  qr: {
    title: 'Check-in QR code',
    subject: 'Your check-in QR — {{programme_name}}',
    description: 'Issued when physical venue details are confirmed.',
  },
  pickup: {
    title: 'Pickup point details',
    subject: 'Your pickup for {{programme_name}} outing',
    description: 'Company-event (site inspection / allocation day) bus pickup info.',
  },
  review: {
    title: 'Post-event review invite',
    subject: 'How was the outing? Share a quick review',
    description: 'Sent to checked-in company-event attendees only.',
  },
  waitlist: {
    title: 'Waitlist confirmation',
    subject: 'You’re on the waitlist — {{programme_name}}',
    description: 'When registration is full or seats are limited.',
  },
};

function shell(opts: {
  title: string;
  preheader: string;
  bodyHtml: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#0F4C59;padding:28px 32px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.02em;">ABODE ACADEMY</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px;">
              ${opts.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background:#151616;padding:20px 32px;text-align:center;">
              <p style="margin:0;color:#888888;font-size:12px;">© 2026 AbodeFlex · Abode Academy</p>
              <p style="margin:8px 0 0;color:#666666;font-size:11px;">Design only (ABO-27) — sending is handled by backend.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function cta(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#0F4C59;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px;">${label}</a>`;
}

function detailBox(rows: { label: string; value: string }[]): string {
  const items = rows
    .map(
      (r) =>
        `<p style="margin:0 0 8px;color:#334155;font-size:14px;"><strong style="color:#0F4C59;">${r.label}:</strong> ${r.value}</p>`,
    )
    .join('');
  return `<div style="margin:24px 0;padding:16px 18px;background:#F8FAFC;border-radius:12px;text-align:left;">${items}</div>`;
}

export function renderEventEmail(
  kind: EventEmailKind,
  sample: EventEmailSample = DEFAULT_EMAIL_SAMPLE,
): { subject: string; html: string } {
  const meta = EVENT_EMAIL_META[kind];
  const subject = meta.subject
    .replace(/\{\{programme_name\}\}/g, sample.programme_name)
    .replace(/\{\{cohort_label\}\}/g, sample.cohort_label)
    .replace(/\{\{event_date\}\}/g, sample.event_date);

  switch (kind) {
    case 'registration':
      return {
        subject,
        html: shell({
          title: meta.title,
          preheader: `You’re in for ${sample.programme_name}.`,
          bodyHtml: `
            <h1 style="margin:0 0 12px;color:#0F4C59;font-size:24px;">You’re registered, ${sample.first_name}!</h1>
            <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">
              Welcome to <strong>${sample.programme_name}</strong> — ${sample.cohort_label}.
              Save this email. We’ll send session links and venue updates here.
            </p>
            ${detailBox([
              { label: 'Programme', value: sample.programme_name },
              { label: 'Cohort', value: sample.cohort_label },
              { label: 'Next step', value: 'Watch for your session join / QR emails' },
            ])}
            <div style="text-align:center;margin-top:8px;">${cta(sample.register_url, 'View registration')}</div>
            <p style="margin:24px 0 0;color:#94A3B8;font-size:12px;">Questions? ${sample.support_email}</p>
          `,
        }),
      };
    case 'reminder':
      return {
        subject,
        html: shell({
          title: meta.title,
          preheader: `Reminder: ${sample.event_date}`,
          bodyHtml: `
            <h1 style="margin:0 0 12px;color:#0F4C59;font-size:24px;">Coming up soon</h1>
            <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">
              Hi ${sample.first_name}, this is a reminder for <strong>${sample.programme_name}</strong>.
            </p>
            ${detailBox([
              { label: 'When', value: sample.event_date },
              { label: 'Where', value: `${sample.venue}, ${sample.city}` },
            ])}
            <div style="text-align:center;">${cta(sample.join_url, 'Open session link')}</div>
          `,
        }),
      };
    case 'qr':
      return {
        subject,
        html: shell({
          title: meta.title,
          preheader: 'Your venue check-in QR is ready.',
          bodyHtml: `
            <h1 style="margin:0 0 12px;color:#0F4C59;font-size:24px;">Your check-in QR</h1>
            <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">
              Hi ${sample.first_name}, show this code at the entrance. Do not share it.
            </p>
            <div style="margin:28px 0;text-align:center;">
              <div style="display:inline-block;background:#EDFCFF;padding:24px;border-radius:16px;">
                <img src="${sample.qr_image_url}" width="220" height="220" alt="Check-in QR" style="display:block;border-radius:8px;" />
              </div>
            </div>
            ${detailBox([
              { label: 'Date', value: sample.event_date },
              { label: 'Venue', value: sample.venue },
            ])}
          `,
        }),
      };
    case 'pickup':
      return {
        subject,
        html: shell({
          title: meta.title,
          preheader: `Pickup at ${sample.pickup_point}`,
          bodyHtml: `
            <h1 style="margin:0 0 12px;color:#0F4C59;font-size:24px;">Your pickup details</h1>
            <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">
              Hi ${sample.first_name}, here’s where to meet the bus for the outing.
            </p>
            ${detailBox([
              { label: 'Pickup point', value: sample.pickup_point },
              { label: 'Time', value: sample.pickup_time },
              { label: 'Destination', value: `${sample.venue}, ${sample.city}` },
            ])}
            <p style="margin:0;color:#94A3B8;font-size:12px;">Arrive 10 minutes early. Bring a valid ID.</p>
          `,
        }),
      };
    case 'review':
      return {
        subject,
        html: shell({
          title: meta.title,
          preheader: 'Share a quick review of the outing.',
          bodyHtml: `
            <h1 style="margin:0 0 12px;color:#0F4C59;font-size:24px;">How was the outing?</h1>
            <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">
              Hi ${sample.first_name}, thanks for attending. Your feedback helps us improve site inspections and allocation days.
            </p>
            <div style="text-align:center;margin:28px 0;">${cta(sample.review_url, 'Leave a review')}</div>
            <p style="margin:0;color:#94A3B8;font-size:12px;">This link is only for checked-in attendees.</p>
          `,
        }),
      };
    case 'waitlist':
      return {
        subject,
        html: shell({
          title: meta.title,
          preheader: `Waitlist position #${sample.waitlist_position}`,
          bodyHtml: `
            <h1 style="margin:0 0 12px;color:#0F4C59;font-size:24px;">You’re on the waitlist</h1>
            <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">
              Hi ${sample.first_name}, seats for <strong>${sample.programme_name}</strong> (${sample.cohort_label}) are currently full.
            </p>
            ${detailBox([{ label: 'Approximate position', value: `#${sample.waitlist_position}` }])}
            <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">
              We’ll email you if a seat opens. No action needed right now.
            </p>
          `,
        }),
      };
  }
}

export const EVENT_EMAIL_KINDS = Object.keys(EVENT_EMAIL_META) as EventEmailKind[];
