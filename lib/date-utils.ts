/**
 * Date utilities for stats calculations
 * Uses America/Chicago timezone for local date handling
 */

const TIMEZONE = 'America/Chicago'

/**
 * Get current date in local timezone as YYYY-MM-DD string
 */
export function getLocalToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE })
}

/**
 * Get date N days ago in local timezone
 */
export function getLocalDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toLocaleDateString('en-CA', { timeZone: TIMEZONE })
}

/**
 * Get the first day of current month in local timezone
 */
export function getFirstDayOfMonth(): string {
  const now = new Date()
  const year = parseInt(now.toLocaleDateString('en-CA', { timeZone: TIMEZONE, year: 'numeric' }))
  const month = parseInt(now.toLocaleDateString('en-CA', { timeZone: TIMEZONE, month: '2-digit' }))
  return `${year}-${month.toString().padStart(2, '0')}-01`
}

/**
 * Get date 365 days ago
 */
export function getDateOneYearAgo(): string {
  return getLocalDateDaysAgo(365)
}

/**
 * Format a date string for display
 */
export function formatDate(dateStr: string, format: 'short' | 'long' | 'month' = 'short'): string {
  const date = new Date(dateStr + 'T00:00:00')

  switch (format) {
    case 'long':
      return date.toLocaleDateString('en-US', {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    case 'month':
      return date.toLocaleDateString('en-US', {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: 'short'
      })
    case 'short':
    default:
      return date.toLocaleDateString('en-US', {
        timeZone: TIMEZONE,
        month: 'short',
        day: 'numeric'
      })
  }
}

/**
 * Format a number with optional decimal places
 */
export function formatNumber(num: number, decimals = 0): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Calculate weight change and return formatted string with direction
 */
export function formatWeightChange(startWeight: number | null, endWeight: number | null): string | null {
  if (startWeight === null || endWeight === null) return null
  const change = startWeight - endWeight
  if (change === 0) return '0 lbs'
  const sign = change > 0 ? '-' : '+'
  return `${sign}${Math.abs(change).toFixed(1)} lbs`
}

/**
 * Get month boundaries for the last N months
 */
export function getMonthBoundaries(numMonths: number): Array<{
  start: string
  end: string
  label: string
}> {
  const months: Array<{ start: string; end: string; label: string }> = []
  const today = new Date()

  for (let i = 0; i < numMonths; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const year = date.getFullYear()
    const month = date.getMonth()

    const start = `${year}-${(month + 1).toString().padStart(2, '0')}-01`

    // End of month
    const lastDay = new Date(year, month + 1, 0).getDate()
    let end = `${year}-${(month + 1).toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`

    // If current month, end at today
    const todayStr = getLocalToday()
    if (end > todayStr) {
      end = todayStr
    }

    const label = date.toLocaleDateString('en-US', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: 'short'
    })

    months.push({ start, end, label })
  }

  return months
}

/**
 * Calculate days between two date strings
 */
export function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Check if a date is in the current month
 */
export function isCurrentMonth(dateStr: string): boolean {
  const date = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}
