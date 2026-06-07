export const DAYS_OF_WEEK = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

export const DAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"] as const;

export const SESSION_STATUS = {
  scheduled: "Terjadwal",
  attended: "Hadir",
  absent: "Tidak Hadir",
  rescheduled: "Direschedule",
} as const;

export const LEVELS = ["pemula", "menengah", "lanjut"] as const;

export const LEVEL_LABELS: Record<string, string> = {
  pemula: "Pemula",
  menengah: "Menengah",
  lanjut: "Lanjut",
};

export const SESSION_TYPE_LABELS: Record<string, string> = {
  trial: "Trial",
  paket: "Paket",
};
