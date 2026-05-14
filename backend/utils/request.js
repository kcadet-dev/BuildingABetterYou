export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function parseDateInput(dateValue) {
  if (!dateValue) {
    return null;
  }

  const [year, month, day] = String(dateValue).split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day, 12);
}

export function parseIntegerParam(value) {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) ? parsedValue : null;
}
