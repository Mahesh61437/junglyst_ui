import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTime, formatDuration, parseLocalDate, seatsLabel, splitCommission, projectRevenue,
  bookingTotal, registrationState, validateAttendee, linesToList, listToLines, toCsv, formatINR,
} from './workshops.js';

describe('formatTime', () => {
  test('converts 24h to 12h', () => {
    assert.equal(formatTime('14:30:00'), '2:30 PM');
    assert.equal(formatTime('00:05'), '12:05 AM');
    assert.equal(formatTime('12:00'), '12:00 PM');
  });
  test('empty / bad input', () => {
    assert.equal(formatTime(''), '');
    assert.equal(formatTime('ab'), '');
  });
});

describe('formatDuration', () => {
  test('hours and minutes', () => {
    assert.equal(formatDuration(150), '2 hr 30 min');
    assert.equal(formatDuration(120), '2 hrs');
    assert.equal(formatDuration(60), '1 hr');
    assert.equal(formatDuration(45), '45 min');
    assert.equal(formatDuration(0), '');
  });
});

test('parseLocalDate keeps the calendar day', () => {
  const d = parseLocalDate('2026-10-18');
  assert.equal(d.getDate(), 18);
  assert.equal(d.getMonth(), 9);
  assert.equal(parseLocalDate(''), null);
});

describe('seatsLabel', () => {
  test('tones', () => {
    assert.deepEqual(seatsLabel(0), { text: 'Sold out', tone: 'soldout' });
    assert.equal(seatsLabel(1).text, 'Only 1 seat left');
    assert.equal(seatsLabel(5).tone, 'low');
    assert.equal(seatsLabel(6).tone, 'ok');
  });
});

describe('money', () => {
  test('splitCommission matches backend rounding', () => {
    assert.deepEqual(splitCommission('1798.00', 20), { commission: 359.6, sellerPayout: 1438.4 });
    assert.deepEqual(splitCommission(500, 0), { commission: 0, sellerPayout: 500 });
  });
  test('projectRevenue ignores negative / fractional seats', () => {
    assert.deepEqual(projectRevenue({ price: 899, seats: 10, commissionPercent: 20 }),
      { gross: 8990, commission: 1798, sellerPayout: 7192 });
    assert.equal(projectRevenue({ price: 899, seats: -3, commissionPercent: 20 }).gross, 0);
    assert.equal(projectRevenue({ price: 100, seats: 2.9, commissionPercent: 0 }).gross, 200);
  });
  test('bookingTotal and formatINR', () => {
    assert.equal(bookingTotal('899.00', 2), 1798);
    assert.equal(formatINR(1798), '₹1,798');
    assert.equal(formatINR('abc'), '₹0');
  });
});

describe('registrationState', () => {
  const now = new Date('2026-10-11T10:00:00Z');
  test('server state wins and drives labels / badges', () => {
    assert.deepEqual(
      (({ state, open, badge }) => ({ state, open, badge }))(registrationState({ registration_state: 'sold_out' }, now)),
      { state: 'sold_out', open: false, badge: 'Sold out' });
    assert.equal(registrationState({ registration_state: 'no_dates' }, now).label, 'New dates coming soon');
    assert.equal(registrationState({ registration_state: 'closed' }, now).open, false);
  });
  test('opens later: label, badge and the moment it flips', () => {
    const s = registrationState({ registration_state: 'opens_later', registration_opens_at: '2026-10-20T04:30:00Z' }, now);
    assert.equal(s.open, false);
    assert.match(s.label, /^Registrations open 20 Oct, /);
    assert.equal(s.badge, 'Opens 20 Oct');
    assert.equal(s.nextChangeAt.toISOString(), '2026-10-20T04:30:00.000Z');
  });
  test('open with deadline flips at the close time', () => {
    const s = registrationState({ registration_state: 'open', registration_closes_at: '2026-10-30T00:00:00Z' }, now);
    assert.equal(s.open, true);
    assert.match(s.label, /^Register by 30 Oct/);
    assert.equal(s.nextChangeAt.toISOString(), '2026-10-30T00:00:00.000Z');
  });
  test('falls back to the time window for older payloads', () => {
    assert.equal(registrationState({ registration_opens_at: '2026-10-20T00:00:00Z' }, now).state, 'opens_later');
    assert.equal(registrationState({ registration_closes_at: '2026-10-01T00:00:00Z' }, now).state, 'closed');
    assert.equal(registrationState({}, now).state, 'open');
  });
  test('msUntil is clamped for setTimeout', async () => {
    const { msUntil } = await import('./workshops.js');
    assert.equal(msUntil(new Date(1000), 5000), 0);
    assert.equal(msUntil(new Date(Date.UTC(2030, 0, 1)), 0), 2 ** 31 - 1);
  });
});

