import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Format a date string as "15 Mar" for chart axis ticks */
export const formatChartDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

/** Format a date string as "15 Mar 2026" for tables */
export const formatFullDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/** Format a Date object as a time string */
export const formatTime = (date) => date.toLocaleTimeString();

/** Format a Date object as a full locale string */
export const formatDateTime = (dateStr) =>
  new Date(dateStr).toLocaleString();

/** Format a Date object as a short date string */
export const formatShortDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString();

/** Format currency (INR) */
export const formatCost = (amount) =>
  amount > 0 ? `₹${amount}` : "Free";

/** Format participant count as "current/max" */
export const formatParticipants = (current, max) => `${current}/${max}`;

/** Calculate percentage, rounded to nearest integer */
export const toPercent = (value, total) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

/** Truncate a string with ellipsis */
export const truncate = (str, maxLen = 15) =>
  str.length > maxLen ? str.substring(0, maxLen - 1) + "..." : str;
