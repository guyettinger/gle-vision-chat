import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines and merges CSS class names using clsx and tailwind-merge.
 *
 * @param inputs - A list of class name values that can include strings, arrays, objects, or falsy values.
 * @returns The normalized and merged className string.
 */
export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};
