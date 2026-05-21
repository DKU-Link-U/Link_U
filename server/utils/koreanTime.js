const KOREA_TIME_ZONE = 'Asia/Seoul';
const KOREA_TIME_OFFSET_MINUTES = 9 * 60;
const KOREA_TIME_OFFSET_MS = KOREA_TIME_OFFSET_MINUTES * 60 * 1000;

const koreanDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: KOREA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function toDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getKoreanDateTimeParts(value = new Date()) {
  const date = toDate(value);

  if (!date) return null;

  return koreanDateTimeFormatter
    .formatToParts(date)
    .reduce((parts, part) => {
      if (part.type !== 'literal') {
        parts[part.type] = part.value;
      }

      return parts;
    }, {});
}

function toKoreanDateKey(value = new Date()) {
  const parts = getKoreanDateTimeParts(value);

  if (!parts) return '';

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function toKoreanDateTime(value = new Date()) {
  const parts = getKoreanDateTimeParts(value);

  if (!parts) return '';

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

function toKoreanIsoString(value = new Date()) {
  const parts = getKoreanDateTimeParts(value);

  if (!parts) return '';

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+09:00`;
}

function addDaysToDateKey(dateKey, days) {
  const [year, month, day] = String(dateKey).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return date.toISOString().slice(0, 10);
}

function dateKeyToKoreanDayUtcDate(dateKey, endOfDay = false) {
  const [year, month, day] = String(dateKey).split('-').map(Number);
  const utcMillis = Date.UTC(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
  ) - KOREA_TIME_OFFSET_MS;

  return new Date(utcMillis);
}

function getKoreanRecordedDate(value = new Date()) {
  const dateKey = toKoreanDateKey(value);
  const [year, month, day] = dateKey.split('-').map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

module.exports = {
  KOREA_TIME_OFFSET_MINUTES,
  KOREA_TIME_ZONE,
  addDaysToDateKey,
  dateKeyToKoreanDayUtcDate,
  getKoreanRecordedDate,
  toKoreanDateKey,
  toKoreanDateTime,
  toKoreanIsoString,
};
