const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit', month: '2-digit', year: 'numeric',
});
const timeFormatter = new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2,
});

function parseDate(value) {
  if (value == null || value === '') return null;
  // Las fechas sin hora son locales: evitar que UTC cambie el día en Argentina.
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
  }
  if (!(value instanceof Date) && typeof value !== 'string') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
  const date = parseDate(value);
  return date ? dateFormatter.format(date) : '—';
}

export function formatTime(value) {
  if (typeof value === 'string' && /^\d{1,2}:\d{2}$/.test(value)) {
    const [hour, minute] = value.split(':').map(Number);
    return hour < 24 && minute < 60 ? `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` : '—';
  }
  const date = parseDate(value);
  return date ? timeFormatter.format(date) : '—';
}

export function formatCurrency(value) {
  return typeof value === 'number' && Number.isFinite(value) ? currencyFormatter.format(value) : '—';
}
