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

### Architecture & Design
- **Design Patterns**: Documented in [DESIGN_PATTERNS.md](./DESIGN_PATTERNS.md), detailing the use of Singleton, Observer, Facade, and Component patterns.

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
  - **Component Reusability**: The game grid, rows, and keyboard keys are repeating elements. Angular's component architecture allows encapsulating logic and styles for these elements, promoting reusability and cleaner code.
  - **Scalability & Structure**: While native JS is sufficient for a basic clone, using Angular ensures the project is scalable. It simplifies adding future features like backend integration, user auth, and persistent stats.
  - **TypeScript**: First-class support for TypeScript ensures type safety for the game logic (interfaces for Guesses, GameState, etc.), reducing runtime errors.
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

### Feature: Individual Field Input
- **Goal**: Allow users to correct specific letters without deleting the whole word.
- **Implementation**:
  - **GameGrid**: Made tiles interactive (`onTileClick`) to set the `focusedIndex`.
  - **GameService**: Updated `addLetter` and `removeLetter` to respect `focusedIndex` and allow arbitrary cursor placement.
  - **Visuals**: Highlighted the currently focused tile to indicate where the next letter will be typed.

### Feature: Dark Mode / Theme System
- **Goal**: Provide users with light, dark, and automatic (system preference) theme options.
- **Implementation**:
  - **`ThemeService`**: A singleton service managing theme state via Angular Signals. Persists preference to `localStorage` and listens for system `prefers-color-scheme` changes.
  - **`ThemeToggleComponent`**: A dropdown UI component allowing users to select their preferred theme.
  - **CSS `light-dark()` Function**: Refactored `_variables.scss` to use the native CSS `light-dark()` function, enabling automatic color switching based on the `color-scheme` property without JavaScript.
  - **Bootstrap Integration**: Sets `data-bs-theme` attribute on `<html>` to ensure Bootstrap components also respect the chosen theme.

### Feature: Type-Safe Game Types
- **Goal**: Improve code robustness by using type-safe constant objects instead of string literals.
- **Implementation**:
  - **`game-types.ts`**: Created a dedicated file (`src/app/models/game-types.ts`) defining `LetterStatus` and `GameStatus` using the TypeScript const assertion pattern (`as const`).
  - **Usage**: Replaced all string comparisons (e.g., `'correct'`, `'playing'`) with their typed counterparts (e.g., `LetterStatus.CORRECT`, `GameStatus.PLAYING`) throughout `GameService`.
  - **Benefits**: Enables IDE autocompletion, prevents typos, and makes refactoring safer.

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

### Feature: Frontend Deployment (GitHub Pages - Prototyping)
- **Decision**: I use GitHub Pages for hosting the frontend during development.
- **Reasoning**: Free, easy integration with GitHub repository, and sufficient for static frontend hosting.
- **Implementation**: I configured `angular-cli-ghpages` and added a `deploy-gh-pages` script to `package.json`.

### Feature: Production Deployment (Docker & VM)
- **Decision**: I deployed the full stack using Docker containers on a Debian 13 VM.
- **Reasoning**:
  - **Containerization**: Docker ensures consistent environments across development and production. Each service (frontend, backend, database) runs in an isolated container.
  - **VM Choice (Switch Engine / Debian 13)**: A lightweight, reliable Linux distribution suitable for container workloads.
  - **Orchestration (Docker Compose)**: Simplifies multi-container management, handles networking, and allows easy scaling.
  - **Reverse Proxy (Nginx)**: The frontend container uses Nginx to serve the Angular app and proxy `/api/*` requests to the backend container, eliminating CORS issues.
  - **Security (UFW)**: The firewall is configured to only allow SSH (port 22) and HTTP(S) (port 80/443), minimizing attack surface.
- **Implementation Details**:
  - **`wordle-frontend/Dockerfile`**: Multi-stage build with Node.js for compilation and Nginx for serving.
  - **`wordle-backend/Dockerfile`**: Multi-stage build with .NET SDK for compilation and ASP.NET runtime for execution.
  - **`wordle-frontend/nginx.conf`**: Serves static files and proxies API requests to the `backend` service.
  - **`docker-compose.yml`**: Defines the `db`, `backend`, and `frontend` services with proper dependencies and networking.

### Feature: CI/CD Pipeline (GitHub Actions)
- **Decision**: I set up an automatic deployment workflow using GitHub Actions.
- **Reasoning**:
  - **Automation**: Every push to `main` triggers a deployment, reducing manual effort.
  - **Simplicity**: The `appleboy/ssh-action` allows direct SSH commands to the VM.
  - **Security (GitHub Secrets)**: Sensitive data (host, credentials, database password) is stored securely in repository secrets, not in code.
- **Implementation Details**:
  - **`.github/workflows/deploy.yml`**: Connects to the VM, pulls the latest code, and runs `docker compose up -d --build`.
  - **`.gitignore`**: Ensures `.env` files (containing secrets) are not committed to the repository.

