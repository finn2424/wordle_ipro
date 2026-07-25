# Design Patterns in Wordle Project

This document outlines the software design patterns used in the Wordle application to ensure maintainability, scalability, and clean code.

## 1. Singleton Pattern
**Usage**: Angular Services.
**Description**: All services declared with `@Injectable({ providedIn: 'root' })` are singletons. This ensures a single instance of `GameService`, `ThemeService`, etc., managing the state for the entire application.
**Example**: `GameService` holds the current game state for the entire session.

## 2. Observer Pattern (Reactive Programming)
**Usage**: Angular Signals and Effects.
**Description**: The application heavily relies on the Observer pattern via Angular's Signals. Components "observe" state changes (signals) and automatically update the UI when the state changes.
**Example**: `GameService` exposes `readonly guesses = computed(...)`. The `GameGrid` component reads this signal, and Angular automatically updates the DOM when `guesses` changes.

## 3. Facade Pattern
**Usage**: `GameService`.
**Description**: The `GameService` acts as a facade for the complex game logic and API interactions. Components like `GameGrid` or `VirtualKeyboard` do not need to know about the API endpoints, local storage, or validation rules; they simply call methods on the `GameService`.

## 4. Component Pattern
**Usage**: Angular Components.
**Description**: The UI is broken down into small, reusable components.
- **Presentational Components**: `GameGrid` (receives data via inputs, emits events via outputs).
- **Container Components**: `App` (manages layout and orchestrates smart components).

## 5. Lazy Loading Pattern
**Usage**: Modal Components (`GameOverModal`, `StatisticsModal`, `InstructionsModal`).
**Description**: Components that are not needed on initial page load are loaded on demand using dynamic `import()` expressions. This splits them into separate JavaScript chunks that are only downloaded when the user triggers the corresponding action (e.g., opening a modal).
**Example**: `const { GameOverModalComponent } = await import('./components/game-over-modal/game-over-modal.component');` — the modal code is fetched only when the game ends.
