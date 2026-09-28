/**
 * Pure formatting helpers. No Vue, no DOM — these are used by both the dashboard
 * and the chart tooltips.
 */

/** Turns a possibly-null/Invalid date string into a Date, or null. */
export function toDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Study time, always expressed in hours.
 *
 * One decimal below 100 hours keeps differences legible ("12.5h"), and none above it
 * keeps large totals from reading as false precision ("1,277h" rather than
 * "1,277.4h"). Thousands are grouped so a four-digit figure stays scannable.
 */
export function formatHours(milliseconds: number): string {
  const hours = milliseconds / 3_600_000
  if (hours >= 100) {
    return `${Math.round(hours).toLocaleString()}h`
  }
  return `${hours.toFixed(1)}h`
}

export function formatNumber(value: number, options: Intl.NumberFormatOptions = {}): string {
  return Math.round(value).toLocaleString(undefined, options)
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`
}

/** "Mar 4, 2027" */
export function formatDate(date: Date | null): string {
  if (!date) {
    return '—'
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/** "12 Mar 2027" style, used for the ETA so it reads unambiguously. */
export function formatDateLong(date: Date | null): string {
  if (!date) {
    return 'Unknown'
  }
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTime(date: Date | null): string {
  if (!date) {
    return '—'
  }
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

/** Relative future/past distance: "in 3 days", "2 hours ago". */
export function formatRelative(target: Date | null, now: Date = new Date()): string {
  if (!target) {
    return '—'
  }

  const deltaMs = target.getTime() - now.getTime()
  const future = deltaMs > 0
  const absolute = Math.abs(deltaMs)

  const minutes = Math.round(absolute / 60_000)
  const hours = Math.round(absolute / 3_600_000)
  const days = Math.round(absolute / 86_400_000)

  let magnitude: string
  if (minutes < 60) {
    magnitude = `${minutes} minute${minutes === 1 ? '' : 's'}`
  } else if (hours < 48) {
    magnitude = `${hours} hour${hours === 1 ? '' : 's'}`
  } else if (days < 60) {
    magnitude = `${days} day${days === 1 ? '' : 's'}`
  } else {
    const months = Math.round(days / 30)
    magnitude = `${months} month${months === 1 ? '' : 's'}`
  }

  return future ? `in ${magnitude}` : `${magnitude} ago`
}

/** Turns a raw SRS interval in seconds into "4 hours" / "1 week" / "4 months". */
export function formatInterval(seconds: number | null): string {
  if (seconds === null) {
    return 'no wait'
  }

  const table: Array<[number, string]> = [
    [86_400 * 30, 'month'],
    [86_400 * 7, 'week'],
    [86_400, 'day'],
    [3_600, 'hour'],
    [60, 'minute'],
  ]

  for (const [unitSeconds, label] of table) {
    if (seconds >= unitSeconds) {
      const count = Math.round(seconds / unitSeconds)
      return `${count} ${label}${count === 1 ? '' : 's'}`
    }
  }

  return `${seconds} seconds`
}

/** ISO date key (YYYY-MM-DD) in local time, used to bucket activity by day. */
export function dayKey(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

/**
 * How stale a loaded dataset is, phrased for a status line.
 *
 * `formatRelative` is wrong here: a load that completed two seconds ago would read
 * "0 minutes ago", which looks like a bug. Anything inside a minute and a half is
 * "just now", and the label never implies the data is older than it is.
 */
export function formatFreshness(loadedAt: Date | null, now: Date = new Date()): string {
    if (!loadedAt) {
        return ''
    }

    const ageMs = now.getTime() - loadedAt.getTime()
    if (ageMs < 90_000) {
        return 'just now'
    }

    return formatRelative(loadedAt, now)
}
