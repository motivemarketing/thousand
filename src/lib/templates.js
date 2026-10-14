// Ready-made goals. Rule for every rep: doing it on its scheduled days should move the goal's number.
// reps = the default set (1 to 3). more = other reps that also move this number, offered as add-ons.
import { SLEEPMID } from './baseline.js';

export const M = [1, 2, 3, 4, 5, 6], MF = [1, 2, 3, 4, 5];

export function templates(b) {
  const all = build(b), ok = (t) => (t.kind === 'down' ? t.to < t.from : t.kind === 'up' ? t.to > t.from : t.to > 0);
  return Object.fromEntries(Object.entries(all).map(([k, list]) => [k, list.filter(ok)]));
}

function build(b) {
  const a = b?.answers || {};
  const weight = Number(a.hw?.lb) || 200, sys = Number(a.bp?.s) || 134, sleep = SLEEPMID[a.sleep] || 6, mscore = Number(a.mscore) || 6;
  const screen = { 'Under 1 hour': 1, '1–2 hours': 1.5, '2–4 hours': 3, 'More than 4 hours': 4.5 }[a.screen] || 3;
  const work = { 'Under 30': 30, '30–40': 40, '41–50': 48, '51–60': 58, 'More than 60': 65 }[a.whours] || 58;
  return {
    faith: [
      { t: 'Read the whole Bible', kind: 'count', unit: 'chapters', from: 0, to: 1189, months: 12,
        reps: [['Read 4 chapters of Scripture', M]], more: [['Catch-up: read 8 chapters', [6]]],
        why: '1,189 chapters. 4 a day, Monday to Saturday, finishes in a year.' },
      { t: 'Read the New Testament', kind: 'count', unit: 'chapters', from: 0, to: 260, months: 4,
        reps: [['Read 3 chapters of Scripture', M]], more: [['Catch-up: read 6 chapters', [6]]],
        why: '260 chapters. 3 a day, Monday to Saturday, finishes in about 4 months.' },
      { t: 'Memorize 52 verses', kind: 'count', unit: 'verses', from: 0, to: 52, months: 12,
        reps: [['Learn this week\'s new verse', [1]], ['Recite my verses from memory', M]], more: [['Write this week\'s verse on a card', [1]]],
        why: 'A new verse every Monday, recited daily so it sticks. It counts when you can say it word for word.' },
      { t: 'Pray for my crew daily', kind: 'count', unit: 'days of prayer', from: 0, to: 78, months: 3,
        reps: [['Pray for each person in my crew by name', M]], more: [],
        why: 'Every day but Sunday for 3 months.' }],
    marriage: [
      { t: 'Weekly date nights', kind: 'count', unit: 'date nights', from: 0, to: 26, months: 6,
        reps: [['Date night', [5]]], more: [['Plan and book this week\'s date', [2]]],
        why: 'Every Friday for 6 months.' },
      { t: 'Pray together nightly', kind: 'count', unit: 'nights of prayer', from: 0, to: 78, months: 3,
        reps: [['Pray together before bed', M]], more: [],
        why: 'Monday to Saturday for 3 months.' },
      { t: 'Read a marriage book together', kind: 'count', unit: 'chapters', from: 0, to: 12, months: 3,
        reps: [['Read this week\'s chapter', [1]], ['Talk through the chapter together', [3]]], more: [],
        why: 'One chapter a week: read it Monday, talk it through Wednesday.' },
      { t: 'Raise our marriage score', kind: 'up', unit: 'out of 10', from: mscore, to: Math.min(10, mscore + 2), months: 6,
        reps: [['10 minutes of real conversation, no phones', M], ['Date night', [5]]], more: [['Pray together before bed', M], ['Ask: how can I love you better this week?', [6]]],
        why: `Your onboarding answer was ${mscore}. Rate it together on the Saturday check-in.` }],
    parenting: [
      { t: 'One-on-ones with each kid', kind: 'count', unit: 'one-on-ones', from: 0, to: 72, months: 6,
        reps: [['One-on-one time with a kid', [2, 4, 6]]], more: [['Put the next one-on-ones on the calendar', [1]]],
        why: '3 a week for 6 months. Rotate through every kid.' },
      { t: 'Family dinner most nights', kind: 'count', unit: 'family dinners', from: 0, to: 100, months: 5,
        reps: [['Family dinner at the table, phones away', MF]], more: [['Plan the week\'s dinners', [6]]],
        why: 'Weeknights at the table for 5 months.' },
      { t: 'Bible time with the kids', kind: 'count', unit: 'family devotions', from: 0, to: 72, months: 6,
        reps: [['Bedtime Scripture with the kids', [1, 3, 5]]], more: [],
        why: '3 nights a week for 6 months.' }],
    health: [
      { t: 'Lose weight', kind: 'down', unit: 'lbs', from: weight, to: Math.round(weight * 0.93), months: 4,
        reps: [['Stay within my calorie target', M], ['30 minutes of movement', M]], more: [['Log everything I eat', M], ['No food after 8 pm', M], ['Protein at every meal', M]],
        why: 'Starts from your onboarding weight. Weight comes off mostly through food. CDC: 1 to 2 lbs a week is a safe pace.' },
      { t: 'Lower my blood pressure', kind: 'down', unit: 'mmHg (top number)', from: sys, to: 119, months: 6,
        reps: [['30 minutes of brisk movement', M], ['Under 2,300 mg of sodium', M]], more: [['One drink or none', M], ['Lights out 7.5 hours before my alarm', M]],
        why: 'AHA: under 120/80 is normal. Movement and less sodium are the two biggest levers.' },
      { t: 'Run a half marathon', kind: 'up', unit: 'mile long run', from: 3, to: 13.1, months: 5,
        reps: [['Training run', [2, 4]], ['Long run', [6]]], more: [['Strength or cross-training', [1, 5]]],
        why: 'Build the Saturday long run from 3 to 13.1 miles.' },
      { t: 'Sleep 7 hours', kind: 'up', unit: 'hours a night', from: Math.min(sleep, 6.5), to: 7, months: 2,
        reps: [['Lights out 7.5 hours before my alarm', M], ['Phone out of the bedroom', M]], more: [['No caffeine after 2 pm', M]],
        why: '7 hours is the AASM minimum for adults.' }],
    worklife: [
      { t: 'Laptop closed by 6', kind: 'count', unit: 'evenings', from: 0, to: 60, months: 3,
        reps: [['Laptop closed by 6:00', MF]], more: [['Plan tomorrow before shutting down', MF]],
        why: 'Weeknights for 3 months.' },
      { t: 'Cut my screen time', kind: 'down', unit: 'hours a day', from: screen, to: Math.max(0.5, Math.round(screen) / 2), months: 2,
        reps: [['Phone in the drawer by 9:00', M], ['No social apps before noon', M]], more: [['Delete or time-limit one app', [6]]],
        why: 'Check your phone\'s screen time report on the Saturday check-in.' },
      { t: 'Work under 50 hours', kind: 'down', unit: 'hours a week', from: Math.max(work, 52), to: 48, months: 3,
        reps: [['Leave work by 5:30', MF], ['Plan tomorrow before leaving', MF]], more: [['Decline one meeting I don\'t need', [1]]],
        why: 'Brought into your 119-hour budget.' }],
    budget: [
      { t: 'Pay off the credit card', kind: 'down', unit: '$', from: 5000, to: 0, months: 12,
        reps: [['No new charges on the card', M], ['Extra payment on the card', [5]]], more: [['Cancel, sell or cut something and send it to the card', [3]]],
        why: 'Change the starting balance to yours. Stop adding to it, and send an extra payment every Friday.' },
      { t: 'Build an emergency fund', kind: 'up', unit: '$', from: 1000, to: 10000, months: 12,
        reps: [['Transfer to the emergency fund', [5]], ['No-spend day', [1, 2, 3, 4]]], more: [['Pack lunch and save the difference', MF]],
        why: 'About 3 months of expenses, saved over a year. Move the money every Friday.' },
      { t: 'Stick to the grocery budget', kind: 'down', unit: '$ a month', from: 1400, to: 1000, months: 3,
        reps: [['Plan meals and the shopping list', [6]], ['Dinner from the plan, no takeout', MF]], more: [['Shop from the list only', [6]]],
        why: 'Brought down over 3 months.' }],
  };
}

/** Rep ideas for a goal: its template's reps and add-ons when it came from one, otherwise every rep in the area. */
export function repIdeas(area, title, b) {
  const list = templates(b)[area] || [];
  const t = list.find((x) => x.t === title);
  return [...new Set((t ? [...t.reps, ...t.more] : list.flatMap((x) => [...x.reps, ...x.more])).map((r) => r[0]))];
}
export function repDays(area, name) {
  for (const t of templates(null)[area] || []) for (const [n, d] of [...t.reps, ...t.more]) if (n === name) return [...d];
  return [...M];
}
