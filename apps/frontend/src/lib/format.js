import i18n from '../i18n';

const localeMap = {
  fr: 'fr-FR',
  ar: 'ar-MR'
};

export function getLocale() {
  return localeMap[i18n.language] || 'fr-FR';
}

export function formatMoney(amount, currency = 'MRU') {
  const formatter = new Intl.NumberFormat(getLocale());
  return `${formatter.format(Number(amount || 0))} ${currency}`;
}

export function formatDateTime(isoDate, options = { dateStyle: 'medium', timeStyle: 'short' }) {
  if (!isoDate) return '-';
  return new Intl.DateTimeFormat(getLocale(), options).format(new Date(isoDate));
}

export function formatDate(isoDate) {
  if (!isoDate) return '-';
  return new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium' }).format(new Date(isoDate));
}

export function formatNumber(amount) {
  const formatter = new Intl.NumberFormat(getLocale());
  return formatter.format(Number(amount || 0));
}