test('validateAttendee', () => {
  assert.deepEqual(validateAttendee({ attendee_name: 'Asha', attendee_phone: '9876543210', attendee_email: 'a@b.co' }), {});
  const errors = validateAttendee({ attendee_name: ' ', attendee_phone: '12', attendee_email: 'nope' });
  assert.deepEqual(Object.keys(errors).sort(), ['attendee_email', 'attendee_name', 'attendee_phone']);
});

test('list <-> lines round trip drops blanks', () => {
  assert.deepEqual(linesToList(' 3 inch bowl \n\nWelcome drink\n'), ['3 inch bowl', 'Welcome drink']);
  assert.equal(listToLines(['a', 'b']), 'a\nb');
  assert.equal(listToLines(null), '');
});

test('toCsv escapes commas, quotes and newlines', () => {
  const csv = toCsv([{ name: 'Asha, K', note: 'said "hi"' }], [
    { label: 'Name', value: r => r.name },
    { label: 'Note', value: r => r.note },
  ]);
  assert.equal(csv, 'Name,Note\n"Asha, K","said ""hi"""');
});

test('googleCalendarUrl builds an IST event window', async () => {
  const { googleCalendarUrl } = await import('./workshops.js');
  const url = new URL(googleCalendarUrl({
    title: 'Terrarium Basics', date: '2026-10-18', start: '10:00:00', end: '12:30', location: 'Kochi', details: 'Ref JNG-1',
  }));
  assert.equal(url.searchParams.get('dates'), '20261018T100000/20261018T123000');
  assert.equal(url.searchParams.get('ctz'), 'Asia/Kolkata');
  assert.equal(url.searchParams.get('text'), 'Terrarium Basics');
});

test('datetime-local round trip', async () => {
  const { toLocalInput, fromLocalInput } = await import('./workshops.js');
  const local = toLocalInput('2026-10-18T04:30:00.000Z');
  assert.match(local, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  assert.equal(fromLocalInput(local), '2026-10-18T04:30:00.000Z');
  assert.equal(toLocalInput(''), '');
  assert.equal(fromLocalInput(''), null);
});

describe('co-hosting', async () => {
  const { allocateByShare, splitAcrossCohosts, sharesTotal, evenShares, termsSignature } = await import('./workshops.js');
  test('allocateByShare sums exactly and matches the backend', () => {
    assert.deepEqual(allocateByShare(10, [33.33, 33.33, 33.34]), [3.33, 3.33, 3.34]);
    assert.deepEqual(allocateByShare(1000, [60, 40]), [600, 400]);
    const parts = allocateByShare(899, [33.33, 33.33, 33.34]);
    assert.equal(Math.round(parts.reduce((a, b) => a + b, 0) * 100), 89900);
  });
  test('splitAcrossCohosts applies each seller commission', () => {
    const rows = splitAcrossCohosts(1000, [
      { seller: 'a', share_percent: '60', commission_percent: '20' },
      { seller: 'b', share_percent: '40', commission_percent: '15' },
    ]);
    assert.deepEqual(rows, [
      { seller: 'a', gross: 600, commission: 120, payout: 480 },
      { seller: 'b', gross: 400, commission: 60, payout: 340 },
    ]);
  });
  test('sharesTotal, evenShares, termsSignature', () => {
    assert.equal(sharesTotal([{ share_percent: '33.33' }, { share_percent: '66.67' }]), 100);
    assert.deepEqual(evenShares(3), [33.34, 33.33, 33.33]);
    assert.equal(evenShares(3).reduce((a, b) => a + b, 0).toFixed(2), '100.00');
    assert.equal(termsSignature([{ seller: 'a', share_percent: '50.00', commission_percent: 20 }]),
      termsSignature([{ seller: 'a', share_percent: 50, commission_percent: '20.00' }]));
  });
});

test('hostNames joins co-hosts and falls back to the lead', async () => {
  const { hostNames } = await import('./workshops.js');
  assert.equal(hostNames({ organisers: [{ name: 'A' }] }), 'A');
  assert.equal(hostNames({ organisers: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] }), 'A, B & C');
  assert.equal(hostNames({ organiser: { name: 'Lead' } }), 'Lead');
});

test('phoneLinks builds tel and WhatsApp links', async () => {
  const { phoneLinks } = await import('./workshops.js');
  assert.deepEqual(phoneLinks('98765 43210'), { tel: 'tel:+919876543210', whatsapp: 'https://wa.me/919876543210' });
  assert.deepEqual(phoneLinks('+91 98765 43210'), { tel: 'tel:+919876543210', whatsapp: 'https://wa.me/919876543210' });
  assert.equal(phoneLinks(''), null);
  assert.equal(phoneLinks('12345'), null);
});

