/** Read the two stable columns in the offline sheet, including quoted CSV cells. */
export function parseConfirmationCsv(source: string): { attendance_id: string; given: boolean }[] {
  const records: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"') {
      if (quoted && source[index + 1] === '"') { cell += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell); cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      row.push(cell); cell = '';
      if (row.some((value) => value.trim())) records.push(row);
      row = [];
    } else cell += char;
  }
  if (quoted) throw new Error('The CSV has an unfinished quoted cell');
  row.push(cell);
  if (row.some((value) => value.trim())) records.push(row);
  const header = records.shift()?.map((value) => value.trim().replace(/^\uFEFF/, '').toLowerCase()) ?? [];
  const idIndex = header.indexOf('attendance_id');
  const givenIndex = header.indexOf('given');
  if (idIndex < 0 || givenIndex < 0) throw new Error('The sheet needs attendance_id and given columns');
  return records.map((values) => ({
    attendance_id: (values[idIndex] ?? '').trim(),
    given: ['true', 'yes', '1', 'y', 'x', '✓'].includes((values[givenIndex] ?? '').trim().toLowerCase()),
  })).filter((value) => value.attendance_id);
}
