// A date is a local-time string YYYY-MM-DD. This is the only file that does
// date arithmetic, and every function that needs today takes it as an
// argument, so tests fix the day they mean.

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Today, as the app writes it. The one place that reads the clock. */
export function today(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** "2026-10-13" reads as "13 October 2026". */
export function formatDate(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  return `${date} ${MONTHS[month - 1]} ${year}`;
}
