import { Injectable, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Available theme options for the application.
 * - LIGHT: Force light theme
 * - DARK: Force dark theme
 * - AUTO: Follow system preference
 */
export const Theme = {
    LIGHT: 'light',
    DARK: 'dark',
    AUTO: 'auto'
} as const;

export type Theme = typeof Theme[keyof typeof Theme];

const THEME_STORAGE_KEY = 'theme-preference';

/**
 * Service responsible for managing the application's color theme.
 * Supports light, dark, and auto (system preference) modes.
 * Persists user preference to localStorage and applies styles via CSS color-scheme.
 */
@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private document = inject(DOCUMENT);

    readonly theme = signal<Theme>(this.getInitialTheme());

    constructor() {
        effect(() => {
            const currentTheme = this.theme();
            this.setTheme(currentTheme);
            localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
        });

        this.listenForSystemChanges();
    }

    /**
     * Sets the current theme preference.
     * @param theme The theme to apply.
     */
    set(theme: Theme) {
        this.theme.set(theme);
    }

    /**
     * Retrieves the initial theme from localStorage or defaults to 'auto'.
     */
    private getInitialTheme(): Theme {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
        if (savedTheme && Object.values(Theme).includes(savedTheme)) {
            return savedTheme;
        }
        return Theme.AUTO;
    }

    /**
     * Applies the theme by delegating to the appropriate method.
     * @param theme The theme preference to apply.
     */
    private setTheme(theme: Theme) {
        if (Theme.AUTO === theme) {
            this.applySystemTheme();
        } else {
            this.applyEffectiveTheme(theme);
        }
    }

    /**
     * Determines and applies the effective theme based on OS preference.
     */
    private applySystemTheme() {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.applyEffectiveTheme(isDark ? Theme.DARK : Theme.LIGHT);
    }

    /**
     * Applies the effective theme to the DOM.
     * Sets both Bootstrap's data attribute and the native color-scheme style.
     * @param theme The resolved theme ('light' or 'dark').
     */
    private applyEffectiveTheme(theme: 'light' | 'dark') {
        const html = this.document.documentElement;
        html.setAttribute('data-bs-theme', theme);
        html.style.colorScheme = theme;
    }

    /**
     * Listens for changes to the system's color scheme preference.
     * Only reacts if the current theme is set to 'auto'.
     */
    private listenForSystemChanges() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        mediaQuery.addEventListener('change', () => {
            if (Theme.AUTO === this.theme()) {
                this.applySystemTheme();
            }
        });
    }
}

