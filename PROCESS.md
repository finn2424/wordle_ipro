# Development Process & Documentation

This document serves as a log for the tools, resources, and methodologies used during the development of "Wordle IPRO". It includes details on AI usage, design tools, and rationale behind specific implementation decisions.

## 🛠 Tools & Resources

### Design & Prototyping
- **Mockups**: [Stitch](https://stitch.withgoogle.com)
  - *Details*: I generated mockups using AI features.
- **Diagrams**: [SmartDraw](https://app.smartdraw.com)
  - *Details*: I manually created the game logic flowchart.

### Development Environment
- **IDE**: Visual Studio Code
- **Version Control**: Git & GitHub
- **Frameworks**: Angular (Frontend) - *See justification in Implementation Log below*
- **Deployment**: for now: GitHub Pages (via `angular-cli-ghpages`)

### Workflows
- **Update Docs**: A workflow (`.agent/workflows/update-docs.md`) to automatically check for and document changes in the repository.

## 🤖 AI Usage Report

### Role of AI & Developer Responsibility
I utilize AI as a powerful pair programmer to accelerate development, generate visual design assets, and suggest implementation patterns. However, **I rigorously evaluate, improve, and fine-tune all AI-generated code**.

I leverage my existing expertise in **Angular** to validate AI outputs, ensuring they adhere to best practices (e.g., Signals, modern control flow). This workflow represents a shift from "writing every line" to "orchestrating and refining high-level logic," requiring significant architectural oversight and debugging effort from my side to meet academic standards.

### Specific Examples
- **Design**: I used Stitch to generate the mockups for the application.
- **Documentation**: I used an AI assistant to generate the template for `MILESTONES.md` based on a whiteboard photo.
- **Prototyping**: I used AI (Antigravity) to quickly implement a viewer to display the mockups within the web application.
- **Styling**: I used AI (Antigravity) for quick, fancy styling of UI components (e.g., GameGrid, VirtualKeyboard).

## 📝 Implementation Log & Decisions

### Decision: Frontend Framework (Angular vs. Native HTML/JS)
- **Decision**: I chose Angular over Native HTML/JS.
- **Reasoning**:
  - **State Management**: Wordle has a complex state (6 attempts, 5 letters each, keyboard status, game outcome). Angular Signals provide a clean, reactive way to manage this state without the "spaghetti code" often found in manual DOM manipulation.
  - **Component Reusability**: The game grid, rows, and keyboard keys are repeating elements. Angular's component architecture allows us to encapsulate logic and styles for these elements, promoting reusability and cleaner code.
  - **Scalability & Structure**: While native JS is sufficient for a basic clone, using Angular ensures the project is scalable. It simplifies adding future features like backend integration, user auth, and persistent stats.
  - **TypeScript**: First-class support for TypeScript ensures type safety for our game logic (interfaces for Guesses, GameState, etc.), reducing runtime errors.
  - **Tooling**: Angular CLI provides out-of-the-box build optimization, SCSS support, and PWA capabilities, which are manually configured in a native setup.

### Decision: Backend Technology (.NET vs. Node.js)
- **Decision**: I chose .NET 10 (ASP.NET Core) over Node.js.
- **Reasoning**:
  - **Kull.GenericBackend**: This library enables rapid API development by exposing SQL stored procedures directly as REST endpoints. This drastically reduces boilerplate code for CRUD operations and allows focusing on database logic.
  - **Type Safety**: C# and .NET provide strong type safety, which reduces runtime errors when handling API requests and database responses.
  - **SQL Server Integration**: Native integration with SQL Server via `Microsoft.Data.SqlClient` simplifies database connectivity.
  - **Swagger/OpenAPI**: Swashbuckle provides automatic API documentation generation, useful for frontend integration.
  - **Scalability**: ASP.NET Core is highly performant and suitable for production workloads.
- **Implementation Details**:
  - Project: `wordle-backend/`
  - Target Framework: .NET 10
  - Key Packages: `Kull.GenericBackend`, `Microsoft.Data.SqlClient`, `Swashbuckle.AspNetCore`

### Feature: Game Logic
- **Decision**: I implemented this using a dedicated `GameService` managing state via Angular Signals.
- **Implementation**:
  - **State**: `guesses`, `currentGuess`, `gameStatus`, `error` managed in a private writable signal.
  - **Computed**: `evaluatedGuesses` derives color codes (`correct`, `present`, `absent`) automatically.
  - **Validation**: Two-pass algorithm handling duplicate letters correctly (green first, then yellow).

### Feature: UI/UX
- **Approach**: I opted for a modern, responsive design using Bootstrap 5 as the foundation.
- **Tooling**:
  - **Bootstrap 5**: Core CSS framework for responsive grid, utilities, and base component styles.
  - **ng-bootstrap**: Native Angular components for Bootstrap widgets (modals, tooltips, etc.) without jQuery dependency.
  - **@angular/localize**: Added for internationalization support required by ng-bootstrap.

### Feature: Animations & Input Handling
- **Goal**: I wanted to provide immediate visual feedback for both physical and virtual keystrokes.
- **Implementation**:
  - **Synchronization**: I captured physical keyboard events in `app.ts` and programmatically triggered the `VirtualKeyboard` animation using `@ViewChild`.
  - **Reactivity**: I used an Angular Signal (`pressedKeys`) to track active keys, automatically toggling a CSS class for a "pressed" effect.
  - **Feedback**: This ensures the user sees the virtual key react even when they type on their physical keyboard, creating a cohesive experience.

### Feature: Shared SCSS Architecture
- **Decision**: I implemented a centralized CSS variables system and shared component styling.
- **Reasoning**:
  - **Maintainability**: Centralizing colors and design tokens in one place makes theme updates easier.
  - **Consistency**: Shared styles ensure uniform appearance across components (e.g., tiles in the game grid and instructions modal).
  - **Separation of Concerns**: Variables are separate from component styles, following best practices.
- **Implementation**:
  - **`_variables.scss`**: Defines CSS custom properties (`:root`) for app theme colors, game logic colors (correct, present, absent), and keyboard colors.
  - **`_tiles.scss`**: Contains reusable `.tile` class and state modifiers (`.tile-correct`, `.tile-present`, `.tile-absent`) used by `GameGrid` and `InstructionsModal`.
  - Both files are located in `wordle-frontend/src/styles/` and imported via `styles.scss`.

### Feature: Deployment
- **Decision**: I use GitHub Pages for hosting the frontend.
- **Reasoning**: Free, easy integration with GitHub repository, and sufficient for static frontend hosting.
- **Implementation**: I configured `angular-cli-ghpages` and added a `deploy-gh-pages` script to `package.json`.

---
*This document will be updated continuously as the project evolves.*
