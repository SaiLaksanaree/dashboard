import dayjs from 'dayjs';

export function formatDateTime(val) {
  if (!val) return '-';
  return dayjs(val).format('DD/MM/YYYY HH:mm');
}

export function withinRange(r, from, to) {
  const d = dayjs(r.bookingAt);
  const okFrom = from ? d.isAfter(dayjs(from).startOf('day')) || d.isSame(dayjs(from).startOf('day')) : true;
  const okTo = to ? d.isBefore(dayjs(to).endOf('day')) || d.isSame(dayjs(to).endOf('day')) : true;
  return okFrom && okTo;
}

export function uniq(arr) {
  return Array.from(new Set(arr));
}

export function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = key(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {});
}

export function paginate(arr, page, perPage) {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const totalPages = Math.max(1, Math.ceil(arr.length / perPage));
  return { items: arr.slice(start, end), totalPages };
}