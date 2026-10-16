import { describe, expect, it } from 'vitest';
import { addMonths, formatDate, formatMonth, monthOf, today, upcoming, type Birthday, type DatedReminder } from './dates';

describe('today', () => {
  it('is the local date, written the way the app stores it', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(today()).toBe(new Date().toLocaleDateString('en-CA'));
  });
});

describe('formatDate', () => {
  it('writes the day as a person reads it', () => {
    expect(formatDate('2026-10-13')).toBe('13 October 2026');
    expect(formatDate('2026-01-05')).toBe('5 January 2026');
    expect(formatDate('2026-12-31')).toBe('31 December 2026');
  });

  it('keeps a leap day', () => {
    expect(formatDate('2028-02-29')).toBe('29 February 2028');
  });
});

describe('monthOf and formatMonth', () => {
  it('take the year and month off a date and write them back', () => {
    expect(monthOf('2026-10-13')).toBe('2026-10');
    expect(formatMonth('2026-10')).toBe('October 2026');
    expect(formatMonth('2027-01')).toBe('January 2027');
  });
});

describe('addMonths', () => {
  it('keeps the day of the month', () => {
    expect(addMonths('2026-10-16', 3)).toBe('2027-01-16');
    expect(addMonths('2026-10-16', 12)).toBe('2027-10-16');
  });

  it('crosses into the next year', () => {
    expect(addMonths('2026-12-15', 3)).toBe('2027-03-15');
  });

  it('stops at the last day of a shorter month', () => {
    expect(addMonths('2026-10-31', 3)).toBe('2027-01-31');
    expect(addMonths('2027-01-31', 3)).toBe('2027-04-30');
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
  });
});

describe('the upcoming window', () => {
  const ada: Birthday = { id: 1, name: 'Ada Lovelace', birthday: '1990-12-10' };
  const grace: Birthday = { id: 2, name: 'Grace Hopper', birthday: null };

  function reminder(fields: Partial<DatedReminder> & { remindOn: string }): DatedReminder {
    return {
      contactId: ada.id,
      contactName: ada.name,
      description: 'Send the photos',
      repeatsYearly: false,
      ...fields,
    };
  }

  it('ends three months on the same day, and includes both ends', () => {
    const dates = upcoming([{ id: 1, name: 'Ada', birthday: '1990-10-16' }], [], '2026-07-16');
    expect(dates[0].dates.map((date) => date.day)).toEqual(['2026-10-16']);

    const past = upcoming([{ id: 1, name: 'Ada', birthday: '1990-07-16' }], [], '2026-07-16');
    expect(past[0].dates.map((date) => date.day)).toEqual(['2026-07-16']);
  });

  it('stops at the last day of a shorter month', () => {
    const inside = upcoming([{ id: 1, name: 'Ada', birthday: '1990-04-30' }], [], '2026-01-31');
    const outside = upcoming([{ id: 1, name: 'Ada', birthday: '1990-05-01' }], [], '2026-01-31');

    expect(inside[0].dates.map((date) => date.day)).toEqual(['2026-04-30']);
    expect(outside).toEqual([]);
  });

  it('lists a birthday that is today', () => {
    const today: Birthday = { id: 3, name: 'Alan Turing', birthday: '1990-10-16' };

    expect(upcoming([today], [], '2026-10-16')).toEqual([
      {
        month: '2026-10',
        label: 'October 2026',
        dates: [{ day: '2026-10-16', kind: 'birthday', contactId: 3, contactName: 'Alan Turing', description: null }],
      },
    ]);
  });

  it('leaves out a contact with no birthday', () => {
    expect(upcoming([grace], [], '2026-10-16')).toEqual([]);
  });

  it('leaves out a birthday whose next date is past the window', () => {
    expect(upcoming([ada], [], '2026-06-16')).toEqual([]);
  });

  it('shows a birthday that has passed this year on its date next year when the window reaches it', () => {
    // The window runs from 20 December to 20 March, so 10 January next year is inside it.
    const january: Birthday = { id: 3, name: 'Alan Turing', birthday: '1990-01-10' };

    expect(upcoming([january], [], '2026-12-20')[0].dates.map((date) => date.day)).toEqual(['2027-01-10']);
  });

  it('keeps a 29 February birthday on the 28th in a year without one', () => {
    const leapling: Birthday = { id: 3, name: 'Alan Turing', birthday: '1990-02-29' };

    expect(upcoming([leapling], [], '2026-01-05')[0].dates.map((date) => date.day)).toEqual(['2026-02-28']);
    expect(upcoming([leapling], [], '2028-01-05')[0].dates.map((date) => date.day)).toEqual(['2028-02-29']);
  });

  it('lists a reminder in the window with what it says', () => {
    const listed = upcoming([], [reminder({ remindOn: '2026-11-02' })], '2026-10-16');

    expect(listed[0].dates).toEqual([
      {
        day: '2026-11-02',
        kind: 'reminder',
        contactId: 1,
        contactName: 'Ada Lovelace',
        description: 'Send the photos',
      },
    ]);
  });

  it('leaves out a reminder outside the window', () => {
    expect(upcoming([], [reminder({ remindOn: '2026-08-02' })], '2026-10-16')).toEqual([]);
    expect(upcoming([], [reminder({ remindOn: '2027-04-01' })], '2026-10-16')).toEqual([]);
  });

  it('brings a yearly reminder back on the same date each year', () => {
    const yearly = reminder({ remindOn: '2026-01-10', repeatsYearly: true });

    expect(upcoming([], [yearly], '2026-12-20')[0].dates.map((date) => date.day)).toEqual(['2027-01-10']);
    expect(upcoming([], [yearly], '2026-10-16')[0].dates.map((date) => date.day)).toEqual(['2027-01-10']);
  });

  it('lists a yearly reminder once inside the window', () => {
    const yearly = reminder({ remindOn: '2026-11-02', repeatsYearly: true });

    expect(upcoming([], [yearly], '2026-10-16')[0].dates.map((date) => date.day)).toEqual(['2026-11-02']);
  });

  it('groups the dates by month, soonest first', () => {
    const alan: Birthday = { id: 3, name: 'Alan Turing', birthday: '1990-11-20' };
    const katherine: Birthday = { id: 4, name: 'Katherine Johnson', birthday: '1990-08-26' };

    const months = upcoming([alan, katherine, ada], [reminder({ remindOn: '2026-10-30' })], '2026-10-16');

    expect(months.map((month) => month.label)).toEqual(['October 2026', 'November 2026', 'December 2026']);
    expect(months.map((month) => month.dates.map((date) => [date.day, date.kind]))).toEqual([
      [['2026-10-30', 'reminder']],
      [['2026-11-20', 'birthday']],
      [['2026-12-10', 'birthday']],
    ]);
    // Katherine's birthday in August is outside the window, so it is left out.
    expect(months.flatMap((month) => month.dates).map((date) => date.contactId)).not.toContain(4);
  });

  it('lists two dates on one day with the contact that comes first', () => {
    const months = upcoming([ada], [reminder({ remindOn: '2026-12-10' })], '2026-10-16');

    expect(months[0].dates.map((date) => date.kind)).toEqual(['birthday', 'reminder']);
  });
});
