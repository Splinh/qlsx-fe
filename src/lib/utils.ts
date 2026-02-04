/**
 * =============================================
 * LIB/UTILS - Utility Functions
 * =============================================
 * Helper functions cho shadcn/ui components
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes với conflict resolution
 * Sử dụng clsx để xử lý conditional classes
 * Sử dụng twMerge để merge và loại bỏ duplicates
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
