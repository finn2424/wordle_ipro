import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VirtualKeyboard } from './virtual-keyboard';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('VirtualKeyboard', () => {
    let component: VirtualKeyboard;
    let fixture: ComponentFixture<VirtualKeyboard>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [VirtualKeyboard],
        }).compileComponents();

        fixture = TestBed.createComponent(VirtualKeyboard);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('rows', () => {
        it('should have 3 rows defined', () => {
            expect(component.rows.length).toBe(3);
        });

        it('should have the correct number of keys per row (10, 9, 9)', () => {
            expect(component.rows[0]!.length).toBe(10);
            expect(component.rows[1]!.length).toBe(9);
            expect(component.rows[2]!.length).toBe(9);
        });
    });

    describe('onKey()', () => {
        it('should emit "A" via keyPress output', () => {
            const emitSpy = vi.spyOn(component.keyPress, 'emit');

            component.onKey('A');

            expect(emitSpy).toHaveBeenCalledWith('A');
        });

        it('should emit "Enter" via keyPress output', () => {
            const emitSpy = vi.spyOn(component.keyPress, 'emit');

            component.onKey('Enter');

            expect(emitSpy).toHaveBeenCalledWith('Enter');
        });

        it('should emit "Backspace" via keyPress output', () => {
            const emitSpy = vi.spyOn(component.keyPress, 'emit');

            component.onKey('Backspace');

            expect(emitSpy).toHaveBeenCalledWith('Backspace');
        });
    });

    describe('triggerAnimation()', () => {
        it('should add the key to pressedKeys', () => {
            vi.useFakeTimers();

            component.triggerAnimation('A');

            const pressedKeys = (component as any).pressedKeys() as Set<string>;
            expect(pressedKeys.has('A')).toBe(true);

            vi.useRealTimers();
        });

        it('should remove the key from pressedKeys after 150ms', () => {
            vi.useFakeTimers();

            component.triggerAnimation('A');

            // Verify it's present before the timeout
            let pressedKeys = (component as any).pressedKeys() as Set<string>;
            expect(pressedKeys.has('A')).toBe(true);

            // Advance time by 150ms
            vi.advanceTimersByTime(150);

            // Verify it's removed after the timeout
            pressedKeys = (component as any).pressedKeys() as Set<string>;
            expect(pressedKeys.has('A')).toBe(false);

            vi.useRealTimers();
        });
    });
});
