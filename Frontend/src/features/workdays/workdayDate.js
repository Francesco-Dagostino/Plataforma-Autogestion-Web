const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires'

function getDateParts(date) {
  return Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: ARGENTINA_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(date)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value]),
  )
}

export function getArgentinaToday() {
  const { year, month, day } = getDateParts(new Date())
  return `${year}-${month}-${day}`
}

// DateEntry represents a calendar day. Keep its date portion instead of
// converting the UTC instant to the browser's local timezone.
export function getWorkdayDateString(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10)
  }

  const { year, month, day } = getDateParts(new Date(value))
  return `${year}-${month}-${day}`
}

export function getWorkdayDate(value) {
  return new Date(`${getWorkdayDateString(value)}T00:00:00Z`)
}

export function formatWorkdayDate(value, options = {}) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'UTC',
    ...options,
  }).format(getWorkdayDate(value))
}
