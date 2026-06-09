/**
 * Anonimisasi nama untuk kalender publik.
 * "Ahmad Riyadi" → "A.R"
 * "Siti Nur Haliza" → "S.N.H"
 * "Budi" → "B."
 */
export function anonymizeName(name: string): string {
  const words = name.trim().split(/\s+/);
  return words.map((w) => w[0].toUpperCase()).join(".") + (words.length === 1 ? "." : "");
}

/**
 * Generate token random 16 karakter alphanumeric
 */
export function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Format waktu dari "17:30:00" ke "17.30"
 */
export function formatTime(time: string | null | undefined): string {
  if (!time) return "--:--";
  const [h, m] = time.split(":");
  return `${h}.${m}`;
}

/**
 * Format tanggal ke bahasa Indonesia
 */
export function formatDateID(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format tanggal singkat
 */
export function formatDateShort(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}
