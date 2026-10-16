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

/** The year and month a date sits in, as the dashboard groups them. */
export function monthOf(day: string): string {
  return day.slice(0, 7);
}

/** "2026-10" reads as "October 2026", for a month heading. */
export function formatMonth(month: string): string {
  const [year, number] = month.split('-').map(Number);
  return `${MONTHS[number - 1]} ${year}`;
}

/**
 * The same day of the month a number of months on, and the last day of that
 * month when it is shorter. "2026-10-31" three months on is "2027-01-31",
 * while "2027-01-31" three months on is "2027-04-30".
 */
export function addMonths(day: string, months: number): string {
  const [year, month, date] = day.split('-').map(Number);
  const wanted = month - 1 + months;
  const lastDay = new Date(year, wanted + 1, 0).getDate();
  return `${year + Math.floor(wanted / 12)}-${pad((wanted % 12) + 1)}-${pad(Math.min(date, lastDay))}`;
}

/** The same month and day in another year. 29 February falls on the 28th in a year without one. */
function inYear(day: string, year: number): string {
  const [, month, date] = day.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${pad(month)}-${pad(Math.min(date, lastDay))}`;
}

function pad(part: number): string {
  return `${part}`.padStart(2, '0');
}

/* The dashboard's window */

/** A contact with a birthday, as the dashboard needs to see one. */
export interface Birthday {
  id: number;
  name: string;
  birthday: string | null;
}

/** A reminder, as the dashboard needs to see one. */
export interface DatedReminder {
  contactId: number;
  contactName: string;
  remindOn: string;
  description: string;
  repeatsYearly: boolean;
}

export interface UpcomingDate {
  day: string;
  kind: 'birthday' | 'reminder';
  contactId: number;
  contactName: string;
  /** What a reminder says. A birthday has no text of its own. */
  description: string | null;
}

export interface UpcomingMonth {
  month: string;
  label: string;
  dates: UpcomingDate[];
}

/**
 * Every birthday and reminder between today and the same date three months on,
 * both days included, soonest first and grouped by month.
 *
 * A birthday has no reminder behind it and comes round every year, so it
 * shows on its next date on or after today. A reminder shows on the date it
 * holds, and a yearly one comes round too.
 */
export function upcoming(birthdays: Birthday[], reminders: DatedReminder[], today: string): UpcomingMonth[] {
  const last = addMonths(today, 3);
  const dates: UpcomingDate[] = [];

  for (const contact of birthdays) {
    if (!contact.birthday) continue;
    for (const day of everyYear(contact.birthday, today, last)) {
      dates.push({
        day,
        kind: 'birthday',
        contactId: contact.id,
        contactName: contact.name,
        description: null,
      });
    }
  }

  for (const reminder of reminders) {
    const days = reminder.repeatsYearly ? everyYear(reminder.remindOn, today, last) : [reminder.remindOn];
    for (const day of days) {
      if (day < today || day > last) continue;
      dates.push({
        day,
        kind: 'reminder',
        contactId: reminder.contactId,
        contactName: reminder.contactName,
        description: reminder.description,
      });
    }
  }

  dates.sort((one, other) =>
    one.day === other.day
      ? one.contactId - other.contactId || one.kind.localeCompare(other.kind)
      : one.day < other.day
        ? -1
        : 1,
  );

  return dates.reduce<UpcomingMonth[]>((months, date) => {
    const month = monthOf(date.day);
    const lastGroup = months.at(-1);
    if (lastGroup && lastGroup.month === month) lastGroup.dates.push(date);
    else months.push({ month, label: formatMonth(month), dates: [date] });
    return months;
  }, []);
}

/** Every date from today to last on which the same month and day come round again. */
function everyYear(anniversary: string, today: string, last: string): string[] {
  const days: string[] = [];
  for (let year = Number(today.slice(0, 4)); year <= Number(last.slice(0, 4)); year += 1) {
    const day = inYear(anniversary, year);
    if (day >= today && day <= last) days.push(day);
  }
  return days;
}
