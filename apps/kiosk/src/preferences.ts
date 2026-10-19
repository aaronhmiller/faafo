export interface KioskPreferences {
  largeText: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

const STORAGE_KEY = "verdant-kiosk-preferences";
const defaults: KioskPreferences = { largeText: false, highContrast: false, reducedMotion: false };

export function loadPreferences(): KioskPreferences {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<KioskPreferences> | null;
    return stored ? { ...defaults, ...stored } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}

export function savePreferences(preferences: KioskPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  applyPreferences(preferences);
}

export function applyPreferences(preferences: KioskPreferences): void {
  document.documentElement.classList.toggle("large-text", preferences.largeText);
  document.documentElement.classList.toggle("high-contrast", preferences.highContrast);
  document.documentElement.classList.toggle("reduce-motion", preferences.reducedMotion);
}
