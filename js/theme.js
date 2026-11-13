/**
 * Shared Theme Engine (System / Light / Dark)
 * Pure helpers safe in browser contexts.
 */

export const VALID_THEMES = ['system', 'light', 'dark'];
export const THEME_STORAGE_KEY = 'bioprocess-theme';

export function getEffectiveTheme(mode = 'system') {
  if (mode === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  }
  return mode === 'light' ? 'light' : 'dark';
}

export function loadSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && VALID_THEMES.includes(saved)) return saved;
  } catch (e) {}
  return 'system';
}

export function saveTheme(mode) {
  const valid = VALID_THEMES.includes(mode) ? mode : 'system';
  try {
    localStorage.setItem(THEME_STORAGE_KEY, valid);
  } catch (e) {}
  return valid;
}

export function applyThemeDocumentClass(mode) {
  const effective = getEffectiveTheme(mode);
  if (typeof document !== 'undefined') {
    const html = document.documentElement;
    if (effective === 'dark') {
      html.classList.add('dark');
      html.classList.remove('light');
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
    }
  }
  return effective;
}