### Feature: Domain & SSL Configuration
- **Decision**: I configured a custom domain and SSL via Let's Encrypt only for the production environment.
- **Implementation**:
  - **Domain**: `wordle-fb.duckdns.org` (Dynamic DNS via DuckDNS).
  - **SSL**: Generated Let's Encrypt certificates using `certbot` on the host VM.
  - **Integration**:
    - Certificates mounted into the `wordle-ui` container via volumes (`/etc/letsencrypt:/etc/letsencrypt:ro`).
    - Nginx configured to listen on port 443 (SSL) and redirect HTTP (80) to HTTPS.
  - **Environment Configuration**:
    - Updated `environment.ts` (Production) to use a relative `apiUrl: ''`. This ensures requests are correctly routed through the Nginx proxy (which forwards `/api` to the backend) without needing hardcoded absolute URLs.

### Feature: Database Schema & Stored Procedure API
- **Goal**: Design a robust database schema and leverage SQL stored procedures as the API layer via `Kull.GenericBackend`.
- **Schema Design** (`wordle-backend/database/schema.sql`):
  - **`Users`**: Anonymous users identified by a `DeviceId` (GUID), with optional `DisplayName`.
  - **`WordDictionary`**: Stores valid 5-letter words with flags for answer eligibility and usage tracking.
  - **`Games`**: Tracks individual game sessions linking `UserId` to `WordId`, with status (`playing`, `won`, `lost`) and attempt count. Supports infinite gameplay.
  - **`Attempts`**: Records each guess within a game session with its validation result (e.g., `CPPAA` for Correct/Present/Absent).
- **Stored Procedures (API Endpoints)**:
  - `spUser_GetOrCreate`: Retrieves or creates a user based on device ID.
  - `spGame_Start`: Starts a new game with a random target word or resumes an existing active game. Returns a single flattened result set combining game state and history.
  - `spGame_SubmitGuess`: Validates guesses against the dictionary, calculates letter statuses, and updates game state.
  - `spStats_Get`: Calculates and returns user statistics (games played, win rate, streaks) and guess distribution in a single result set.
- **Data Population**:
  - The word list is populated using [this GitHub Gist](https://gist.github.com/slushman/34e60d6bc479ac8fc698df8c226e4264) (slushman/wordle-list).
- **Security**: The schema file contains no sensitive data; credentials are managed via environment variables.

### Refactoring: Stored Procedures (Single Result Sets)
- **Problem**: The generic backend library had issues handling multiple result sets returned by stored procedures.
- **Solution**: Refactored `spGame_Start` and `spStats_Get` to return single, flattened result sets.
  - `spGame_Start` uses a `LEFT JOIN` to combine game details with the list of attempts.
  - `spStats_Get` aggregates all statistics into a single row of columns.

### Feature: Local Development Database Access
- **Goal**: Allow developers to connect to the production database from their local machine for testing and debugging.
- **Implementation**:
  - **SSH Tunnel**: Added an `npm run ssh-db-tunnel` script in `package.json` that creates an SSH tunnel to the VM, forwarding `localhost:1433` to the container's SQL Server.
  - **Docker Compose**: The `db` service now exposes port `1433` on `127.0.0.1` only, preventing external access while allowing SSH-tunneled connections.
  - **Backend Port Removal**: Removed direct `8080` port exposure for the backend; it's now accessible only through the internal Docker network via Nginx.


### Migration: Server Replacement & Domain Change (June 2026)
- **Context**: The original production VM was unexpectedly deleted, requiring a migration to a new server.
- **Challenge**: The new server was already hosting another containerized application using Nginx on ports 80/443 and an MSSQL container on port 1433.
- **Resolution**:
  - **Port Adjustments**: Updated `docker-compose.yml` to bind the Wordle frontend to host port `8083` and the database to host port `1434` to prevent port collisions.
  - **SSL Architecture Change**: Removed SSL handling from the `wordle-ui` container. Nginx on the host machine now handles SSL termination and reverse-proxies traffic to the internal `8083` port.
  - **Domain Provider**: Swapped `DuckDNS` (which was returning 404s) for `No-IP` (wordle-fb.ddns.net).
  - **Database Restoration**: Used the `npm run ssh-db-tunnel` (updated to port `1434`) to connect to the new live database. Executed `schema.sql` to recreate tables, and created a Node.js script to chunk the dictionary data into a `populate.sql` file (bypassing SQL Server's 1,000-row `INSERT` limit). This resolved a `400 Bad Request` API error caused by the empty dictionary validation.

### Feature: Show Stats Button in Game Over Modal
- Added a "Show Stats" button next to "Play Again" in the game-over modal. Clicking it opens the `StatisticsModalComponent` so users can view stats without starting a new game.

### Feature: Local Development with SQL Server LocalDB
- Added LocalDB as an alternative to Docker for local development. Uses Windows Integrated Security — see `README.md` for setup instructions.

---
*This document will be updated continuously as the project evolves.*
