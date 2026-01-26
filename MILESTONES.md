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

## Milestone 5: Statistics & Database
**Deadline:** 2026-02-06
- [ ] Setup DB and connect to .NET Backend
- [ ] Design API Specification (Endpoints for Game State & User Stats)
- [ ] Provision SQL Database & Define Schema (Users, Games, Attempts)
- [ ] Populate Database with Word Dictionary for Validation
- [ ] Implement Backend Endpoints for Storing Game Results
- [ ] Implement "Valid English Word" Rule (Backend Dictionary Validation & Random Selection)
    - [ ] Verify Dictionary Check & Random Word
- [ ] Integrate Frontend with Backend Stats API
- [ ] Create `StatisticsModal` (Games Played, Win %, Cur/Max Streak, Guess Distribution)
    - [ ] Verify Statistics Calculation & Display per GAME_RULES.md

## Milestone 6: Deployment & Presentation
**Deadline:** 2026-08-17
- [ ] Refactor and refine styling
- [ ] Optimize Production Build (AOT, Lazy Loading)
- [ ] Make vanilla JS version of frontend
- [ ] Deploy Frontend & Backend to Cloud Provider
- [ ] Perform Final manual Testing
- [ ] Create Presentation Slides & Live Demo Script
