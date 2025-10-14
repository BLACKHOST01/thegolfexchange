import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to conditionally join classNames together.
 * It merges Tailwind classes intelligently (last one wins).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
