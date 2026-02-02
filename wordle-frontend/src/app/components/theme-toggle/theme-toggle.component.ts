import { Component, inject } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { ThemeService, Theme } from '../../services/theme.service';

/**
 * Dropdown toggle component for switching between light, dark, and auto themes.
 * Displays an icon representing the current theme and provides a menu to change it.
 */
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [NgbDropdownModule],
  template: `
    <div ngbDropdown class="d-inline-block" placement="bottom-end">
      <button type="button" class="btn btn-outline-secondary d-flex align-items-center gap-2 border-0" id="themeDropdown" ngbDropdownToggle [attr.aria-label]="'Current theme: ' + themeService.theme()">
        @if (themeService.theme() === Theme.LIGHT) {
          <svg class="bi bi-sun-fill fa-icon-sm"  xmlns="http://www.w3.org/2000/svg"  fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708"/>
          </svg>      
        } @else if (themeService.theme() === Theme.DARK) {
          <svg class="fa-icon-sm" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M256 0C114.6 0 0 114.6 0 256S114.6 512 256 512c68.8 0 131.3-27.2 177.3-71.4 7.3-7 9.4-17.9 5.3-27.1s-13.7-14.9-23.8-14.1c-4.9 .4-9.8 .6-14.8 .6-101.6 0-184-82.4-184-184 0-72.1 41.5-134.6 102.1-164.8 9.1-4.5 14.3-14.3 13.1-24.4S322.6 8.5 312.7 6.3C294.4 2.2 275.4 0 256 0z"/></svg>
        } @else {
          <svg class="fa-icon-sm" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M448 256c0-106-86-192-192-192l0 384c106 0 192-86 192-192zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z"/></svg>
        }
      </button>
      <div ngbDropdownMenu aria-labelledby="themeDropdown">
        <button ngbDropdownItem (click)="updateTheme(Theme.LIGHT)" [class.active]="themeService.theme() === Theme.LIGHT" class="d-flex align-items-center gap-2">
          <svg class="bi bi-sun-fill fa-icon-sm"  xmlns="http://www.w3.org/2000/svg"  fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708"/>
          </svg>              
          Light
        </button>
        <button ngbDropdownItem (click)="updateTheme(Theme.DARK)" [class.active]="themeService.theme() === Theme.DARK" class="d-flex align-items-center gap-2">
          <svg class="fa-icon-sm" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M256 0C114.6 0 0 114.6 0 256S114.6 512 256 512c68.8 0 131.3-27.2 177.3-71.4 7.3-7 9.4-17.9 5.3-27.1s-13.7-14.9-23.8-14.1c-4.9 .4-9.8 .6-14.8 .6-101.6 0-184-82.4-184-184 0-72.1 41.5-134.6 102.1-164.8 9.1-4.5 14.3-14.3 13.1-24.4S322.6 8.5 312.7 6.3C294.4 2.2 275.4 0 256 0z"/></svg>
            Dark
        </button>
        <button ngbDropdownItem (click)="updateTheme(Theme.AUTO)" [class.active]="themeService.theme() === Theme.AUTO" class="d-flex align-items-center gap-2">
          <svg class="fa-icon-sm" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M448 256c0-106-86-192-192-192l0 384c106 0 192-86 192-192zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z"/></svg>
            Auto
        </button>
      </div>
    </div>
  `,
  styles: `
    .btn-outline-secondary {
        --bs-btn-color: var(--app-color-text-primary);
        --bs-btn-border-color: transparent;
        --bs-btn-hover-color: var(--app-color-text-primary);
        --bs-btn-hover-bg: var(--keyboard-color-bg-hover);
        --bs-btn-hover-border-color: transparent;
        --bs-btn-focus-shadow-rgb: 108, 117, 125;
        --bs-btn-active-color: var(--app-color-text-primary);
        --bs-btn-active-bg: var(--keyboard-color-bg-active);
        --bs-btn-active-border-color: transparent;
    }
  `
})
export class ThemeToggleComponent {
  protected themeService = inject(ThemeService);
  protected readonly Theme = Theme;

  /**
   * Updates the application theme via the ThemeService.
   * @param theme The theme to apply.
   */
  updateTheme(theme: Theme) {
    this.themeService.set(theme);
  }
}

