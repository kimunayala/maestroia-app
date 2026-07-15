export function formatCLP(value) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatNumber(value) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(n);
}