test('isPastSession compares local date + start time', async () => {
  const { isPastSession } = await import('./workshops.js');
  const now = new Date(2026, 9, 12, 14, 0); // 12 Oct 2026, 2:00 PM local
  assert.equal(isPastSession('2026-10-12', '10:00', now), true);
  assert.equal(isPastSession('2026-10-12', '15:30', now), false);
  assert.equal(isPastSession('2026-10-11', '23:00', now), true);
  assert.equal(isPastSession('2026-10-13', '09:00', now), false);
  assert.equal(isPastSession('', '10:00', now), false);
});

describe('photoLibrary', async () => {
  const { photoLibrary } = await import('./workshops.js');
  test('gallery then option photos, without duplicates', () => {
    assert.deepEqual(photoLibrary(['cover.jpg', 'bowl8.jpg'], [
      { images: ['bowl6.jpg'] }, { images: ['bowl8.jpg'] }, {},
    ]), ['cover.jpg', 'bowl8.jpg', 'bowl6.jpg']);
    assert.deepEqual(photoLibrary(undefined, undefined), []);
  });
});

describe('custom sections', async () => {
  const { cleanSections, sectionsError, MAX_CUSTOM_SECTIONS } = await import('./workshops.js');

  test('cleanSections trims, drops blank rows and editor keys', () => {
    assert.deepEqual(cleanSections([
      { key: 'a', title: ' Notes ', body: ' Arrive early. ' },
      { key: 'b', title: '', body: '   ' },
    ]), [{ title: 'Notes', body: 'Arrive early.' }]);
    assert.deepEqual(cleanSections(undefined), []);
  });

  test('sectionsError', () => {
    assert.equal(sectionsError([{ title: 'Notes', body: 'x' }, { title: '', body: '' }]), null);
    assert.match(sectionsError([{ title: 'Notes', body: '' }]), /heading and a description/);
    assert.match(sectionsError([{ title: '', body: 'Text' }]), /heading and a description/);
    const tooMany = Array.from({ length: MAX_CUSTOM_SECTIONS + 1 }, (_, i) => ({ title: `S${i}`, body: 'x' }));
    assert.match(sectionsError(tooMany), /at most/);
  });
});

describe('group booking', async () => {
  const { isSharedOption, optionUnitLabel, sharedNote, normaliseParty, chargedUnits, partyLabel, galleryImages } = await import('./workshops.js');
  const solo = { pricing: 'per_person', max_people_per_build: 1 };
  const family = { pricing: 'per_build', max_people_per_build: 4 };

  test('galleryImages: option photos first, workshop photos as fallback', () => {
    const workshop = { images: ['w1.jpg', 'w2.jpg'] };
    assert.deepEqual(galleryImages(workshop, { images: ['bowl6.jpg'] }), ['bowl6.jpg']);
    assert.deepEqual(galleryImages(workshop, { images: [] }), ['w1.jpg', 'w2.jpg']);
    assert.deepEqual(galleryImages(workshop, undefined), ['w1.jpg', 'w2.jpg']);
    assert.deepEqual(galleryImages({}, null), []);
  });

  test('labels', () => {
    assert.equal(isSharedOption(family), true);
    assert.equal(isSharedOption(solo), false);
    assert.equal(optionUnitLabel(family), 'per group');
    assert.equal(optionUnitLabel(solo), 'per person');
    assert.equal(sharedNote(family), 'Up to 4 people share one terrarium');
    assert.equal(sharedNote(solo), '');
  });
  test('per-person party: one terrarium each, capped by seats', () => {
    assert.deepEqual(normaliseParty(solo, 9, 1, 6), { people: 6, builds: 6, minPeople: 1, maxPeople: 6, maxBuilds: 6 });
    assert.equal(chargedUnits(solo, normaliseParty(solo, 3, 1, 6)), 3);
  });
  test('shared party: each group slot is one seat for up to a group', () => {
    assert.deepEqual(normaliseParty(family, 1, 1, 6), { people: 4, builds: 1, minPeople: 4, maxPeople: 4, maxBuilds: 6 });
    assert.equal(normaliseParty(family, 1, 2, 6).people, 8, 'two slots, up to 8 people');
    assert.equal(normaliseParty(family, 1, 9, 6).builds, 6, 'capped by seats, not people');
    assert.equal(normaliseParty(family, 1, 1, 1).builds, 1, 'one seat left still fits a group');
    assert.equal(chargedUnits(family, normaliseParty(family, 1, 2, 6)), 2);
  });
  test('partyLabel', () => {
    assert.equal(partyLabel({ participants: 3, builds: 1 }), '3 people · 1 shared terrarium');
    assert.equal(partyLabel({ participants: 6, builds: 2 }), '6 people · 2 shared terrariums');
    assert.equal(partyLabel({ participants: 2, builds: 2 }), '2 people');
    assert.equal(partyLabel({ participants: 1, builds: 1 }), '1 person');
  });
});
