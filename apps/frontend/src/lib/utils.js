import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatPhoneNumber(phone) {
  if (!phone) return '';
  return String(phone).trim().replace(/^\+222/, '');
}
