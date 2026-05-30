export const normalizePhone = (phone: string): string => {
  const trimmed = phone.trim().replace(/\s+/g, "");
  if (/^\+222\d{8}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^\d{8}$/.test(trimmed)) {
    return `+222${trimmed}`;
  }
  if (/^\+\d{8,15}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
};

export const isValidPhone = (phone: string): boolean => {
  const normalized = normalizePhone(phone);
  return /^\+222\d{8}$/.test(normalized) || /^\+\d{8,15}$/.test(normalized);
};
