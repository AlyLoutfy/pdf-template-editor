import { DUMMY_DATA } from '../types';

export function replacePlaceholders(text: string): string {
  let result = text;
  
  Object.entries(DUMMY_DATA).forEach(([placeholder, value]) => {
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
  });
  
  return result;
}

export function hasPlaceholder(text: string): boolean {
  return /\{[a-zA-Z]+\}/.test(text);
}

export function extractPlaceholder(text: string): string | null {
  const match = text.match(/\{([a-zA-Z]+)\}/);
  return match ? match[1] : null;
}

export { DUMMY_DATA };






