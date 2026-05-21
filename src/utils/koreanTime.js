export const KOREA_TIME_ZONE = 'Asia/Seoul'

const koreanDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: KOREA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function toDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getKoreanDateTimeParts(value = new Date()) {
  const date = toDate(value)

  if (!date) return null

  return koreanDateTimeFormatter
    .formatToParts(date)
    .reduce((parts, part) => {
      if (part.type !== 'literal') {
        parts[part.type] = part.value
      }

      return parts
    }, {})
}

export function toKoreanDateKey(value = new Date()) {
  const parts = getKoreanDateTimeParts(value)

  if (!parts) return ''

  return `${parts.year}-${parts.month}-${parts.day}`
}

export function toKoreanDateTime(value = new Date()) {
  const parts = getKoreanDateTimeParts(value)

  if (!parts) return ''

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`
}

export function toKoreanIsoString(value = new Date()) {
  const parts = getKoreanDateTimeParts(value)

  if (!parts) return ''

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+09:00`
}

export function addDaysToDateKey(dateKey, days) {
  const [year, month, day] = String(dateKey).split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))

  return date.toISOString().slice(0, 10)
}

export function parseDateKey(dateKey) {
  const [year, month, day] = String(dateKey).split('-').map(Number)

  return new Date(year, month - 1, day)
}
