import { TestBed } from '@angular/core/testing';
import { ThemeService, Theme } from './theme.service';
import { DOCUMENT } from '@angular/common';

describe('ThemeService Verification', () => {
    let service: ThemeService;
    let document: Document;
    let htmlElement: HTMLElement;
    let matchMediaMock: any;

    beforeEach(() => {
        // Mock matchMedia
        matchMediaMock = {
            matches: false, // Default to light
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        };

        // Assign to window
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: matchMediaMock.matches,
                media: query,
                onchange: null,
                addListener: vi.fn(), // Deprecated
                removeListener: vi.fn(), // Deprecated
                addEventListener: matchMediaMock.addEventListener,
                removeEventListener: matchMediaMock.removeEventListener,
                dispatchEvent: vi.fn(),
            })),
        });

        TestBed.configureTestingModule({
            providers: [ThemeService]
        });

        service = TestBed.inject(ThemeService);
        document = TestBed.inject(DOCUMENT);
        htmlElement = document.documentElement;
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Attribute Application (Core Verification)', () => {
        it('should apply "dark" to both data-bs-theme and color-scheme when set to dark', () => {
            // Act
            service.set(Theme.DARK);
            TestBed.flushEffects();

            // Assert - Verify Bootstrap hook
            expect(htmlElement.getAttribute('data-bs-theme')).toBe(Theme.DARK);

            // Assert - Verify Custom CSS hook (light-dark() support)
            expect(htmlElement.style.colorScheme).toBe(Theme.DARK);
        });

        it('should apply "light" to both data-bs-theme and color-scheme when set to light', () => {
            // Act
            service.set(Theme.LIGHT);
            TestBed.flushEffects();

            // Assert
            expect(htmlElement.getAttribute('data-bs-theme')).toBe(Theme.LIGHT);
            expect(htmlElement.style.colorScheme).toBe(Theme.LIGHT);
        });
    });

    describe('Auto Mode Logic', () => {
        it('should apply system "dark" preference when mode is auto', () => {
            // Arrange - Simulate System Dark Mode
            matchMediaMock.matches = true;

            // Act
            service.set(Theme.AUTO);
            TestBed.flushEffects();

            // Assert - Should resolve to dark
            expect(htmlElement.getAttribute('data-bs-theme')).toBe(Theme.DARK);
            expect(htmlElement.style.colorScheme).toBe(Theme.DARK);
        });

        it('should apply system "light" preference when mode is auto', () => {
            // Arrange - Simulate System Light Mode
            matchMediaMock.matches = false;

            // Act
            service.set(Theme.AUTO);
            TestBed.flushEffects();

            // Assert - Should resolve to light
            expect(htmlElement.getAttribute('data-bs-theme')).toBe(Theme.LIGHT);
            expect(htmlElement.style.colorScheme).toBe(Theme.LIGHT);
        });
    });
});
