import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function formatDate(date: string | Date, format = 'MMM D, YYYY') {
  return dayjs(date).format(format);
}

export function formatDateTime(date: string | Date) {
  return dayjs(date).format('MMM D, YYYY h:mm A');
}

export function fromNow(date: string | Date) {
  return dayjs(date).fromNow();
}

export function today() {
  return dayjs().format('YYYY-MM-DD');
}
