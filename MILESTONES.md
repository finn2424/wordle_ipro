# Project Milestones

## Milestone 1: Project Setup & Tools
**Deadline:** 2026-01-16
- [x] Initialize Git Repository
- [x] Setup Angular Frontend Project (`wordle-frontend`)
- [x] Create Mockups for Game Interface
- [x] Create MILESTONES.md and basic README.md
- [x] Create simple flowchart for game logic
- [x] Implement Mockup Viewer (Prototyping Tool)
- [x] Setup GitHub Pages Deployment (`angular-cli-ghpages`)

## Milestone 2: Functionalities & Requirements
**Deadline:** 2026-01-19
- [x] Select & Initialize Backend Technology (.NET 10 with Kull.GenericBackend)
- [x] Define Detailed Game Rules → See [GAME_RULES.md](./GAME_RULES.md)
- [x] Select Word Dictionary Source (API vs Local JSON) -> First store in DB, later maybe API

## Milestone 3: MVP (Basic UI & Infra)
**Deadline:** 2026-01-23
- [x] Implement Main App Layout (Header, Game Container)
- [x] Develop UI of `GameGrid` Component (Responsive 6x5 Grid)
- [x] Develop UI of `VirtualKeyboard` Component with click events
- [x] Develop UI of `InstructionsModal` Component
- [x] Develop UI of `StatisticsModal` Component
- [x] Develop UI of `GameOverModal` Component

## Milestone 4: Core Implementation (Wordle)
**Deadline:** 2026-01-30
- [x] Implement `GameService` for State Management (Signals/Subject)
    - [x] Verify Implementation (Unit Tests)
- [x] Develop Logic for Word Validation & Color Coding (Correct, Present, Absent)
    - [x] Verify Logic & Colors
- [x] Handle Keyboard Input (Physical & Virtual)
    - [x] Verify Input Handling
- [x] Implement Win/Loss Conditions & Notifications
    - [x] Verify Win/Loss Logic and rules integration from [GAME_RULES.md](./GAME_RULES.md)
- [x] Add CSS Animations (Flip reveal, Invalid shake)
    - [x] Verify Animations
- [-] Address items in [FEEDBACK1.md](./FEEDBACK1.md)

## Milestone 5: Statistics & Database
**Deadline:** 2026-02-06
- [x] Setup DB and connect to .NET Backend
- [x] Design API Specification (Endpoints for Game State & User Stats)
- [x] Provision SQL Database & Define Schema (Users, Games, Attempts)
- [x] Populate Database with Word Dictionary for Validation (Source: [slushman/wordle-list](https://gist.github.com/slushman/34e60d6bc479ac8fc698df8c226e4264))
- [x] Implement Backend Endpoints for Storing Game Results
- [x] Implement "Valid English Word" Rule (Backend Dictionary Validation & Random Selection)
    - [x] Verify Dictionary Check & Random Word
- [x] Integrate Frontend with Backend APIs
    - [x] Integrated User Identification (`POST /api/User/GetOrCreate`)
    - [x] Integrated Game Logic (`POST /api/Game/Start`, `POST /api/Game/SubmitGuess`)
    - [x] Integrated Statistics (`GET /api/Stats/Get`)
- [x] Create `StatisticsModal` (Games Played, Win %, Cur/Max Streak, Guess Distribution)
    - [x] Verify Statistics Calculation & Display per GAME_RULES.md

## Milestone 6: Deployment & Presentation
**Deadline:** 2026-08-17
- [x] Refactor and refine styling (use css vars, light-dark() function)
- [x] Improve styling
- [x] Fix bugs
- [x] Optimize Production Build (AOT, Lazy Loading)
- [ ] Make vanilla JS version of frontend (opensource library kolibri)
- [x] Setup Docker Containers (Frontend, Backend, Database)
- [x] Configure Nginx Reverse Proxy for API routing
- [x] Setup VM (Debian 13) with UFW Firewall
- [x] Implement CI/CD Pipeline (GitHub Actions)
- [x] Deploy Frontend & Backend to Cloud Provider
- [x] Choose Domain (.nip.io or real domain) -> `wordle-fb.ddns.net` (moved from DuckDNS to No-IP)
- [x] Finish Hosting (Nginx configuration)

- [x] Add "Show Stats" button next to "Play Again" button
- [x] Implement Advanced Analytics (e.g., most common starting words)
- [x] Add more tests (80 unit tests across 9 suites: components, services, models)
- [ ] Post update in Teams channel

- [x] Improve Security (avoid known vulnerabilities, configure host VM, secure endpoints)
- [x] Expose Database for Local Development
- [-] Fulfill and document requirements from teams document
- [ ] Perform Final manual Testing
- [ ] Create Presentation Slides & Live Demo Script