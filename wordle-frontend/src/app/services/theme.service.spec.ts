import { TestBed } from '@angular/core/testing';
import { ThemeService, Theme } from './theme.service';
import { DOCUMENT } from '@angular/common';
import { vi, describe, it, expect, beforeEach, afterEach, type MockInstance } from 'vitest';

interface MatchMediaMock {
    matches: boolean;
    addEventListener: MockInstance;
    removeEventListener: MockInstance;
}

describe('ThemeService', () => {
    let service: ThemeService;
    let doc: Document;
    let htmlElement: HTMLElement;
    let matchMediaMock: MatchMediaMock;
    let getItemSpy: MockInstance;
    let setItemSpy: MockInstance;

    function setupMatchMediaMock(isDark = false): void {
        matchMediaMock = {
            matches: isDark,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        };

        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation((query: string) => ({
                matches: matchMediaMock.matches,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: matchMediaMock.addEventListener,
                removeEventListener: matchMediaMock.removeEventListener,
                dispatchEvent: vi.fn(),
            })),
        });
    }

    function createService(): void {
        TestBed.configureTestingModule({
            providers: [ThemeService],
        });

        service = TestBed.inject(ThemeService);
        doc = TestBed.inject(DOCUMENT);
        htmlElement = doc.documentElement;
    }

    beforeEach(() => {
        getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
        setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
        setupMatchMediaMock(false);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should be created', () => {
        createService();
        expect(service).toBeTruthy();
    });

    describe('Initial Theme', () => {
        it('should default to auto when no localStorage value exists', () => {
            getItemSpy.mockReturnValue(null);
            createService();

            expect(service.theme()).toBe(Theme.AUTO);
        });

        it('should restore saved theme from localStorage if valid', () => {
            getItemSpy.mockReturnValue('dark');
            createService();

            expect(service.theme()).toBe(Theme.DARK);
        });

        it('should default to auto if localStorage has an invalid value', () => {
            getItemSpy.mockReturnValue('invalid-theme-value');
            createService();

            expect(service.theme()).toBe(Theme.AUTO);
        });
    });

    describe('set()', () => {
        beforeEach(() => {
            createService();
        });

        it('should update the theme signal', () => {
            service.set(Theme.DARK);

            expect(service.theme()).toBe(Theme.DARK);
        });

        it('should apply data-bs-theme="light" and colorScheme="light" when set to light', () => {
            service.set(Theme.LIGHT);
            TestBed.flushEffects();

            expect(htmlElement.getAttribute('data-bs-theme')).toBe('light');
            expect(htmlElement.style.colorScheme).toBe('light');
        });

        it('should apply data-bs-theme="dark" and colorScheme="dark" when set to dark', () => {
            service.set(Theme.DARK);
            TestBed.flushEffects();

            expect(htmlElement.getAttribute('data-bs-theme')).toBe('dark');
            expect(htmlElement.style.colorScheme).toBe('dark');
        });
    });

    describe('Persistence', () => {
        it('should persist theme preference to localStorage on change', () => {
            createService();
            setItemSpy.mockClear();

            service.set(Theme.DARK);
            TestBed.flushEffects();

            expect(setItemSpy).toHaveBeenCalledWith('theme-preference', 'dark');
        });
    });
});
