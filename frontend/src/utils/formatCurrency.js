export function formatCOP(value) {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return '$ 0';

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericValue);
}