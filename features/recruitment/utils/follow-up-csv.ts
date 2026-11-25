import type { RecruitmentAnalysisPerson } from '../schemas/recruitment-analysis.schema';

/** Quote CSV cells and keep spreadsheet formulas in user-entered fields inert. */
export function csvCell(value: string | number | null | undefined) {
  const text = String(value ?? '');
  const safe = /^[\s\u0000-\u001f]*[=+\-@]|^[\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function followUpCsv(people: RecruitmentAnalysisPerson[], group: string) {
  const columns = ['User ID', 'First name', 'Last name', 'Email', 'Phone number', 'Programme', 'Cohort', 'Source', 'Follow-up group', 'Furthest stage', 'Stalled days'];
  const rows = people.map(person => [
    person.user_id, person.first_name, person.last_name, person.email,
    person.phone_number ? `'${person.phone_number}` : '',
    person.programme_name, person.cohort_name, person.source, group,
    person.furthest_stage.replace(/_/g, ' '), person.stalled_days,
  ]);
  return '\uFEFF' + [columns, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
}
