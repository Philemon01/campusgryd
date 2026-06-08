import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Triggers haptic feedback / vibration on supporting mobile devices.
 * @param pattern A single duration (ms) or an array of durations representing [vibrate, pause, vibrate, ...]
 */
export function triggerHaptic(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore vibration errors
    }
  }
}
