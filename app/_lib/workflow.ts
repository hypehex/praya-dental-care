export const paymentStatuses: Record<number, string> = {
  0: "Belum dibayar", 1: "Lunas", 2: "Menunggu Verifikasi", 3: "Ditolak",
};

export function clinicToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function formatTime24(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "UTC",
  }).format(date);
}

export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export const visitTransitions: Record<string, string[]> = {
  Menunggu: ["Pemeriksaan"], Dikonfirmasi: ["Pemeriksaan"], Pemeriksaan: ["Selesai"],
};
